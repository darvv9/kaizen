/** "HH:mm" → minutos desde meia-noite. */
export function parseTime(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function prettyTime(time: string): string {
  const mins = parseTime(time);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}:${String(m).padStart(2, "0")}`;
}

export const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120] as const;

export const TIMELINE_START = 5 * 60;
export const TIMELINE_END = 24 * 60;
/** Escala da timeline — blocos seguem duração real. */
export const PX_PER_MIN = 2.2;

export function timelineHeight(): number {
  return (TIMELINE_END - TIMELINE_START) * PX_PER_MIN;
}

export function blockTop(startTime: string): number {
  return (parseTime(startTime) - TIMELINE_START) * PX_PER_MIN;
}

/** Altura proporcional à duração (sem inflar blocos curtos). */
export function blockHeight(durationMinutes: number): number {
  return durationMinutes * PX_PER_MIN;
}

const SNAP = 15;

export function snapTimelineMinutes(
  minutes: number,
  durationMinutes: number
): number {
  const snapped = Math.round(minutes / SNAP) * SNAP;
  return Math.max(
    TIMELINE_START,
    Math.min(TIMELINE_END - durationMinutes, snapped)
  );
}

/** Fim visual do bloco em minutos (para detectar colisão na tela). */
export function slotVisualEndMinutes(startTime: string, durationMinutes: number): number {
  return parseTime(startTime) + blockHeight(durationMinutes) / PX_PER_MIN;
}
