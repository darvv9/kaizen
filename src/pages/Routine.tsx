import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useStore } from "../store/useStore";
import { RoutineBlock } from "../components/RoutineBlock";
import { SlotSheet } from "../components/SlotSheet";
import {
  WEEKDAYS_MON_FIRST,
  WEEKDAY_SHORT_MON_FIRST,
  WEEKDAY_FULL,
  weekdayOf,
} from "../lib/date";
import { slotsForWeekday } from "../lib/routine";
import { computeSlotLayouts } from "../lib/overlapLayout";
import {
  TIMELINE_START,
  TIMELINE_END,
  timelineHeight,
  formatTime,
  PX_PER_MIN,
} from "../lib/time";
import type { RoutineSlot, Weekday } from "../types";

export function Routine() {
  const data = useStore((s) => s.data);
  const todayWd = weekdayOf();
  const [selected, setSelected] = useState<Weekday>(todayWd);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<RoutineSlot | null>(null);
  const updateRoutineSlot = useStore((s) => s.updateRoutineSlot);

  function moveSlot(slotId: string, startTime: string) {
    updateRoutineSlot(slotId, { startTime });
  }

  const slots = useMemo(
    () => slotsForWeekday(data, selected),
    [data, selected]
  );

  const layouts = useMemo(() => computeSlotLayouts(slots), [slots]);

  const hours = useMemo(() => {
    const out: string[] = [];
    for (let m = TIMELINE_START; m < TIMELINE_END; m += 60) {
      out.push(formatTime(m));
    }
    return out;
  }, []);

  function openAdd() {
    setEditing(null);
    setSheetOpen(true);
  }

  function openEdit(slot: RoutineSlot) {
    setEditing(slot);
    setSheetOpen(true);
  }

  return (
    <div className="space-y-5">
      <header>
        <div className="text-xs uppercase tracking-[0.2em] text-white/40">Rotina</div>
        <h1 className="text-2xl font-bold text-white">Sua semana</h1>
        <p className="mt-1 text-sm text-white/45">
          Arraste os blocos para mudar o horário · toque para editar.
        </p>
      </header>

      <section className="card p-2">
        <div className="grid grid-cols-7 gap-1">
          {WEEKDAYS_MON_FIRST.map((wd, i) => {
            const count = slotsForWeekday(data, wd).length;
            const isToday = wd === todayWd;
            const isSelected = wd === selected;
            return (
              <button
                key={wd}
                onClick={() => setSelected(wd)}
                className="relative flex flex-col items-center rounded-xl py-2.5 transition"
              >
                {isSelected && (
                  <span className="absolute inset-0 rounded-xl bg-white/10" />
                )}
                <span
                  className={`relative text-[11px] font-medium ${
                    isSelected ? "text-white" : "text-white/45"
                  }`}
                >
                  {WEEKDAY_SHORT_MON_FIRST[i]}
                </span>
                <span
                  className={`relative mt-0.5 text-lg font-bold ${
                    isToday ? "text-white" : isSelected ? "text-white/80" : "text-white/35"
                  }`}
                >
                  {count || "·"}
                </span>
                {isToday && (
                  <span className="relative mt-0.5 h-1 w-1 rounded-full bg-white" />
                )}
              </button>
            );
          })}
        </div>
      </section>

      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-semibold text-white/80">{WEEKDAY_FULL[selected]}</h2>
        <span className="text-xs text-white/40">
          {slots.length} {slots.length === 1 ? "bloco" : "blocos"}
        </span>
      </div>

      {slots.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 px-6 py-12 text-center">
          <div className="text-3xl opacity-40">▦</div>
          <p className="text-sm text-white/50">
            Nada neste dia ainda. Toque em + para montar sua rotina.
          </p>
          <button
            onClick={openAdd}
            className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-ink-950"
          >
            Adicionar
          </button>
        </div>
      ) : (
        <section className="card relative max-h-[min(58vh,540px)] overflow-y-auto overscroll-contain">
          <div className="flex min-h-0">
            <div
              className="relative w-11 shrink-0 border-r border-white/[0.06]"
              style={{ height: timelineHeight() }}
            >
              {hours.map((h) => {
                const top = (parseInt(h) * 60 - TIMELINE_START) * PX_PER_MIN;
                return (
                  <span
                    key={h}
                    className="absolute right-2 -translate-y-1/2 text-[10px] text-white/30"
                    style={{ top }}
                  >
                    {parseInt(h)}h
                  </span>
                );
              })}
            </div>
            <div className="relative min-h-0 flex-1" style={{ height: timelineHeight() }}>
              {hours.map((h) => {
                const top = (parseInt(h) * 60 - TIMELINE_START) * PX_PER_MIN;
                return (
                  <div
                    key={h}
                    className="pointer-events-none absolute inset-x-0 border-t border-white/[0.04]"
                    style={{ top }}
                  />
                );
              })}
              {slots.map((slot) => {
                const habit = data.habits.find((h) => h.id === slot.habitId);
                if (!habit) return null;
                const category = data.categories.find((c) => c.id === habit.categoryId);
                const layout = layouts.get(slot.id) ?? { column: 0, totalColumns: 1 };
                return (
                  <RoutineBlock
                    key={slot.id}
                    slot={slot}
                    habit={habit}
                    category={category}
                    column={layout.column}
                    totalColumns={layout.totalColumns}
                    onEdit={() => openEdit(slot)}
                    onTimeChange={moveSlot}
                  />
                );
              })}
            </div>
          </div>
        </section>
      )}

      {slots.length > 0 && (
        <motion.button
          onClick={openAdd}
          whileTap={{ scale: 0.92 }}
          className="fixed bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-white text-2xl font-light text-ink-950 shadow-glow"
        >
          +
        </motion.button>
      )}

      <SlotSheet
        open={sheetOpen}
        weekday={selected}
        editing={editing}
        onClose={() => setSheetOpen(false)}
      />
    </div>
  );
}
