/** "HH:mm" → minutos desde meia-noite. */
export function parseTime(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export function formatTime(minutes: number): string {
  const total = Math.max(0, Math.min(24 * 60, Math.round(minutes)));
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function prettyMinutes(minutes: number): string {
  const total = Math.max(0, Math.min(24 * 60, Math.round(minutes)));
  if (total === 24 * 60) return "24h";
  const h = Math.floor(total / 60);
  const m = total % 60;
  return m === 0 ? `${h}h` : `${h}:${String(m).padStart(2, "0")}`;
}

export function prettyTime(time: string): string {
  return prettyMinutes(parseTime(time));
}

export function prettyDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h${m}`;
}

export const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120] as const;
