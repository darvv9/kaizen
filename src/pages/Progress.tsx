import { useMemo } from "react";
import { motion } from "framer-motion";
import { useStore } from "../store/useStore";
import { levelFromXp, rankTitle, xpForLevel } from "../lib/game";
import {
  bestStreak,
  currentStreak,
  totalCompletions,
  xpByCategory,
} from "../lib/stats";
import { lastNDays, WEEKDAY_LABELS } from "../lib/date";
import { buildDaySummaries } from "../lib/productivity";
import { DayHistory } from "../components/DayHistory";

export function Progress() {
  const data = useStore((s) => s.data);

  const level = levelFromXp(data.totalXp);
  const streak = currentStreak(data);
  const best = bestStreak(data);
  const completions = totalCompletions(data);

  const week = useMemo(() => {
    const summaries = buildDaySummaries(data, 7);
    return summaries.map((s, i) => ({
      label: WEEKDAY_LABELS[lastNDays(7)[i].getDay()],
      pct: s.level === "skipped" ? -1 : s.score < 0 ? 0 : s.score,
      level: s.level,
      color: s.color,
      done: s.done,
      total: s.total,
    }));
  }, [data]);

  const catXp = useMemo(() => xpByCategory(data), [data]);
  const cats = [...data.categories].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6">
      <header>
        <div className="text-xs uppercase tracking-[0.2em] text-white/40">
          Progresso
        </div>
        <h1 className="text-2xl font-bold text-white">Sua evolução</h1>
      </header>

      <section className="card overflow-hidden p-5">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-5xl font-bold text-white">{level.level}</div>
            <div className="text-sm font-medium text-accent-soft">
              {rankTitle(level.level)}
            </div>
          </div>
          <div className="text-right text-sm text-white/45">
            <div>{data.totalXp} XP total</div>
            <div>
              faltam {Math.max(0, xpForLevel(level.level + 1) - data.totalXp)} p/ nível{" "}
              {level.level + 1}
            </div>
          </div>
        </div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/[0.06]">
          <motion.div
            className="h-full rounded-full bg-accent shadow-glow"
            initial={{ width: 0 }}
            animate={{ width: `${level.progress * 100}%` }}
            transition={{ type: "spring", stiffness: 80, damping: 18 }}
          />
        </div>
      </section>

      <section className="grid grid-cols-3 gap-3">
        <Stat label="Sequência" value={`${streak}`} suffix="dias" icon="🔥" />
        <Stat label="Recorde" value={`${best}`} suffix="dias" icon="🏅" />
        <Stat label="Concluídos" value={`${completions}`} suffix="total" icon="✅" />
      </section>

      <section className="card p-5">
        <h2 className="mb-4 text-sm font-semibold text-white/80">
          Últimos 7 dias
        </h2>
        <div className="flex items-end justify-between gap-2" style={{ height: 130 }}>
          {week.map((d, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex h-[96px] w-full items-end justify-center">
                <motion.div
                  className="w-7 rounded-full"
                  style={{
                    background:
                      d.level === "skipped"
                        ? "linear-gradient(180deg, #6b7cff, #6b7cff88)"
                        : d.pct > 0
                        ? `linear-gradient(180deg, ${d.color}, ${d.color}88)`
                        : d.total === 0
                        ? "rgba(255,255,255,0.06)"
                        : `${d.color}66`,
                  }}
                  initial={{ height: 4 }}
                  animate={{
                    height: Math.max(
                      4,
                      (d.level === "skipped"
                        ? 0.2
                        : d.pct > 0
                        ? d.pct
                        : d.total > 0
                        ? 0.12
                        : 0.04) * 96
                    ),
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 120,
                    damping: 18,
                    delay: i * 0.04,
                  }}
                />
              </div>
              <span className="text-[11px] text-white/45">{d.label}</span>
            </div>
          ))}
        </div>
      </section>

      <DayHistory />

      <section className="card p-5">
        <h2 className="mb-4 text-sm font-semibold text-white/80">Por categoria</h2>
        <div className="space-y-4">
          {cats.map((cat) => {
            const xp = catXp[cat.id] ?? 0;
            const lvl = levelFromXp(xp);
            return (
              <div key={cat.id}>
                <div className="mb-1.5 flex items-center gap-2 text-sm">
                  <span>{cat.icon}</span>
                  <span className="font-medium text-white/85">{cat.name}</span>
                  <span className="ml-auto text-xs text-white/45">
                    Nível {lvl.level} · {xp} XP
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: cat.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${lvl.progress * 100}%` }}
                    transition={{ type: "spring", stiffness: 90, damping: 18 }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  suffix,
  icon,
}: {
  label: string;
  value: string;
  suffix: string;
  icon: string;
}) {
  return (
    <div className="card flex flex-col items-center gap-0.5 px-2 py-4">
      <span className="text-xl">{icon}</span>
      <span className="text-2xl font-bold text-white">{value}</span>
      <span className="text-[10px] uppercase tracking-wide text-white/40">
        {label}
      </span>
      <span className="text-[10px] text-white/30">{suffix}</span>
    </div>
  );
}
