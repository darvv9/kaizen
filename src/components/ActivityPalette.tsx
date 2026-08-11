import { useMemo } from "react";
import { useStore } from "../store/useStore";
import { ask } from "../store/useConfirm";
import { destructive } from "../store/undo";
import { useLongPress } from "../lib/useLongPress";
import { contrastInk } from "../lib/color";
import { Icon } from "./Icon";
import type { Category, Habit } from "../types";

interface Props {
  activeId: string | null;
  onSelect: (habitId: string | null) => void;
  onCreate: () => void;
}

export function ActivityPalette({ activeId, onSelect, onCreate }: Props) {
  const data = useStore((s) => s.data);
  const deleteHabit = useStore((s) => s.deleteHabit);

  const chips = useMemo(() => {
    const order = new Map(data.categories.map((c) => [c.id, c.order]));
    return data.habits
      .filter((h) => !h.archived)
      .map((habit) => ({
        habit,
        category: data.categories.find((c) => c.id === habit.categoryId),
      }))
      .sort(
        (a, b) =>
          (order.get(a.habit.categoryId) ?? 99) -
          (order.get(b.habit.categoryId) ?? 99)
      );
  }, [data.habits, data.categories]);

  async function confirmDelete(habit: Habit) {
    const count = data.routineSlots.filter((s) => s.habitId === habit.id).length;
    const variants =
      habit.variants.length > 0 ? ` e as ${habit.variants.length} variações` : "";
    const ok = await ask({
      title: `Excluir “${habit.name}” do app?`,
      message:
        count === 0
          ? `Sai da biblioteca${variants}.`
          : `Saem os ${count} ${
              count === 1 ? "bloco" : "blocos"
            } da semana${variants}, com o histórico.`,
      confirmLabel: "Excluir do app inteiro",
      destructive: true,
    });
    if (!ok) return;
    if (habit.id === activeId) onSelect(null);
    destructive(`${habit.name} excluída`, () => deleteHabit(habit.id));
  }

  return (
    <div className="-mx-[var(--page-x)] flex shrink-0 gap-2 overflow-x-auto px-[var(--page-x)] pb-1">
      {chips.map(({ habit, category }) => (
        <Chip
          key={habit.id}
          habit={habit}
          category={category}
          active={habit.id === activeId}
          onSelect={() => onSelect(habit.id === activeId ? null : habit.id)}
          onLongPress={() => confirmDelete(habit)}
        />
      ))}
      <button
        onClick={onCreate}
        className="press flex shrink-0 items-center gap-1.5 rounded-full border border-dashed border-white/25 px-3 py-1.5 text-xs font-medium text-white/55"
      >
        <Icon name="plus" size={13} />
        Nova
      </button>
    </div>
  );
}

function Chip({
  habit,
  category,
  active,
  onSelect,
  onLongPress,
}: {
  habit: Habit;
  category?: Category;
  active: boolean;
  onSelect: () => void;
  onLongPress: () => void;
}) {
  const color = category?.color ?? "#ffffff";
  const { pressing, handlers } = useLongPress({ onLongPress, onClick: onSelect });

  return (
    <button
      {...handlers}
      className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-transform duration-150 ${
        pressing ? "scale-95" : ""
      }`}
      style={
        active
          ? {
              backgroundColor: color,
              borderColor: color,
              color: contrastInk(color),
            }
          : {
              backgroundColor: `${color}14`,
              borderColor: `${color}40`,
              color: "rgba(255,255,255,0.78)",
            }
      }
    >
      {category && <Icon name={category.icon} size={13} />}
      {habit.name}
    </button>
  );
}
