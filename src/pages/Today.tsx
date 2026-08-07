import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useStore } from "../store/useStore";
import { useNav } from "../store/useNav";
import { ProgressRing } from "../components/ProgressRing";
import { HabitCard } from "../components/HabitCard";
import { DayPicker } from "../components/DayPicker";
import { DayVariantSheet } from "../components/DayVariantSheet";
import { Icon } from "../components/Icon";
import type { Habit } from "../types";
import { addDays, dayKey, prettyDate, isToday, isFutureDate } from "../lib/date";
import { physiqueStatus, shouldNagToday } from "../lib/physique";
import { currentStreak, dayProgress, isDaySkipped } from "../lib/stats";
import { scheduleForDay, isSlotDone } from "../lib/routine";
import { prettyTime } from "../lib/time";

export function Today() {
  const data = useStore((s) => s.data);
  const toggleSlot = useStore((s) => s.toggleSlot);
  const skipDay = useStore((s) => s.skipDay);
  const unskipDay = useStore((s) => s.unskipDay);
  const setTab = useNav((s) => s.setTab);

  const today = useMemo(() => new Date(), []);
  const [viewDate, setViewDate] = useState(() => new Date());
  const [variantTarget, setVariantTarget] = useState<{
    slotId: string;
    habit: Habit;
  } | null>(null);

  const key = dayKey(viewDate);
  const skipped = isDaySkipped(data, key);
  const isFuture = isFutureDate(viewDate, today);
  const viewingToday = isToday(viewDate, today);
  const locked = skipped || isFuture;

  const schedule = useMemo(() => scheduleForDay(data, viewDate), [data, viewDate]);
  const { done, total } = dayProgress(data, viewDate);
  const progress = total > 0 ? done / total : 0;
  const streak = currentStreak(data);

  function handleSkip() {
    const label = viewDate.toLocaleDateString("pt-BR", { day: "numeric", month: "long" });
    if (confirm(`Pular o dia ${label}? Não vai quebrar sua sequência.`)) {
      skipDay(viewDate);
    }
  }

  return (
    <div className="space-y-4">
      <header className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase tracking-[0.2em] text-white/35">Kaizen</div>
            <h1 className="truncate text-xl font-bold capitalize leading-tight text-white">
              {prettyDate(viewDate)}
            </h1>
            <div className="mt-1.5 flex items-center gap-3 text-[11px] text-white/40">
              <span className="flex items-center gap-1">
                <Icon name="flame" size={12} />
                {streak} {streak === 1 ? "dia" : "dias"}
              </span>
              {!skipped && total > 0 && (
                <span>
                  {done} de {total}
                </span>
              )}
            </div>
          </div>
          {!skipped && total > 0 && (
            <div className="relative shrink-0">
              <ProgressRing progress={progress} size={56} stroke={5}>
                <span className="text-[11px] font-bold text-white">
                  {Math.round(progress * 100)}
                </span>
              </ProgressRing>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          <DayPicker date={viewDate} onChange={setViewDate} />
          {!isFuture && !skipped && (
            <button
              onClick={handleSkip}
              className="flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-[11px] font-medium text-white/50"
            >
              <Icon name="skip" size={12} />
              {viewingToday ? "Pular hoje" : "Pular dia"}
            </button>
          )}
        </div>
      </header>

      {isFuture && (
        <div className="card px-4 py-3 text-center text-xs text-white/45">
          Este dia ainda não chegou — só visualização.
        </div>
      )}

      {skipped && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="card flex items-center justify-between gap-3 border-[#6b7cff]/40 bg-[#6b7cff]/10 px-4 py-3.5"
        >
          <div>
            <div className="text-sm font-semibold text-white">Dia pulado</div>
            <div className="text-xs text-white/50">Sem cobrança · sequência preservada</div>
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

      {viewingToday && shouldNagToday(data) && <PhysiqueNag />}

      {!skipped && (
        <div className="space-y-2">
          {schedule.map(({ slot, habit, category, variant }) => (
            <HabitCard
              key={slot.id}
              title={habit.name}
              subtitle={variant?.name ?? (habit.variants.length > 0 ? "definir" : undefined)}
              time={prettyTime(slot.startTime)}
              color={category?.color}
              icon={category?.icon}
              done={isSlotDone(data, slot.id, key)}
              disabled={locked}
              onToggle={() => !locked && toggleSlot(slot.id, viewDate)}
              onSubtitlePress={
                habit.variants.length > 0
                  ? () => setVariantTarget({ slotId: slot.id, habit })
                  : undefined
              }
            />
          ))}

          {total === 0 && (
            <div className="card flex flex-col items-center gap-3 px-6 py-10 text-center">
              <p className="text-sm text-white/45">Nada na rotina deste dia.</p>
              <button
                onClick={() => setTab("week")}
                className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-ink-950"
              >
                Montar a semana
              </button>
            </div>
          )}
        </div>
      )}

      <DayVariantSheet
        open={variantTarget !== null}
        habit={variantTarget?.habit ?? null}
        slotId={variantTarget?.slotId ?? ""}
        dayKey={key}
        onClose={() => setVariantTarget(null)}
      />
    </div>
  );
}

function PhysiqueNag() {
  const data = useStore((s) => s.data);
  const snoozePhysique = useStore((s) => s.snoozePhysique);
  const setTab = useNav((s) => s.setTab);
  const status = physiqueStatus(data);

  const title = status.state === "empty" ? "Grave o primeiro vídeo" : "Hora do vídeo novo";
  const subtitle =
    status.state === "empty"
      ? `Depois é um a cada ${data.physique.intervalDays} dias.`
      : `Faz ${status.daysSinceLast} dias desde o último.`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="card space-y-3 border-white/20 bg-white/[0.07] px-4 py-3.5"
    >
      <div className="flex items-center gap-3">
        <Icon name="film" size={20} className="shrink-0 text-white/70" />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-white">{title}</div>
          <div className="text-xs text-white/50">{subtitle}</div>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => setTab("physique")}
          className="flex-1 rounded-xl bg-white py-2.5 text-sm font-semibold text-ink-950"
        >
          Gravar agora
        </button>
        <button
          onClick={() => snoozePhysique(dayKey(addDays(new Date(), 2)))}
          className="rounded-xl bg-white/10 px-4 py-2.5 text-sm font-medium text-white/70"
        >
          Depois
        </button>
      </div>
    </motion.div>
  );
}
