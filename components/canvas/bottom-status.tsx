"use client";

import type { RefObject } from "react";
import { Crosshair } from "lucide-react";

interface BottomStatusProps {
  coordsRef: RefObject<HTMLSpanElement | null>;
  onFit: () => void;
}

/** Bottom-right status: live pointer position in world coordinates + fit action. */
export function BottomStatus({ coordsRef, onFit }: BottomStatusProps) {
  return (
    <div className="floating-panel fixed right-4 bottom-4 z-10 hidden items-center gap-2 px-3.5 py-2 text-xs text-neutral-500 lg:flex">
      <span
        aria-hidden="true"
        className="h-2 w-2 shrink-0 rounded-full bg-emerald-500"
      />
      <span ref={coordsRef} className="tabular-nums">
        X: —, Y: —
      </span>
      <span aria-hidden="true" className="h-4 w-px bg-neutral-200" />
      <button
        type="button"
        onClick={onFit}
        className="rounded-md px-1 py-0.5 font-medium text-accent hover:bg-accent/5 focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:outline-none"
      >
        Fit All Notes
      </button>
      <Crosshair className="hidden" aria-hidden="true" />
    </div>
  );
}
