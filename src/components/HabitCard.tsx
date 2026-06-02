import { motion } from "framer-motion";
import type { Category, Habit } from "../types";
import { contrastInk } from "../lib/color";

interface Props {
  habit: Habit;
  category?: Category;
  done: boolean;
  onToggle: () => void;
  time?: string;
}

export function HabitCard({ habit, category, done, onToggle, time }: Props) {
  const color = category?.color ?? "#ffffff";

  return (
    <motion.button
      layout
      onClick={onToggle}
      whileTap={{ scale: 0.97 }}
      className="card flex w-full items-center gap-3 px-4 py-3.5 text-left"
      style={{ borderColor: done ? `${color}55` : undefined }}
    >
      <motion.div
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2"
        animate={{
          backgroundColor: done ? color : "rgba(0,0,0,0)",
          borderColor: done ? color : "rgba(255,255,255,0.22)",
        }}
        transition={{ type: "spring", stiffness: 400, damping: 24 }}
      >
        <motion.svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          initial={false}
          animate={{ scale: done ? 1 : 0, opacity: done ? 1 : 0 }}
          transition={{ type: "spring", stiffness: 500, damping: 22 }}
        >
          <path
            d="M5 13l4 4L19 7"
            stroke={contrastInk(color)}
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </motion.svg>
      </motion.div>

      <div className="min-w-0 flex-1">
        {time && (
          <div className="text-[11px] font-medium text-white/40">{time}</div>
        )}
        <div
          className={`truncate text-[15px] font-medium transition-colors ${
            done ? "text-white/45 line-through" : "text-white"
          }`}
        >
          {habit.name}
        </div>
      </div>

      <span
        className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold"
        style={{ backgroundColor: `${color}1f`, color }}
      >
        +{habit.xp}
      </span>
    </motion.button>
  );
}
