import type { AppData } from "../types";
import { levelFromXp } from "../lib/game";

export interface Achievement {
  id: string;
  name: string;
  desc: string;
  icon: string;
  /** Retorna progresso 0..1 dado o estado atual. */
  progress: (ctx: AchievementContext) => number;
}

export interface AchievementContext {
  data: AppData;
  bestStreak: number;
  currentStreak: number;
  totalCompletions: number;
  perfectDays: number;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first-step",
    name: "Primeiro passo",
    desc: "Complete seu primeiro hábito",
    icon: "🌱",
    progress: (c) => clamp(c.totalCompletions / 1),
  },
  {
    id: "streak-3",
    name: "Esquentando",
    desc: "3 dias seguidos",
    icon: "🔥",
    progress: (c) => clamp(c.bestStreak / 3),
  },
  {
    id: "streak-7",
    name: "Semana cheia",
    desc: "7 dias seguidos",
    icon: "⚡",
    progress: (c) => clamp(c.bestStreak / 7),
  },
  {
    id: "streak-30",
    name: "Inquebrável",
    desc: "30 dias seguidos",
    icon: "💎",
    progress: (c) => clamp(c.bestStreak / 30),
  },
  {
    id: "level-5",
    name: "Subindo de nível",
    desc: "Alcance o nível 5",
    icon: "🚀",
    progress: (c) => clamp(levelFromXp(c.data.totalXp).level / 5),
  },
  {
    id: "level-10",
    name: "Veterano",
    desc: "Alcance o nível 10",
    icon: "🏆",
    progress: (c) => clamp(levelFromXp(c.data.totalXp).level / 10),
  },
  {
    id: "completions-50",
    name: "Constante",
    desc: "50 hábitos concluídos",
    icon: "🎯",
    progress: (c) => clamp(c.totalCompletions / 50),
  },
  {
    id: "completions-200",
    name: "Máquina",
    desc: "200 hábitos concluídos",
    icon: "🤖",
    progress: (c) => clamp(c.totalCompletions / 200),
  },
  {
    id: "perfect-5",
    name: "Dia perfeito x5",
    desc: "5 dias com tudo concluído",
    icon: "👑",
    progress: (c) => clamp(c.perfectDays / 5),
  },
];

function clamp(v: number): number {
  return Math.max(0, Math.min(1, v));
}
