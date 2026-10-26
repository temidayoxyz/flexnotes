"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TriangleAlert, X } from "lucide-react";
import { CanvasSurface } from "@/components/canvas/canvas-surface";
import { BottomStatus } from "@/components/canvas/bottom-status";
import { BottomToolbar } from "@/components/canvas/bottom-toolbar";
import { EmptyHint } from "@/components/canvas/empty-hint";
import {
  TopCenterHint,
  TopLeftBrand,
  TopRightControls,
} from "@/components/canvas/top-bar";
import { ClearConfirmDialog } from "@/components/dialogs/clear-confirm-dialog";
import { HelpDialog } from "@/components/dialogs/help-dialog";
import {
  ImportDialog,
  type ImportRequest,
} from "@/components/dialogs/import-dialog";
import { SearchOverlay, type SearchMatch } from "@/components/search/search-overlay";
import { Toast, type ToastAction } from "@/components/ui/toast";
import { useCanvas } from "@/hooks/use-canvas";
import {
  documentForMerge,
  documentForReplace,
  downloadBackup,
  parseBackup,
} from "@/lib/backup/backup";
import {
  notesBounds,
  viewportCenter,
} from "@/lib/canvas/viewport";
import { findPlacement, snapToGrid } from "@/lib/canvas/placement";
import { DEFAULT_NOTE_HEIGHT, DEFAULT_NOTE_WIDTH } from "@/lib/notes/defaults";
import { NOTE_COLORS } from "@/lib/notes/colors";
import { isTextEntryTarget } from "@/lib/keyboard/shortcuts";
import { SCHEMA_VERSION } from "@/lib/storage/schema";
import type { CanvasDocument, Point } from "@/lib/types";

const ZOOM_STEP_IN = 1.25;

