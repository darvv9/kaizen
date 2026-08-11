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

/** Janela que aparece de cara. O resto do dia fica a um scroll de distância. */
const VIEW_START = 7 * 60;
const VIEW_END = 22 * 60;
const VIEW_MINUTES = VIEW_END - VIEW_START;

export interface GridRange {
  start: number;
  end: number;
  minutes: number;
}

/** A grade é sempre o dia inteiro — quem escolhe a janela é o scroll. */
export const FULL_DAY: GridRange = { start: 0, end: 24 * 60, minutes: 24 * 60 };

/**
 * Escala vertical: a janela padrão (7h–22h) preenche a caixa visível, e as
 * outras 9 horas do dia ficam fora dela, alcançáveis rolando.
 */
export function pxPerMinute(availableHeight: number): number {
  if (availableHeight <= 0) return MIN_PX_PER_MIN;
  return Math.min(
    MAX_PX_PER_MIN,
    Math.max(MIN_PX_PER_MIN, availableHeight / VIEW_MINUTES)
  );
}

/** Abre em 7h — mas nunca escondendo um bloco que começa antes disso. */
export function initialScrollTop(slots: RoutineSlot[], pxPerMin: number): number {
  let earliest = VIEW_START;
  for (const slot of slots) {
    earliest = Math.min(earliest, parseTime(slot.startTime) - 30);
  }
  return Math.max(0, Math.min(VIEW_START, earliest)) * pxPerMin;
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

/** Só as horas cheias estritamente dentro da janela: 0h e 24h são a borda. */
export function hourMarks(range: GridRange): number[] {
  const out: number[] = [];
  for (let m = Math.ceil(range.start / 60) * 60; m < range.end; m += 60) {
    if (m > range.start) out.push(m);
  }
  return out;
}
