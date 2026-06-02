export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  order: number;
}

export interface Habit {
  id: string;
  categoryId: string;
  name: string;
  xp: number;
  /** Legado: usado só se não houver rotina montada. */
  days: Weekday[];
  target: number;
  createdAt: string;
  archived?: boolean;
}

/** Bloco da rotina semanal: hábito + dia + horário. */
export interface RoutineSlot {
  id: string;
  habitId: string;
  weekday: Weekday;
  startTime: string;
  durationMinutes: number;
}

export type Logs = Record<string, Record<string, number>>;
export type SlotLogs = Record<string, Record<string, boolean>>;
/** Dias marcados como pulados (YYYY-MM-DD). */
export type SkippedDays = Record<string, true>;

export interface AppData {
  categories: Category[];
  habits: Habit[];
  routineSlots: RoutineSlot[];
  logs: Logs;
  slotLogs: SlotLogs;
  skippedDays: SkippedDays;
  totalXp: number;
  unlocked: string[];
  createdAt: string;
}
