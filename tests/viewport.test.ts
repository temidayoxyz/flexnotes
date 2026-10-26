import { describe, expect, it } from "vitest";
import {
  DEFAULT_VIEWPORT,
  MAX_ZOOM,
  MIN_ZOOM,
  clampZoom,
  fitToContent,
  notesBounds,
  rectsOverlap,
  screenToWorld,
  viewportCenter,
  viewportCenteredOn,
  worldToScreen,
  zoomAtPoint,
} from "@/lib/canvas/viewport";
import type { Note, Viewport } from "@/lib/types";

function note(overrides: Partial<Note>): Note {
  return {
    id: "n1",
    text: "",
    color: "yellow",
    x: 0,
    y: 0,
    width: 200,
    height: 200,
    order: 0,
    ...overrides,
  };
}

const rect = { left: 100, top: 50 };

describe("screenToWorld / worldToScreen", () => {
  it("round-trips a point through both conversions", () => {
    const viewport: Viewport = { panX: -400, panY: 300, zoom: 1.5 };
    const world = { x: 120, y: -80 };
    const screen = worldToScreen(world, viewport);
    const back = screenToWorld(
      { x: screen.x + rect.left, y: screen.y + rect.top },
      viewport,
      rect,
    );
    expect(back.x).toBeCloseTo(world.x);
    expect(back.y).toBeCloseTo(world.y);
  });

  it("accounts for the container rect and negative world coordinates", () => {
    const viewport: Viewport = { panX: 0, panY: 0, zoom: 1 };
    const world = screenToWorld({ x: 100, y: 50 }, viewport, rect);
    expect(world).toEqual({ x: 0, y: 0 });
  });

  it("scales by zoom", () => {
    const viewport: Viewport = { panX: 0, panY: 0, zoom: 2 };
    const world = screenToWorld({ x: 300, y: 250 }, viewport, rect);
    expect(world).toEqual({ x: 100, y: 100 });
  });
});

describe("zoomAtPoint", () => {
  it("keeps the world point under the focal point fixed", () => {
    const viewport: Viewport = { panX: -120, panY: 60, zoom: 1 };
    const focal = { x: 300, y: 220 };
    const before = screenToWorld(focal, viewport, { left: 0, top: 0 });
    const zoomed = zoomAtPoint(viewport, focal, 2);
    const after = screenToWorld(focal, zoomed, { left: 0, top: 0 });
    expect(after.x).toBeCloseTo(before.x);
    expect(after.y).toBeCloseTo(before.y);
    expect(zoomed.zoom).toBe(2);
  });

  it("clamps zoom to the supported range", () => {
    expect(zoomAtPoint(DEFAULT_VIEWPORT, { x: 0, y: 0 }, 99).zoom).toBe(MAX_ZOOM);
    expect(zoomAtPoint(DEFAULT_VIEWPORT, { x: 0, y: 0 }, 0.001).zoom).toBe(MIN_ZOOM);
  });
});

describe("clampZoom", () => {
  it("clamps non-finite and out-of-range values", () => {
    expect(clampZoom(Number.NaN)).toBe(1);
    expect(clampZoom(10)).toBe(MAX_ZOOM);
    expect(clampZoom(0.5)).toBe(0.5);
  });
});

describe("fitToContent", () => {
  it("resets to the default viewport when there are no notes", () => {
    expect(fitToContent([], { width: 800, height: 600 })).toEqual(DEFAULT_VIEWPORT);
  });

  it("centers the notes with padding and never exceeds 100% zoom", () => {
    const notes = [
      note({ x: 0, y: 0 }),
      note({ id: "n2", x: 500, y: 400 }),
    ];
    const size = { width: 2000, height: 1600 };
    const viewport = fitToContent(notes, size, 100);
    expect(viewport.zoom).toBe(1);
    const center = viewportCenter(viewport, size);
    expect(center.x).toBeCloseTo(350);
    expect(center.y).toBeCloseTo(300);
  });

  it("zooms out for content larger than the viewport", () => {
    // 800x600 fitting 2000x1500 content → 0.4 zoom (above MIN_ZOOM).
    const notes = [note({ x: 0, y: 0, width: 2000, height: 1500 })];
    const viewport = fitToContent(notes, { width: 800, height: 600 }, 0);
    expect(viewport.zoom).toBeCloseTo(0.4);
  });

  it("never zooms out past MIN_ZOOM", () => {
    const notes = [note({ x: 0, y: 0, width: 4000, height: 3000 })];
    const viewport = fitToContent(notes, { width: 800, height: 600 }, 0);
    expect(viewport.zoom).toBe(MIN_ZOOM);
  });
});

describe("notesBounds and rectsOverlap", () => {
  it("computes the bounding box of all notes", () => {
    const bounds = notesBounds([
      note({ x: -100, y: -50, width: 200, height: 100 }),
      note({ id: "n2", x: 300, y: 600, width: 100, height: 100 }),
    ]);
    expect(bounds).toEqual({ x: -100, y: -50, width: 500, height: 750 });
  });

  it("detects overlaps but not edge touches", () => {
    const a = { x: 0, y: 0, width: 100, height: 100 };
    expect(rectsOverlap(a, { x: 50, y: 50, width: 100, height: 100 })).toBe(true);
    expect(rectsOverlap(a, { x: 100, y: 0, width: 100, height: 100 })).toBe(false);
  });
});

describe("viewportCenteredOn", () => {
  it("centers a world point at the given zoom", () => {
    const viewport = viewportCenteredOn({ x: 500, y: -250 }, 1, { width: 800, height: 600 });
    const center = viewportCenter(viewport, { width: 800, height: 600 });
    expect(center.x).toBeCloseTo(500);
    expect(center.y).toBeCloseTo(-250);
  });
});
