/** Generate a stable unique id for a note. */
export function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID (e.g. older browsers).
  return `note-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
