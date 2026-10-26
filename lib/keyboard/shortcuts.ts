export interface ShortcutHint {
  keys: string;
  description: string;
}

/** Data for the shortcuts help panel; single source of truth for docs too. */
export const SHORTCUTS: ShortcutHint[] = [
  { keys: "N", description: "New note" },
  { keys: "Space + drag", description: "Pan the canvas" },
  { keys: "Scroll / trackpad", description: "Pan the canvas" },
  { keys: "Ctrl / ⌘ + scroll", description: "Zoom at pointer" },
  { keys: "Ctrl / ⌘ + + / −", description: "Zoom in / out" },
  { keys: "Ctrl / ⌘ + 0", description: "Fit all notes" },
  { keys: "Ctrl / ⌘ + K", description: "Search notes" },
  { keys: "Delete", description: "Delete selected note" },
  { keys: "Ctrl / ⌘ + Z", description: "Undo delete" },
  { keys: "Arrows", description: "Nudge selected note (Shift = 1px)" },
  { keys: "Esc", description: "Stop editing / close panels" },
  { keys: "?", description: "Show this help" },
];

export function isTextEntryTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "TEXTAREA" || tag === "INPUT" || target.isContentEditable;
}
