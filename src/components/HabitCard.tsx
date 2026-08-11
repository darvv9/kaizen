import { motion } from "framer-motion";
import { contrastInk } from "../lib/color";
import { Icon } from "./Icon";
import type { IconName } from "../icons/names";

interface Props {
  title: string;
  /** Variação do dia: "Treino A", "No-gi". */
  subtitle?: string;
  time?: string;
  color?: string;
  icon?: IconName;
  done: boolean;
  disabled?: boolean;
  onToggle: () => void;
  /** Toque na pill da variação (troca só neste dia). */
  onSubtitlePress?: () => void;
}

export function HabitCard({
  title,
  subtitle,
  time,
  color = "#ffffff",
  icon,
  done,
  disabled = false,
  onToggle,
  onSubtitlePress,
}: Props) {
  return (
    <div
      className="card flex w-full items-center gap-3 px-4 py-3"
      style={{ borderColor: done ? `${color}55` : undefined }}
    >
      <motion.button
        onClick={onToggle}
        disabled={disabled}
        whileTap={disabled ? undefined : { scale: 0.97 }}
        className="flex min-w-0 flex-1 items-center gap-3 text-left disabled:opacity-60"
      >
        <motion.span
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
        </motion.span>

        <span className="min-w-0 flex-1">
          {time && <span className="block text-[11px] font-medium text-white/40">{time}</span>}
          <span
            className={`flex items-center gap-1.5 truncate text-[15px] font-medium transition-colors ${
              done ? "text-white/45 line-through" : "text-white"
            }`}
          >
            {icon && <Icon name={icon} size={14} className="shrink-0" style={{ color }} />}
            {title}
          </span>
        </span>
      </motion.button>

      {subtitle &&
        (onSubtitlePress ? (
          <button
            onClick={onSubtitlePress}
            className="press shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold"
            style={{ backgroundColor: `${color}1f`, color }}
          >
            {subtitle}
          </button>
        ) : (
          <span
            className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold"
            style={{ backgroundColor: `${color}1f`, color }}
          >
            {subtitle}
          </span>
        ))}
    </div>
  );
}
