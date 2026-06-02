import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useStore } from "../store/useStore";
import { useNav } from "../store/useNav";
import {
  getMonthGrid,
  monthLabel,
  WEEKDAY_SHORT_MON_FIRST,
  dayKey,
} from "../lib/date";
import { buildMonthSummaries, summaryForDay } from "../lib/productivity";

export function MonthCalendar() {
  const data = useStore((s) => s.data);
  const goToDay = useNav((s) => s.goToDay);
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const summaries = useMemo(
    () => buildMonthSummaries(data, year, month, today),
    [data, year, month, today]
  );
  const byKey = useMemo(
    () => new Map(summaries.map((s) => [s.key, s])),
    [summaries]
  );
  const grid = useMemo(() => getMonthGrid(year, month), [year, month]);

  function prevMonth() {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  }

  function nextMonth() {
    const isCurrent =
      year === today.getFullYear() && month === today.getMonth();
    if (isCurrent) return;
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  }

  const canNext =
    year < today.getFullYear() ||
    (year === today.getFullYear() && month < today.getMonth());

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-white/70"
        >
          ‹
        </button>
        <span className="text-sm font-semibold capitalize text-white">
          {monthLabel(year, month)}
        </span>
        <button
          onClick={nextMonth}
          disabled={!canNext}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06] text-white/70 disabled:opacity-25"
        >
          ›
        </button>
      </div>

      <div className="mb-2 grid grid-cols-7 gap-1">
        {WEEKDAY_SHORT_MON_FIRST.map((d) => (
          <div key={d} className="text-center text-[10px] font-medium text-white/35">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {grid.flat().map((date, i) => {
          if (!date) {
            return <div key={`empty-${i}`} className="aspect-square" />;
          }
          const key = dayKey(date);
          const isFuture = key > dayKey(today);
          const s = byKey.get(key) ?? (isFuture ? null : summaryForDay(data, date, today));
          const isTodayCell = key === dayKey(today);

          return (
            <motion.button
              key={key}
              whileTap={!isFuture ? { scale: 0.92 } : undefined}
              disabled={isFuture}
              onClick={() => !isFuture && goToDay(key, "today")}
              className={`relative flex aspect-square flex-col items-center justify-center rounded-xl border text-center transition ${
                isTodayCell ? "border-white/40" : "border-transparent"
              } ${isFuture ? "opacity-25" : "bg-white/[0.04]"}`}
              style={
                s
                  ? {
                      backgroundColor: `${s.color}18`,
                      borderColor: `${s.color}44`,
                    }
                  : undefined
              }
            >
              <span className="text-xs font-semibold text-white">{date.getDate()}</span>
              {s && (
                <span
                  className="mt-0.5 max-w-full truncate px-0.5 text-[8px] font-medium leading-tight"
                  style={{ color: s.color }}
                >
                  {s.labelPt}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
