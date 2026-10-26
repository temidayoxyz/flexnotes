"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import { createId } from "@/lib/id";
import { colorForIndex, NOTE_COLORS } from "@/lib/notes/colors";
import { DEFAULT_NOTE_HEIGHT, DEFAULT_NOTE_WIDTH } from "@/lib/notes/defaults";
import {
  DEFAULT_DOCUMENT,
  SCHEMA_VERSION,
} from "@/lib/storage/schema";
import { createCanvasStorage, type CanvasStorage } from "@/lib/storage/storage";
import {
  fitToContent,
  viewportCenteredOn,
  zoomAtPoint,
} from "@/lib/canvas/viewport";
import type { CanvasDocument, Note, NoteColor, Point, Viewport } from "@/lib/types";

export type SaveStatus = "idle" | "saved" | "error";

export interface CanvasState {
  notes: Note[];
  viewport: Viewport;
  colorIndex: number;
  selectedId: string | null;
  editingId: string | null;
  hydrated: boolean;
  /** Non-blocking notice from storage load (corrupt data / unavailable storage). */
  storageNotice: string | null;
  saveStatus: SaveStatus;
  /** Session-only snapshot for undoing a delete. */
  lastDeleted: Note | null;
}

export type CanvasAction =
  | { type: "hydrate"; doc: CanvasDocument; notice?: string | null }
  | { type: "save-status"; status: SaveStatus }
  | { type: "create-note"; x: number; y: number }
  | { type: "update-note"; id: string; patch: Partial<Omit<Note, "id">> }
  | { type: "delete-note"; id: string }
  | { type: "undo-delete" }
  | { type: "duplicate-note"; id: string }
  | { type: "set-color"; id: string; color: NoteColor }
  | { type: "select"; id: string | null }
  | { type: "start-editing"; id: string | null }
  | { type: "set-viewport"; viewport: Viewport }
  | { type: "pan-by"; dx: number; dy: number }
  | { type: "zoom-at"; focal: Point; nextZoom: number }
  | { type: "zoom-by-factor"; factor: number; center: Point }
  | { type: "fit-content"; width: number; height: number }
  | { type: "go-to-note"; id: string; width: number; height: number }
  | { type: "set-next-color"; color: NoteColor }
  | { type: "move-notes"; moves: Array<{ id: string; x: number; y: number }> }
  | { type: "replace-document"; doc: CanvasDocument }
  | { type: "merge-notes"; notes: Note[] }
  | { type: "clear-canvas" };

export function initialCanvasState(): CanvasState {
  return {
    notes: [],
    viewport: { ...DEFAULT_DOCUMENT.viewport },
    colorIndex: 0,
    selectedId: null,
    editingId: null,
    hydrated: false,
    storageNotice: null,
    saveStatus: "idle",
    lastDeleted: null,
  };
}

function maxOrder(notes: Note[]): number {
  return notes.reduce((max, note) => Math.max(max, note.order), 0);
}

