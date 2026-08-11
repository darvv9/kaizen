import type { AppData, Category, Habit, HabitVariant, RoutineSlot, Weekday } from "../types";
import { dayKey } from "../lib/date";
import { DEFAULT_PHYSIQUE_INTERVAL } from "./migrate";

export const CATEGORY_COLORS = [
  "#ffffff",
  "#4e9bff",
  "#ff5c8a",
  "#23c1aa",
  "#3ddc97",
  "#ffb14e",
  "#c9c9d4",
  "#ff6b6b",
];

const defaultCategories: Category[] = [
  { id: "cat-academia", name: "Academia", color: "#ffffff", icon: "dumbbell", order: 0 },
  { id: "cat-jiu", name: "Jiu-Jitsu", color: "#4e9bff", icon: "belt", order: 1 },
  { id: "cat-cuidados", name: "Cuidados", color: "#ff5c8a", icon: "scissors", order: 2 },
  { id: "cat-estudo", name: "Estudo", color: "#23c1aa", icon: "book", order: 3 },
  { id: "cat-comida", name: "Alimentação", color: "#3ddc97", icon: "apple", order: 4 },
];

function variant(id: string, name: string, items: string[] = []): HabitVariant {
  return { id, name, items };
}

/**
 * A composição de fábrica do A/B/C. Exportada porque o atalho "criar Treino
 * A · B · C" (no bloco da Semana e nos Ajustes) recria os exercícios junto —
 * quem apagou a Academia sem querer recupera tudo num toque.
 */
export const DEFAULT_GYM_VARIANTS: { name: string; items: string[] }[] = [
  {
    name: "Treino A",
    items: [
      "Supino reto 4x10",
      "Supino inclinado 3x10",
      "Desenvolvimento 3x12",
      "Elevação lateral 3x15",
      "Tríceps corda 4x12",
    ],
  },
  {
    name: "Treino B",
    items: [
      "Barra fixa 4x max",
      "Remada curvada 4x10",
      "Puxada frente 3x12",
      "Rosca direta 4x10",
      "Rosca martelo 3x12",
    ],
  },
  {
    name: "Treino C",
    items: [
      "Agachamento 4x10",
      "Leg press 4x12",
      "Cadeira extensora 3x15",
      "Mesa flexora 3x12",
      "Panturrilha 4x20",
    ],
  },
];

const defaultHabits: Habit[] = [
  habit("h-academia", "cat-academia", "Academia", [
    variant("v-treino-a", DEFAULT_GYM_VARIANTS[0].name, DEFAULT_GYM_VARIANTS[0].items),
    variant("v-treino-b", DEFAULT_GYM_VARIANTS[1].name, DEFAULT_GYM_VARIANTS[1].items),
    variant("v-treino-c", DEFAULT_GYM_VARIANTS[2].name, DEFAULT_GYM_VARIANTS[2].items),
  ]),
  habit("h-jiu", "cat-jiu", "Jiu-Jitsu", [
    variant("v-nogi", "No-gi"),
    variant("v-gi", "Gi"),
    variant("v-livre", "Livre (gi)"),
  ]),
  habit("h-skincare", "cat-cuidados", "Skincare"),
  habit("h-sono", "cat-cuidados", "Dormir cedo"),
  habit("h-estudo", "cat-estudo", "Estudo"),
  habit("h-proteina", "cat-comida", "Proteína do dia"),
  habit("h-agua", "cat-comida", "2L de água"),
];

function habit(
  id: string,
  categoryId: string,
  name: string,
  variants: HabitVariant[] = []
): Habit {
  return { id, categoryId, name, createdAt: dayKey(), variants };
}

function slot(
  id: string,
  habitId: string,
  weekday: Weekday,
  startTime: string,
  durationMinutes: number,
  variantId?: string
): RoutineSlot {
  return { id, habitId, weekday, startTime, durationMinutes, ...(variantId ? { variantId } : {}) };
}

const defaultRoutineSlots: RoutineSlot[] = [
  slot("s-aca-seg", "h-academia", 1, "07:00", 60, "v-treino-a"),
  slot("s-aca-qua", "h-academia", 3, "07:00", 60, "v-treino-b"),
  slot("s-aca-sex", "h-academia", 5, "07:00", 60, "v-treino-c"),

  slot("s-jiu-ter", "h-jiu", 2, "19:30", 90, "v-nogi"),
  slot("s-jiu-qui", "h-jiu", 4, "19:30", 90, "v-gi"),
  slot("s-jiu-sab", "h-jiu", 6, "10:00", 90, "v-livre"),

  slot("s-prot-seg", "h-proteina", 1, "12:30", 30),
  slot("s-prot-qua", "h-proteina", 3, "12:30", 30),
  slot("s-prot-sex", "h-proteina", 5, "12:30", 30),

  slot("s-agua-seg", "h-agua", 1, "08:30", 15),
  slot("s-est-seg", "h-estudo", 1, "15:00", 45),
  slot("s-est-qui", "h-estudo", 4, "15:00", 45),

  slot("s-skin-ter", "h-skincare", 2, "22:00", 15),
  slot("s-skin-sex", "h-skincare", 5, "22:00", 15),
  slot("s-sono-dom", "h-sono", 0, "23:00", 15),
];

export function createDefaultData(): AppData {
  return {
    schemaVersion: 2,
    categories: defaultCategories,
    habits: defaultHabits,
    routineSlots: defaultRoutineSlots,
    slotLogs: {},
    slotVariants: {},
    skippedDays: {},
    physique: { entries: [], intervalDays: DEFAULT_PHYSIQUE_INTERVAL },
    createdAt: dayKey(),
  };
}
