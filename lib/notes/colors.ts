import type { NoteColor } from "@/lib/types";

/** Palette order used when cycling colours across new notes. */
export const NOTE_COLORS: readonly NoteColor[] = [
  "yellow",
  "mint",
  "lavender",
  "peach",
  "sky",
  "pink",
  "green",
] as const;

export const NOTE_COLOR_VALUES: Record<NoteColor, string> = {
  yellow: "#FFF0A8",
  mint: "#B9F0E5",
  lavender: "#DCCAFF",
  peach: "#FFD5C9",
  sky: "#C9E4FF",
  pink: "#F7CDE2",
  green: "#DDF3D8",
};

export const NOTE_COLOR_LABELS: Record<NoteColor, string> = {
  yellow: "Soft yellow",
  mint: "Mint",
  lavender: "Lavender",
  peach: "Peach",
  sky: "Sky blue",
  pink: "Soft pink",
  green: "Pale green",
};

/** Deterministic colour for palette position `index` (wraps, handles negatives). */
export function colorForIndex(index: number): NoteColor {
  const count = NOTE_COLORS.length;
  const wrapped = ((index % count) + count) % count;
  return NOTE_COLORS[wrapped];
}

export function isValidColor(value: unknown): value is NoteColor {
  return typeof value === "string" && NOTE_COLORS.includes(value as NoteColor);
}
