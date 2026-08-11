import { useMemo, useState } from "react";
import { useStore } from "../store/useStore";
import { useFeedback } from "../store/useFeedback";
import { ActivityPalette } from "../components/ActivityPalette";
import { Icon } from "../components/Icon";
import { WeekGrid } from "../components/WeekGrid";
import { SlotSheet } from "../components/SlotSheet";
import { weekdayOf } from "../lib/date";
import { parseTime, prettyTime } from "../lib/time";
import type { RoutineSlot, Weekday } from "../types";

const DEFAULT_DURATION = 60;

export function Week() {
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

  /** Quantos blocos por categoria na semana — o que ele quer ver de relance. */
  const summary = useMemo(() => {
    const counts = new Map<string, number>();
    for (const slot of data.routineSlots) {
      const habit = data.habits.find((h) => h.id === slot.habitId);
      if (!habit) continue;
      counts.set(habit.categoryId, (counts.get(habit.categoryId) ?? 0) + 1);
    }
    return data.categories
      .filter((c) => counts.has(c.id))
      .map((c) => ({ category: c, count: counts.get(c.id)! }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }, [data.routineSlots, data.habits, data.categories]);

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
            Semana
          </div>
          <h1 className="text-xl font-bold leading-tight text-white">
            Sua semana
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-2.5 pb-1">
          {summary.map(({ category, count }) => (
            <span
              key={category.id}
              className="flex items-center gap-1 text-[11px] font-semibold"
              style={{ color: category.color }}
              title={category.name}
            >
              <Icon name={category.icon} size={13} />
              {count}
            </span>
          ))}
        </div>
      </header>

      <ActivityPalette
        activeId={armedId}
        onSelect={setArmedId}
        onCreate={() => openSheet(target.weekday, target.startTime, null, true)}
      />

      {/* Mesma altura com ou sem atividade na mão: a dica troca de texto, não
          aparece flutuando por cima da grade. */}
      <div className="flex h-8 shrink-0 items-center">
        {armed ? (
          <div className="flex w-full items-center gap-2 rounded-md2 bg-white px-3 py-1.5">
            <span className="min-w-0 flex-1 truncate text-[11px] font-semibold text-ink-950">
              Toque num horário para colocar “{armed.name}”
            </span>
            <button
              onClick={() => setArmedId(null)}
              aria-label="Cancelar"
              className="press flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink-950/10 text-ink-950"
            >
              <Icon name="close" size={12} />
            </button>
          </div>
        ) : (
          <p className="text-[10px] leading-snug text-white/30">
            Toque numa atividade e depois no horário · segure a atividade pra excluir ·
            arraste o bloco pra mudar dia e hora.
          </p>
        )}
      </div>

      <WeekGrid
        armedHabitId={armedId}
        onEmptyTap={handleEmptyTap}
        onEditSlot={(slot) => openSheet(slot.weekday, slot.startTime, slot)}
      />

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
