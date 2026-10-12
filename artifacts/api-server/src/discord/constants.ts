export const DEFAULT_MESSAGE = [
  "📋 **Recrutement staff**",
  "",
  "Tu souhaites rejoindre l'équipe ? Clique sur le bouton ci-dessous et remplis le formulaire de candidature.",
].join("\n");

export const DEFAULT_BUTTON_LABEL = "📩 Candidater";
export const DEFAULT_EMBED_TITLE = "📋 Recrutement staff";
export const BOT_VERSION = "6.0";
export const BOT_DEVELOPER_ID = "1140296215469240401";
export const BOT_LAST_MODIFIED = "12 octobre 2026";
export const RANK_COMMAND_ACCESS_ROLE_ID = "1429494599730335765";
export const RANK_ANNOUNCEMENT_ROLE_ID = "1429508546550038648";
export const RANK_ANNOUNCEMENT_CHANNEL_ID = "1542655357728456855";
export const STAFF_ABSENCE_ACCESS_ROLE_ID = "1429508546550038648";
export const MEMBER_EMOJI = "<:utilisateur:1558391260375556097>";
export const REASON_EMOJI = "<:raison:1558391410498084925>";
export const RANK_EMOJI = "<:rank:1558389911625662544>";
export const DERANK_EMOJI = "<:derank:1558389778406440991>";
export const HIGHEST_ROLE_EMOJI = "<:r_le:1559245099945299978>";
export const DATE_EMOJI = "<:temps:1559244751008432308>";
export const OKAY_EMOJI_NAME = "okay";

export const AUTHORIZED_SETUP_USER_IDS = new Set([
  "1140296215469240401",
  "1487882100613971979",
]);

export const AVAILABLE_QUESTIONS = [
  {
    id: "name",
    label: "Quel est ton prénom/pseudo ?",
  },
  {
    id: "age",
    label: "Quel âge as-tu ?",
  },
  {
    id: "motivation",
    label: "Pourquoi souhaites-tu rejoindre le serveur ?",
  },
  {
    id: "discovery",
    label: "Comment as-tu découvert le serveur ?",
  },
  {
    id: "rules",
    label: "Acceptes-tu le règlement ?",
  },
  {
    id: "staff-motivation",
    label: "Pourquoi souhaites-tu rejoindre l'équipe staff ?",
  },
  {
    id: "staff-experience",
    label: "Quelle expérience as-tu en modération ou en animation ?",
  },
  {
    id: "staff-availability",
    label: "Quels sont tes jours et horaires de disponibilité ?",
  },
  {
    id: "staff-scenario",
    label: "Comment réagirais-tu face à un conflit entre membres ?",
  },
] as const;

export type QuestionId = (typeof AVAILABLE_QUESTIONS)[number]["id"];

export function customQuestionKey(label: string): string {
  return `custom:${label.trim().replace(/\s+/g, " ").slice(0, 80)}`;
}

export function isCustomQuestionKey(questionKey: string): boolean {
  return questionKey.startsWith("custom:");
}

export function questionLabel(questionId: string): string {
  const builtInQuestion = AVAILABLE_QUESTIONS.find(
    (question) => question.id === questionId,
  );
  if (builtInQuestion) {
    return builtInQuestion.label;
  }

  if (isCustomQuestionKey(questionId)) {
    return questionId.slice("custom:".length);
  }

  return questionId;
}