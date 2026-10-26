import { isValidColor } from "@/lib/notes/colors";
import type { CanvasDocument, Note, Viewport } from "@/lib/types";

export const SCHEMA_VERSION = 1;

export const STORAGE_KEY = "flexnotes.canvas";
/** Raw copy of unreadable saved data, kept so users can attempt recovery. */
export const CORRUPT_BACKUP_KEY = "flexnotes.canvas.corrupt";

export const MIN_NOTE_SIZE = 140;
export const MAX_NOTE_SIZE = 1200;
export const MAX_NOTE_TEXT = 10000;

export const DEFAULT_DOCUMENT: CanvasDocument = {
  version: SCHEMA_VERSION,
  notes: [],
  viewport: { panX: 0, panY: 0, zoom: 1 },
  colorIndex: 0,
};

function finiteNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

/** Clamp a note dimension to supported bounds. */
function clampedSize(value: unknown, fallback: number): number {
  const raw = finiteNumber(value, fallback);
  return Math.min(MAX_NOTE_SIZE, Math.max(MIN_NOTE_SIZE, raw));
}

/** Validate and repair a single note; returns null when the entry is unusable. */
export function normalizeNote(raw: unknown): Note | null {
  if (typeof raw !== "object" || raw === null) return null;
  const record = raw as Record<string, unknown>;
  const id =
    typeof record.id === "string" && record.id.length > 0 && record.id.length <= 128
      ? record.id
      : null;
  if (!id) return null;
  return {
    id,
    text:
      typeof record.text === "string" && record.text.length <= MAX_NOTE_TEXT
        ? record.text
        : "",
    color: isValidColor(record.color) ? record.color : "yellow",
    x: finiteNumber(record.x, 0),
    y: finiteNumber(record.y, 0),
    width: clampedSize(record.width, 220),
    height: clampedSize(record.height, 220),
    order: Number.isFinite(record.order) ? Number(record.order) : 0,
  };
}

export function normalizeViewport(raw: unknown): Viewport {
  if (typeof raw !== "object" || raw === null) return { ...DEFAULT_DOCUMENT.viewport };
  const record = raw as Record<string, unknown>;
  const zoomRaw = finiteNumber(record.zoom, 1);
  return {
    panX: finiteNumber(record.panX, 0),
    panY: finiteNumber(record.panY, 0),
    zoom: Math.min(3, Math.max(0.25, zoomRaw)),
  };
}

/**
 * Validate raw parsed data against the versioned document schema.
 * Returns a repaired document, or null when the shape is unsupported
 * (missing, wrong version, or notes is not an array).
 */
export function normalizeDocument(raw: unknown): CanvasDocument | null {
  if (typeof raw !== "object" || raw === null) return null;
  const record = raw as Record<string, unknown>;
  if (record.version !== SCHEMA_VERSION) return null;
  if (!Array.isArray(record.notes)) return null;

  const notes: Note[] = [];
  const seen = new Set<string>();
  for (const entry of record.notes) {
    const note = normalizeNote(entry);
    // Duplicate ids in stored data would break selection and edits — keep the first.
    if (note && !seen.has(note.id)) {
      seen.add(note.id);
      notes.push(note);
    }
  }

  const colorIndexRaw = finiteNumber(record.colorIndex, 0);
  return {
    version: SCHEMA_VERSION,
    notes,
    viewport: normalizeViewport(record.viewport),
    colorIndex: Math.max(0, Math.floor(colorIndexRaw)),
  };
}
