import {
  ChannelType,
  Client,
  EmbedBuilder,
  MessageFlags,
  type ChatInputCommandInteraction,
  type TextChannel,
} from "discord.js";
import type { MaintenanceService } from "@workspace/db";
import { logger } from "../lib/logger";
import { errorEmbed } from "./embeds";
import { syncRegistrationMessage } from "./message";
import {
  clearExpiredMaintenance,
  clearMaintenance,
  getActiveMaintenances,
  maintenanceReasonLabel,
  setMaintenance,
  type MaintenanceRecord,
} from "./maintenance-store";
import { getInscriptionConfig } from "./store";

const BRUSSELS_TIME_ZONE = "Europe/Brussels";
let expirySweepRunning = false;
let expiryWatcherStarted = false;

function localDateTimeParts(date: Date): Record<string, number> {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: BRUSSELS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  return Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  );
}

function parseBrusselsDateTime(value: string): Date | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})$/.exec(
    value.trim(),
  );
  if (!match) {
    return null;
  }

  const [, dayValue, monthValue, yearValue, hourValue, minuteValue] = match;
  const day = Number(dayValue);
  const month = Number(monthValue);
  const year = Number(yearValue);
  const hour = Number(hourValue);
  const minute = Number(minuteValue);
  const targetUtc = Date.UTC(year, month - 1, day, hour, minute);
  const target = new Date(targetUtc);

  if (
    target.getUTCFullYear() !== year ||
    target.getUTCMonth() !== month - 1 ||
    target.getUTCDate() !== day ||
    hour > 23 ||
    minute > 59
  ) {
    return null;
  }

  for (const offsetMinutes of [120, 60]) {
    const candidate = new Date(targetUtc - offsetMinutes * 60_000);
    const parts = localDateTimeParts(candidate);
    if (
      parts.year === year &&
      parts.month === month &&
      parts.day === day &&
      parts.hour === hour &&
      parts.minute === minute
    ) {
      return candidate;
    }
  }

  // This also rejects local times that do not exist during the spring DST change.
  return null;
}

function discordTime(date: Date): string {
  return `<t:${Math.floor(date.getTime() / 1000)}:F> (<t:${Math.floor(date.getTime() / 1000)}:R>)`;
}

function truncate(value: string, maxLength: number): string {
  return value.length <= maxLength
    ? value
    : `${value.slice(0, maxLength - 1)}…`;
}

function serviceState(
  label: string,
  record: MaintenanceRecord | undefined,
): { name: string; value: string; inline: false } {
  if (!record) {
    return {
      name: label,
      value: "🟢 **En ligne**",
      inline: false,
    };
  }

  return {
    name: label,
    value: `🔴 **Maintenance temporaire**\n**Raison :** ${maintenanceReasonLabel(record.reason)}\n${truncate(record.message || "Aucune précision complémentaire.", 600)}\n\nFin prévue : ${discordTime(record.endsAt)}`,
    inline: false,
  };
}

function statusEmbed(records: MaintenanceRecord[]): EmbedBuilder {
  const byService = new Map(records.map((record) => [record.service, record]));
  const notice = byService.get("notice");

  return new EmbedBuilder()
    .setColor(0xf2b2a8)
    .setTitle("État des services")
    .setDescription(
      "Les maintenances expirent automatiquement à l’heure indiquée.",
    )
    .addFields(
      serviceState("Support", byService.get("support")),
      serviceState("Recrutement", byService.get("recrutement")),
      {
        name: "Avis de mise à jour",
        value: notice
          ? `🟠 **Information seulement — services non coupés**\n**Raison :** ${maintenanceReasonLabel(notice.reason)}\n${truncate(notice.message || "Aucune précision complémentaire.", 600)}\n\nFin prévue : ${discordTime(notice.endsAt)}`
          : "Aucun avis en cours.",
        inline: false,
      },
    )
    .setTimestamp();
}

async function refreshRecruitmentMessages(client: Client): Promise<void> {
  for (const guild of client.guilds.cache.values()) {
    try {
      const config = await getInscriptionConfig(guild.id);
      if (!config.registrationChannelId || !config.registrationMessageId) {
        continue;
      }
      const channel = await guild.channels
        .fetch(config.registrationChannelId)
        .catch(() => null);
      if (channel?.type === ChannelType.GuildText) {
        await syncRegistrationMessage(guild, channel as TextChannel);
      }
    } catch (error) {
      logger.warn(
        { err: error, guildId: guild.id },
        "Could not refresh recruitment message after maintenance change",
      );
    }
  }
}

