import { rectsOverlap } from "@/lib/canvas/viewport";
import type { Note, Point, Rect } from "@/lib/types";

/** Snap a world coordinate to the placement grid to keep positions tidy. */
export const PLACEMENT_GRID = 12;
/** Minimum world-space spacing between placement candidates. */
const MIN_SPIRAL_STEP = 48;
/** Maximum spiral candidates examined before giving up and overlapping. */
const MAX_CANDIDATES = 64;

export function snapToGrid(value: number, grid = PLACEMENT_GRID): number {
  return Math.round(value / grid) * grid;
}

export function noteRect(note: Note): Rect {
  return { x: note.x, y: note.y, width: note.width, height: note.height };
}

/**
 * Yield offsets on an expanding square spiral, starting at the origin.
 * Deterministic, bounded work per call — no unbounded scans.
 */
function* spiral(step: number): Generator<Point> {
  yield { x: 0, y: 0 };
  let ring = 1;
  while (true) {
    for (let i = 0; i < ring * 2; i++) {
      yield { x: -ring * step + i * step, y: -ring * step };
    }
    for (let i = 1; i <= ring * 2; i++) {
      yield { x: ring * step, y: -ring * step + i * step };
    }
    for (let i = 1; i <= ring * 2; i++) {
      yield { x: ring * step - i * step, y: ring * step };
    }
    for (let i = 1; i < ring * 2; i++) {
      yield { x: -ring * step, y: ring * step - i * step };
    }
    ring++;
  }
}

/**
 * Find a placement near `desired` that does not overlap existing notes.
 * Walks a bounded spiral of candidates; if all of them collide (a crowded
 * area), returns the desired position anyway — intentional overlap is allowed.
 */
export function findPlacement(
  existing: Note[],
  desired: Point,
  size: { width: number; height: number },
): Point {
  // Scale the spiral step to the note so a note-sized hop can clear a
  // neighbouring note within a few rings instead of dozens.
  const step = Math.max(MIN_SPIRAL_STEP, Math.round(Math.min(size.width, size.height) / 2));
  const candidate: Rect = { x: 0, y: 0, width: size.width, height: size.height };
  let checked = 0;
  for (const offset of spiral(step)) {
    if (checked >= MAX_CANDIDATES) break;
    checked++;
    candidate.x = desired.x + offset.x;
    candidate.y = desired.y + offset.y;
    if (!existing.some((note) => rectsOverlap(candidate, noteRect(note)))) {
      return { x: candidate.x, y: candidate.y };
    }
  }
  return desired;
}
