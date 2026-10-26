"use client";

import { Hand, Minus, Plus } from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";
import {
  NOTE_COLOR_LABELS,
  NOTE_COLOR_VALUES,
  colorForIndex,
} from "@/lib/notes/colors";

interface BottomToolbarProps {
  nextColorIndex: number;
  zoom: number;
  panMode: boolean;
  onCreateNote: () => void;
  onCycleNextColor: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onTogglePanMode: () => void;
}

const SEPARATOR = <div aria-hidden="true" className="mx-1 h-6 w-px bg-neutral-200" />;

/** Floating bottom-centre toolbar: new note, next colour, zoom, pan mode. */
export function BottomToolbar({
  nextColorIndex,
  zoom,
  panMode,
  onCreateNote,
  onCycleNextColor,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onTogglePanMode,
}: BottomToolbarProps) {
  const nextColor = colorForIndex(nextColorIndex);
  const zoomPercent = Math.round(zoom * 100);

  return (
    <div
      className="floating-panel fixed bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 p-1.5"
      style={{ marginBottom: "env(safe-area-inset-bottom, 0px)" }}
      role="toolbar"
      aria-label="Canvas toolbar"
    >
      <button
        type="button"
        onClick={onCreateNote}
        className="flex items-center gap-1.5 rounded-xl bg-neutral-900 px-3 py-2 text-sm font-medium whitespace-nowrap text-white hover:bg-neutral-800 focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:outline-none motion-safe:transition-colors sm:gap-2 sm:px-3.5"
      >
        <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>New note</span>
        <span className="ml-0.5 hidden rounded-md bg-white/15 px-1.5 py-0.5 text-[10px] font-semibold text-white/80 sm:inline">
          N
        </span>
      </button>

      {SEPARATOR}

      <button
        type="button"
        onClick={onCycleNextColor}
        aria-label={`Next note colour: ${NOTE_COLOR_LABELS[nextColor]}. Click to change.`}
        title={`Next note colour: ${NOTE_COLOR_LABELS[nextColor]}`}
        className="flex flex-col items-center gap-0.5 rounded-xl px-2.5 py-1.5 hover:bg-neutral-100 focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:outline-none"
      >
        <span className="text-[9px] font-semibold tracking-widest text-neutral-400 uppercase">
          Next
        </span>
        <span
          className="h-4 w-4 rounded-full ring-1 ring-neutral-900/10"
          style={{ backgroundColor: NOTE_COLOR_VALUES[nextColor] }}
          aria-hidden="true"
        />
      </button>

      {SEPARATOR}

      <IconButton icon={Minus} label="Zoom out (Ctrl+−)" onClick={onZoomOut} />
      <button
        type="button"
        onClick={onZoomReset}
        title="Reset zoom to 100%"
        aria-label={`Zoom ${zoomPercent} percent. Click to reset.`}
        className="w-14 rounded-lg py-1.5 text-center text-sm font-medium text-neutral-700 tabular-nums hover:bg-neutral-100 focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:outline-none"
      >
        {zoomPercent}%
      </button>
      <IconButton icon={Plus} label="Zoom in (Ctrl++)" onClick={onZoomIn} />

      {SEPARATOR}

      <IconButton
        icon={Hand}
        label="Pan tool (drag canvas to pan)"
        active={panMode}
        onClick={onTogglePanMode}
      />
    </div>
  );
}
