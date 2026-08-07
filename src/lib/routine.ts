import type { AppData, Category, Habit, HabitVariant, RoutineSlot, Weekday } from "../types";
import { parseTime } from "./time";
import { dayKey, weekdayOf } from "./date";
import { resolveVariantId, variantOf } from "./variants";

export interface ScheduledItem {
  slot: RoutineSlot;
  habit: Habit;
  category?: Category;
  variant?: HabitVariant;
}

export function slotsForWeekday(data: AppData, weekday: Weekday): RoutineSlot[] {
  return data.routineSlots
    .filter((s) => s.weekday === weekday)
    .sort((a, b) => parseTime(a.startTime) - parseTime(b.startTime));
}

/** Blocos do dia, em ordem de horário, com a variação já resolvida. */
export function scheduleForDay(data: AppData, date: Date = new Date()): ScheduledItem[] {
  const key = dayKey(date);
  const habitMap = new Map(data.habits.map((h) => [h.id, h]));
  const catMap = new Map(data.categories.map((c) => [c.id, c]));
  const items: ScheduledItem[] = [];

  for (const slot of slotsForWeekday(data, weekdayOf(date))) {
    const habit = habitMap.get(slot.habitId);
    if (!habit || habit.archived) continue;
    items.push({
      slot,
      habit,
      category: catMap.get(habit.categoryId),
      variant: variantOf(habit, resolveVariantId(data, slot, key)),
    });
  }
  return items;
}

export function isSlotDone(data: AppData, slotId: string, key: string): boolean {
  return data.slotLogs[slotId]?.[key] === true;
}
