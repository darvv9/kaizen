import type { AppData, Category, Habit, RoutineSlot, Weekday } from "../types";
import { parseTime } from "./time";
import { weekdayOf } from "./date";

export interface ScheduledItem {
  slot: RoutineSlot;
  habit: Habit;
  category?: Category;
}

export function slotsForWeekday(data: AppData, weekday: Weekday): RoutineSlot[] {
  return data.routineSlots
    .filter((s) => s.weekday === weekday)
    .sort((a, b) => parseTime(a.startTime) - parseTime(b.startTime));
}

export function scheduleForDay(data: AppData, date: Date = new Date()): ScheduledItem[] {
  const wd = weekdayOf(date);
  const habitMap = new Map(data.habits.map((h) => [h.id, h]));
  const catMap = new Map(data.categories.map((c) => [c.id, c]));
  const items: ScheduledItem[] = [];

  for (const slot of slotsForWeekday(data, wd)) {
    const habit = habitMap.get(slot.habitId);
    if (!habit || habit.archived) continue;
    items.push({
      slot,
      habit,
      category: catMap.get(habit.categoryId),
    });
  }
  return items;
}

export function isSlotDone(data: AppData, slotId: string, key: string): boolean {
  return data.slotLogs[slotId]?.[key] === true;
}

export function uniqueHabitsFromSlots(data: AppData, weekday: Weekday): Habit[] {
  const seen = new Set<string>();
  const out: Habit[] = [];
  for (const slot of slotsForWeekday(data, weekday)) {
    const h = data.habits.find((x) => x.id === slot.habitId);
    if (h && !seen.has(h.id)) {
      seen.add(h.id);
      out.push(h);
    }
  }
  return out;
}

export function hasRoutine(data: AppData): boolean {
  return data.routineSlots.length > 0;
}
