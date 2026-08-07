import { useMemo } from "react";
import { useStore } from "../store/useStore";
import { contrastInk } from "../lib/color";
import { Icon } from "./Icon";

interface Props {
  activeId: string | null;
  onSelect: (habitId: string | null) => void;
  onCreate: () => void;
}

export function ActivityPalette({ activeId, onSelect, onCreate }: Props) {
  const data = useStore((s) => s.data);

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

  return (
    <div className="-mx-4 flex shrink-0 gap-2 overflow-x-auto px-4 pb-1">
      {chips.map(({ habit, category }) => {
        const color = category?.color ?? "#ffffff";
        const active = habit.id === activeId;
        return (
          <button
            key={habit.id}
            onClick={() => onSelect(active ? null : habit.id)}
            className="flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition active:scale-95"
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
      })}
      <button
        onClick={onCreate}
        className="flex shrink-0 items-center gap-1.5 rounded-full border border-dashed border-white/25 px-3 py-1.5 text-xs font-medium text-white/55"
      >
        <Icon name="plus" size={13} />
        Nova
      </button>
    </div>
  );
}
