import { describe, expect, it } from "vitest";
import {
  buildBackup,
  documentForMerge,
  documentForReplace,
  parseBackup,
} from "@/lib/backup/backup";
import type { CanvasDocument } from "@/lib/types";

const current: CanvasDocument = {
  version: 1,
  notes: [
    { id: "mine", text: "mine", color: "yellow", x: 0, y: 0, width: 220, height: 220, order: 1 },
  ],
  viewport: { panX: 10, panY: 20, zoom: 1 },
  colorIndex: 2,
};

const imported: CanvasDocument = {
  version: 1,
  notes: [
    { id: "mine", text: "theirs", color: "mint", x: 5, y: 5, width: 220, height: 220, order: 0 },
    { id: "theirs", text: "other", color: "sky", x: 300, y: 0, width: 220, height: 220, order: 1 },
  ],
  viewport: { panX: 0, panY: 0, zoom: 1 },
  colorIndex: 0,
};

describe("parseBackup", () => {
  it("accepts the wrapped backup format round-trip", () => {
    const json = JSON.stringify(buildBackup(current));
    const result = parseBackup(json);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.document.notes).toHaveLength(1);
      expect(result.document.notes[0].id).toBe("mine");
    }
  });

  it("accepts a bare version-1 document", () => {
    const result = parseBackup(JSON.stringify(current));
    expect(result.ok).toBe(true);
  });

  it("rejects invalid JSON, wrong apps, and unknown schema versions", () => {
    expect(parseBackup("not json").ok).toBe(false);
    expect(parseBackup("42").ok).toBe(false);
    expect(
      parseBackup(JSON.stringify({ app: "other", schema: 1, document: current })).ok,
    ).toBe(false);
    expect(
      parseBackup(JSON.stringify({ app: "flexnotes", schema: 99, document: current })).ok,
    ).toBe(false);
    expect(parseBackup(JSON.stringify({ version: 7, notes: [] })).ok).toBe(false);
  });
});

describe("documentForReplace", () => {
  it("uses the imported document and regenerates colliding ids", () => {
    const replaced = documentForReplace(imported, current);
    expect(replaced.notes).toHaveLength(2);
    expect(replaced.notes.map((note) => note.id)).not.toContain("mine");
    expect(replaced.viewport).toEqual(imported.viewport);
  });
});

describe("documentForMerge", () => {
  it("keeps current notes, regenerates colliding ids, stacks imported on top", () => {
    const merged = documentForMerge(imported, current);
    expect(merged.notes).toHaveLength(3);
    const ids = merged.notes.map((note) => note.id);
    expect(new Set(ids).size).toBe(3);
    expect(merged.viewport).toEqual(current.viewport);
    const maxExisting = Math.max(...current.notes.map((note) => note.order));
    // Imported notes stack above the existing ones.
    const importedOrders = merged.notes
      .filter((note) => note.text !== "mine")
      .map((note) => note.order);
    expect(Math.min(...importedOrders)).toBeGreaterThan(maxExisting);
  });
});
