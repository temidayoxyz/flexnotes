import {
  CORRUPT_BACKUP_KEY,
  DEFAULT_DOCUMENT,
  STORAGE_KEY,
  normalizeDocument,
} from "@/lib/storage/schema";
import type { CanvasDocument } from "@/lib/types";

export type LoadResult =
  | { status: "ok"; doc: CanvasDocument }
  | { status: "empty" }
  | {
      status: "corrupt";
      /** A fresh document to start from; the unreadable data was preserved. */
      doc: CanvasDocument;
      reason: string;
    }
  | { status: "unavailable"; reason: string };

/**
 * Storage abstraction. The canvas UI depends on this interface, not on
 * localStorage directly, so the engine can be swapped (e.g. IndexedDB) later.
 */
export interface CanvasStorage {
  load(): LoadResult;
  save(doc: CanvasDocument): boolean;
}

function isStorageAccessible(storage: Storage | null): storage is Storage {
  if (!storage) return false;
  try {
    const probe = "__flexnotes_probe__";
    storage.setItem(probe, "1");
    storage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

export class LocalStorageCanvasStorage implements CanvasStorage {
  private readonly storage: Storage | null;

  constructor() {
    try {
      this.storage =
        typeof window !== "undefined" ? window.localStorage : null;
    } catch {
      this.storage = null;
    }
  }

  load(): LoadResult {
    if (!isStorageAccessible(this.storage)) {
      return {
        status: "unavailable",
        reason: "Browser storage is unavailable, so notes can’t be saved.",
      };
    }
    let raw: string | null = null;
    try {
      raw = this.storage.getItem(STORAGE_KEY);
    } catch (error) {
      return {
        status: "unavailable",
        reason:
          error instanceof Error
            ? `Reading saved notes failed: ${error.message}`
            : "Reading saved notes failed.",
      };
    }
    if (raw === null) return { status: "empty" };

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      this.preserveCorrupt(raw);
      return {
        status: "corrupt",
        doc: structuredCloneSafe(DEFAULT_DOCUMENT),
        reason: "Saved notes were unreadable. A backup copy was kept; starting fresh.",
      };
    }
    const doc = normalizeDocument(parsed);
    if (!doc) {
      this.preserveCorrupt(raw);
      return {
        status: "corrupt",
        doc: structuredCloneSafe(DEFAULT_DOCUMENT),
        reason:
          "Saved notes used an unsupported format. A backup copy was kept; starting fresh.",
      };
    }
    return { status: "ok", doc };
  }

  save(doc: CanvasDocument): boolean {
    if (!isStorageAccessible(this.storage)) return false;
    try {
      this.storage.setItem(STORAGE_KEY, JSON.stringify(doc));
      return true;
    } catch {
      // Quota exceeded or storage blocked — the caller surfaces this to the user.
      return false;
    }
  }

  /** Keep unreadable raw data so a future version (or manual fix) can recover it. */
  private preserveCorrupt(raw: string): void {
    if (!isStorageAccessible(this.storage)) return;
    try {
      this.storage.setItem(CORRUPT_BACKUP_KEY, raw);
    } catch {
      // Nothing more we can do — the user is told data was unreadable.
    }
  }
}

function structuredCloneSafe(doc: CanvasDocument): CanvasDocument {
  return {
    version: doc.version,
    notes: doc.notes.map((note) => ({ ...note })),
    viewport: { ...doc.viewport },
    colorIndex: doc.colorIndex,
  };
}

export function createCanvasStorage(): CanvasStorage {
  return new LocalStorageCanvasStorage();
}
