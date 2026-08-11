import { create } from "zustand";
import type {
  AppData,
  Category,
  Habit,
  HabitVariant,
  PhysiqueEntry,
  RoutineSlot,
  Weekday,
  SkippedDays,
} from "../types";
import type { IconName } from "../icons/names";
import { storage } from "../data/storage";
import { createDefaultData } from "../data/defaults";
import { migrateAppData } from "../data/migrate";
import { dayKey } from "../lib/date";
import { uid } from "../lib/id";
import { isDaySkipped } from "../lib/stats";

interface StoreState {
  data: AppData;

  toggleSlot: (slotId: string, date?: Date) => boolean;

  addHabit: (input: { categoryId: string; name: string }) => string;
  updateHabit: (id: string, patch: Partial<Pick<Habit, "name" | "categoryId" | "archived">>) => void;
  deleteHabit: (id: string) => void;

  addVariant: (habitId: string, name: string, items?: string[]) => string;
  updateVariant: (habitId: string, variantId: string, patch: Partial<Omit<HabitVariant, "id">>) => void;
  deleteVariant: (habitId: string, variantId: string) => void;

  addRoutineSlot: (input: {
    habitId: string;
    weekday: Weekday;
    startTime: string;
    durationMinutes: number;
    variantId?: string;
  }) => void;
  updateRoutineSlot: (id: string, patch: Partial<RoutineSlot>) => void;
  deleteRoutineSlot: (id: string) => void;
  /** Variação só naquele dia; null volta a usar a do bloco. */
  setSlotVariant: (slotId: string, key: string, variantId: string | null) => void;

  skipDay: (date?: Date) => void;
  unskipDay: (date?: Date) => void;

  addCategory: (input: { name: string; color: string; icon: IconName }) => void;
  updateCategory: (id: string, patch: Partial<Omit<Category, "id">>) => void;
  deleteCategory: (id: string) => void;

  addPhysiqueEntry: (input: {
    mediaId: string;
    date?: string;
    note?: string;
    durationSec?: number;
    sizeBytes?: number;
  }) => void;
  updatePhysiqueEntry: (id: string, patch: Partial<Pick<PhysiqueEntry, "date" | "note">>) => void;
  /** Remove a entrada e devolve o mediaId para a página apagar o blob. */
  deletePhysiqueEntry: (id: string) => string | null;
  clearPhysiqueEntries: () => string[];
  setPhysiqueInterval: (days: number) => void;
  snoozePhysique: (untilKey: string) => void;
  setBadgeEnabled: (enabled: boolean) => void;

  exportData: () => string;
  importData: (json: string) => boolean;
  resetData: () => void;
  /** Volta a um estado anterior inteiro — é o que faz o "Desfazer" funcionar. */
  restoreData: (data: AppData) => void;
}

function load(): AppData {
  return storage.load() ?? createDefaultData();
}

function persist(data: AppData) {
  storage.save(data);
}