function maintenanceTargets(service: string): MaintenanceService[] {
  if (service === "tout") {
    return ["support", "recrutement"];
  }
  if (service === "annonce") {
    return ["notice"];
  }
  if (service === "support" || service === "recrutement") {
    return [service];
  }
  return [];
}

export async function handleMaintenanceCommand(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const action = interaction.options.getString("action", true);
  const service = interaction.options.getString("service", true);
  await interaction.deferReply(
    service === "annonce" ? {} : { flags: MessageFlags.Ephemeral },
  );
  const services = maintenanceTargets(service);
  if (services.length === 0) {
    await interaction.editReply({
      embeds: [errorEmbed("Service inconnu", "Choisis un service valide.")],
    });
    return;
  }

  if (action === "stop") {
    const toClear: MaintenanceService[] =
      service === "tout"
        ? ["support", "recrutement", "notice"]
        : services;
    await clearMaintenance(toClear);
    if (toClear.includes("recrutement")) {
      await refreshRecruitmentMessages(interaction.client);
    }
    await interaction.editReply({
      embeds: [
        new EmbedBuilder()
          .setColor(0xf2b2a8)
          .setTitle("Maintenance terminée")
          .setDescription(
            service === "tout"
              ? "Le support et le recrutement sont de nouveau en ligne. Les avis d’information ont aussi été effacés."
              : `${service === "annonce" ? "L’avis de mise à jour a été retiré." : `Le service **${service}** est de nouveau en ligne.`}`,
          ),
      ],
    });
    return;
  }

  const endText = interaction.options.getString("fin");
  const reasonValue = interaction.options.getString("raison");
  const message = interaction.options.getString("message")?.trim() ?? "";
  const validReasons = [
    "mise-a-jour",
    "incident-technique",
    "maintenance-preventive",
    "autre",
  ] as const;
  if (
    !endText ||
    !reasonValue ||
    !validReasons.includes(reasonValue as (typeof validReasons)[number]) ||
    (reasonValue === "autre" && !message)
  ) {
    await interaction.editReply({
      embeds: [
        errorEmbed(
          "Informations manquantes",
          "Pour activer une maintenance, choisis une raison et indique une fin au format **JJ/MM/AAAA HH:mm**, heure de Bruxelles. Ajoute aussi une précision si la raison est « Autre ».",
        ),
      ],
    });
    return;
  }

  const endsAt = parseBrusselsDateTime(endText);
  if (!endsAt || endsAt.getTime() <= Date.now()) {
    await interaction.editReply({
      embeds: [
        errorEmbed(
          "Date de fin invalide",
          "Indique une date future et réelle au format **JJ/MM/AAAA HH:mm**, heure de Bruxelles.",
        ),
      ],
    });
    return;
  }

  if (service === "tout") {
    await clearMaintenance(["notice"]);
  }
  for (const target of services) {
    await setMaintenance(target, {
      message,
      reason: reasonValue as (typeof validReasons)[number],
      endsAt,
      updatedByUserId: interaction.user.id,
    });
  }

  if (services.includes("recrutement")) {
    await refreshRecruitmentMessages(interaction.client);
  }

  const serviceLabel =
    service === "tout"
      ? "Le support et le recrutement"
      : service === "annonce"
        ? "L’avis de mise à jour"
        : `Le service **${service}**`;
  await interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setColor(0xf2b2a8)
        .setTitle(service === "annonce" ? "Avis programmé" : "Maintenance activée")
        .setDescription(
          `${serviceLabel} ${service === "annonce" ? "sera affiché" : "est en maintenance"} jusqu’au ${discordTime(endsAt)}.\n\n**Raison :** ${maintenanceReasonLabel(reasonValue as (typeof validReasons)[number])}${message ? `\n${message}` : ""}`,
        ),
    ],
  });
}

export async function handleStatusCommand(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  await interaction.deferReply();
  const records = await getActiveMaintenances();
  await interaction.editReply({
    embeds: [statusEmbed(records)],
    allowedMentions: { parse: [] },
  });
}

export function startMaintenanceExpiryWatcher(client: Client): void {
  if (expiryWatcherStarted) {
    return;
  }
  expiryWatcherStarted = true;

  const sweep = async () => {
    if (expirySweepRunning) {
      return;
    }
    expirySweepRunning = true;
    try {
      const expired = await clearExpiredMaintenance();
      if (expired.includes("recrutement")) {
        await refreshRecruitmentMessages(client);
      }
      if (expired.length > 0) {
        logger.info({ services: expired }, "Maintenance period expired");
      }
    } catch (error) {
      logger.error({ err: error }, "Could not clear expired maintenance");
    } finally {
      expirySweepRunning = false;
    }
  };

  void sweep();
  setInterval(() => void sweep(), 5_000);
}
