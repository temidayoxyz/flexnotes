import { describe, expect, it } from "vitest";
import { findPlacement, snapToGrid } from "@/lib/canvas/placement";
import type { Note } from "@/lib/types";

function note(overrides: Partial<Note>): Note {
  return {
    id: "n1",
    text: "",
    color: "yellow",
    x: 0,
    y: 0,
    width: 220,
    height: 220,
    order: 0,
    ...overrides,
  };
}

describe("snapToGrid", () => {
  it("snaps to the placement grid", () => {
    expect(snapToGrid(25, 12)).toBe(24);
    expect(snapToGrid(-25, 12)).toBe(-24);
  });
});

describe("findPlacement", () => {
  it("returns the desired position when the canvas is empty", () => {
    const desired = { x: 100, y: 100 };
    expect(findPlacement([], desired, { width: 220, height: 220 })).toEqual(desired);
  });

  it("avoids an existing note by shifting nearby", () => {
    const existing = [note({ x: 0, y: 0 })];
    const desired = { x: 0, y: 0 };
    const placed = findPlacement(existing, desired, { width: 220, height: 220 });
    const placedRect = { x: placed.x, y: placed.y, width: 220, height: 220 };
    const existingRect = { x: 0, y: 0, width: 220, height: 220 };
    // The chosen spot must not overlap the existing note.
    const overlaps =
      placedRect.x < existingRect.x + existingRect.width &&
      existingRect.x < placedRect.x + placedRect.width &&
      placedRect.y < existingRect.y + existingRect.height &&
      existingRect.y < placedRect.y + placedRect.height;
    expect(overlaps).toBe(false);
  });

  it("is deterministic for the same input", () => {
    const existing = [note({ x: 0, y: 0 }), note({ id: "n2", x: 96, y: 96 })];
    const a = findPlacement(existing, { x: 48, y: 48 }, { width: 220, height: 220 });
    const b = findPlacement(existing, { x: 48, y: 48 }, { width: 220, height: 220 });
    expect(a).toEqual(b);
  });

  it("falls back to the desired position in a fully crowded neighbourhood", () => {
    // A wall of notes surrounding the desired position within the search radius.
    const existing: Note[] = [];
    for (let row = -4; row <= 4; row++) {
      for (let col = -4; col <= 4; col++) {
        existing.push(
          note({
            id: `n${row}-${col}`,
            x: col * 48 - 110,
            y: row * 48 - 110,
            width: 460,
            height: 460,
          }),
        );
      }
    }
    const desired = { x: 0, y: 0 };
    expect(findPlacement(existing, desired, { width: 220, height: 220 })).toEqual(desired);
  });
});
