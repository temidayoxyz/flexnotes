import { describe, expect, it } from "vitest";
import {
  DEFAULT_DOCUMENT,
  normalizeDocument,
  normalizeNote,
} from "@/lib/storage/schema";

describe("normalizeDocument", () => {
  it("accepts a valid document", () => {
    const doc = normalizeDocument({
      version: 1,
      notes: [
        { id: "a", text: "hello", color: "mint", x: 10, y: -20, width: 300, height: 200, order: 1 },
      ],
      viewport: { panX: 5, panY: -5, zoom: 1.25 },
      colorIndex: 3,
    });
    expect(doc).not.toBeNull();
    expect(doc?.notes).toHaveLength(1);
    expect(doc?.notes[0]).toMatchObject({ id: "a", color: "mint", x: 10 });
    expect(doc?.viewport).toEqual({ panX: 5, panY: -5, zoom: 1.25 });
    expect(doc?.colorIndex).toBe(3);
  });

  it("rejects non-objects and unknown versions", () => {
    expect(normalizeDocument(null)).toBeNull();
    expect(normalizeDocument("nope")).toBeNull();
    expect(normalizeDocument({ version: 2, notes: [] })).toBeNull();
    expect(normalizeDocument({ notes: [] })).toBeNull();
    expect(normalizeDocument({ version: 1, notes: "nope" })).toBeNull();
  });

  it("repairs invalid note fields without dropping the note", () => {
    const doc = normalizeDocument({
      version: 1,
      notes: [
        { id: "a", text: 42, color: "neon", x: "bad", y: Number.NaN, width: 10, height: 99999 },
      ],
      viewport: { zoom: 42 },
      colorIndex: -5,
    });
    expect(doc).not.toBeNull();
    expect(doc?.notes[0]).toMatchObject({
      id: "a",
      text: "",
      color: "yellow",
      x: 0,
      y: 0,
      width: 140,
      height: 1200,
    });
    expect(doc?.viewport.zoom).toBe(3);
    expect(doc?.colorIndex).toBe(0);
  });

  it("drops notes without usable ids and de-duplicates ids", () => {
    const doc = normalizeDocument({
      version: 1,
      notes: [
        { text: "no id" },
        { id: "dup", text: "first" },
        { id: "dup", text: "second" },
      ],
    });
    expect(doc?.notes).toHaveLength(1);
    expect(doc?.notes[0].text).toBe("first");
  });

  it("returns defaults for an empty-but-valid document", () => {
    expect(normalizeDocument({ version: 1, notes: [] })).toEqual({
      ...DEFAULT_DOCUMENT,
      notes: [],
    });
  });
});

describe("normalizeNote", () => {
  it("returns null for unusable entries", () => {
    expect(normalizeNote(null)).toBeNull();
    expect(normalizeNote(42)).toBeNull();
    expect(normalizeNote({ text: "no id" })).toBeNull();
  });
});
