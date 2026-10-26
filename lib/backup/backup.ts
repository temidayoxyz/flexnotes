import {
  SCHEMA_VERSION,
  normalizeDocument,
  normalizeNote,
} from "@/lib/storage/schema";
import type { CanvasDocument, Note } from "@/lib/types";
import { createId } from "@/lib/id";

/** On-disk backup format — documented in docs/backup-format.md. */
export interface BackupFile {
  app: "flexnotes";
  schema: typeof SCHEMA_VERSION;
  exportedAt: string;
  document: CanvasDocument;
}

export function buildBackup(doc: CanvasDocument): BackupFile {
  return {
    app: "flexnotes",
    schema: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    document: doc,
  };
}

function todayStamp(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Trigger a JSON download of the current canvas. Returns false when blocked. */
export function downloadBackup(doc: CanvasDocument): boolean {
  try {
    const json = JSON.stringify(buildBackup(doc), null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `flexnotes-backup-${todayStamp()}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    // Revoke after a tick so Safari has time to start the download.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  } catch {
    return false;
  }
}

export type ParseBackupResult =
  | { ok: true; document: CanvasDocument }
  | { ok: false; reason: string };

/**
 * Parse and validate a backup file. Accepts the wrapped BackupFile format and
 * a bare CanvasDocument. Untrusted values are validated; nothing is executed.
 */
export function parseBackup(text: string): ParseBackupResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, reason: "That file isn’t valid JSON." };
  }
  if (typeof parsed !== "object" || parsed === null) {
    return { ok: false, reason: "That file doesn’t contain Flexnotes data." };
  }
  const record = parsed as Record<string, unknown>;

  let candidate: unknown = record;
  if (record.app === "flexnotes" && record.document !== undefined) {
    candidate = record.document;
    if (record.schema !== SCHEMA_VERSION) {
      return {
        ok: false,
        reason: `Backup schema ${String(record.schema)} isn’t supported (expected ${SCHEMA_VERSION}).`,
      };
    }
  }
  if (
    typeof candidate === "object" &&
    candidate !== null &&
    (candidate as Record<string, unknown>).version !== SCHEMA_VERSION
  ) {
    const found = (candidate as Record<string, unknown>).version;
    return {
      ok: false,
      reason: found
        ? `Backup version ${String(found)} isn’t supported (expected ${SCHEMA_VERSION}).`
        : "That file doesn’t look like a Flexnotes backup.",
    };
  }
  const document = normalizeDocument(candidate);
  if (!document) {
    return { ok: false, reason: "That backup file is malformed or incomplete." };
  }
  return { ok: true, document };
}

/**
 * Replace the current canvas with an imported document. Ids are kept unless
 * they collide, in which case a fresh id is generated.
 */
export function documentForReplace(
  imported: CanvasDocument,
  current: CanvasDocument,
): CanvasDocument {
  const currentIds = new Set(current.notes.map((note) => note.id));
  const notes = imported.notes.map((note) =>
    currentIds.has(note.id) ? { ...note, id: createId() } : note,
  );
  return { ...imported, notes };
}

/**
 * Merge an imported document into the current one. Colliding ids are
 * regenerated so both sets of notes survive; imported notes stack on top.
 */
export function documentForMerge(
  imported: CanvasDocument,
  current: CanvasDocument,
): CanvasDocument {
  const currentIds = new Set(current.notes.map((note) => note.id));
  const maxOrder = current.notes.reduce(
    (max, note) => Math.max(max, note.order),
    0,
  );
  const importedNotes: Note[] = imported.notes.map((note, index) => ({
    ...normalizeNote({ ...note, id: currentIds.has(note.id) ? createId() : note.id })!,
    order: maxOrder + 1 + index,
  }));
  return {
    version: SCHEMA_VERSION,
    notes: [...current.notes, ...importedNotes],
    viewport: current.viewport,
    colorIndex: current.colorIndex,
  };
}
