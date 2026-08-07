import type {
  AppData,
  Category,
  Habit,
  HabitVariant,
  PhysiqueEntry,
  PhysiqueState,
  RoutineSlot,
  SkippedDays,
  SlotLogs,
  SlotVariants,
  Weekday,
} from "../types";
import { EMOJI_TO_ICON, isIconName, type IconName } from "../icons/names";
import { uid } from "../lib/id";
import { dayKey } from "../lib/date";

export const DEFAULT_PHYSIQUE_INTERVAL = 14;

type Raw = Record<string, unknown>;

function asArray(value: unknown): Raw[] {
  return Array.isArray(value) ? (value.filter(isObject) as Raw[]) : [];
}

function isObject(value: unknown): value is Raw {
  return typeof value === "object" && value !== null;
}

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function num(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

/** Emoji legado, nome de ícone atual ou palpite pelo nome da categoria. */
function normalizeIconName(value: unknown, categoryName: string): IconName {
  if (isIconName(value)) return value;
  const raw = str(value);
  if (raw && EMOJI_TO_ICON[raw]) return EMOJI_TO_ICON[raw];

  const name = categoryName.toLowerCase();
  if (/academia|shape|muscula|treino|for[cç]a/.test(name)) return "dumbbell";
  if (/jiu|luta|arte marcial|judo|judô/.test(name)) return "belt";
  if (/corr|cardio|caminh/.test(name)) return "run";
  if (/apar[eê]ncia|cuidado|pele|skin|cabelo/.test(name)) return "scissors";
  if (/projeto|trabalho|work|neg[oó]cio/.test(name)) return "briefcase";
  if (/estudo|leitura|curso|faculdade/.test(name)) return "book";
  if (/aliment|comida|dieta|nutri/.test(name)) return "apple";
  if (/[aá]gua|hidrat/.test(name)) return "droplet";
  if (/sono|dormir|noite/.test(name)) return "moon";
  if (/mente|medita|foco|c[eé]rebro/.test(name)) return "bulb";
  return "target";
}

function normalizeCategory(raw: Raw, index: number): Category | null {
  const id = str(raw.id);
  if (!id) return null;
  const name = str(raw.name, "Sem nome");
  return {
    id,
    name,
    color: str(raw.color, "#ffffff"),
    icon: normalizeIconName(raw.icon, name),
    order: num(raw.order, index),
  };
}

function normalizeVariant(raw: Raw): HabitVariant | null {
  const name = str(raw.name).trim();
  if (!name) return null;
  const items = Array.isArray(raw.items)
    ? raw.items.filter((i): i is string => typeof i === "string")
    : [];
  return { id: str(raw.id) || uid("v-"), name, items };
}

function normalizeHabit(raw: Raw, categoryIds: Set<string>): Habit | null {
  const id = str(raw.id);
  const categoryId = str(raw.categoryId);
  if (!id || !categoryIds.has(categoryId)) return null;
  return {
    id,
    categoryId,
    name: str(raw.name, "Sem nome"),
    createdAt: str(raw.createdAt) || dayKey(),
    ...(raw.archived === true ? { archived: true as const } : {}),
    variants: asArray(raw.variants)
      .map(normalizeVariant)
      .filter((v): v is HabitVariant => v !== null),
  };
}

function normalizeSlot(raw: Raw, habits: Map<string, Habit>): RoutineSlot | null {
  const id = str(raw.id);
  const habitId = str(raw.habitId);
  const habit = habits.get(habitId);
  if (!id || !habit) return null;

  const weekday = num(raw.weekday, -1);
  if (weekday < 0 || weekday > 6) return null;

  const variantId = str(raw.variantId);
  const hasVariant = habit.variants.some((v) => v.id === variantId);

  return {
    id,
    habitId,
    weekday: weekday as Weekday,
    startTime: /^\d{2}:\d{2}$/.test(str(raw.startTime)) ? str(raw.startTime) : "09:00",
    durationMinutes: Math.max(5, num(raw.durationMinutes, 60)),
    ...(hasVariant ? { variantId } : {}),
  };
}

function normalizeSlotLogs(raw: unknown, slotIds: Set<string>): SlotLogs {
  const out: SlotLogs = {};
  if (!isObject(raw)) return out;
  for (const [slotId, days] of Object.entries(raw)) {
    if (!slotIds.has(slotId) || !isObject(days)) continue;
    const kept: Record<string, boolean> = {};
    for (const [key, done] of Object.entries(days)) {
      if (done === true) kept[key] = true;
    }
    if (Object.keys(kept).length > 0) out[slotId] = kept;
  }
  return out;
}

function normalizeSlotVariants(raw: unknown, slotIds: Set<string>): SlotVariants {
  const out: SlotVariants = {};
  if (!isObject(raw)) return out;
  for (const [slotId, days] of Object.entries(raw)) {
    if (!slotIds.has(slotId) || !isObject(days)) continue;
    const kept: Record<string, string> = {};
    for (const [key, variantId] of Object.entries(days)) {
      if (typeof variantId === "string" && variantId) kept[key] = variantId;
    }
    if (Object.keys(kept).length > 0) out[slotId] = kept;
  }
  return out;
}

function normalizeSkipped(raw: unknown): SkippedDays {
  const out: SkippedDays = {};
  if (!isObject(raw)) return out;
  for (const [key, value] of Object.entries(raw)) {
    if (value === true) out[key] = true;
  }
  return out;
}

function normalizePhysiqueEntry(raw: Raw): PhysiqueEntry | null {
  const mediaId = str(raw.mediaId);
  const date = str(raw.date);
  if (!mediaId || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  return {
    id: str(raw.id) || uid("p-"),
    date,
    mediaId,
    ...(str(raw.note) ? { note: str(raw.note) } : {}),
    ...(typeof raw.durationSec === "number" ? { durationSec: raw.durationSec } : {}),
    ...(typeof raw.sizeBytes === "number" ? { sizeBytes: raw.sizeBytes } : {}),
    createdAt: str(raw.createdAt) || new Date().toISOString(),
  };
}

function normalizePhysique(raw: unknown): PhysiqueState {
  const source = isObject(raw) ? raw : {};
  const entries = asArray(source.entries)
    .map(normalizePhysiqueEntry)
    .filter((e): e is PhysiqueEntry => e !== null)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  return {
    entries,
    intervalDays: Math.max(1, num(source.intervalDays, DEFAULT_PHYSIQUE_INTERVAL)),
    ...(str(source.snoozedUntil) ? { snoozedUntil: str(source.snoozedUntil) } : {}),
    ...(source.badgeEnabled === true ? { badgeEnabled: true as const } : {}),
  };
}

/**
 * Normaliza qualquer dado salvo (v1 antigo ou v2) para o schema atual.
 * Nunca lança: dado ruim vira dado vazio, não tela quebrada.
 */
export function migrateAppData(raw: unknown): AppData | null {
  if (!isObject(raw)) return null;

  const categories = asArray(raw.categories)
    .map(normalizeCategory)
    .filter((c): c is Category => c !== null)
    .sort((a, b) => a.order - b.order);
  if (categories.length === 0) return null;

  const categoryIds = new Set(categories.map((c) => c.id));
  const habits = asArray(raw.habits)
    .map((h) => normalizeHabit(h, categoryIds))
    .filter((h): h is Habit => h !== null);

  const habitMap = new Map(habits.map((h) => [h.id, h]));
  const routineSlots = asArray(raw.routineSlots)
    .map((s) => normalizeSlot(s, habitMap))
    .filter((s): s is RoutineSlot => s !== null);

  const slotIds = new Set(routineSlots.map((s) => s.id));

  return {
    schemaVersion: 2,
    categories,
    habits,
    routineSlots,
    slotLogs: normalizeSlotLogs(raw.slotLogs, slotIds),
    slotVariants: normalizeSlotVariants(raw.slotVariants, slotIds),
    skippedDays: normalizeSkipped(raw.skippedDays),
    physique: normalizePhysique(raw.physique),
    createdAt: str(raw.createdAt) || dayKey(),
  };
}
