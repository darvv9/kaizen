import type { RoutineSlot, Weekday } from "../types";
import { parseTime } from "./time";

/** Segunda → Domingo (ordem das colunas da grade). */
export const WEEK_DAYS: Weekday[] = [1, 2, 3, 4, 5, 6, 0];

export const SNAP_MINUTES = 15;
export const MIN_DURATION = 15;
/** Altura mínima de um bloco para o nome caber e continuar tocável. */
export const MIN_BLOCK_PX = 20;

const MIN_PX_PER_MIN = 0.42;
const MAX_PX_PER_MIN = 1.1;
const DEFAULT_START = 7 * 60;
const DEFAULT_END = 22 * 60;

export interface GridRange {
  start: number;
  end: number;
  minutes: number;
}

/** Janela de horas da grade: cresce só o necessário pra caber a rotina. */
export function gridRange(slots: RoutineSlot[]): GridRange {
  let start = DEFAULT_START;
  let end = DEFAULT_END;
  for (const slot of slots) {
    const from = parseTime(slot.startTime);
    start = Math.min(start, from);
    end = Math.max(end, from + slot.durationMinutes);
  }
  const first = Math.max(0, Math.floor(start / 60) * 60);
  const last = Math.min(24 * 60, Math.ceil(end / 60) * 60);
  return { start: first, end: last, minutes: last - first };
}

/** Escala vertical: tenta caber a semana inteira na tela sem sumir com os blocos. */
export function pxPerMinute(availableHeight: number, range: GridRange): number {
  if (availableHeight <= 0 || range.minutes <= 0) return MIN_PX_PER_MIN;
  return Math.min(
    MAX_PX_PER_MIN,
    Math.max(MIN_PX_PER_MIN, availableHeight / range.minutes)
  );
}

export function snapMinutes(minutes: number): number {
  return Math.round(minutes / SNAP_MINUTES) * SNAP_MINUTES;
}

export function floorToSnap(minutes: number): number {
  return Math.floor(minutes / SNAP_MINUTES) * SNAP_MINUTES;
}

export function clampStart(
  minutes: number,
  durationMinutes: number,
  range: GridRange
): number {
  return Math.max(range.start, Math.min(range.end - durationMinutes, minutes));
}

export function clampDuration(
  minutes: number,
  startMinutes: number,
  range: GridRange
): number {
  return Math.max(MIN_DURATION, Math.min(range.end - startMinutes, minutes));
}

export function hourMarks(range: GridRange): number[] {
  const out: number[] = [];
  for (let m = range.start; m <= range.end; m += 60) out.push(m);
  return out;
}