export function FlexnotesApp() {
  const canvas = useCanvas();
  const { state } = canvas;
  const containerRef = useRef<HTMLDivElement>(null);
  const coordsRef = useRef<HTMLSpanElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [panMode, setPanMode] = useState(false);
  const [spacePan, setSpacePan] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [helpOpen, setHelpOpen] = useState(false);
  const [importRequest, setImportRequest] = useState<ImportRequest | null>(null);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; action?: ToastAction } | null>(null);
  const [dismissedNotice, setDismissedNotice] = useState<string | null>(null);

  const showToast = useCallback((message: string, action?: ToastAction) => {
    setToast({ message, action });
  }, []);

  // Parsed backup waiting on the user's replace/merge confirmation.
  const pendingImportRef = useRef<CanvasDocument | null>(null);

  /* ---------------- viewport helpers ---------------- */

  const containerSize = useCallback(() => {
    const rect = containerRef.current?.getBoundingClientRect();
    return { width: rect?.width ?? window.innerWidth, height: rect?.height ?? window.innerHeight };
  }, []);

  const zoomByFactor = useCallback(
    (factor: number) => {
      const { width, height } = containerSize();
      canvas.zoomByFactor(factor, { x: width / 2, y: height / 2 });
    },
    [canvas, containerSize],
  );

  const fitToNotes = useCallback(() => {
    const { width, height } = containerSize();
    canvas.fitContent(width, height);
  }, [canvas, containerSize]);

  const goToNote = useCallback(
    (id: string) => {
      const { width, height } = containerSize();
      canvas.goToNote(id, width, height);
      setSearchOpen(false);
    },
    [canvas, containerSize],
  );

  /* ---------------- note actions ---------------- */

  const handleCreateNote = useCallback(() => {
    const { width, height } = containerSize();
    const center = viewportCenter(state.viewport, { width, height });
    const desired = {
      x: snapToGrid(center.x - DEFAULT_NOTE_WIDTH / 2),
      y: snapToGrid(center.y - DEFAULT_NOTE_HEIGHT / 2),
    };
    const placed = findPlacement(
      state.notes,
      desired,
      { width: DEFAULT_NOTE_WIDTH, height: DEFAULT_NOTE_HEIGHT },
    );
    canvas.createNoteAt(placed.x, placed.y);
  }, [canvas, containerSize, state.notes, state.viewport]);

  const handleDeleteNote = useCallback(
    (id: string) => {
      canvas.deleteNote(id);
      showToast("Note deleted", { label: "Undo", onClick: () => canvas.undoDelete() });
    },
    [canvas, showToast],
  );

  const handleCycleNextColor = useCallback(() => {
    canvas.setNextColor(NOTE_COLORS[(state.colorIndex + 1) % NOTE_COLORS.length]);
  }, [canvas, state.colorIndex]);

  /** Arrange all notes in a tidy grid centred on the current content. */
  const handleTile = useCallback(() => {
    const notes = state.notes;
    if (notes.length === 0) return;
    const bounds = notesBounds(notes);
    if (!bounds) return;
    const sorted = [...notes].sort((a, b) => a.order - b.order);
    const gap = 48;
    const cols = Math.ceil(Math.sqrt(sorted.length));
    const rows = Math.ceil(sorted.length / cols);
    const gridWidth = cols * DEFAULT_NOTE_WIDTH + (cols - 1) * gap;
    const gridHeight = rows * DEFAULT_NOTE_HEIGHT + (rows - 1) * gap;
    const startX = bounds.x + bounds.width / 2 - gridWidth / 2;
    const startY = bounds.y + bounds.height / 2 - gridHeight / 2;
    canvas.moveNotes(
      sorted.map((note, index) => ({
        id: note.id,
        x: snapToGrid(startX + (index % cols) * (DEFAULT_NOTE_WIDTH + gap)),
        y: snapToGrid(startY + Math.floor(index / cols) * (DEFAULT_NOTE_HEIGHT + gap)),
      })),
    );
    showToast("Notes arranged in a grid");
  }, [canvas, showToast, state.notes]);

  /* ---------------- search ---------------- */

  const searchMatches = useMemo<SearchMatch[]>(() => {
    const query = searchQuery.trim().toLowerCase();
    if (query === "") return [];
    return state.notes
      .filter((note) => note.text.toLowerCase().includes(query))
      .slice(0, 20)
      .map((note) => {
        const index = note.text.toLowerCase().indexOf(query);
        const from = Math.max(0, index - 30);
        const snippet =
          (from > 0 ? "…" : "") + note.text.slice(from, from + 90).trim() +
          (from + 90 < note.text.length ? "…" : "");
        return { note, snippet: snippet || "Empty note" };
      });
  }, [searchQuery, state.notes]);

  /* ---------------- backup ---------------- */

  const handleExport = useCallback(() => {
    const doc: CanvasDocument = {
      version: SCHEMA_VERSION,
      notes: state.notes,
      viewport: state.viewport,
      colorIndex: state.colorIndex,
    };
    const ok = downloadBackup(doc);
    showToast(ok ? "Backup downloaded" : "Export failed — download was blocked");
  }, [showToast, state.colorIndex, state.notes, state.viewport]);

  const handleImportFile = useCallback(async (file: File) => {
    const text = await file.text();
    const result = parseBackup(text);
    if (result.ok) {
      setImportRequest({
        kind: "confirm",
        fileName: file.name,
        incomingCount: result.document.notes.length,
      });
      // Stash the parsed document for the confirmation handlers.
      pendingImportRef.current = result.document;
    } else {
      setImportRequest({ kind: "error", reason: result.reason, fileName: file.name });
      pendingImportRef.current = null;
    }
  }, []);

  const currentDocument = useCallback(
    (): CanvasDocument => ({
      version: SCHEMA_VERSION,
      notes: state.notes,
      viewport: state.viewport,
      colorIndex: state.colorIndex,
    }),
    [state.colorIndex, state.notes, state.viewport],
  );

  const handleImportReplace = useCallback(() => {
    const imported = pendingImportRef.current;
    if (imported) {
      canvas.replaceDocument(documentForReplace(imported, currentDocument()));
      showToast(`Imported ${imported.notes.length} ${imported.notes.length === 1 ? "note" : "notes"} (replaced)`);
      fitToNotes();
    }
    pendingImportRef.current = null;
    setImportRequest(null);
  }, [canvas, currentDocument, fitToNotes, showToast]);

  const handleImportMerge = useCallback(() => {
    const imported = pendingImportRef.current;
    if (imported) {
      const merged = documentForMerge(imported, currentDocument());
      canvas.mergeNotes(merged.notes);
      showToast(`Imported ${merged.notes.length - state.notes.length} ${merged.notes.length - state.notes.length === 1 ? "note" : "notes"}`);
    }
    pendingImportRef.current = null;
    setImportRequest(null);
  }, [canvas, currentDocument, showToast, state.notes.length]);

  /* ---------------- pointer coordinate readout ---------------- */

  // Direct DOM text update — cheap, and avoids re-rendering the app per move.
  const handleCoordinateMove = useCallback((world: Point | null) => {
    const element = coordsRef.current;
    if (!element) return;
    element.textContent = world
      ? `X: ${Math.round(world.x)}px, Y: ${Math.round(world.y)}px`
      : "X: —, Y: —";
  }, []);

  /* ---------------- keyboard shortcuts ---------------- */

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const textTarget = isTextEntryTarget(event.target);
      if (event.key === "Escape") {
        if (searchOpen) return setSearchOpen(false);
        if (helpOpen) return setHelpOpen(false);
        if (importRequest) return setImportRequest(null);
        if (clearConfirmOpen) return setClearConfirmOpen(false);
        if (toast) return setToast(null);
        if (textTarget) {
          canvas.startEditing(null);
          (event.target as HTMLElement).blur();
          return;
        }
        if (state.selectedId) canvas.select(null);
        return;
      }
      if (textTarget) return;

      const mod = event.ctrlKey || event.metaKey;
      const key = event.key.toLowerCase();
      if (mod && key === "k") {
        event.preventDefault();
        setSearchOpen((open) => !open);
        return;
      }
      if (mod && key === "z") {
        event.preventDefault();
        canvas.undoDelete();
        return;
      }
      if (mod && key === "d" && state.selectedId) {
        event.preventDefault();
        canvas.duplicateNote(state.selectedId);
        return;
      }
      if (mod && event.key === "0") {
        event.preventDefault();
        fitToNotes();
        return;
      }
      if (mod && (event.key === "+" || event.key === "=")) {
        event.preventDefault();
        zoomByFactor(ZOOM_STEP_IN);
        return;
      }
      if (mod && event.key === "-") {
        event.preventDefault();
        zoomByFactor(1 / ZOOM_STEP_IN);
        return;
      }
      if (mod) return;

      if (event.key === "n" || event.key === "N") {
        event.preventDefault();
        handleCreateNote();
        return;
      }
      if (event.key === "?") {
        event.preventDefault();
        setHelpOpen(true);
        return;
      }
      if ((event.key === "Delete" || event.key === "Backspace") && state.selectedId) {
        event.preventDefault();
        handleDeleteNote(state.selectedId);
        return;
      }
      if (event.key.startsWith("Arrow") && state.selectedId) {
        event.preventDefault();
        const step = event.shiftKey ? 1 : 10;
        const note = state.notes.find((candidate) => candidate.id === state.selectedId);
        if (note) {
          const deltas: Record<string, Point> = {
            ArrowLeft: { x: -step, y: 0 },
            ArrowRight: { x: step, y: 0 },
            ArrowUp: { x: 0, y: -step },
            ArrowDown: { x: 0, y: step },
          };
          const delta = deltas[event.key];
          if (delta) canvas.updateNote(note.id, { x: note.x + delta.x, y: note.y + delta.y });
        }
        return;
      }
      if (event.code === "Space") {
        event.preventDefault();
        if (!event.repeat) setSpacePan(true);
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code === "Space") setSpacePan(false);
    };
    const onBlur = () => setSpacePan(false);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, [
    canvas,
    clearConfirmOpen,
    fitToNotes,
    handleCreateNote,
    handleDeleteNote,
    helpOpen,
    importRequest,
    searchOpen,
    state.notes,
    state.selectedId,
    toast,
    zoomByFactor,
  ]);

  /* ---------------- storage banner ---------------- */

  const saveFailed = state.hydrated && state.saveStatus === "error";
  const bannerMessage =
    state.storageNotice ??
    (saveFailed ? "Changes aren’t being saved — browser storage is unavailable or full." : null);
  const showBanner = bannerMessage !== null && bannerMessage !== dismissedNotice;

  return (
    <main className="fixed inset-0 overflow-hidden bg-background">
      <CanvasSurface
        viewport={state.viewport}
        notes={state.notes}
        selectedId={state.selectedId}
        editingId={state.editingId}
        panMode={panMode}
        spacePan={spacePan}
        containerRef={containerRef}
        onPanBy={canvas.panBy}
        onZoomAt={canvas.zoomAt}
        onSetViewport={canvas.setViewport}
        onSelect={canvas.select}
        onStopEditing={() => canvas.startEditing(null)}
        onCoordinateMove={handleCoordinateMove}
        onNoteSelect={canvas.select}
        onNoteStartEditing={canvas.startEditing}
        onNoteChange={canvas.updateNote}
        onNoteDelete={handleDeleteNote}
        onNoteDuplicate={canvas.duplicateNote}
        onNoteSetColor={canvas.setColor}
      />

      {state.hydrated && state.notes.length === 0 ? (
        <EmptyHint onCreateNote={handleCreateNote} />
      ) : null}

      <TopLeftBrand
        saveStatus={state.saveStatus}
        hydrated={state.hydrated}
        onExport={handleExport}
        onImport={() => fileInputRef.current?.click()}
        onClear={() => setClearConfirmOpen(true)}
      />
      <TopCenterHint noteCount={state.notes.length} />
      <TopRightControls
        onSearch={() => setSearchOpen((open) => !open)}
        onFit={fitToNotes}
        onTile={handleTile}
        onHelp={() => setHelpOpen(true)}
      />

      <BottomToolbar
        nextColorIndex={state.colorIndex}
        zoom={state.viewport.zoom}
        panMode={panMode}
        onCreateNote={handleCreateNote}
        onCycleNextColor={handleCycleNextColor}
        onZoomIn={() => zoomByFactor(ZOOM_STEP_IN)}
        onZoomOut={() => zoomByFactor(1 / ZOOM_STEP_IN)}
        onZoomReset={() => {
          const { width, height } = containerSize();
          canvas.zoomAt({ x: width / 2, y: height / 2 }, 1);
        }}
        onTogglePanMode={() => setPanMode((mode) => !mode)}
      />
      <BottomStatus coordsRef={coordsRef} onFit={fitToNotes} />

      {showBanner && bannerMessage ? (
        <div
          role="alert"
          className="floating-panel fixed bottom-4 left-4 z-30 flex max-w-sm items-start gap-2.5 border-amber-200 bg-amber-50 p-3.5"
        >
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
          <p className="text-sm leading-relaxed text-amber-900">{bannerMessage}</p>
          <button
            type="button"
            aria-label="Dismiss warning"
            onClick={() => setDismissedNotice(bannerMessage)}
            className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-amber-700 hover:bg-amber-100 focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:outline-none"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      ) : null}

      {searchOpen ? (
        <SearchOverlay
          query={searchQuery}
          matches={searchMatches}
          onQueryChange={setSearchQuery}
          onGoToNote={goToNote}
          onClose={() => setSearchOpen(false)}
        />
      ) : null}
      {helpOpen ? <HelpDialog onClose={() => setHelpOpen(false)} /> : null}
      {importRequest ? (
        <ImportDialog
          request={importRequest}
          currentCount={state.notes.length}
          onReplace={handleImportReplace}
          onMerge={handleImportMerge}
          onClose={() => {
            pendingImportRef.current = null;
            setImportRequest(null);
          }}
        />
      ) : null}
      {clearConfirmOpen ? (
        <ClearConfirmDialog
          noteCount={state.notes.length}
          onClear={() => {
            canvas.clearCanvas();
            setClearConfirmOpen(false);
            showToast("Canvas cleared");
          }}
          onClose={() => setClearConfirmOpen(false)}
        />
      ) : null}
      {toast ? (
        <Toast
          message={toast.message}
          action={toast.action}
          onDismiss={() => setToast(null)}
        />
      ) : null}

      {/* Hidden file input for JSON backup import */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) void handleImportFile(file);
        }}
      />
    </main>
  );
}
