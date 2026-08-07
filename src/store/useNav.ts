import { create } from "zustand";
import type { TabId } from "../components/TabBar";

interface NavState {
  tab: TabId;
  setTab: (tab: TabId) => void;
}

export const useNav = create<NavState>((set) => ({
  tab: "today",
  setTab: (tab) => set({ tab }),
}));
