import type { AppData } from "../types";
import { migrateAppData } from "./migrate";

/**
 * Adapter de persistência isolado.
 *
 * Hoje grava em localStorage. No futuro (sync entre dispositivos Apple),
 * basta reimplementar estas funções com um backend (ex: Supabase) sem mexer
 * na UI nem no store. Veja AGENTS.md.
 */

const KEY = "kaizen:data:v1";

export const storage = {
  load(): AppData | null {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Partial<AppData>;
      if (!parsed.categories || !parsed.habits) return null;
      return migrateAppData(parsed as AppData);
    } catch {
      return null;
    }
  },

  save(data: AppData): void {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch {
      // storage cheio ou indisponível: ignora silenciosamente
    }
  },

  clear(): void {
    try {
      localStorage.removeItem(KEY);
    } catch {
      // noop
    }
  },
};
