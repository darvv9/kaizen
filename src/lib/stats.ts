import type { AppData, Habit, Weekday } from "../types";
import { addDays, dayKey, weekdayOf } from "./date";
import { hasRoutine, scheduleForDay, isSlotDone, slotsForWeekday } from "./routine";
import { isDaySkipped } from "./productivity";

export function isScheduled(habit: Habit, weekday: Weekday): boolean {
  if (habit.archived) return false;
  return habit.days.length === 0 || habit.days.includes(weekday);
}

export function habitsForDay(data: AppData, date: Date): Habit[] {
  if (hasRoutine(data)) {
    const wd = weekdayOf(date);
    const seen = new Set<string>();
    const out: Habit[] = [];
    for (const slot of slotsForWeekday(data, wd)) {
      const h = data.habits.find((x) => x.id === slot.habitId);
      if (h && !h.archived && !seen.has(h.id)) {
        seen.add(h.id);
        out.push(h);
      }
    }
    return out;
  }
  const wd = weekdayOf(date);
  return data.habits.filter((h) => isScheduled(h, wd));
}

export function completedCount(data: AppData, habitId: string, key: string): number {
  return data.logs[habitId]?.[key] ?? 0;
}

export function isDone(data: AppData, habit: Habit, key: string): boolean {
  if (hasRoutine(data)) {
    const wdSlots = data.routineSlots.filter((s) => s.habitId === habit.id);
    if (wdSlots.length === 0) return false;
    return wdSlots.every((s) => isSlotDone(data, s.id, key));
  }
  return completedCount(data, habit.id, key) >= habit.target;
}

export function isHabitDoneOnDay(data: AppData, habitId: string, key: string): boolean {
  const habit = data.habits.find((h) => h.id === habitId);
  if (!habit) return false;
  return isDone(data, habit, key);
}

/** Progresso do dia: slots concluídos quando há rotina, senão hábitos. Pulado = 0 tarefas. */
export function dayProgress(data: AppData, date: Date): { done: number; total: number } {
  const key = dayKey(date);
  if (isDaySkipped(data, key)) return { done: 0, total: 0 };
  if (hasRoutine(data)) {
    const items = scheduleForDay(data, date);
    let done = 0;
    for (const { slot } of items) {
      if (isSlotDone(data, slot.id, key)) done++;
    }
    return { done, total: items.length };
  }
  const habits = habitsForDay(data, date);
  let done = 0;
  for (const h of habits) {
    if (isDone(data, h, key)) done++;
  }
  return { done, total: habits.length };
}

function hasAnyCompletion(data: AppData, date: Date): boolean {
  const key = dayKey(date);
  if (hasRoutine(data)) {
    for (const slotId in data.slotLogs) {
      if (data.slotLogs[slotId]?.[key]) return true;
    }
  }
  for (const habitId in data.logs) {
    if ((data.logs[habitId]?.[key] ?? 0) > 0) return true;
  }
  return false;
}

export function isPerfectDay(data: AppData, date: Date): boolean {
  if (isDaySkipped(data, dayKey(date))) return false;
  const { done, total } = dayProgress(data, date);
  return total > 0 && done === total;
}

/** Dias com conclusão contam; dias pulados não quebram a sequência. */
export function currentStreak(data: AppData, today: Date = new Date()): number {
  let streak = 0;
  let cursor = today;
  const todayKey = dayKey(today);

  if (!hasAnyCompletion(data, cursor) && !isDaySkipped(data, todayKey)) {
    cursor = addDays(cursor, -1);
  }

  for (let guard = 0; guard < 400; guard++) {
    const key = dayKey(cursor);
    if (isDaySkipped(data, key)) {
      cursor = addDays(cursor, -1);
      continue;
    }
    if (hasAnyCompletion(data, cursor)) {
      streak++;
      cursor = addDays(cursor, -1);
      continue;
    }
    break;
  }
  return streak;
}

export function bestStreak(data: AppData): number {
  const keys = new Set<string>();
  if (hasRoutine(data)) {
    for (const slotId in data.slotLogs) {
      for (const key in data.slotLogs[slotId]) {
        if (data.slotLogs[slotId][key]) keys.add(key);
      }
    }
  }
  for (const habitId in data.logs) {
    for (const key in data.logs[habitId]) {
      if ((data.logs[habitId][key] ?? 0) > 0) keys.add(key);
    }
  }
  if (keys.size === 0) return 0;
  const sorted = [...keys].sort();
  let best = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1] + "T00:00:00");
    const cur = new Date(sorted[i] + "T00:00:00");
    const diff = Math.round((cur.getTime() - prev.getTime()) / 86400000);
    if (diff === 1) {
      run++;
      best = Math.max(best, run);
    } else {
      run = 1;
    }
  }
  return best;
}

export function totalCompletions(data: AppData): number {
  if (hasRoutine(data)) {
    let total = 0;
    for (const slotId in data.slotLogs) {
      for (const key in data.slotLogs[slotId]) {
        if (data.slotLogs[slotId][key]) total++;
      }
    }
    return total;
  }
  let total = 0;
  for (const habitId in data.logs) {
    for (const key in data.logs[habitId]) {
      total += data.logs[habitId][key] ?? 0;
    }
  }
  return total;
}

export function countPerfectDays(data: AppData): number {
  const keys = new Set<string>();
  if (hasRoutine(data)) {
    for (const slotId in data.slotLogs) {
      for (const key in data.slotLogs[slotId]) {
        if (data.slotLogs[slotId][key]) keys.add(key);
      }
    }
  }
  for (const habitId in data.logs) {
    for (const key in data.logs[habitId]) {
      if ((data.logs[habitId][key] ?? 0) > 0) keys.add(key);
    }
  }
  let count = 0;
  for (const key of keys) {
    if (isPerfectDay(data, new Date(key + "T00:00:00"))) count++;
  }
  return count;
}

export function xpByCategory(data: AppData): Record<string, number> {
  const habitMap = new Map(data.habits.map((h) => [h.id, h]));
  const out: Record<string, number> = {};

  if (hasRoutine(data)) {
    for (const slotId in data.slotLogs) {
      const slot = data.routineSlots.find((s) => s.id === slotId);
      if (!slot) continue;
      const habit = habitMap.get(slot.habitId);
      if (!habit) continue;
      let count = 0;
      for (const key in data.slotLogs[slotId]) {
        if (data.slotLogs[slotId][key]) count++;
      }
      out[habit.categoryId] = (out[habit.categoryId] ?? 0) + count * habit.xp;
    }
    return out;
  }

  for (const habitId in data.logs) {
    const habit = habitMap.get(habitId);
    if (!habit) continue;
    let count = 0;
    for (const key in data.logs[habitId]) {
      count += data.logs[habitId][key] ?? 0;
    }
    out[habit.categoryId] = (out[habit.categoryId] ?? 0) + count * habit.xp;
  }
  return out;
}
