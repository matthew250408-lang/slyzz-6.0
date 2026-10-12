import {
  EmbedBuilder,
  type Guild,
  type GuildMember,
  type Role,
  type User,
} from "discord.js";
import {
  AUTHORIZED_SETUP_USER_IDS,
  BOT_DEVELOPER_ID,
  BOT_LAST_MODIFIED,
  BOT_VERSION,
  DATE_EMOJI,
  DERANK_EMOJI,
  DEFAULT_EMBED_TITLE,
  HIGHEST_ROLE_EMOJI,
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

export function serverInfoEmbed(guild: Guild, owner: User): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setColor(EMBED_COLOR)
    .setTitle(`Informations sur ${guild.name}`)
    .addFields(
      { name: "Propriétaire", value: `<@${owner.id}>`, inline: true },
      { name: "Membres", value: guild.memberCount.toLocaleString("fr-FR"), inline: true },
      {
        name: "Créé le",
        value: guild.createdAt.toLocaleDateString("fr-FR"),
        inline: true,
      },
      {
        name: "Salons",
        value: guild.channels.cache.size.toLocaleString("fr-FR"),
        inline: true,
      },
      {
        name: "Rôles",
        value: Math.max(0, guild.roles.cache.size - 1).toLocaleString("fr-FR"),
        inline: true,
      },
      {
        name: "Niveau de boost",
        value: guild.premiumTier.toString(),
        inline: true,
      },
      { name: "Identifiant", value: `\`${guild.id}\``, inline: false },
    )
    .setTimestamp();

  const iconURL = guild.iconURL({ size: 512 });
  if (iconURL) {
    embed.setThumbnail(iconURL);
  }

  return embed;
}

export function staffAbsenceEmbed(
  member: GuildMember,
  startDate: string,
  endDate: string,
  reason: string,
): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(EMBED_COLOR)
    .setTitle("Absence du staff")
    .addFields(
      {
        name: "Membre",
        value: `${MEMBER_EMOJI} <@${member.id}>`,
        inline: false,
      },
      {
        name: "Rôle le plus élevé",
        value: `${HIGHEST_ROLE_EMOJI} <@&${member.roles.highest.id}>`,
        inline: false,
      },
      {
        name: "Date",
        value: `${DATE_EMOJI} du ${startDate} au ${endDate}`,
        inline: false,
      },
      {
        name: "Raison",
        value: `${REASON_EMOJI} ${reason.trim()}`,
        inline: false,
      },
    )
    .setThumbnail(member.displayAvatarURL())
    .setTimestamp();
}

export function rankActionEmbed(
  action: "rank" | "derank",
  member: User,
  role: Role,
  actor: User,
  reason: string,
  okayEmoji = "👌",
): EmbedBuilder {
  const isRank = action === "rank";
  const heading = isRank
    ? `${okayEmoji} ${RANK_EMOJI} Rank-Up !`
    : `${okayEmoji} ${DERANK_EMOJI} Derank !`;
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
      "Configure ici le formulaire de **recrutement** : son **message**, son **titre**, son **bouton**, ses **questions** et le **salon de réception**.",
    )
    .addFields(
      {
        name: "Message de recrutement",
        value: truncate(config.messageContent, 1024),
        inline: false,
      },
      {
        name: "Titre de l'embed",
        value: truncate(config.embedTitle, 256),
        inline: true,
      },
      {
        name: "Bouton de candidature",
        value: truncate(config.buttonLabel, 1024),
        inline: true,
      },
      {
        name: "Questions de candidature",
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
    .setTitle("Nouvelle candidature au recrutement")
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