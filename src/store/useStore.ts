import { create } from "zustand";
import type { AppData, Category, Habit, RoutineSlot, Weekday, SkippedDays } from "../types";
import { storage } from "../data/storage";
import { createDefaultData } from "../data/defaults";
import { migrateAppData } from "../data/migrate";
import { dayKey } from "../lib/date";
import { uid } from "../lib/id";
import { isDaySkipped } from "../lib/productivity";
import {
  bestStreak,
  countPerfectDays,
  currentStreak,
  totalCompletions,
} from "../lib/stats";
import { ACHIEVEMENTS } from "../data/achievements";

export interface ToggleResult {
  done: boolean;
  xpDelta: number;
  newlyUnlocked: string[];
}

interface StoreState {
  data: AppData;
  hydrated: boolean;

  toggleHabit: (habitId: string, date?: Date) => ToggleResult;
  toggleSlot: (slotId: string, date?: Date) => ToggleResult;

  addHabit: (input: {
    categoryId: string;
    name: string;
    xp: number;
    days?: Weekday[];
    target?: number;
  }) => string;
  updateHabit: (id: string, patch: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;

  addRoutineSlot: (input: {
    habitId: string;
    weekday: Weekday;
    startTime: string;
    durationMinutes: number;
  }) => void;
  updateRoutineSlot: (id: string, patch: Partial<RoutineSlot>) => void;
  deleteRoutineSlot: (id: string) => void;

  skipDay: (date?: Date) => void;
  unskipDay: (date?: Date) => void;

  addCategory: (input: { name: string; color: string; icon: string }) => void;
  updateCategory: (id: string, patch: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  exportData: () => string;
  importData: (json: string) => boolean;
  resetData: () => void;
}

function load(): AppData {
  const raw = storage.load();
  return raw ?? createDefaultData();
}

function persist(data: AppData) {
  storage.save(data);
}

function computeUnlocked(data: AppData): string[] {
  const ctx = {
    data,
    bestStreak: bestStreak(data),
    currentStreak: currentStreak(data),
    totalCompletions: totalCompletions(data),
    perfectDays: countPerfectDays(data),
  };
  return ACHIEVEMENTS.filter((a) => a.progress(ctx) >= 1).map((a) => a.id);
}

function applyXpAndAchievements(
  data: AppData,
  xpDelta: number,
  prevUnlocked: string[]
): { data: AppData; newlyUnlocked: string[] } {
  const next: AppData = {
    ...data,
    totalXp: Math.max(0, data.totalXp + xpDelta),
  };
  const unlocked = computeUnlocked(next);
  next.unlocked = unlocked;
  return {
    data: next,
    newlyUnlocked: unlocked.filter((id) => !prevUnlocked.includes(id)),
  };
}

export const useStore = create<StoreState>((set, get) => ({
  data: load(),
  hydrated: true,

  toggleHabit: (habitId, date = new Date()) => {
    const key = dayKey(date);
    if (isDaySkipped(get().data, key)) {
      return { done: false, xpDelta: 0, newlyUnlocked: [] };
    }
    let result: ToggleResult = { done: false, xpDelta: 0, newlyUnlocked: [] };

    set((state) => {
      const habit = state.data.habits.find((h) => h.id === habitId);
      if (!habit) return state;

      const logs = { ...state.data.logs };
      const habitLog = { ...(logs[habitId] ?? {}) };
      const wasDone = (habitLog[key] ?? 0) >= habit.target;

      const xpDelta = wasDone ? -habit.xp : habit.xp;
      if (wasDone) delete habitLog[key];
      else habitLog[key] = habit.target;
      logs[habitId] = habitLog;

      const prevUnlocked = state.data.unlocked;
      const { data, newlyUnlocked } = applyXpAndAchievements(
        { ...state.data, logs },
        xpDelta,
        prevUnlocked
      );
      result = { done: !wasDone, xpDelta, newlyUnlocked };
      persist(data);
      return { data };
    });

    return result;
  },

  toggleSlot: (slotId, date = new Date()) => {
    const key = dayKey(date);
    if (isDaySkipped(get().data, key)) {
      return { done: false, xpDelta: 0, newlyUnlocked: [] };
    }
    let result: ToggleResult = { done: false, xpDelta: 0, newlyUnlocked: [] };

    set((state) => {
      const slot = state.data.routineSlots.find((s) => s.id === slotId);
      if (!slot) return state;
      const habit = state.data.habits.find((h) => h.id === slot.habitId);
      if (!habit) return state;

      const slotLogs = { ...state.data.slotLogs };
      const log = { ...(slotLogs[slotId] ?? {}) };
      const wasDone = log[key] === true;

      if (wasDone) delete log[key];
      else log[key] = true;
      slotLogs[slotId] = log;

      const xpDelta = wasDone ? -habit.xp : habit.xp;
      const prevUnlocked = state.data.unlocked;
      const { data, newlyUnlocked } = applyXpAndAchievements(
        { ...state.data, slotLogs },
        xpDelta,
        prevUnlocked
      );
      result = { done: !wasDone, xpDelta, newlyUnlocked };
      persist(data);
      return { data };
    });

    return result;
  },

  addHabit: ({ categoryId, name, xp, days = [], target = 1 }) => {
    const id = uid("h-");
    set((state) => {
      const habit: Habit = {
        id,
        categoryId,
        name: name.trim(),
        xp,
        days,
        target,
        createdAt: dayKey(),
      };
      const data = { ...state.data, habits: [...state.data.habits, habit] };
      persist(data);
      return { data };
    });
    return id;
  },

  updateHabit: (id, patch) => {
    set((state) => {
      const habits = state.data.habits.map((h) => (h.id === id ? { ...h, ...patch } : h));
      const data = { ...state.data, habits };
      persist(data);
      return { data };
    });
  },

  deleteHabit: (id) => {
    set((state) => {
      const habits = state.data.habits.filter((h) => h.id !== id);
      const logs = { ...state.data.logs };
      delete logs[id];
      const routineSlots = state.data.routineSlots.filter((s) => s.habitId !== id);
      const slotLogs = { ...state.data.slotLogs };
      for (const s of state.data.routineSlots.filter((x) => x.habitId === id)) {
        delete slotLogs[s.id];
      }
      const data = { ...state.data, habits, logs, routineSlots, slotLogs };
      persist(data);
      return { data };
    });
  },

  addRoutineSlot: ({ habitId, weekday, startTime, durationMinutes }) => {
    set((state) => {
      const slot: RoutineSlot = {
        id: uid("s-"),
        habitId,
        weekday,
        startTime,
        durationMinutes,
      };
      const data = {
        ...state.data,
        routineSlots: [...state.data.routineSlots, slot],
      };
      persist(data);
      return { data };
    });
  },

  updateRoutineSlot: (id, patch) => {
    set((state) => {
      const routineSlots = state.data.routineSlots.map((s) =>
        s.id === id ? { ...s, ...patch } : s
      );
      const data = { ...state.data, routineSlots };
      persist(data);
      return { data };
    });
  },

  deleteRoutineSlot: (id) => {
    set((state) => {
      const routineSlots = state.data.routineSlots.filter((s) => s.id !== id);
      const slotLogs = { ...state.data.slotLogs };
      delete slotLogs[id];
      const data = { ...state.data, routineSlots, slotLogs };
      persist(data);
      return { data };
    });
  },

  skipDay: (date = new Date()) => {
    const key = dayKey(date);
    set((state) => {
      const skippedDays: SkippedDays = { ...state.data.skippedDays, [key]: true };
      const data = { ...state.data, skippedDays };
      persist(data);
      return { data };
    });
  },

  unskipDay: (date = new Date()) => {
    const key = dayKey(date);
    set((state) => {
      const next: SkippedDays = { ...state.data.skippedDays };
      delete next[key];
      const data = { ...state.data, skippedDays: next };
      persist(data);
      return { data };
    });
  },

  addCategory: ({ name, color, icon }) => {
    set((state) => {
      const order =
        state.data.categories.reduce((m, c) => Math.max(m, c.order), -1) + 1;
      const category: Category = { id: uid("cat-"), name: name.trim(), color, icon, order };
      const data = { ...state.data, categories: [...state.data.categories, category] };
      persist(data);
      return { data };
    });
  },

  updateCategory: (id, patch) => {
    set((state) => {
      const categories = state.data.categories.map((c) =>
        c.id === id ? { ...c, ...patch } : c
      );
      const data = { ...state.data, categories };
      persist(data);
      return { data };
    });
  },

  deleteCategory: (id) => {
    set((state) => {
      const categories = state.data.categories.filter((c) => c.id !== id);
      const removedHabitIds = state.data.habits
        .filter((h) => h.categoryId === id)
        .map((h) => h.id);
      const habits = state.data.habits.filter((h) => h.categoryId !== id);
      const logs = { ...state.data.logs };
      for (const hid of removedHabitIds) delete logs[hid];
      const routineSlots = state.data.routineSlots.filter(
        (s) => !removedHabitIds.includes(s.habitId)
      );
      const slotLogs = { ...state.data.slotLogs };
      for (const s of state.data.routineSlots) {
        if (removedHabitIds.includes(s.habitId)) delete slotLogs[s.id];
      }
      const data = { ...state.data, categories, habits, logs, routineSlots, slotLogs };
      persist(data);
      return { data };
    });
  },

  exportData: () => JSON.stringify(get().data, null, 2),

  importData: (json) => {
    try {
      const parsed = JSON.parse(json) as Partial<AppData>;
      if (!parsed?.categories || !parsed?.habits) return false;
      const data = migrateAppData(parsed as AppData);
      persist(data);
      set({ data });
      return true;
    } catch {
      return false;
    }
  },

  resetData: () => {
    const data = createDefaultData();
    persist(data);
    set({ data });
  },
}));
