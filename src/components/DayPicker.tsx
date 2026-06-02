import { addDays, dayKey, isToday } from "../lib/date";

interface Props {
  date: Date;
  onChange: (date: Date) => void;
}

export function DayPicker({ date, onChange }: Props) {
  const today = new Date();
  const isViewingToday = isToday(date, today);
  const canGoForward = dayKey(date) < dayKey(today);

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onChange(addDays(date, -1))}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.06] text-lg text-white/70"
        aria-label="Dia anterior"
      >
        ‹
      </button>
      {!isViewingToday && (
        <button
          onClick={() => onChange(new Date())}
          className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold text-ink-950"
        >
          Hoje
        </button>
      )}
      <button
        onClick={() => canGoForward && onChange(addDays(date, 1))}
        disabled={!canGoForward}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.06] text-lg text-white/70 disabled:opacity-25"
        aria-label="Próximo dia"
      >
        ›
      </button>
    </div>
  );
}
