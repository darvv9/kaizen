import type { RoutineSlot } from "../types";
import { parseTime, slotVisualEndMinutes } from "./time";

export interface SlotLayout {
  column: number;
  totalColumns: number;
}

function visualEnd(slot: RoutineSlot): number {
  return slotVisualEndMinutes(slot.startTime, slot.durationMinutes);
}

function slotsOverlap(a: RoutineSlot, b: RoutineSlot): boolean {
  const aStart = parseTime(a.startTime);
  const bStart = parseTime(b.startTime);
  return aStart < visualEnd(b) && bStart < visualEnd(a);
}

function groupOverlapping(slots: RoutineSlot[]): RoutineSlot[][] {
  const parent = new Map<string, string>();
  for (const s of slots) parent.set(s.id, s.id);

  function find(id: string): string {
    let root = id;
    while (parent.get(root) !== root) root = parent.get(root)!;
    let cur = id;
    while (parent.get(cur) !== root) {
      const next = parent.get(cur)!;
      parent.set(cur, root);
      cur = next;
    }
    return root;
  }

  function unite(a: string, b: string) {
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(ra, rb);
  }

  for (let i = 0; i < slots.length; i++) {
    for (let j = i + 1; j < slots.length; j++) {
      if (slotsOverlap(slots[i], slots[j])) unite(slots[i].id, slots[j].id);
    }
  }

  const groups = new Map<string, RoutineSlot[]>();
  for (const slot of slots) {
    const root = find(slot.id);
    if (!groups.has(root)) groups.set(root, []);
    groups.get(root)!.push(slot);
  }
  return [...groups.values()];
}

/** Máximo de blocos simultâneos (usa tamanho visual na tela). */
function maxConcurrent(slots: RoutineSlot[]): number {
  const points: { t: number; delta: number }[] = [];
  for (const s of slots) {
    points.push({ t: parseTime(s.startTime), delta: 1 });
    points.push({ t: visualEnd(s), delta: -1 });
  }
  points.sort((a, b) => a.t - b.t || a.delta - b.delta);
  let cur = 0;
  let max = 0;
  for (const p of points) {
    cur += p.delta;
    max = Math.max(max, cur);
  }
  return Math.max(1, max);
}

/** Quantos blocos competem com este no instante em que ele começa. */
function columnsAtStart(slot: RoutineSlot, group: RoutineSlot[]): number {
  const start = parseTime(slot.startTime);
  let count = 0;
  for (const other of group) {
    if (parseTime(other.startTime) <= start && start < visualEnd(other)) count++;
  }
  return Math.max(1, count);
}

export function computeSlotLayouts(slots: RoutineSlot[]): Map<string, SlotLayout> {
  const layouts = new Map<string, SlotLayout>();
  if (slots.length === 0) return layouts;

  for (const group of groupOverlapping(slots)) {
    const ordered = [...group].sort(
      (a, b) =>
        parseTime(a.startTime) - parseTime(b.startTime) ||
        visualEnd(b) - visualEnd(a)
    );

    const columnEnds: number[] = [];
    const columns = new Map<string, number>();

    for (const slot of ordered) {
      const start = parseTime(slot.startTime);
      const end = visualEnd(slot);
      let column = 0;
      while (column < columnEnds.length && columnEnds[column] > start) column++;
      if (column === columnEnds.length) columnEnds.push(end);
      else columnEnds[column] = Math.max(columnEnds[column], end);
      columns.set(slot.id, column);
    }

    const groupMax = maxConcurrent(group);

    for (const slot of ordered) {
      const atStart = columnsAtStart(slot, group);
      layouts.set(slot.id, {
        column: columns.get(slot.id) ?? 0,
        totalColumns: Math.max(groupMax, atStart, columnEnds.length),
      });
    }
  }

  return layouts;
}

export function hasOverlaps(slots: RoutineSlot[]): boolean {
  for (let i = 0; i < slots.length; i++) {
    for (let j = i + 1; j < slots.length; j++) {
      if (slotsOverlap(slots[i], slots[j])) return true;
    }
  }
  return false;
}
