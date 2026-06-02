import type { AppData, Habit, RoutineSlot, Weekday } from "../types";
import { uid } from "../lib/id";

/** Normaliza dados antigos (sem rotina) para o schema atual. */
export function migrateAppData(raw: Partial<AppData> & Pick<AppData, "categories" | "habits">): AppData {
  const habits = raw.habits ?? [];
  let routineSlots = raw.routineSlots ?? [];
  const slotLogs = raw.slotLogs ?? {};

  if (routineSlots.length === 0 && habits.length > 0) {
    routineSlots = habitsToDefaultSlots(habits);
  }

  return {
    categories: raw.categories,
    habits,
    routineSlots,
    logs: raw.logs ?? {},
    slotLogs,
    skippedDays: raw.skippedDays ?? {},
    totalXp: raw.totalXp ?? 0,
    unlocked: raw.unlocked ?? [],
    createdAt: raw.createdAt ?? new Date().toISOString().slice(0, 10),
  };
}

function habitsToDefaultSlots(habits: Habit[]): RoutineSlot[] {
  const defaultTimes = ["07:00", "08:30", "10:00", "12:00", "15:00", "18:00", "19:30", "22:00"];
  const slots: RoutineSlot[] = [];
  let timeIdx = 0;

  for (const habit of habits) {
    if (habit.archived) continue;
    const weekdays: Weekday[] =
      habit.days.length === 0 ? [0, 1, 2, 3, 4, 5, 6] : habit.days;

    for (const wd of weekdays) {
      slots.push({
        id: uid("s-"),
        habitId: habit.id,
        weekday: wd,
        startTime: defaultTimes[timeIdx % defaultTimes.length],
        durationMinutes: 45,
      });
      timeIdx++;
    }
  }

  return slots;
}
