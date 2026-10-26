"use client";

import { Plus } from "lucide-react";
import { BrandMark } from "@/components/canvas/top-bar";

interface EmptyHintProps {
  onCreateNote: () => void;
}

/** First-use hint shown on an empty canvas; never blocks the workspace. */
export function EmptyHint({ onCreateNote }: EmptyHintProps) {
  return (
    <div className="pointer-events-none fixed inset-0 z-10 flex items-center justify-center p-4">
      <div className="floating-panel pointer-events-auto max-w-sm p-6 text-center">
        <div className="flex justify-center">
          <BrandMark className="h-11 w-11" />
        </div>
        <h2 className="mt-3 text-base font-semibold text-neutral-900">
          Your infinite canvas is empty
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">
          Create a sticky note and start writing. Everything is saved privately
          in this browser — no account needed.
        </p>
        <button
          type="button"
          onClick={onCreateNote}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:outline-none"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          New note
        </button>
        <p className="mt-3 text-xs text-neutral-400">
          or press <span className="kbd">N</span> — drag with{" "}
          <span className="kbd">Space</span> to move around
        </p>
      </div>
    </div>
  );
}