export function canvasReducer(state: CanvasState, action: CanvasAction): CanvasState {
  switch (action.type) {
    case "hydrate":
      return {
        ...state,
        notes: action.doc.notes,
        viewport: action.doc.viewport,
        colorIndex: action.doc.colorIndex,
        hydrated: true,
        storageNotice: action.notice ?? null,
      };

    case "save-status":
      return state.saveStatus === action.status
        ? state
        : { ...state, saveStatus: action.status };

    case "create-note": {
      const note: Note = {
        id: createId(),
        text: "",
        color: colorForIndex(state.colorIndex),
        x: action.x,
        y: action.y,
        width: DEFAULT_NOTE_WIDTH,
        height: DEFAULT_NOTE_HEIGHT,
        order: maxOrder(state.notes) + 1,
      };
      return {
        ...state,
        notes: [...state.notes, note],
        colorIndex: state.colorIndex + 1,
        selectedId: note.id,
        editingId: note.id,
      };
    }

    case "update-note": {
      let changed = false;
      const notes = state.notes.map((note) => {
        if (note.id !== action.id) return note;
        for (const key of Object.keys(action.patch) as Array<Exclude<keyof Note, "id">>) {
          if (note[key] !== action.patch[key]) {
            changed = true;
            break;
          }
        }
        return changed ? { ...note, ...action.patch } : note;
      });
      return changed ? { ...state, notes } : state;
    }

    case "delete-note": {
      const target = state.notes.find((note) => note.id === action.id);
      if (!target) return state;
      return {
        ...state,
        notes: state.notes.filter((note) => note.id !== action.id),
        selectedId: state.selectedId === action.id ? null : state.selectedId,
        editingId: state.editingId === action.id ? null : state.editingId,
        lastDeleted: target,
      };
    }

    case "undo-delete": {
      const note = state.lastDeleted;
      if (!note || state.notes.some((existing) => existing.id === note.id)) {
        return state;
      }
      return {
        ...state,
        notes: [...state.notes, note],
        selectedId: note.id,
        lastDeleted: null,
      };
    }

    case "duplicate-note": {
      const source = state.notes.find((note) => note.id === action.id);
      if (!source) return state;
      const copy: Note = {
        ...source,
        id: createId(),
        x: source.x + 24,
        y: source.y + 24,
        order: maxOrder(state.notes) + 1,
      };
      return {
        ...state,
        notes: [...state.notes, copy],
        selectedId: copy.id,
        editingId: null,
      };
    }

    case "set-color":
      return {
        ...state,
        notes: state.notes.map((note) =>
          note.id === action.id ? { ...note, color: action.color } : note,
        ),
      };

    case "select": {
      if (action.id === state.selectedId) return state;
      // Clicked notes come to the front so they are never hidden by their neighbours.
      if (action.id === null) return { ...state, selectedId: null };
      const top = maxOrder(state.notes) + 1;
      return {
        ...state,
        notes: state.notes.map((note) =>
          note.id === action.id ? { ...note, order: top } : note,
        ),
        selectedId: action.id,
      };
    }

    case "start-editing":
      return {
        ...state,
        editingId: action.id,
        selectedId: action.id ?? state.selectedId,
      };

    case "set-viewport":
      return { ...state, viewport: action.viewport };

    case "pan-by":
      return {
        ...state,
        viewport: {
          ...state.viewport,
          panX: state.viewport.panX + action.dx,
          panY: state.viewport.panY + action.dy,
        },
      };

    case "zoom-at":
      return {
        ...state,
        viewport: zoomAtPoint(state.viewport, action.focal, action.nextZoom),
      };

    case "zoom-by-factor":
      return {
        ...state,
        viewport: zoomAtPoint(
          state.viewport,
          action.center,
          state.viewport.zoom * action.factor,
        ),
      };

    case "fit-content":
      return {
        ...state,
        viewport: fitToContent(state.notes, {
          width: action.width,
          height: action.height,
        }),
      };

    case "go-to-note": {
      const note = state.notes.find((candidate) => candidate.id === action.id);
      if (!note) return state;
      return {
        ...state,
        selectedId: note.id,
        viewport: viewportCenteredOn(
          { x: note.x + note.width / 2, y: note.y + note.height / 2 },
          Math.max(state.viewport.zoom, 0.75),
          { width: action.width, height: action.height },
        ),
      };
    }

    case "set-next-color": {
      const index = NOTE_COLORS.indexOf(action.color);
      return index === -1 ? state : { ...state, colorIndex: index };
    }

    case "move-notes": {
      if (action.moves.length === 0) return state;
      const movesById = new Map(action.moves.map((move) => [move.id, move]));
      return {
        ...state,
        notes: state.notes.map((note) => {
          const move = movesById.get(note.id);
          return move ? { ...note, x: move.x, y: move.y } : note;
        }),
      };
    }

    case "replace-document":
      return {
        ...state,
        notes: action.doc.notes,
        viewport: action.doc.viewport,
        colorIndex: action.doc.colorIndex,
        selectedId: null,
        editingId: null,
        lastDeleted: null,
      };

    case "merge-notes":
      return {
        ...state,
        notes: [...state.notes, ...action.notes],
        selectedId: null,
        editingId: null,
      };

    case "clear-canvas":
      return {
        ...state,
        notes: [],
        selectedId: null,
        editingId: null,
        lastDeleted: null,
      };

    default:
      return state;
  }
}

export interface UseCanvasResult {
  state: CanvasState;
  createNoteAt: (x: number, y: number) => void;
  updateNote: (id: string, patch: Partial<Omit<Note, "id">>) => void;
  deleteNote: (id: string) => void;
  undoDelete: () => void;
  duplicateNote: (id: string) => void;
  setColor: (id: string, color: NoteColor) => void;
  select: (id: string | null) => void;
  startEditing: (id: string | null) => void;
  setViewport: (viewport: Viewport) => void;
  panBy: (dx: number, dy: number) => void;
  zoomAt: (focal: Point, nextZoom: number) => void;
  zoomByFactor: (factor: number, center: Point) => void;
  fitContent: (width: number, height: number) => void;
  goToNote: (id: string, width: number, height: number) => void;
  setNextColor: (color: NoteColor) => void;
  moveNotes: (moves: Array<{ id: string; x: number; y: number }>) => void;
  replaceDocument: (doc: CanvasDocument) => void;
  mergeNotes: (notes: Note[]) => void;
  clearCanvas: () => void;
  getDocument: () => CanvasDocument;
}

const SAVE_DEBOUNCE_MS = 400;

/**
 * Owns all canvas state: the reducer plus storage hydration and debounced
 * persistence. Components consume actions; persistence stays out of the UI.
 */
