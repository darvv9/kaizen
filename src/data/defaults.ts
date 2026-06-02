import type { AppData, Category, Habit, RoutineSlot, Weekday } from "../types";
import { dayKey } from "../lib/date";

export const CATEGORY_COLORS = [
  "#ffffff",
  "#ff5c8a",
  "#23c1aa",
  "#ffb14e",
  "#4e9bff",
  "#c9c9d4",
  "#ff6b6b",
  "#3ddc97",
];

export const CATEGORY_ICONS = [
  "💪",
  "🥋",
  "💈",
  "💼",
  "📚",
  "🥗",
  "🧠",
  "🎯",
  "🔥",
  "🌙",
  "💧",
  "🏃",
];

const defaultCategories: Category[] = [
  { id: "cat-shape", name: "Shape", color: "#ffffff", icon: "💪", order: 0 },
  { id: "cat-jiu", name: "Jiu-Jitsu", color: "#4e9bff", icon: "🥋", order: 1 },
  { id: "cat-look", name: "Aparência", color: "#ff5c8a", icon: "💈", order: 2 },
  { id: "cat-work", name: "Projetos", color: "#ffb14e", icon: "💼", order: 3 },
  { id: "cat-study", name: "Estudo", color: "#23c1aa", icon: "📚", order: 4 },
  { id: "cat-food", name: "Alimentação", color: "#3ddc97", icon: "🥗", order: 5 },
];

const defaultHabits: Habit[] = [
  habit("cat-shape", "Treino de força", 25, "h-shape-treino"),
  habit("cat-shape", "10k passos", 15, "h-shape-passos"),
  habit("cat-jiu", "Treino de Jiu-Jitsu", 30, "h-jiu-treino"),
  habit("cat-jiu", "Drill / mobilidade", 15, "h-jiu-drill"),
  habit("cat-look", "Skincare", 10, "h-look-skin"),
  habit("cat-look", "Dormir cedo", 15, "h-look-sleep"),
  habit("cat-work", "Foco no projeto", 30, "h-work-foco"),
  habit("cat-study", "Estudo", 20, "h-study"),
  habit("cat-food", "Proteína do dia", 20, "h-food-prot"),
  habit("cat-food", "2L de água", 10, "h-food-agua"),
];

function habit(categoryId: string, name: string, xp: number, id: string): Habit {
  return {
    id,
    categoryId,
    name,
    xp,
    days: [],
    target: 1,
    createdAt: dayKey(),
  };
}

function slot(
  id: string,
  habitId: string,
  weekday: Weekday,
  startTime: string,
  durationMinutes: number
): RoutineSlot {
  return { id, habitId, weekday, startTime, durationMinutes };
}

const defaultRoutineSlots: RoutineSlot[] = [
  // Segunda
  slot("s-mon-1", "h-shape-treino", 1, "07:00", 60),
  slot("s-mon-2", "h-food-agua", 1, "08:30", 15),
  slot("s-mon-3", "h-work-foco", 1, "10:00", 120),
  slot("s-mon-4", "h-food-prot", 1, "12:30", 30),
  slot("s-mon-5", "h-study", 1, "15:00", 45),
  slot("s-mon-6", "h-jiu-treino", 1, "19:30", 90),
  slot("s-mon-7", "h-look-skin", 1, "22:00", 15),
  // Terça
  slot("s-tue-1", "h-shape-passos", 2, "07:30", 45),
  slot("s-tue-2", "h-work-foco", 2, "10:00", 120),
  slot("s-tue-3", "h-study", 2, "14:00", 60),
  slot("s-tue-4", "h-jiu-drill", 2, "18:00", 45),
  slot("s-tue-5", "h-look-sleep", 2, "23:00", 15),
  // Quarta
  slot("s-wed-1", "h-shape-treino", 3, "07:00", 60),
  slot("s-wed-2", "h-work-foco", 3, "10:00", 120),
  slot("s-wed-3", "h-food-prot", 3, "12:30", 30),
  slot("s-wed-4", "h-study", 3, "16:00", 45),
  slot("s-wed-5", "h-jiu-treino", 3, "19:30", 90),
  // Quinta
  slot("s-thu-1", "h-shape-passos", 4, "07:30", 45),
  slot("s-thu-2", "h-work-foco", 4, "10:00", 120),
  slot("s-thu-3", "h-study", 4, "15:00", 60),
  slot("s-thu-4", "h-jiu-drill", 4, "18:00", 45),
  slot("s-thu-5", "h-look-skin", 4, "22:00", 15),
  // Sexta
  slot("s-fri-1", "h-shape-treino", 5, "07:00", 60),
  slot("s-fri-2", "h-work-foco", 5, "10:00", 120),
  slot("s-fri-3", "h-food-prot", 5, "12:30", 30),
  slot("s-fri-4", "h-jiu-treino", 5, "19:30", 90),
  // Sábado
  slot("s-sat-1", "h-shape-passos", 6, "09:00", 60),
  slot("s-sat-2", "h-study", 6, "11:00", 60),
  slot("s-sat-3", "h-look-skin", 6, "21:00", 15),
  // Domingo
  slot("s-sun-1", "h-jiu-drill", 0, "10:00", 45),
  slot("s-sun-2", "h-food-agua", 0, "12:00", 15),
  slot("s-sun-3", "h-look-sleep", 0, "23:00", 15),
];

export function createDefaultData(): AppData {
  return {
    categories: defaultCategories,
    habits: defaultHabits,
    routineSlots: defaultRoutineSlots,
    logs: {},
    slotLogs: {},
    skippedDays: {},
    totalXp: 0,
    unlocked: [],
    createdAt: dayKey(),
  };
}
