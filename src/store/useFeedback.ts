import { create } from "zustand";

export type Tone = "info" | "success" | "error";

export interface ToastAction {
  label: string;
  onPress: () => void;
}

export interface Toast {
  id: number;
  text: string;
  tone: Tone;
  action?: ToastAction;
}

interface FeedbackState {
  toasts: Toast[];
  push: (text: string, tone?: Tone, action?: ToastAction) => void;
  dismiss: (id: number) => void;
}

let counter = 0;

/** Com ação (Desfazer) o toast fica bem mais tempo — ninguém desfaz em 1,8s. */
const PLAIN_MS = 1800;
const ACTION_MS = 6000;

export const useFeedback = create<FeedbackState>((set, get) => ({
  toasts: [],

  push: (text, tone = "info", action) => {
    const id = ++counter;
    set((s) => ({ toasts: [...s.toasts, { id, text, tone, action }] }));
    setTimeout(() => get().dismiss(id), action ? ACTION_MS : PLAIN_MS);
  },

  dismiss: (id) => {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },
}));