function sortEntries(entries: PhysiqueEntry[]): PhysiqueEntry[] {
  return [...entries].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

export const useStore = create<StoreState>((set, get) => ({
  data: load(),

  toggleSlot: (slotId, date = new Date()) => {
    const key = dayKey(date);
    if (isDaySkipped(get().data, key)) return false;
    let done = false;

    set((state) => {
      const slot = state.data.routineSlots.find((s) => s.id === slotId);
      if (!slot) return state;

      const slotLogs = { ...state.data.slotLogs };
      const log = { ...(slotLogs[slotId] ?? {}) };
      const wasDone = log[key] === true;

      if (wasDone) delete log[key];
      else log[key] = true;

      if (Object.keys(log).length === 0) delete slotLogs[slotId];
      else slotLogs[slotId] = log;

      done = !wasDone;
      const data = { ...state.data, slotLogs };
      persist(data);
      return { data };
    });

    return done;
  },

  addHabit: ({ categoryId, name }) => {
    const id = uid("h-");
    set((state) => {
      const habit: Habit = {
        id,
        categoryId,
        name: name.trim(),
        createdAt: dayKey(),
        variants: [],
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
      const removedSlots = state.data.routineSlots.filter((s) => s.habitId === id);
      const routineSlots = state.data.routineSlots.filter((s) => s.habitId !== id);
      const slotLogs = { ...state.data.slotLogs };
      const slotVariants = { ...state.data.slotVariants };
      for (const s of removedSlots) {
        delete slotLogs[s.id];
        delete slotVariants[s.id];
      }
      const data = { ...state.data, habits, routineSlots, slotLogs, slotVariants };
      persist(data);
      return { data };
    });
  },

  addVariant: (habitId, name, items = []) => {
    const id = uid("v-");
    set((state) => {
      const habits = state.data.habits.map((h) =>
        h.id === habitId
          ? { ...h, variants: [...h.variants, { id, name: name.trim(), items }] }
          : h
      );
      const data = { ...state.data, habits };
      persist(data);
      return { data };
    });
    return id;
  },

  updateVariant: (habitId, variantId, patch) => {
    set((state) => {
      const habits = state.data.habits.map((h) =>
        h.id === habitId
          ? {
              ...h,
              variants: h.variants.map((v) => (v.id === variantId ? { ...v, ...patch } : v)),
            }
          : h
      );
      const data = { ...state.data, habits };
      persist(data);
      return { data };
    });
  },

  deleteVariant: (habitId, variantId) => {
    set((state) => {
      const habits = state.data.habits.map((h) =>
        h.id === habitId ? { ...h, variants: h.variants.filter((v) => v.id !== variantId) } : h
      );
      const routineSlots = state.data.routineSlots.map((s) => {
        if (s.variantId !== variantId) return s;
        const { variantId: _drop, ...rest } = s;
        return rest;
      });
      const slotVariants: AppData["slotVariants"] = {};
      for (const [slotId, days] of Object.entries(state.data.slotVariants)) {
        const kept = Object.fromEntries(
          Object.entries(days).filter(([, id]) => id !== variantId)
        );
        if (Object.keys(kept).length > 0) slotVariants[slotId] = kept;
      }
      const data = { ...state.data, habits, routineSlots, slotVariants };
      persist(data);
      return { data };
    });
  },

  addRoutineSlot: ({ habitId, weekday, startTime, durationMinutes, variantId }) => {
    set((state) => {
      const slot: RoutineSlot = {
        id: uid("s-"),
        habitId,
        weekday,
        startTime,
        durationMinutes,
        ...(variantId ? { variantId } : {}),
      };
      const data = { ...state.data, routineSlots: [...state.data.routineSlots, slot] };
      persist(data);
      return { data };
    });
  },

  updateRoutineSlot: (id, patch) => {
    set((state) => {
      const routineSlots = state.data.routineSlots.map((s) => {
        if (s.id !== id) return s;
        const next = { ...s, ...patch };
        const changedHabit = patch.habitId !== undefined && patch.habitId !== s.habitId;
        if (changedHabit && patch.variantId === undefined) delete next.variantId;
        if (next.variantId === undefined) delete next.variantId;
        return next;
      });
      const data = { ...state.data, routineSlots };
      persist(data);
      return { data };
    });
  },

  deleteRoutineSlot: (id) => {
    set((state) => {
      const routineSlots = state.data.routineSlots.filter((s) => s.id !== id);
      const slotLogs = { ...state.data.slotLogs };
      const slotVariants = { ...state.data.slotVariants };
      delete slotLogs[id];
      delete slotVariants[id];
      const data = { ...state.data, routineSlots, slotLogs, slotVariants };
      persist(data);
      return { data };
    });
  },

  setSlotVariant: (slotId, key, variantId) => {
    set((state) => {
      const slotVariants = { ...state.data.slotVariants };
      const days = { ...(slotVariants[slotId] ?? {}) };
      if (variantId) days[key] = variantId;
      else delete days[key];
      if (Object.keys(days).length === 0) delete slotVariants[slotId];
      else slotVariants[slotId] = days;
      const data = { ...state.data, slotVariants };
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
      const skippedDays: SkippedDays = { ...state.data.skippedDays };
      delete skippedDays[key];
      const data = { ...state.data, skippedDays };
      persist(data);
      return { data };
    });
  },

  addCategory: ({ name, color, icon }) => {
    set((state) => {
      const order = state.data.categories.reduce((m, c) => Math.max(m, c.order), -1) + 1;
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
      const removedHabitIds = new Set(
        state.data.habits.filter((h) => h.categoryId === id).map((h) => h.id)
      );
      const habits = state.data.habits.filter((h) => !removedHabitIds.has(h.id));
      const removedSlots = state.data.routineSlots.filter((s) => removedHabitIds.has(s.habitId));
      const routineSlots = state.data.routineSlots.filter((s) => !removedHabitIds.has(s.habitId));
      const slotLogs = { ...state.data.slotLogs };
      const slotVariants = { ...state.data.slotVariants };
      for (const s of removedSlots) {
        delete slotLogs[s.id];
        delete slotVariants[s.id];
      }
      const data = { ...state.data, categories, habits, routineSlots, slotLogs, slotVariants };
      persist(data);
      return { data };
    });
  },

  addPhysiqueEntry: ({ mediaId, date, note, durationSec, sizeBytes }) => {
    set((state) => {
      const entry: PhysiqueEntry = {
        id: uid("p-"),
        date: date ?? dayKey(),
        mediaId,
        ...(note ? { note } : {}),
        ...(durationSec !== undefined ? { durationSec } : {}),
        ...(sizeBytes !== undefined ? { sizeBytes } : {}),
        createdAt: new Date().toISOString(),
      };
      const physique = {
        ...state.data.physique,
        entries: sortEntries([...state.data.physique.entries, entry]),
      };
      delete physique.snoozedUntil;
      const data = { ...state.data, physique };
      persist(data);
      return { data };
    });
  },

  updatePhysiqueEntry: (id, patch) => {
    set((state) => {
      const entries = sortEntries(
        state.data.physique.entries.map((e) => (e.id === id ? { ...e, ...patch } : e))
      );
      const data = { ...state.data, physique: { ...state.data.physique, entries } };
      persist(data);
      return { data };
    });
  },

  deletePhysiqueEntry: (id) => {
    const entry = get().data.physique.entries.find((e) => e.id === id);
    if (!entry) return null;
    set((state) => {
      const entries = state.data.physique.entries.filter((e) => e.id !== id);
      const data = { ...state.data, physique: { ...state.data.physique, entries } };
      persist(data);
      return { data };
    });
    return entry.mediaId;
  },

  clearPhysiqueEntries: () => {
    const ids = get().data.physique.entries.map((e) => e.mediaId);
    set((state) => {
      const data = { ...state.data, physique: { ...state.data.physique, entries: [] } };
      persist(data);
      return { data };
    });
    return ids;
  },

  setPhysiqueInterval: (days) => {
    set((state) => {
      const physique = { ...state.data.physique, intervalDays: Math.max(1, days) };
      const data = { ...state.data, physique };
      persist(data);
      return { data };
    });
  },

  snoozePhysique: (untilKey) => {
    set((state) => {
      const physique = { ...state.data.physique, snoozedUntil: untilKey };
      const data = { ...state.data, physique };
      persist(data);
      return { data };
    });
  },

  setBadgeEnabled: (enabled) => {
    set((state) => {
      const physique = { ...state.data.physique, badgeEnabled: enabled };
      const data = { ...state.data, physique };
      persist(data);
      return { data };
    });
  },

  exportData: () => JSON.stringify(get().data, null, 2),

  importData: (json) => {
    try {
      const data = migrateAppData(JSON.parse(json));
      if (!data) return false;
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

  restoreData: (data) => {
    persist(data);
    set({ data });
  },
}));
