import { Sheet } from "./Sheet";
import { useStore } from "../store/useStore";
import { resolveVariantId, variantOf } from "../lib/variants";
import type { Habit } from "../types";

interface Props {
  open: boolean;
  habit: Habit | null;
  slotId: string;
  dayKey: string;
  onClose: () => void;
}

export function DayVariantSheet({ open, habit, slotId, dayKey, onClose }: Props) {
  const data = useStore((s) => s.data);
  const setSlotVariant = useStore((s) => s.setSlotVariant);

  const slot = data.routineSlots.find((s) => s.id === slotId);
  const currentVariantId = slot ? resolveVariantId(data, slot, dayKey) : undefined;
  const current = habit ? variantOf(habit, currentVariantId) : undefined;

  return (
    <Sheet open={open} title={habit?.name ?? ""} onClose={onClose}>
      <div className="space-y-5">
        <div className="space-y-2">
          <label className="block text-xs font-medium uppercase tracking-wide text-white/45">
            Neste dia
          </label>
          <div className="flex flex-wrap gap-2">
            {habit?.variants.map((v) => (
              <button
                key={v.id}
                onClick={() => setSlotVariant(slotId, dayKey, v.id)}
                className={`rounded-full px-3.5 py-2 text-sm font-medium transition ${
                  currentVariantId === v.id
                    ? "bg-white text-ink-950"
                    : "bg-ink-800 text-white/55"
                }`}
              >
                {v.name}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-white/35">
            Muda só hoje. A semana continua como você montou.
          </p>
        </div>

        {current && current.items.length > 0 && (
          <div className="space-y-2">
            <label className="block text-xs font-medium uppercase tracking-wide text-white/45">
              {current.name}
            </label>
            <ol className="card divide-y divide-white/[0.06] overflow-hidden">
              {current.items.map((item, i) => (
                <li
                  key={`${item}-${i}`}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/85"
                >
                  <span className="w-4 shrink-0 text-[11px] tabular-nums text-white/30">
                    {i + 1}
                  </span>
                  {item}
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </Sheet>
  );
}
