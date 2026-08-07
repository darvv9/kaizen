import type { AppData, PhysiqueEntry } from "../types";
import { addDays, dayKey, parseDayKey } from "./date";

export type PhysiqueStateName = "empty" | "ok" | "due" | "late";

export interface PhysiqueStatus {
  state: PhysiqueStateName;
  last: PhysiqueEntry | null;
  daysSinceLast: number | null;
  /** Positivo = faltam dias; zero = hoje; negativo = atrasado. */
  daysUntilDue: number;
  dueKey: string | null;
}

export function daysBetween(fromKey: string, toKey: string): number {
  const from = parseDayKey(fromKey).getTime();
  const to = parseDayKey(toKey).getTime();
  return Math.round((to - from) / 86400000);
}

export function lastPhysiqueEntry(data: AppData): PhysiqueEntry | null {
  return data.physique.entries[0] ?? null;
}

export function physiqueStatus(data: AppData, today: Date = new Date()): PhysiqueStatus {
  const todayKey = dayKey(today);
  const last = lastPhysiqueEntry(data);
  const interval = Math.max(1, data.physique.intervalDays);

  if (!last) {
    return { state: "empty", last: null, daysSinceLast: null, daysUntilDue: 0, dueKey: null };
  }

  const daysSinceLast = daysBetween(last.date, todayKey);
  const dueKey = dayKey(addDays(parseDayKey(last.date), interval));
  const daysUntilDue = interval - daysSinceLast;

  return {
    state: daysUntilDue > 0 ? "ok" : daysUntilDue === 0 ? "due" : "late",
    last,
    daysSinceLast,
    daysUntilDue,
    dueKey,
  };
}

/** Cobra na tela Hoje? Respeita o "depois". */
export function shouldNagToday(data: AppData, today: Date = new Date()): boolean {
  const { state } = physiqueStatus(data, today);
  if (state === "ok") return false;
  const snoozed = data.physique.snoozedUntil;
  return !snoozed || dayKey(today) > snoozed;
}

export function physiqueStatusLabel(status: PhysiqueStatus): string {
  switch (status.state) {
    case "empty":
      return "Primeiro vídeo";
    case "ok":
      return `Próximo em ${status.daysUntilDue} ${status.daysUntilDue === 1 ? "dia" : "dias"}`;
    case "due":
      return "Vídeo novo é hoje";
    case "late": {
      const late = Math.abs(status.daysUntilDue);
      return `Atrasado ${late} ${late === 1 ? "dia" : "dias"}`;
    }
  }
}

export function prettyDayKey(key: string): string {
  return parseDayKey(key).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
  });
}

export function relativeDays(days: number): string {
  if (days <= 0) return "hoje";
  if (days === 1) return "ontem";
  return `há ${days} dias`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const mb = bytes / (1024 * 1024);
  if (mb < 1) return `${(bytes / 1024).toFixed(0)} KB`;
  if (mb < 1024) return `${mb.toFixed(mb < 10 ? 1 : 0)} MB`;
  return `${(mb / 1024).toFixed(1)} GB`;
}
