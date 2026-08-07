import type { AppData } from "../types";
import { migrateAppData } from "./migrate";

/**
 * Adapter de persistência isolado (metadados, não mídia).
 *
 * Hoje grava em localStorage. No futuro (sync entre dispositivos Apple),
 * basta reimplementar estas funções com um backend (ex: Supabase) sem mexer
 * na UI nem no store. Veja AGENTS.md.
 *
 * A chave v1 (schema antigo, com XP/medalhas) é lida uma vez para converter
 * e depois fica congelada: nunca é sobrescrita nem apagada automaticamente.
 */

const KEY = "kaizen:data:v2";
const LEGACY_KEY = "kaizen:data:v1";

function read(key: string): unknown {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  return JSON.parse(raw);
}

export const storage = {
  load(): AppData | null {
    try {
      const current = migrateAppData(read(KEY));
      if (current) return current;
    } catch (err) {
      console.warn("[kaizen] dados v2 ilegíveis", err);
      return null;
    }

    try {
      const legacy = migrateAppData(read(LEGACY_KEY));
      if (legacy) {
        storage.save(legacy);
        return legacy;
      }
    } catch (err) {
      console.warn("[kaizen] dados v1 ilegíveis", err);
    }

    return null;
  },

  save(data: AppData): void {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch (err) {
      console.warn("[kaizen] falha ao salvar", err);
    }
  },

  clear(): void {
    try {
      localStorage.removeItem(KEY);
    } catch {
      // noop
    }
  },

  hasLegacy(): boolean {
    try {
      return localStorage.getItem(LEGACY_KEY) !== null;
    } catch {
      return false;
    }
  },

  clearLegacy(): void {
    try {
      localStorage.removeItem(LEGACY_KEY);
    } catch {
      // noop
    }
  },
};
