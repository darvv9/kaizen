import type { IconName } from "./icons/names";

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: IconName;
  order: number;
}

/** Variação de uma atividade: Treino A/B/C, No-gi/Gi, etc. */
export interface HabitVariant {
  id: string;
  name: string;
  /** Composição — exercícios, uma linha cada. Vazio quando não se aplica. */
  items: string[];
}

export interface Habit {
  id: string;
  categoryId: string;
  name: string;
  createdAt: string;
  archived?: boolean;
  variants: HabitVariant[];
}

/** Bloco da rotina semanal: atividade + dia + horário. */
export interface RoutineSlot {
  id: string;
  habitId: string;
  weekday: Weekday;
  startTime: string;
  durationMinutes: number;
  /** Variação padrão deste bloco na semana. */
  variantId?: string;
}

/** slotId → dayKey → concluído. */
export type SlotLogs = Record<string, Record<string, boolean>>;
/** slotId → dayKey → variação daquele dia (sobrepõe a do bloco). */
export type SlotVariants = Record<string, Record<string, string>>;
/** Dias marcados como pulados (YYYY-MM-DD). */
export type SkippedDays = Record<string, true>;

export interface PhysiqueEntry {
  id: string;
  /** YYYY-MM-DD */
  date: string;
  /** Chave do vídeo no adapter de mídia (IndexedDB). */
  mediaId: string;
  note?: string;
  durationSec?: number;
  sizeBytes?: number;
  createdAt: string;
}

export interface PhysiqueState {
  entries: PhysiqueEntry[];
  intervalDays: number;
  /** Silencia o lembrete até este dia (YYYY-MM-DD). */
  snoozedUntil?: string;
  badgeEnabled?: boolean;
}

export interface AppData {
  schemaVersion: 2;
  categories: Category[];
  habits: Habit[];
  routineSlots: RoutineSlot[];
  slotLogs: SlotLogs;
  slotVariants: SlotVariants;
  skippedDays: SkippedDays;
  physique: PhysiqueState;
  createdAt: string;
}
