import { create } from "zustand";

export interface Toast {
  id: number;
  text: string;
  tone: "xp" | "level" | "badge";
}

interface FeedbackState {
  toasts: Toast[];
  levelUp: number | null;
  push: (text: string, tone?: Toast["tone"]) => void;
  remove: (id: number) => void;
  showLevelUp: (level: number) => void;
  clearLevelUp: () => void;
}

let counter = 0;

export const useFeedback = create<FeedbackState>((set) => ({
  toasts: [],
  levelUp: null,
  push: (text, tone = "xp") => {
    const id = ++counter;
    set((s) => ({ toasts: [...s.toasts, { id, text, tone }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 1600);
  },
  remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  showLevelUp: (level) => set({ levelUp: level }),
  clearLevelUp: () => set({ levelUp: null }),
}));
