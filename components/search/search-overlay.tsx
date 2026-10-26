"use client";

import { useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { NOTE_COLOR_VALUES } from "@/lib/notes/colors";
import type { Note } from "@/lib/types";

export interface SearchMatch {
  note: Note;
  snippet: string;
}

interface SearchOverlayProps {
  query: string;
  matches: SearchMatch[];
  onQueryChange: (query: string) => void;
  onGoToNote: (id: string) => void;
  onClose: () => void;
}

/** Lightweight local search overlay; queries never leave the browser. */
export function SearchOverlay({
  query,
  matches,
  onQueryChange,
  onGoToNote,
  onClose,
}: SearchOverlayProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="fixed inset-0 z-30" onPointerDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search notes"
        className="floating-panel absolute top-16 left-1/2 w-[min(92vw,460px)] -translate-x-1/2 p-2"
        onPointerDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-2 rounded-xl bg-neutral-100 px-3">
          <Search className="h-4 w-4 shrink-0 text-neutral-400" aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && matches.length > 0) {
                onGoToNote(matches[0].note.id);
              }
            }}
            placeholder="Search notes…"
            aria-label="Search notes"
            className="w-full bg-transparent py-2.5 text-sm text-neutral-900 outline-none placeholder:text-neutral-400"
          />
          <button
            type="button"
            aria-label="Close search"
            onClick={onClose}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-200 hover:text-neutral-700 focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:outline-none"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-1 max-h-72 overflow-y-auto" role="listbox" aria-label="Search results">
          {query.trim() === "" ? (
            <p className="px-3 py-3 text-sm text-neutral-400">
              Type to search your notes — everything stays on this device.
            </p>
          ) : matches.length === 0 ? (
            <p className="px-3 py-3 text-sm text-neutral-400">
              No notes match “{query.trim()}”.
            </p>
          ) : (
            matches.map(({ note, snippet }) => (
              <button
                key={note.id}
                type="button"
                role="option"
                aria-selected={false}
                onClick={() => onGoToNote(note.id)}
                className="flex w-full items-start gap-2.5 rounded-xl px-3 py-2.5 text-left hover:bg-neutral-100 focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:outline-none"
              >
                <span
                  aria-hidden="true"
                  className="mt-1 h-3 w-3 shrink-0 rounded-full ring-1 ring-neutral-900/10"
                  style={{ backgroundColor: NOTE_COLOR_VALUES[note.color] }}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-neutral-800">
                    {snippet}
                  </span>
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
