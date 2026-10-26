import type { Note, Point, Rect, Viewport } from "@/lib/types";

export const MIN_ZOOM = 0.25;
export const MAX_ZOOM = 3;
export const DEFAULT_ZOOM = 1;

export const DEFAULT_VIEWPORT: Viewport = { panX: 0, panY: 0, zoom: DEFAULT_ZOOM };

export function clampZoom(zoom: number): number {
  if (!Number.isFinite(zoom)) return DEFAULT_ZOOM;
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
}

/**
 * Convert a screen point (client coordinates) into world coordinates.
 * `rect` is the bounding rect of the canvas container element.
 */
export function screenToWorld(
  screen: Point,
  viewport: Viewport,
  rect: { left: number; top: number },
): Point {
  return {
    x: (screen.x - rect.left - viewport.panX) / viewport.zoom,
    y: (screen.y - rect.top - viewport.panY) / viewport.zoom,
  };
}

/** Convert world coordinates into coordinates relative to the canvas container. */
export function worldToScreen(world: Point, viewport: Viewport): Point {
  return {
    x: world.x * viewport.zoom + viewport.panX,
    y: world.y * viewport.zoom + viewport.panY,
  };
}

/**
 * Zoom while keeping the world point under the screen-space focal point fixed,
 * so the content under the cursor/pointer does not jump.
 * `focal` is relative to the canvas container's top-left corner.
 */
export function zoomAtPoint(
  viewport: Viewport,
  focal: Point,
  nextZoom: number,
): Viewport {
  const zoom = clampZoom(nextZoom);
  const worldX = (focal.x - viewport.panX) / viewport.zoom;
  const worldY = (focal.y - viewport.panY) / viewport.zoom;
  return {
    zoom,
    panX: focal.x - worldX * zoom,
    panY: focal.y - worldY * zoom,
  };
}

/** Bounding rect (world coordinates) that contains every note. */
export function notesBounds(notes: Note[]): Rect | null {
  if (notes.length === 0) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const note of notes) {
    minX = Math.min(minX, note.x);
    minY = Math.min(minY, note.y);
    maxX = Math.max(maxX, note.x + note.width);
    maxY = Math.max(maxY, note.y + note.height);
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

/**
 * Compute a viewport that fits all notes with padding, capped at 100% zoom.
 * With no notes, resets to the default view.
 */
export function fitToContent(
  notes: Note[],
  size: { width: number; height: number },
  padding = 96,
): Viewport {
  const bounds = notesBounds(notes);
  if (!bounds) return DEFAULT_VIEWPORT;

  const availW = Math.max(size.width - padding * 2, 100);
  const availH = Math.max(size.height - padding * 2, 100);
  const zoom = clampZoom(
    Math.min(availW / bounds.width, availH / bounds.height, DEFAULT_ZOOM),
  );
  const centerX = bounds.x + bounds.width / 2;
  const centerY = bounds.y + bounds.height / 2;
  return {
    zoom,
    panX: size.width / 2 - centerX * zoom,
    panY: size.height / 2 - centerY * zoom,
  };
}

/** Do two world rects overlap (strict — touching edges do not count). */
export function rectsOverlap(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.width &&
    b.x < a.x + a.width &&
    a.y < b.y + b.height &&
    b.y < a.y + a.height
  );
}

/** Center of the viewport in world coordinates, given the container rect. */
export function viewportCenter(
  viewport: Viewport,
  size: { width: number; height: number },
): Point {
  return {
    x: (size.width / 2 - viewport.panX) / viewport.zoom,
    y: (size.height / 2 - viewport.panY) / viewport.zoom,
  };
}

/** Viewport that centers a world point at the given zoom (used by search "go to note"). */
export function viewportCenteredOn(
  worldCenter: Point,
  zoom: number,
  size: { width: number; height: number },
): Viewport {
  const safeZoom = clampZoom(zoom);
  return {
    zoom: safeZoom,
    panX: size.width / 2 - worldCenter.x * safeZoom,
    panY: size.height / 2 - worldCenter.y * safeZoom,
  };
}
