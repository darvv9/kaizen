import { motion, type PanInfo } from "framer-motion";
import type { Category, Habit, RoutineSlot } from "../types";
import {
  prettyTime,
  blockTop,
  blockHeight,
  parseTime,
  formatTime,
  snapTimelineMinutes,
  TIMELINE_START,
  TIMELINE_END,
  PX_PER_MIN,
} from "../lib/time";

interface Props {
  slot: RoutineSlot;
  habit: Habit;
  category?: Category;
  column: number;
  totalColumns: number;
  onEdit: () => void;
  onTimeChange: (slotId: string, startTime: string) => void;
}

export function RoutineBlock({
  slot,
  habit,
  category,
  column,
  totalColumns,
  onEdit,
  onTimeChange,
}: Props) {
  const color = category?.color ?? "#ffffff";
  const top = blockTop(slot.startTime);
  const height = blockHeight(slot.durationMinutes);
  const gap = 3;
  const widthPct = 100 / totalColumns;
  const leftPct = column * widthPct;

  const currentMinutes = parseTime(slot.startTime);
  const maxUp = (currentMinutes - TIMELINE_START) * PX_PER_MIN;
  const maxDown = (TIMELINE_END - slot.durationMinutes - currentMinutes) * PX_PER_MIN;

  function handleDragEnd(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    if (Math.abs(info.offset.y) >= 14) {
      const next = snapTimelineMinutes(
        currentMinutes + info.offset.y / PX_PER_MIN,
        slot.durationMinutes
      );
      onTimeChange(slot.id, formatTime(next));
    } else {
      onEdit();
    }
  }

  return (
    <motion.div
      drag="y"
      dragMomentum={false}
      dragElastic={0}
      dragConstraints={{ top: -maxUp, bottom: maxDown }}
      onDragEnd={handleDragEnd}
      whileDrag={{
        scale: 1.03,
        zIndex: 50,
        boxShadow: "0 8px 32px rgba(0,0,0,0.45)",
      }}
      className="absolute cursor-grab touch-none overflow-hidden rounded-xl border active:cursor-grabbing"
      style={{
        top,
        height: Math.max(height, 28),
        left: `calc(${leftPct}% + ${gap}px)`,
        width: `calc(${widthPct}% - ${gap * 2}px)`,
        zIndex: column + 1,
        borderColor: `${color}55`,
        background: `linear-gradient(135deg, ${color}28, ${color}10)`,
      }}
    >
      <div
        className="absolute inset-y-0 left-0 w-1"
        style={{ backgroundColor: color }}
      />
      <div className="flex h-full min-w-0 flex-col justify-center py-1 pl-2.5 pr-9">
        <div className="truncate text-[10px] font-medium text-white/50">
          {prettyTime(slot.startTime)}
        </div>
        <div className="truncate text-xs font-semibold text-white">{habit.name}</div>
        {totalColumns === 1 && category && (
          <div className="truncate text-[10px] text-white/45">
            {category.icon} {category.name}
          </div>
        )}
      </div>
      <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
        aria-label={`Editar ${habit.name}`}
        className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/30 text-[12px] leading-none text-white/80 backdrop-blur-sm transition active:scale-90 active:bg-black/50"
      >
        ✎
      </button>
    </motion.div>
  );
}
