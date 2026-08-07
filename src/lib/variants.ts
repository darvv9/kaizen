import type { AppData, Habit, HabitVariant, RoutineSlot } from "../types";

/** Variação do dia: o override daquele dia vence a variação padrão do bloco. */
export function resolveVariantId(
  data: AppData,
  slot: RoutineSlot,
  key: string
): string | undefined {
  return data.slotVariants[slot.id]?.[key] ?? slot.variantId;
}

/** Tolera id órfão (variação apagada): devolve undefined em vez de quebrar. */
export function variantOf(habit: Habit, variantId?: string): HabitVariant | undefined {
  if (!variantId) return undefined;
  return habit.variants.find((v) => v.id === variantId);
}

/** Rótulo curto para caber no bloco da semana: "Treino A" → "A". */
export function shortVariantName(name: string): string {
  const parts = name.trim().split(/\s+/);
  const last = parts[parts.length - 1];
  return parts.length > 1 && last.length <= 2 ? last : name;
}
