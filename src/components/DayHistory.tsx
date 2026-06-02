import { useMemo, useState } from "react";
import { useStore } from "../store/useStore";
import { useNav } from "../store/useNav";
import { buildDaySummaries } from "../lib/productivity";
import { MonthCalendar } from "./MonthCalendar";
import type { DaySummary } from "../lib/productivity";

type Period = "14" | "30" | "month";

export function DayHistory() {
  const data = useStore((s) => s.data);
  const goToDay = useNav((s) => s.goToDay);
  const [period, setPeriod] = useState<Period>("30");

  const summaries = useMemo(() => {
    if (period === "month") return [];
    const days = period === "14" ? 14 : 30;
    return buildDaySummaries(data, days);
  }, [data, period]);

  return (
    <section className="card p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-white/80">Produtividade</h2>
          <p className="mt-0.5 text-xs text-white/40">
            Alta ≥80% · Média ≥50% · Baixa abaixo · toque para abrir o dia
          </p>
        </div>
      </div>

      <div className="mb-4 flex gap-1 rounded-xl bg-white/[0.04] p-1">
        {(
          [
            { id: "14" as const, label: "14 dias" },
            { id: "30" as const, label: "30 dias" },
            { id: "month" as const, label: "Mês" },
          ] as const
        ).map((p) => (
          <button
            key={p.id}
            onClick={() => setPeriod(p.id)}
            className={`flex-1 rounded-lg py-2 text-[11px] font-semibold transition ${
              period === p.id ? "bg-white text-ink-950" : "text-white/45"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {period === "month" ? (
        <MonthCalendar />
      ) : (
        <div className="space-y-2">
          {[...summaries].reverse().map((s) => (
            <DayRow key={s.key} summary={s} onOpen={() => goToDay(s.key, "today")} />
          ))}
        </div>
      )}
    </section>
  );
}

function DayRow({
  summary: s,
  onOpen,
}: {
  summary: DaySummary;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-3 rounded-xl bg-white/[0.04] px-3 py-2.5 text-left active:bg-white/[0.08]"
    >
      <div className="h-9 w-1 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-white">{s.label}</span>
          <span className="text-xs text-white/40">{s.relative}</span>
        </div>
        {s.level === "skipped" ? (
          <span className="text-xs text-white/45">Dia pulado</span>
        ) : s.total > 0 ? (
          <span className="text-xs text-white/45">
            {s.done}/{s.total} concluídos · {Math.round(Math.max(0, s.score) * 100)}%
          </span>
        ) : (
          <span className="text-xs text-white/45">Sem rotina neste dia</span>
        )}
      </div>
      <span
        className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold"
        style={{ backgroundColor: `${s.color}22`, color: s.color }}
      >
        {s.labelPt}
      </span>
    </button>
  );
}
