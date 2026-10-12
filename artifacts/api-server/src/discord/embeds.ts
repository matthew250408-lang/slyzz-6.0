import { EmbedBuilder, type Role, type User } from "discord.js";
import {
  AUTHORIZED_SETUP_USER_IDS,
  BOT_DEVELOPER_ID,
  BOT_LAST_MODIFIED,
  BOT_VERSION,
  DERANK_EMOJI,
  DEFAULT_EMBED_TITLE,
  MEMBER_EMOJI,
  RANK_EMOJI,
  REASON_EMOJI,
  questionLabel,
} from "./constants";
import type { InscriptionConfigData } from "./store";

const EMBED_COLOR = 0xf2b2a8;

function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1)}…`;
}

export function infoEmbed(title: string, description: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(EMBED_COLOR)
    .setTitle(title)
    .setDescription(description);
}

export function botInfoEmbed(): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(EMBED_COLOR)
    .setTitle("Informations sur Biscotto")
    .addFields(
      { name: "Version", value: BOT_VERSION, inline: true },
      { name: "Développeur", value: `<@${BOT_DEVELOPER_ID}>`, inline: true },
      { name: "Dernière modification", value: BOT_LAST_MODIFIED, inline: false },
    );
}

export function rankActionEmbed(
  action: "rank" | "derank",
  member: User,
  role: Role,
  actor: User,
  reason: string,
): EmbedBuilder {
  const isRank = action === "rank";
  const heading = isRank
    ? `${RANK_EMOJI} Rank-Up !`
    : `${DERANK_EMOJI} Derank !`;
  const actionLines = isRank
    ? [
        `**Félicitations**, tu disposes désormais du **grade** <@&${role.id}> !`,
        "Continue ainsi, nous te faisons **confiance** !",
      ]
    : [
        `**Dommage !** Tu ne disposes plus du **grade** <@&${role.id}>.`,
        "Nous te souhaitons une **bonne continuation**.",
      ];
  const formattedReason = reason.trim().replace(/\r?\n/g, "\n> ");

  return new EmbedBuilder()
    .setColor(isRank ? 0xf2b2a8 : 0xf2b2a8)
    .setDescription(
      [
        `## ${heading}`,
        ...actionLines,
        "",
        `> ${MEMBER_EMOJI} **Membre :** <@${member.id}>`,
        `> ${REASON_EMOJI} **Raison :** ${formattedReason}`,
      ].join("\n"),
    )
    .setFooter({
      text: `Action effectuée par ${actor.username}`,
      iconURL: actor.displayAvatarURL(),
    })
    .setTimestamp();
}

export function commandsHelpEmbed(userMention: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(EMBED_COLOR)
    .setTitle("Mention Biscotto !")
    .setDescription(
      `Salut ${userMention} ! Je suis **Biscotto**, mon **propriétaire** est **Slyzz**. Mon rôle est d’aider **Slyzz** à gérer les serveurs où il est **Administrateurs**.\nSi tu as **une question** par rapport à moi, ou même **Slyzz**, hésite pas à m’envoyer un **message privé** !`,
    );
}

export function successEmbed(
  title: string,
  description: string,
): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(EMBED_COLOR)
    .setTitle(title)
    .setDescription(description);
}

export function errorEmbed(
  title: string,
  description: string,
): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(EMBED_COLOR)
    .setTitle(title)
    .setDescription(description);
}

export function setupEmbed(
  config: InscriptionConfigData,
): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(EMBED_COLOR)
    .setDescription(
      "Utilise les paramètres de la commande ou les contrôles ci-dessous pour modifier le **message**, le **titre de l'embed**, le **bouton**, les **questions** et le **salon de réponses**.",
    )
    .addFields(
      {
        name: "Message d'inscription",
        value: truncate(config.messageContent, 1024),
        inline: false,
      },
      {
        name: "Titre de l'embed",
        value: truncate(config.embedTitle, 256),
        inline: true,
      },
      {
        name: "Bouton d'inscription",
        value: truncate(config.buttonLabel, 1024),
        inline: true,
      },
      {
        name: "Questions du formulaire",
        value:
          truncate(
            config.questions.map(questionLabel).join(", "),
            1024,
          ) || "Aucune",
        inline: false,
      },
      {
        name: "Salon des réponses",
        value: config.responseChannelId
          ? `<#${config.responseChannelId}>`
          : "Non configuré",
        inline: true,
      },
    );
}

export function permissionsEmbed(
  config: InscriptionConfigData,
): EmbedBuilder {
  const primaryAdministrators = [...AUTHORIZED_SETUP_USER_IDS]
    .map((userId) => `<@${userId}> (\`${userId}\`)`)
    .join("\n");
  const authorizedMembers =
    config.authorizedUserIds.length > 0
      ? truncate(
          config.authorizedUserIds
            .map((userId) => `<@${userId}> (\`${userId}\`)`)
            .join("\n"),
          1024,
        )
      : "Aucun membre supplémentaire";

  return new EmbedBuilder()
    .setColor(EMBED_COLOR)
    .setTitle("Gestion des autorisations")
    .setDescription(
      "Seuls les **administrateurs principaux** peuvent modifier cette liste. Les membres ajoutés pourront utiliser les **commandes de configuration** du serveur.",
    )
    .addFields(
      {
        name: "Administrateurs principaux",
        value: primaryAdministrators,
        inline: false,
      },
      {
        name: "Membres autorisés",
        value: authorizedMembers,
        inline: false,
      },
      {
        name: "Format accepté",
        value: "Ajoute les IDs séparés par des **virgules**.",
        inline: false,
      },
    );
}

export function registrationEmbed(
  title: string,
  messageContent: string,
): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(EMBED_COLOR)
    .setDescription(messageContent);

  if (title.trim() && title !== DEFAULT_EMBED_TITLE) {
    embed.setTitle(title);
  }

  return embed;
}

export function applicationEmbed(
  user: User,
  answers: Array<{ questionId: string; answer: string }>,
): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(EMBED_COLOR)
    .setTitle("Nouvelle inscription")
    .setDescription(`Candidature envoyée par <@${user.id}>`)
    .addFields(
      {
        name: "Utilisateur",
        value: `${user.tag}\n\`${user.id}\``,
        inline: false,
      },
      ...answers.map(({ questionId, answer }) => ({
        name: questionLabel(questionId),
        value: truncate(answer || "Aucune réponse", 1024),
        inline: false,
      })),
    )
    .setTimestamp();
}