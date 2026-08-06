import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useStore } from "../store/useStore";
import { useFeedback } from "../store/useFeedback";
import { ActivityPalette } from "../components/ActivityPalette";
import { WeekGrid } from "../components/WeekGrid";
import { SlotSheet } from "../components/SlotSheet";
import { weekdayOf } from "../lib/date";
import { parseTime, prettyTime } from "../lib/time";
import type { RoutineSlot, Weekday } from "../types";

const DEFAULT_DURATION = 60;

export function Routine() {
  const data = useStore((s) => s.data);
  const addRoutineSlot = useStore((s) => s.addRoutineSlot);
  const push = useFeedback((s) => s.push);

  const [armedId, setArmedId] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [creatingHabit, setCreatingHabit] = useState(false);
  const [editing, setEditing] = useState<RoutineSlot | null>(null);
  const [target, setTarget] = useState<{ weekday: Weekday; startTime: string }>(
    () => ({ weekday: weekdayOf(), startTime: "09:00" })
  );

  const armed = useMemo(
    () => data.habits.find((h) => h.id === armedId) ?? null,
    [data.habits, armedId]
  );

  function openSheet(
    weekday: Weekday,
    startTime: string,
    slot: RoutineSlot | null,
    newHabit = false
  ) {
    setTarget({ weekday, startTime });
    setEditing(slot);
    setCreatingHabit(newHabit);
    setSheetOpen(true);
  }

  function handleEmptyTap(weekday: Weekday, startTime: string) {
    if (armed) {
      const durationMinutes = Math.max(
        15,
        Math.min(DEFAULT_DURATION, 24 * 60 - parseTime(startTime))
      );
      addRoutineSlot({
        habitId: armed.id,
        weekday,
        startTime,
        durationMinutes,
      });
      push(`${armed.name} · ${prettyTime(startTime)}`);
      return;
    }
    openSheet(weekday, startTime, null);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <header className="flex shrink-0 items-end justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-white/35">
            Kaizen
          </div>
          <h1 className="text-xl font-bold leading-tight text-white">
            Sua semana
          </h1>
        </div>
        <span className="pb-1 text-[11px] text-white/35">
          {data.routineSlots.length}{" "}
          {data.routineSlots.length === 1 ? "bloco" : "blocos"}
        </span>
      </header>

      <ActivityPalette
        activeId={armedId}
        onSelect={setArmedId}
        onCreate={() => openSheet(target.weekday, target.startTime, null, true)}
      />

      <p className="shrink-0 text-[10px] leading-snug text-white/30">
        Toque numa atividade e depois na semana · arraste o bloco pra mudar dia e
        horário · puxe a base pra mudar a duração.
      </p>

      <WeekGrid
        armedHabitId={armedId}
        onEmptyTap={handleEmptyTap}
        onEditSlot={(slot) => openSheet(slot.weekday, slot.startTime, slot)}
      />

      <AnimatePresence>
        {armed && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="pointer-events-none fixed inset-x-0 z-40 mx-auto flex max-w-md justify-center px-5"
            style={{ bottom: "calc(env(safe-area-inset-bottom) + 5.25rem)" }}
          >
            <div className="pointer-events-auto flex max-w-full items-center gap-2 rounded-full bg-white py-2 pl-4 pr-2 shadow-glow">
              <span className="truncate text-xs font-semibold text-ink-950">
                Toque num horário para colocar “{armed.name}”
              </span>
              <button
                onClick={() => setArmedId(null)}
                aria-label="Cancelar"
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink-950/10 text-xs font-bold text-ink-950"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <SlotSheet
        open={sheetOpen}
        weekday={target.weekday}
        defaultStart={target.startTime}
        startAsNewHabit={creatingHabit}
        editing={editing}
        onClose={() => setSheetOpen(false)}
      />
    </div>
  );
}
