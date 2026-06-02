import { useMemo } from "react";
import { motion } from "framer-motion";
import { useStore } from "../store/useStore";
import { ACHIEVEMENTS } from "../data/achievements";
import {
  bestStreak,
  countPerfectDays,
  currentStreak,
  totalCompletions,
} from "../lib/stats";

export function Achievements() {
  const data = useStore((s) => s.data);

  const ctx = useMemo(
    () => ({
      data,
      bestStreak: bestStreak(data),
      currentStreak: currentStreak(data),
      totalCompletions: totalCompletions(data),
      perfectDays: countPerfectDays(data),
    }),
    [data]
  );

  const items = ACHIEVEMENTS.map((a) => ({
    ...a,
    pct: a.progress(ctx),
  }));
  const unlocked = items.filter((i) => i.pct >= 1).length;

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-white/40">
            Conquistas
          </div>
          <h1 className="text-2xl font-bold text-white">Medalhas</h1>
        </div>
        <div className="text-sm font-semibold text-accent-soft">
          {unlocked}/{items.length}
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3">
        {items.map((a, i) => {
          const done = a.pct >= 1;
          return (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04, type: "spring", stiffness: 200, damping: 20 }}
              className={`card relative flex flex-col items-center gap-2 overflow-hidden px-4 py-5 text-center ${
                done ? "shadow-glow" : ""
              }`}
              style={{ borderColor: done ? "rgba(124,92,255,0.4)" : undefined }}
            >
              <div
                className={`text-4xl transition ${done ? "" : "grayscale opacity-35"}`}
              >
                {a.icon}
              </div>
              <div className="text-sm font-semibold text-white">{a.name}</div>
              <div className="text-[11px] leading-tight text-white/45">{a.desc}</div>
              {!done && (
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                  <motion.div
                    className="h-full rounded-full bg-accent/70"
                    initial={{ width: 0 }}
                    animate={{ width: `${a.pct * 100}%` }}
                    transition={{ type: "spring", stiffness: 90, damping: 18 }}
                  />
                </div>
              )}
              {done && (
                <span className="mt-1 rounded-full bg-accent/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent-soft">
                  Desbloqueado
                </span>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
