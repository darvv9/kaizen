import type { AppData } from "../types";
import { addDays, dayKey } from "./date";
import { isSlotDone, scheduleForDay } from "./routine";

export function isDaySkipped(data: AppData, key: string): boolean {
  return data.skippedDays[key] === true;
}

/** Progresso do dia. Dia pulado não tem tarefa nenhuma. */
export function dayProgress(data: AppData, date: Date): { done: number; total: number } {
  const key = dayKey(date);
  if (isDaySkipped(data, key)) return { done: 0, total: 0 };

  const items = scheduleForDay(data, date);
  let done = 0;
  for (const { slot } of items) {
    if (isSlotDone(data, slot.id, key)) done++;
  }
  return { done, total: items.length };
}

function hasAnyCompletion(data: AppData, date: Date): boolean {
  const key = dayKey(date);
  for (const slotId in data.slotLogs) {
    if (data.slotLogs[slotId]?.[key]) return true;
  }
  return false;
}

/** Dias com pelo menos uma conclusão contam; dias pulados não quebram. */
export function currentStreak(data: AppData, today: Date = new Date()): number {
  let streak = 0;
  let cursor = today;

  if (!hasAnyCompletion(data, cursor) && !isDaySkipped(data, dayKey(today))) {
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
