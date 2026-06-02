import type { AppData } from "../types";
import { addDays, dayKey } from "./date";
import { dayProgress } from "./stats";

export type ProductivityLevel = "skipped" | "none" | "low" | "medium" | "high";

export interface DaySummary {
  key: string;
  date: Date;
  label: string;
  relative: string;
  level: ProductivityLevel;
  labelPt: string;
  score: number;
  done: number;
  total: number;
  color: string;
}

export function isDaySkipped(data: AppData, key: string): boolean {
  return data.skippedDays[key] === true;
}

export function dayScoreRatio(data: AppData, date: Date): number {
  const { done, total } = dayProgress(data, date);
  if (total === 0) return 0;
  return done / total;
}

export function productivityLevel(
  data: AppData,
  date: Date
): { level: ProductivityLevel; labelPt: string; color: string; score: number } {
  const key = dayKey(date);
  const { done, total } = dayProgress(data, date);

  if (isDaySkipped(data, key)) {
    return { level: "skipped", labelPt: "Pulado", color: "#6b7cff", score: -1 };
  }
  if (total === 0) {
    return { level: "none", labelPt: "Sem rotina", color: "#3a3a42", score: 0 };
  }

  const score = done / total;
  if (score >= 0.8) {
    return { level: "high", labelPt: "Alta", color: "#ffffff", score };
  }
  if (score >= 0.5) {
    return { level: "medium", labelPt: "Média", color: "#9ca3af", score };
  }
  if (score > 0) {
    return { level: "low", labelPt: "Baixa", color: "#f59e0b", score };
  }
  return { level: "none", labelPt: "Baixa", color: "#ef4444", score: 0 };
}

function relativeLabel(date: Date, today: Date): string {
  const k = dayKey(date);
  if (k === dayKey(today)) return "Hoje";
  if (k === dayKey(addDays(today, -1))) return "Ontem";
  return date.toLocaleDateString("pt-BR", { weekday: "short" });
}

export function buildDaySummaries(
  data: AppData,
  days: number,
  from: Date = new Date()
): DaySummary[] {
  const out: DaySummary[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = addDays(from, -i);
    const key = dayKey(date);
    const { done, total } = dayProgress(data, date);
    const prod = productivityLevel(data, date);
    out.push({
      key,
      date,
      label: date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      relative: relativeLabel(date, from),
      level: prod.level,
      labelPt: prod.labelPt,
      score: prod.score,
      done,
      total,
      color: prod.color,
    });
  }
  return out;
}

/** Todos os dias de um mês civil (para grade do calendário). */
export function buildMonthSummaries(
  data: AppData,
  year: number,
  month: number,
  today: Date = new Date()
): DaySummary[] {
  const last = new Date(year, month + 1, 0).getDate();
  const out: DaySummary[] = [];
  const nowKey = dayKey(today);
  for (let d = 1; d <= last; d++) {
    const date = new Date(year, month, d);
    const key = dayKey(date);
    if (key > nowKey) continue;
    const { done, total } = dayProgress(data, date);
    const prod = productivityLevel(data, date);
    out.push({
      key,
      date,
      label: date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      relative: relativeLabel(date, today),
      level: prod.level,
      labelPt: prod.labelPt,
      score: prod.score,
      done,
      total,
      color: prod.color,
    });
  }
  return out;
}

export function summaryForDay(data: AppData, date: Date, today = new Date()): DaySummary {
  const key = dayKey(date);
  const { done, total } = dayProgress(data, date);
  const prod = productivityLevel(data, date);
  return {
    key,
    date,
    label: date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    relative: relativeLabel(date, today),
    level: prod.level,
    labelPt: prod.labelPt,
    score: prod.score,
    done,
    total,
    color: prod.color,
  };
}
