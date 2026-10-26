"use client";

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";
import { MAX_ZOOM, MIN_ZOOM, screenToWorld } from "@/lib/canvas/viewport";
import type { Note, NoteColor, Point, Viewport } from "@/lib/types";
import { StickyNote } from "@/components/notes/sticky-note";

const DOT_GRID_PX = 24;

export interface CanvasSurfaceProps {
  viewport: Viewport;
  notes: Note[];
  selectedId: string | null;
  editingId: string | null;
  panMode: boolean;
  spacePan: boolean;
  /** Shared with the parent so fit-to-content/tile/create can measure the canvas. */
  containerRef: RefObject<HTMLDivElement | null>;
  onPanBy: (dx: number, dy: number) => void;
  onZoomAt: (focal: Point, nextZoom: number) => void;
  onSetViewport: (viewport: Viewport) => void;
  onSelect: (id: string | null) => void;
  onStopEditing: () => void;
  onCoordinateMove: (world: Point | null) => void;
  onNoteSelect: (id: string) => void;
  onNoteStartEditing: (id: string) => void;
  onNoteChange: (id: string, patch: Partial<Omit<Note, "id">>) => void;
  onNoteDelete: (id: string) => void;
  onNoteDuplicate: (id: string) => void;
  onNoteSetColor: (id: string, color: NoteColor) => void;
}

type InteractionMode = "none" | "pan" | "pinch";

interface InteractionState {
  mode: InteractionMode;
  panPointer: number | null;
  panLast: Point;
  pinch: {
    pointers: [number, number];
    startDistance: number;
    startZoom: number;
    startPan: Point;
    startMid: Point;
  } | null;
}

function initialInteraction(): InteractionState {
  return { mode: "none", panPointer: null, panLast: { x: 0, y: 0 }, pinch: null };
}

