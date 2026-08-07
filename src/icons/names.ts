export const ICON_NAMES = [
  "today",
  "week",
  "physique",
  "settings",
  "chevron-left",
  "chevron-right",
  "chevron-down",
  "close",
  "plus",
  "check",
  "trash",
  "pencil",
  "clock",
  "calendar",
  "flame",
  "skip",
  "alert",
  "download",
  "share",
  "upload",
  "play",
  "camera",
  "film",
  "dumbbell",
  "belt",
  "scissors",
  "briefcase",
  "book",
  "apple",
  "bulb",
  "target",
  "moon",
  "droplet",
  "run",
  "dot",
] as const;

export type IconName = (typeof ICON_NAMES)[number];

export const FALLBACK_ICON: IconName = "dot";

/** Ícones oferecidos na escolha de categoria. */
export const CATEGORY_ICON_NAMES: IconName[] = [
  "dumbbell",
  "belt",
  "run",
  "scissors",
  "briefcase",
  "book",
  "apple",
  "droplet",
  "bulb",
  "target",
  "flame",
  "moon",
];

/** Dados antigos guardavam emoji em Category.icon. */
export const EMOJI_TO_ICON: Record<string, IconName> = {
  "💪": "dumbbell",
  "🥋": "belt",
  "💈": "scissors",
  "💼": "briefcase",
  "📚": "book",
  "🥗": "apple",
  "🧠": "bulb",
  "🎯": "target",
  "🔥": "flame",
  "🌙": "moon",
  "💧": "droplet",
  "🏃": "run",
};

export function isIconName(value: unknown): value is IconName {
  return typeof value === "string" && (ICON_NAMES as readonly string[]).includes(value);
}