export function useCanvas(): UseCanvasResult {
  const [state, dispatch] = useReducer(canvasReducer, undefined, initialCanvasState);
  const storageRef = useRef<CanvasStorage | null>(null);
  const latestDocRef = useRef<CanvasDocument | null>(null);
  const lastSavedRef = useRef<string | null>(null);

  const getDocument = useCallback((): CanvasDocument => {
    // Called from effects/handlers after hydration; falls back to defaults.
    return (
      latestDocRef.current ?? {
        version: SCHEMA_VERSION,
        notes: state.notes,
        viewport: state.viewport,
        colorIndex: state.colorIndex,
      }
    );
  }, [state.notes, state.viewport, state.colorIndex]);

  // Hydrate from storage once on mount. Before this resolves, the canvas
  // renders empty, which also keeps server and client markup consistent.
  useEffect(() => {
    const storage = createCanvasStorage();
    storageRef.current = storage;
    const result = storage.load();
    if (result.status === "ok") {
      dispatch({ type: "hydrate", doc: result.doc });
    } else if (result.status === "empty") {
      dispatch({ type: "hydrate", doc: { ...DEFAULT_DOCUMENT, notes: [], viewport: { ...DEFAULT_DOCUMENT.viewport } } });
    } else if (result.status === "corrupt") {
      dispatch({ type: "hydrate", doc: result.doc, notice: result.reason });
    } else {
      dispatch({
        type: "hydrate",
        doc: { ...DEFAULT_DOCUMENT, notes: [], viewport: { ...DEFAULT_DOCUMENT.viewport } },
        notice: result.reason,
      });
    }
  }, []);

  // Debounced persistence: skip until hydrated and unchanged since last write.
  useEffect(() => {
    if (!state.hydrated) return;
    const doc: CanvasDocument = {
      version: SCHEMA_VERSION,
      notes: state.notes,
      viewport: state.viewport,
      colorIndex: state.colorIndex,
    };
    latestDocRef.current = doc;
    const serialized = JSON.stringify(doc);
    if (serialized === lastSavedRef.current) return;
    const timer = setTimeout(() => {
      const ok = storageRef.current?.save(doc) ?? false;
      lastSavedRef.current = ok ? serialized : lastSavedRef.current;
      dispatch({ type: "save-status", status: ok ? "saved" : "error" });
    }, SAVE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [state.hydrated, state.notes, state.viewport, state.colorIndex]);

  // Best-effort synchronous flush when the tab is hidden or closed.
  useEffect(() => {
    if (!state.hydrated) return;
    const flush = () => {
      const doc = latestDocRef.current;
      if (doc && JSON.stringify(doc) !== lastSavedRef.current) {
        const ok = storageRef.current?.save(doc) ?? false;
        if (ok) lastSavedRef.current = JSON.stringify(doc);
      }
    };
    window.addEventListener("pagehide", flush);
    return () => window.removeEventListener("pagehide", flush);
  }, [state.hydrated]);

  const actions = useMemo(
    () => ({
      createNoteAt: (x: number, y: number) => dispatch({ type: "create-note", x, y }),
      updateNote: (id: string, patch: Partial<Omit<Note, "id">>) =>
        dispatch({ type: "update-note", id, patch }),
      deleteNote: (id: string) => dispatch({ type: "delete-note", id }),
      undoDelete: () => dispatch({ type: "undo-delete" }),
      duplicateNote: (id: string) => dispatch({ type: "duplicate-note", id }),
      setColor: (id: string, color: NoteColor) => dispatch({ type: "set-color", id, color }),
      select: (id: string | null) => dispatch({ type: "select", id }),
      startEditing: (id: string | null) => dispatch({ type: "start-editing", id }),
      setViewport: (viewport: Viewport) => dispatch({ type: "set-viewport", viewport }),
      panBy: (dx: number, dy: number) => dispatch({ type: "pan-by", dx, dy }),
      zoomAt: (focal: Point, nextZoom: number) =>
        dispatch({ type: "zoom-at", focal, nextZoom }),
      zoomByFactor: (factor: number, center: Point) =>
        dispatch({ type: "zoom-by-factor", factor, center }),
      fitContent: (width: number, height: number) =>
        dispatch({ type: "fit-content", width, height }),
      goToNote: (id: string, width: number, height: number) =>
        dispatch({ type: "go-to-note", id, width, height }),
      setNextColor: (color: NoteColor) => dispatch({ type: "set-next-color", color }),
      moveNotes: (moves: Array<{ id: string; x: number; y: number }>) =>
        dispatch({ type: "move-notes", moves }),
      replaceDocument: (doc: CanvasDocument) => dispatch({ type: "replace-document", doc }),
      mergeNotes: (notes: Note[]) => dispatch({ type: "merge-notes", notes }),
      clearCanvas: () => dispatch({ type: "clear-canvas" }),
    }),
    [],
  );

  return { state, ...actions, getDocument };
}
