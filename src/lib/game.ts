/** XP necessário para alcançar um determinado nível (curva crescente suave). */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  // Soma quadrática suave: nível 2 = 100, cresce progressivamente.
  return Math.round(50 * (level - 1) * level);
}

export interface LevelInfo {
  level: number;
  current: number;
  needed: number;
  progress: number; // 0..1 dentro do nível atual
}

export function levelFromXp(totalXp: number): LevelInfo {
  let level = 1;
  while (xpForLevel(level + 1) <= totalXp) {
    level++;
  }
  const base = xpForLevel(level);
  const next = xpForLevel(level + 1);
  const span = next - base;
  const current = totalXp - base;
  return {
    level,
    current,
    needed: span,
    progress: span > 0 ? current / span : 1,
  };
}

export const RANK_TITLES = [
  "Iniciante",
  "Aprendiz",
  "Disciplinado",
  "Constante",
  "Focado",
  "Implacável",
  "Veterano",
  "Mestre",
  "Lendário",
];

export function rankTitle(level: number): string {
  const idx = Math.min(Math.floor((level - 1) / 3), RANK_TITLES.length - 1);
  return RANK_TITLES[idx];
}
