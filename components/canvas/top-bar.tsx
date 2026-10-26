"use client";

import { useRef, useState } from "react";
import {
  ChevronDown,
  CircleHelp,
  Crosshair,
  Download,
  Eraser,
  LayoutGrid,
  Search,
  Upload,
} from "lucide-react";
import { IconButton } from "@/components/ui/icon-button";
import { MenuItem, PopoverMenu } from "@/components/ui/menu";
import type { SaveStatus } from "@/hooks/use-canvas";

/** Inline brand mark (avoids asset path issues under the Pages base path). */
export function BrandMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect width="64" height="64" rx="15" fill="#4f46e5" />
      <path
        d="M18 14h28a6 6 0 0 1 6 6v22L38 56H18a6 6 0 0 1-6-6V20a6 6 0 0 1 6-6z"
        fill="#ffffff"
      />
      <path d="M52 42H40a6 6 0 0 0-6 6v8z" fill="#c7d2fe" />
    </svg>
  );
}

interface TopLeftBrandProps {
  saveStatus: SaveStatus;
  hydrated: boolean;
  onExport: () => void;
  onImport: () => void;
  onClear: () => void;
}

export function TopLeftBrand({ saveStatus, hydrated, onExport, onImport, onClear }: TopLeftBrandProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  let statusText: string;
  let statusTone = "text-muted";
  if (saveStatus === "error") {
    statusText = "Save failed — storage unavailable";
    statusTone = "text-red-600";
  } else if (hydrated) {
    statusText = "Infinite space • Auto-saved";
  } else {
    statusText = "Infinite space";
  }

  return (
    <div className="fixed top-4 left-4 z-20">
      <div className="floating-panel relative flex items-center gap-3 py-2 pr-2 pl-2.5">
        <BrandMark />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-bold tracking-tight text-neutral-900">
              Flexnotes
            </span>
            <span className="rounded-full border border-accent/40 px-1.5 py-px text-[9px] font-semibold tracking-widest text-accent uppercase">
              Canvas
            </span>
          </div>
          <p className={`truncate text-xs ${statusTone}`}>{statusText}</p>
        </div>
        <button
          ref={buttonRef}
          type="button"
          aria-label="Canvas actions"
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          onClick={() => setMenuOpen((open) => !open)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:outline-none"
        >
          <ChevronDown className="h-4 w-4" aria-hidden="true" />
        </button>
        {menuOpen ? (
          <PopoverMenu anchorRef={buttonRef} onClose={() => setMenuOpen(false)}>
            <MenuItem
              icon={<Download />}
              label="Export backup"
              hint="JSON"
              onSelect={() => {
                setMenuOpen(false);
                onExport();
              }}
            />
            <MenuItem
              icon={<Upload />}
              label="Import backup…"
              hint="JSON"
              onSelect={() => {
                setMenuOpen(false);
                onImport();
              }}
            />
            <div className="mx-1.5 my-1 border-t border-neutral-200" />
            <MenuItem
              icon={<Eraser />}
              label="Clear canvas…"
              danger
              onSelect={() => {
                setMenuOpen(false);
                onClear();
              }}
            />
          </PopoverMenu>
        ) : null}
      </div>
    </div>
  );
}

interface TopCenterHintProps {
  noteCount: number;
}

export function TopCenterHint({ noteCount }: TopCenterHintProps) {
  return (
    <div className="floating-panel pointer-events-none fixed top-4 left-1/2 z-10 hidden -translate-x-1/2 items-center gap-2.5 px-4 py-2 text-[13px] whitespace-nowrap text-neutral-500 md:flex">
      <span>
        <span className="kbd">Space</span> + drag to pan
      </span>
      <span aria-hidden="true" className="text-neutral-300">
        •
      </span>
      <span>
        <span className="kbd">Wheel</span> to zoom
      </span>
      <span aria-hidden="true" className="text-neutral-300">
        •
      </span>
      <span className="font-medium text-neutral-700">
        {noteCount === 1 ? "1 note" : `${noteCount} notes`}
      </span>
    </div>
  );
}

interface TopRightControlsProps {
  onSearch: () => void;
  onFit: () => void;
  onTile: () => void;
  onHelp: () => void;
}

export function TopRightControls({ onSearch, onFit, onTile, onHelp }: TopRightControlsProps) {
  return (
    <div className="floating-panel fixed top-4 right-4 z-20 flex items-center gap-0.5 p-1">
      <IconButton icon={Search} label="Search notes (Ctrl+K)" onClick={onSearch} />
      <IconButton icon={Crosshair} label="Fit all notes" onClick={onFit} />
      <IconButton icon={LayoutGrid} label="Tile view" onClick={onTile} />
      <IconButton icon={CircleHelp} label="Keyboard shortcuts (?)" onClick={onHelp} />
    </div>
  );
}
