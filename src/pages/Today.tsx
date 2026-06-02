import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useStore } from "../store/useStore";
import { useFeedback } from "../store/useFeedback";
import { useNav } from "../store/useNav";
import { ProgressRing } from "../components/ProgressRing";
import { HabitCard } from "../components/HabitCard";
import { DayPicker } from "../components/DayPicker";
import {
  dayKey,
  prettyDate,
  weekdayOf,
  isToday,
  isFutureDate,
  parseDayKey,
} from "../lib/date";
import { currentStreak, dayProgress } from "../lib/stats";
import { scheduleForDay, isSlotDone, hasRoutine } from "../lib/routine";
import { isDaySkipped, productivityLevel } from "../lib/productivity";
import { prettyTime } from "../lib/time";
import { levelFromXp } from "../lib/game";
import { ACHIEVEMENTS } from "../data/achievements";

export function Today() {
  const data = useStore((s) => s.data);
  const toggleSlot = useStore((s) => s.toggleSlot);
  const toggleHabit = useStore((s) => s.toggleHabit);
  const skipDay = useStore((s) => s.skipDay);
  const unskipDay = useStore((s) => s.unskipDay);
  const { push, showLevelUp } = useFeedback();

  const targetDayKey = useNav((s) => s.targetDayKey);
  const clearDayTarget = useNav((s) => s.clearDayTarget);

  const calendarToday = useMemo(() => new Date(), []);
  const [viewDate, setViewDate] = useState(() => new Date());

  useEffect(() => {
    if (targetDayKey) {
      setViewDate(parseDayKey(targetDayKey));
      clearDayTarget();
    }
  }, [targetDayKey, clearDayTarget]);

  const key = dayKey(viewDate);
  const skipped = isDaySkipped(data, key);
  const isFuture = isFutureDate(viewDate, calendarToday);
  const viewingToday = isToday(viewDate, calendarToday);
  const useRoutine = hasRoutine(data);
  const canSkip = !isFuture && !skipped;

  const schedule = useMemo(
    () => scheduleForDay(data, viewDate),
    [data, viewDate]
  );
  const { done: doneCount, total } = dayProgress(data, viewDate);
  const progress = skipped ? 0 : total > 0 ? doneCount / total : 0;

  const level = levelFromXp(data.totalXp);
  const streak = currentStreak(data);
  const prod = productivityLevel(data, viewDate);

  function handleToggleSlot(slotId: string) {
    if (skipped || isFuture) return;
    const before = levelFromXp(data.totalXp).level;
    const res = toggleSlot(slotId, viewDate);
    showFeedback(res, before);
  }

  function handleToggleHabit(habitId: string) {
    if (skipped || isFuture) return;
    const before = levelFromXp(data.totalXp).level;
    const res = toggleHabit(habitId, viewDate);
    showFeedback(res, before);
  }

  function showFeedback(
    res: { done: boolean; xpDelta: number; newlyUnlocked: string[] },
    beforeLevel: number
  ) {
    if (res.done && res.xpDelta > 0) push(`+${res.xpDelta} XP`, "xp");
    const after = levelFromXp(Math.max(0, data.totalXp + res.xpDelta)).level;
    if (after > beforeLevel) setTimeout(() => showLevelUp(after), 350);
    for (const id of res.newlyUnlocked) {
      const ach = ACHIEVEMENTS.find((a) => a.id === id);
      if (ach) push(`${ach.icon} ${ach.name}`, "badge");
    }
  }

  function handleSkip() {
    const label = viewDate.toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "long",
    });
    if (
      confirm(
        `Pular o dia ${label}? Não vai quebrar sua sequência.`
      )
    ) {
      skipDay(viewDate);
      push("Dia pulado", "xp");
    }
  }

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-xs uppercase tracking-[0.2em] text-white/40">Kaizen</div>
            <h1 className="truncate text-2xl font-bold capitalize text-white">
              {prettyDate(viewDate)}
            </h1>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-1 rounded-full bg-ink-800 px-3 py-1.5">
              <span className="text-base">🔥</span>
              <span className="text-sm font-semibold text-white">{streak}</span>
            </div>
            {canSkip && (
              <button
                onClick={handleSkip}
                className="rounded-full border border-white/15 px-3 py-1 text-[11px] font-medium text-white/55"
              >
                {viewingToday ? "Pular hoje" : "Pular dia"}
              </button>
            )}
          </div>
        </div>
        <DayPicker date={viewDate} onChange={setViewDate} />
      </header>

      {isFuture && (
        <div className="card px-4 py-3 text-center text-sm text-white/50">
          Este dia ainda não chegou — só visualização da rotina.
        </div>
      )}

      {skipped && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="card flex items-center justify-between gap-3 border border-[#6b7cff]/40 bg-[#6b7cff]/10 px-4 py-4"
        >
          <div>
            <div className="text-sm font-semibold text-white">Dia pulado</div>
            <div className="text-xs text-white/50">
              Sem cobrança · sequência preservada
            </div>
          </div>
          {!isFuture && (
            <button
              onClick={() => unskipDay(viewDate)}
              className="shrink-0 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white"
            >
              Desfazer
            </button>
          )}
        </motion.div>
      )}

      <section className="flex flex-col items-center pt-2">
        <ProgressRing progress={skipped ? 0 : progress} color="#ffffff" size={210}>
          {skipped ? (
            <div className="text-center">
              <div className="text-3xl">—</div>
              <div className="mt-1 text-sm text-white/50">Pulado</div>
            </div>
          ) : (
            <>
              <motion.div
                key={`${key}-${doneCount}`}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-5xl font-bold text-white"
              >
                {total > 0 ? `${Math.round(progress * 100)}%` : "—"}
              </motion.div>
              <div className="mt-1 text-sm text-white/50">
                {total > 0
                  ? `${doneCount} de ${total} concluídos`
                  : "Sem rotina"}
              </div>
            </>
          )}
        </ProgressRing>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-sm">
          <span className="rounded-full bg-white/10 px-3 py-1 font-semibold text-white">
            Nível {level.level}
          </span>
          {!skipped && total > 0 && (
            <span
              className="rounded-full px-3 py-1 text-xs font-semibold"
              style={{ backgroundColor: `${prod.color}22`, color: prod.color }}
            >
              {prod.labelPt}
            </span>
          )}
        </div>
      </section>

      {!skipped && (
        <div className={`space-y-2 ${isFuture ? "pointer-events-none opacity-60" : ""}`}>
          {useRoutine ? (
            schedule.map(({ slot, habit, category }) => (
              <HabitCard
                key={slot.id}
                habit={habit}
                category={category}
                done={isSlotDone(data, slot.id, key)}
                time={prettyTime(slot.startTime)}
                onToggle={() => handleToggleSlot(slot.id)}
              />
            ))
          ) : (
            <LegacyTodayList
              data={data}
              weekday={weekdayOf(viewDate)}
              dayKey={key}
              onToggle={handleToggleHabit}
            />
          )}

          {total === 0 && (
            <div className="card px-6 py-10 text-center text-white/50">
              Nada na rotina deste dia. Monte em{" "}
              <span className="text-white/70">Rotina</span>.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function LegacyTodayList({
  data,
  weekday,
  dayKey: dk,
  onToggle,
}: {
  data: ReturnType<typeof useStore.getState>["data"];
  weekday: number;
  dayKey: string;
  onToggle: (id: string) => void;
}) {
  const cats = [...data.categories].sort((a, b) => a.order - b.order);
  const grouped = cats
    .map((cat) => ({
      cat,
      habits: data.habits.filter(
        (h) =>
          h.categoryId === cat.id &&
          !h.archived &&
          (h.days.length === 0 || h.days.includes(weekday as 0 | 1 | 2 | 3 | 4 | 5 | 6))
      ),
    }))
    .filter((g) => g.habits.length > 0);

  return (
    <>
      {grouped.map(({ cat, habits }) => (
        <section key={cat.id} className="space-y-2.5">
          <div className="flex items-center gap-2 px-1">
            <span className="text-lg">{cat.icon}</span>
            <h2 className="text-sm font-semibold text-white/80">{cat.name}</h2>
          </div>
          {habits.map((h) => (
            <HabitCard
              key={h.id}
              habit={h}
              category={cat}
              done={(data.logs[h.id]?.[dk] ?? 0) >= h.target}
              onToggle={() => onToggle(h.id)}
            />
          ))}
        </section>
      ))}
    </>
  );
}
