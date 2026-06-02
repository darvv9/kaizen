import { create } from "zustand";
import type { TabId } from "../components/TabBar";

interface NavState {
  targetDayKey: string | null;
  targetTab: TabId | null;
  goToDay: (dayKey: string, tab?: TabId) => void;
  clearDayTarget: () => void;
  clearTabTarget: () => void;
}

export const useNav = create<NavState>((set) => ({
  targetDayKey: null,
  targetTab: null,
  goToDay: (dayKey, tab = "today") => set({ targetDayKey: dayKey, targetTab: tab }),
  clearDayTarget: () => set({ targetDayKey: null }),
  clearTabTarget: () => set({ targetTab: null }),
}));
