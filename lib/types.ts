/** Sticky note colours, keyed to the CSS palette in globals.css. */
export type NoteColor =
  | "yellow"
  | "mint"
  | "lavender"
  | "peach"
  | "sky"
  | "pink"
  | "green";

/** A sticky note in world (canvas) coordinates. Independent of screen position. */
export interface Note {
  id: string;
  text: string;
  color: NoteColor;
  x: number;
  y: number;
  width: number;
  height: number;
  /** Stacking order; higher values render on top. */
  order: number;
}

/** Pan offsets are in screen pixels; zoom is unitless (1 = 100%). */
export interface Viewport {
  panX: number;
  panY: number;
  zoom: number;
}

/** The full persisted document (schema version 1). */
export interface CanvasDocument {
  version: 1;
  notes: Note[];
  viewport: Viewport;
  /** Index into NOTE_COLORS for the next note's colour; advances on each create. */
  colorIndex: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}
