import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useStore } from "../store/useStore";
import { computeSlotLayouts, type SlotLayout } from "../lib/overlapLayout";
import { formatTime, parseTime, prettyMinutes } from "../lib/time";
import {
  WEEK_DAYS,
  MIN_BLOCK_PX,
  clampDuration,
  clampStart,
  floorToSnap,
  gridRange,
  hourMarks,
  pxPerMinute,
  snapMinutes,
  type GridRange,
} from "../lib/weekGrid";
import { WEEKDAY_SHORT_MON_FIRST, isToday, weekDates } from "../lib/date";
import { shortVariantName, variantOf } from "../lib/variants";
import type { RoutineSlot, Weekday } from "../types";

const GUTTER = 28;

interface Preview {
  dayIndex: number;
  start: number;
  duration: number;
}

interface Props {
  onEditSlot: (slot: RoutineSlot) => void;
  onEmptyTap: (weekday: Weekday, startTime: string) => void;
  /** Atividade "na mão": destaca os blocos dela na semana. */
  armedHabitId: string | null;
}

export function WeekGrid({ onEditSlot, onEmptyTap, armedHabitId }: Props) {
  const data = useStore((s) => s.data);
  const updateRoutineSlot = useStore((s) => s.updateRoutineSlot);

  const scrollRef = useRef<HTMLDivElement>(null);
  const columnsRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ height: 0, width: 0 });
  const [preview, setPreview] = useState<Preview | null>(null);

  useLayoutEffect(() => {
    const scroller = scrollRef.current;
    const columns = columnsRef.current;
    if (!scroller || !columns) return;
    const measure = () =>
      setSize({ height: scroller.clientHeight, width: columns.clientWidth });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(scroller);
    observer.observe(columns);
    return () => observer.disconnect();
  }, []);

  const week = useMemo(() => weekDates(), []);
  const range = useMemo(() => gridRange(data.routineSlots), [data.routineSlots]);
  const pxPerMin = pxPerMinute(size.height, range);
  const contentHeight = range.minutes * pxPerMin;
  const colWidth = size.width / 7;
  const marks = useMemo(() => hourMarks(range), [range]);

  const habits = useMemo(
    () => new Map(data.habits.map((h) => [h.id, h])),
    [data.habits]
  );
  const categories = useMemo(
    () => new Map(data.categories.map((c) => [c.id, c])),
    [data.categories]
  );

  const layouts = useMemo(() => {
    const minMinutes = MIN_BLOCK_PX / pxPerMin;
    const merged = new Map<string, SlotLayout>();
    for (const weekday of WEEK_DAYS) {
      const daySlots = data.routineSlots.filter((s) => s.weekday === weekday);
      for (const [id, layout] of computeSlotLayouts(daySlots, minMinutes)) {
        merged.set(id, layout);
      }
    }
    return merged;
  }, [data.routineSlots, pxPerMin]);

  function handleBackgroundClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target !== e.currentTarget || colWidth <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const index = Math.min(
      6,
      Math.max(0, Math.floor((e.clientX - rect.left) / colWidth))
    );
    const raw = range.start + (e.clientY - rect.top) / pxPerMin;
    const start = Math.max(
      range.start,
      Math.min(range.end - 30, floorToSnap(raw))
    );
    onEmptyTap(WEEK_DAYS[index], formatTime(start));
  }

  // `isolate` prende os z-index dos blocos aqui dentro: nenhum deles disputa
  // camada com a barra de abas ou com um sheet aberto.
  return (
    <div className="relative isolate flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 pb-1">
        <div className="shrink-0" style={{ width: GUTTER }} />
        <div className="flex flex-1">
          {WEEK_DAYS.map((weekday, i) => {
            const date = week[i];
            const current = isToday(date);
            return (
              <div key={weekday} className="min-w-0 flex-1 text-center">
                <div
                  className={`text-[10px] font-medium ${
                    current ? "text-white" : "text-white/35"
                  }`}
                >
                  {WEEKDAY_SHORT_MON_FIRST[i]}
                </div>
                <div
                  className={`mx-auto mt-0.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold ${
                    current ? "bg-white text-ink-950" : "text-white/40"
                  }`}
                >
                  {date.getDate()}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-lg2 border border-white/[0.06] bg-ink-850/70"
      >
        <div className="flex" style={{ height: contentHeight }}>
          <div className="relative shrink-0" style={{ width: GUTTER }}>
            {marks.map((minutes) => (
              <span
                key={minutes}
                className="absolute right-1.5 -translate-y-1/2 text-[9px] tabular-nums text-white/25"
                style={{ top: (minutes - range.start) * pxPerMin }}
              >
                {minutes / 60}h
              </span>
            ))}
          </div>

          <div
            ref={columnsRef}
            className="relative flex-1"
            onClick={handleBackgroundClick}
          >
            {WEEK_DAYS.map((weekday, i) => (
              <div
                key={weekday}
                className={`pointer-events-none absolute inset-y-0 ${
                  i > 0 ? "border-l border-white/[0.05]" : ""
                }`}
                style={{
                  left: i * colWidth,
                  width: colWidth,
                  backgroundColor: isToday(week[i])
                    ? "rgba(255,255,255,0.035)"
                    : undefined,
                }}
              />
            ))}

            {marks.map((minutes) => (
              <div
                key={minutes}
                className="pointer-events-none absolute inset-x-0 border-t border-white/[0.05]"
                style={{ top: (minutes - range.start) * pxPerMin }}
              />
            ))}

            {data.routineSlots.length === 0 && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-6 text-center text-[11px] leading-relaxed text-white/35">
                Escolha uma atividade ali em cima
                <br />e toque no horário que ela vai ocupar.
              </div>
            )}

            {colWidth > 0 &&
              data.routineSlots.map((slot) => {
                const habit = habits.get(slot.habitId);
                if (!habit) return null;
                const category = categories.get(habit.categoryId);
                const dayIndex = WEEK_DAYS.indexOf(slot.weekday);
                if (dayIndex < 0) return null;
                const layout = layouts.get(slot.id) ?? {
                  column: 0,
                  totalColumns: 1,
                };
                const variant = variantOf(habit, slot.variantId);
                return (
                  <WeekBlock
                    key={slot.id}
                    slot={slot}
                    name={habit.name}
                    variantName={variant?.name}
                    color={category?.color ?? "#ffffff"}
                    dayIndex={dayIndex}
                    layout={layout}
                    colWidth={colWidth}
                    pxPerMin={pxPerMin}
                    range={range}
                    faded={armedHabitId !== null && armedHabitId !== habit.id}
                    onPreview={setPreview}
                    onEdit={() => onEditSlot(slot)}
                    onCommit={(patch) => updateRoutineSlot(slot.id, patch)}
                  />
                );
              })}
          </div>
        </div>
      </div>

      {preview && (
        <div className="pointer-events-none absolute inset-x-0 top-9 z-50 flex justify-center">
          <div className="rounded-full bg-white px-3 py-1 text-[11px] font-bold tabular-nums text-ink-950 shadow-glow">
            {WEEKDAY_SHORT_MON_FIRST[preview.dayIndex]} ·{" "}
            {prettyMinutes(preview.start)}–
            {prettyMinutes(preview.start + preview.duration)}
          </div>
        </div>
      )}
    </div>
  );
}

interface BlockProps {
  slot: RoutineSlot;
  name: string;
  variantName?: string;
  color: string;
  dayIndex: number;
  layout: SlotLayout;
  colWidth: number;
  pxPerMin: number;
  range: GridRange;
  faded: boolean;
  onPreview: (preview: Preview | null) => void;
  onEdit: () => void;
  onCommit: (patch: Partial<RoutineSlot>) => void;
}

type Gesture = {
  mode: "move" | "resize";
  x: number;
  y: number;
  moved: boolean;
};

function WeekBlock({
  slot,
  name,
  variantName,
  color,
  dayIndex,
  layout,
  colWidth,
  pxPerMin,
  range,
  faded,
  onPreview,
  onEdit,
  onCommit,
}: BlockProps) {
  const [preview, setPreview] = useState<Preview | null>(null);
  const gesture = useRef<Gesture | null>(null);
  const startMinutes = parseTime(slot.startTime);

  function begin(e: React.PointerEvent, mode: Gesture["mode"]) {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    gesture.current = { mode, x: e.clientX, y: e.clientY, moved: false };
  }

  function move(e: React.PointerEvent) {
    const g = gesture.current;
    if (!g) return;
    const dx = e.clientX - g.x;
    const dy = e.clientY - g.y;
    if (!g.moved && Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
    g.moved = true;

    const next: Preview =
      g.mode === "move"
        ? {
            dayIndex: Math.min(
              6,
              Math.max(0, dayIndex + Math.round(dx / colWidth))
            ),
            start: clampStart(
              snapMinutes(startMinutes + dy / pxPerMin),
              slot.durationMinutes,
              range
            ),
            duration: slot.durationMinutes,
          }
        : {
            dayIndex,
            start: startMinutes,
            duration: clampDuration(
              snapMinutes(slot.durationMinutes + dy / pxPerMin),
              startMinutes,
              range
            ),
          };

    setPreview(next);
    onPreview(next);
  }

  function finish(e: React.PointerEvent, commit: boolean) {
    const g = gesture.current;
    gesture.current = null;
    if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    const current = preview;
    setPreview(null);
    onPreview(null);
    if (!g) return;
    if (!g.moved) {
      onEdit();
      return;
    }
    if (!commit || !current) return;
    if (g.mode === "move") {
      onCommit({
        weekday: WEEK_DAYS[current.dayIndex],
        startTime: formatTime(current.start),
      });
    } else {
      onCommit({ durationMinutes: current.duration });
    }
  }

  const dragging = preview !== null;
  const shownDay = preview?.dayIndex ?? dayIndex;
  const shownStart = preview?.start ?? startMinutes;
  const shownDuration = preview?.duration ?? slot.durationMinutes;

  const columns = dragging ? 1 : layout.totalColumns;
  const column = dragging ? 0 : layout.column;
  const width = colWidth / columns;
  const height = Math.max(shownDuration * pxPerMin, MIN_BLOCK_PX);

  return (
    <div
      onPointerDown={(e) => begin(e, "move")}
      onPointerMove={move}
      onPointerUp={(e) => finish(e, true)}
      onPointerCancel={(e) => finish(e, false)}
      onClick={(e) => e.stopPropagation()}
      className="absolute select-none overflow-hidden rounded-sm2 border"
      style={{
        left: shownDay * colWidth + column * width + 1,
        width: width - 2,
        top: (shownStart - range.start) * pxPerMin,
        height,
        zIndex: dragging ? 40 : 10 + column,
        opacity: faded ? 0.3 : 1,
        touchAction: "none",
        borderColor: `${color}66`,
        background: `linear-gradient(180deg, ${color}33, ${color}1a)`,
        boxShadow: dragging ? "0 10px 26px rgba(0,0,0,0.5)" : undefined,
        transform: dragging ? "scale(1.04)" : undefined,
      }}
    >
      <div
        className="absolute inset-y-0 left-0 w-[2px]"
        style={{ backgroundColor: color }}
      />
      {height >= 34 ? (
        <div className="flex h-full flex-col justify-start pl-2 pr-1.5 pt-1">
          <div className="truncate text-[9px] font-medium tabular-nums leading-none text-white/50">
            {prettyMinutes(shownStart)}
          </div>
          <div className="mt-0.5 line-clamp-2 text-[10px] font-semibold leading-tight text-white">
            {name}
            {variantName && height < 50 && (
              <span className="text-white/55"> · {shortVariantName(variantName)}</span>
            )}
          </div>
          {variantName && height >= 50 && (
            <div className="truncate text-[9px] font-medium leading-tight" style={{ color }}>
              {variantName}
            </div>
          )}
        </div>
      ) : (
        <div className="flex h-full items-center pl-2 pr-1.5">
          <div className="truncate text-[9px] font-semibold leading-none text-white/90">
            {name}
            {variantName && (
              <span className="text-white/55"> · {shortVariantName(variantName)}</span>
            )}
          </div>
        </div>
      )}

      {height >= 30 && (
        <div
          onPointerDown={(e) => begin(e, "resize")}
          onPointerMove={move}
          onPointerUp={(e) => finish(e, true)}
          onPointerCancel={(e) => finish(e, false)}
          onClick={(e) => e.stopPropagation()}
          className="absolute inset-x-0 bottom-0 flex h-3 items-end justify-center pb-[3px]"
          style={{ touchAction: "none" }}
        >
          <span className="h-[2px] w-5 rounded-full bg-white/40" />
        </div>
      )}
    </div>
  );
}