/** The canvas background: pan, zoom, pinch, and the transformed notes layer. */
export function CanvasSurface({
  viewport,
  notes,
  selectedId,
  editingId,
  panMode,
  spacePan,
  containerRef,
  onPanBy,
  onZoomAt,
  onSetViewport,
  onSelect,
  onStopEditing,
  onCoordinateMove,
  onNoteSelect,
  onNoteStartEditing,
  onNoteChange,
  onNoteDelete,
  onNoteDuplicate,
  onNoteSetColor,
}: CanvasSurfaceProps) {
  const layerRef = useRef<HTMLDivElement>(null);
  const rectRef = useRef<DOMRect | null>(null);
  const interactionRef = useRef<InteractionState>(initialInteraction());
  const activePointersRef = useRef(new Map<number, Point>());
  const [isPanning, setIsPanning] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const update = () => {
      rectRef.current = container.getBoundingClientRect();
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(container);
    return () => observer.disconnect();
  }, [containerRef]);

  // Wheel must be a non-passive native listener so preventDefault is allowed.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = rectRef.current;
      if (!rect) return;
      const focal = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
      // Trackpad pinch arrives as ctrl+wheel with fine deltas; a plain wheel
      // is the app's documented zoom gesture.
      const sensitivity = event.ctrlKey || event.metaKey ? 0.01 : 0.0015;
      const factor = Math.exp(-event.deltaY * sensitivity);
      onZoomAt(focal, viewport.zoom * factor);
    };
    container.addEventListener("wheel", onWheel, { passive: false });
    return () => container.removeEventListener("wheel", onWheel);
  }, [containerRef, onZoomAt, viewport.zoom]);

  const isBackgroundTarget = (target: EventTarget | null): boolean =>
    target === containerRef.current || target === layerRef.current;

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rect = rectRef.current;
    if (!rect) return;
    activePointersRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });
    const state = interactionRef.current;

    if (isBackgroundTarget(event.target)) {
      // Two pointers on the background engage pinch zoom + pan, regardless of mode.
      if (activePointersRef.current.size === 2) {
        const [first, second] = [...activePointersRef.current.entries()];
        const a = { x: first[1].x, y: first[1].y };
        const b = { x: second[1].x, y: second[1].y };
        const distance = Math.hypot(a.x - b.x, a.y - b.y);
        if (distance > 0) {
          try {
            event.currentTarget.setPointerCapture(event.pointerId);
          } catch {
            // Stale pointer id — pinch still tracks while fingers are over the canvas.
          }
          state.mode = "pinch";
          state.panPointer = null;
          setIsPanning(false);
          state.pinch = {
            pointers: [first[0], second[0]],
            startDistance: distance,
            startZoom: viewport.zoom,
            startPan: {
              x: viewport.panX,
              y: viewport.panY,
            },
            startMid: {
              x: (a.x + b.x) / 2 - rect.left,
              y: (a.y + b.y) / 2 - rect.top,
            },
          };
          return;
        }
      }

      const wantPan = panMode || spacePan || event.button === 1;
      if (wantPan) {
        event.preventDefault();
        state.mode = "pan";
        state.panPointer = event.pointerId;
        state.panLast = { x: event.clientX, y: event.clientY };
        setIsPanning(true);
        try {
          event.currentTarget.setPointerCapture(event.pointerId);
        } catch {
          // Stale pointer id — panning still tracks while over the canvas.
        }
        return;
      }

      // Plain click on empty canvas: drop selection and exit editing.
      onSelect(null);
      onStopEditing();
    }
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rect = rectRef.current;
    const state = interactionRef.current;

    if (activePointersRef.current.has(event.pointerId)) {
      activePointersRef.current.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
      });
    }

    if (state.mode === "pinch" && state.pinch) {
      const { pointers, startDistance, startZoom, startPan, startMid } = state.pinch;
      const a = activePointersRef.current.get(pointers[0]);
      const b = activePointersRef.current.get(pointers[1]);
      if (!a || !b || !rect || startDistance <= 0) return;
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      const currentMid = {
        x: (a.x + b.x) / 2 - rect.left,
        y: (a.y + b.y) / 2 - rect.top,
      };
      const zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, startZoom * (distance / startDistance)));
      // Keep the world point that sat under the starting midpoint fixed and
      // follow the midpoint so two-finger drags pan the canvas.
      const world = {
        x: (startMid.x - startPan.x) / startZoom,
        y: (startMid.y - startPan.y) / startZoom,
      };
      onSetViewport({
        zoom,
        panX: currentMid.x - world.x * zoom,
        panY: currentMid.y - world.y * zoom,
      });
      return;
    }

    if (state.mode === "pan" && state.panPointer === event.pointerId) {
      const dx = event.clientX - state.panLast.x;
      const dy = event.clientY - state.panLast.y;
      state.panLast = { x: event.clientX, y: event.clientY };
      onPanBy(dx, dy);
      return;
    }

    // Live coordinate readout (world units under the pointer).
    if (rect) {
      onCoordinateMove(
        screenToWorld(
          { x: event.clientX, y: event.clientY },
          viewport,
          rect,
        ),
      );
    }
  };

  const endPointer = (event: ReactPointerEvent<HTMLDivElement>) => {
    activePointersRef.current.delete(event.pointerId);
    const state = interactionRef.current;
    if (state.mode === "pinch" && state.pinch) {
      const { pointers } = state.pinch;
      if (event.pointerId === pointers[0] || event.pointerId === pointers[1]) {
        state.mode = "none";
        state.pinch = null;
      }
    }
    if (state.mode === "pan" && state.panPointer === event.pointerId) {
      state.mode = "none";
      state.panPointer = null;
      setIsPanning(false);
    }
  };

  const panningCursor = isPanning ? "cursor-grabbing" : panMode || spacePan ? "cursor-grab" : "";

  return (
    <div
      ref={containerRef}
      className={`canvas-dots fixed inset-0 overflow-hidden ${panningCursor}`}
      style={{
        backgroundSize: `${DOT_GRID_PX * viewport.zoom}px ${DOT_GRID_PX * viewport.zoom}px`,
        backgroundPosition: `${viewport.panX}px ${viewport.panY}px`,
        touchAction: "none",
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endPointer}
      onPointerCancel={endPointer}
      onPointerLeave={() => onCoordinateMove(null)}
    >
      <div
        ref={layerRef}
        className="absolute top-0 left-0 will-change-transform"
        style={{
          transform: `translate3d(${viewport.panX}px, ${viewport.panY}px, 0) scale(${viewport.zoom})`,
          transformOrigin: "0 0",
        }}
      >
        {notes.map((note) => (
          <StickyNote
            key={note.id}
            note={note}
            zoom={viewport.zoom}
            selected={selectedId === note.id}
            editing={editingId === note.id}
            onSelect={onNoteSelect}
            onStartEditing={onNoteStartEditing}
            onChange={onNoteChange}
            onDelete={onNoteDelete}
            onDuplicate={onNoteDuplicate}
            onSetColor={onNoteSetColor}
          />
        ))}
      </div>
    </div>
  );
}
