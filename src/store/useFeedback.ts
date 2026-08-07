import { create } from "zustand";

export type Tone = "info" | "success" | "error";

export interface Toast {
  id: number;
  text: string;
  tone: Tone;
}

interface FeedbackState {
  toasts: Toast[];
  push: (text: string, tone?: Tone) => void;
}

let counter = 0;

export const useFeedback = create<FeedbackState>((set) => ({
  toasts: [],
  push: (text, tone = "info") => {
    const id = ++counter;
    set((s) => ({ toasts: [...s.toasts, { id, text, tone }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 1800);
  },
}));
