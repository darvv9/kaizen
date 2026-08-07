import { uid } from "../lib/id";

/**
 * Adapter de mídia isolado: vídeos ficam em IndexedDB, nunca no AppData.
 *
 * `storage.ts` (síncrono, localStorage) guarda metadados; este guarda os blobs.
 * Quem orquestra os dois é a página Físico — o store nunca importa este módulo.
 */

const DB_NAME = "kaizen-media";
const DB_VERSION = 1;
const BLOBS = "blobs";
const META = "meta";

export interface MediaMeta {
  id: string;
  type: string;
  size: number;
  durationSec?: number;
  createdAt: string;
}

export const QUOTA_ERROR = "QUOTA";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(BLOBS)) db.createObjectStore(BLOBS);
      if (!db.objectStoreNames.contains(META)) db.createObjectStore(META, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function isQuotaError(err: unknown): boolean {
  return err instanceof DOMException && err.name === "QuotaExceededError";
}

async function withStores<T>(
  mode: IDBTransactionMode,
  run: (tx: IDBTransaction) => T
): Promise<T> {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction([BLOBS, META], mode);
      let result: T;
      tx.oncomplete = () => resolve(result);
      tx.onabort = () =>
        reject(isQuotaError(tx.error) ? new Error(QUOTA_ERROR) : tx.error ?? new Error("abort"));
      tx.onerror = () => reject(tx.error ?? new Error("erro"));
      result = run(tx);
    });
  } finally {
    db.close();
  }
}

export const media = {
  async put(blob: Blob, extra?: { durationSec?: number }): Promise<string> {
    const id = uid("m-");
    const meta: MediaMeta = {
      id,
      type: blob.type || "video/mp4",
      size: blob.size,
      ...(extra?.durationSec !== undefined ? { durationSec: extra.durationSec } : {}),
      createdAt: new Date().toISOString(),
    };
    await withStores("readwrite", (tx) => {
      tx.objectStore(BLOBS).put(blob, id);
      tx.objectStore(META).put(meta);
    });
    return id;
  },

  async get(id: string): Promise<Blob | null> {
    const db = await openDb();
    try {
      return await new Promise<Blob | null>((resolve, reject) => {
        const request = db.transaction(BLOBS, "readonly").objectStore(BLOBS).get(id);
        request.onsuccess = () => resolve((request.result as Blob) ?? null);
        request.onerror = () => reject(request.error);
      });
    } finally {
      db.close();
    }
  },

  async list(): Promise<MediaMeta[]> {
    const db = await openDb();
    try {
      return await new Promise<MediaMeta[]>((resolve, reject) => {
        const request = db.transaction(META, "readonly").objectStore(META).getAll();
        request.onsuccess = () => resolve((request.result as MediaMeta[]) ?? []);
        request.onerror = () => reject(request.error);
      });
    } finally {
      db.close();
    }
  },

  async remove(id: string): Promise<void> {
    await withStores("readwrite", (tx) => {
      tx.objectStore(BLOBS).delete(id);
      tx.objectStore(META).delete(id);
    });
  },

  async removeMany(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    await withStores("readwrite", (tx) => {
      const blobs = tx.objectStore(BLOBS);
      const metas = tx.objectStore(META);
      for (const id of ids) {
        blobs.delete(id);
        metas.delete(id);
      }
    });
  },

  async usedBytes(): Promise<number> {
    const all = await media.list();
    return all.reduce((sum, m) => sum + m.size, 0);
  },

  async estimate(): Promise<{ usage: number; quota: number } | null> {
    try {
      const result = await navigator.storage?.estimate?.();
      if (!result || result.usage === undefined || result.quota === undefined) return null;
      return { usage: result.usage, quota: result.quota };
    } catch {
      return null;
    }
  },
};
