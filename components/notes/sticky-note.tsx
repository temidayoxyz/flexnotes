"use client";

import {
  memo,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Copy, Trash2 } from "lucide-react";
import {
  MAX_NOTE_SIZE,
  MIN_NOTE_SIZE,
} from "@/lib/storage/schema";
import {
  NOTE_COLOR_LABELS,
  NOTE_COLOR_VALUES,
  NOTE_COLORS,
} from "@/lib/notes/colors";
import { MenuItem, PopoverMenu } from "@/components/ui/menu";
import type { Note, NoteColor, Point } from "@/lib/types";

const DRAG_THRESHOLD_PX = 4;

interface StickyNoteProps {
  note: Note;
  selected: boolean;
  editing: boolean;
  /** Current canvas zoom, used to convert screen deltas into world units. */
  zoom: number;
  onSelect: (id: string) => void;
  onStartEditing: (id: string) => void;
  onChange: (id: string, patch: Partial<Omit<Note, "id">>) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onSetColor: (id: string, color: NoteColor) => void;
}

interface DragState {
  pointerId: number;
  startClient: Point;
  origin: Point;
  dragged: boolean;
}

interface ResizeState {
  pointerId: number;
  startClient: Point;
  startWidth: number;
  startHeight: number;
}

function clampSize(value: number): number {
  return Math.min(MAX_NOTE_SIZE, Math.max(MIN_NOTE_SIZE, value));
}

function StickyNoteImpl({
  note,
  selected,
  editing,
  zoom,
  onSelect,
  onStartEditing,
  onChange,
  onDelete,
  onDuplicate,
  onSetColor,
}: StickyNoteProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<DragState | null>(null);
  const resizeRef = useRef<ResizeState | null>(null);

  // Focus the editor when the note enters editing mode, caret at the end.
  useEffect(() => {
    if (!editing) return;
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.focus({ preventScroll: true });
    const end = textarea.value.length;
    textarea.setSelectionRange(end, end);
  }, [editing]);

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 && event.pointerType === "mouse") return;
    const target = event.target as HTMLElement;
    // Let buttons, the editor and links handle their own pointer events.
    if (target.closest("button, textarea, a, input")) return;
    if (editing) return;

    onSelect(note.id);
    dragRef.current = {
      pointerId: event.pointerId,
      startClient: { x: event.clientX, y: event.clientY },
      origin: { x: note.x, y: note.y },
      dragged: false,
    };
    // Capture so moves outside the note keep dragging it; a stale pointer id
    // must not abort the drag, so degrade to uncaptured tracking instead.
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Pointer is no longer active — dragging still works while it stays over the note.
    }
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dx = event.clientX - drag.startClient.x;
    const dy = event.clientY - drag.startClient.y;
    if (!drag.dragged && Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;

    if (!drag.dragged) {
      drag.dragged = true;
      setDragging(true);
    }
    // Dispatch directly: React batches per event and memoisation keeps the
    // re-render scoped to this note. (An rAF gate would drop updates in
    // environments where animation frames stall, e.g. hidden webviews.)
    onChange(note.id, {
      x: drag.origin.x + dx / zoom,
      y: drag.origin.y + dy / zoom,
    });
  };

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
    if (drag.dragged) {
      setDragging(false);
    } else {
      // A click without movement enters editing mode.
      onStartEditing(note.id);
    }
  };

  const handleResizePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.stopPropagation();
    if (event.button !== 0 && event.pointerType === "mouse") return;
    resizeRef.current = {
      pointerId: event.pointerId,
      startClient: { x: event.clientX, y: event.clientY },
      startWidth: note.width,
      startHeight: note.height,
    };
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Stale pointer id — resize still tracks while over the handle.
    }
  };

  const handleResizePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const resize = resizeRef.current;
    if (!resize || resize.pointerId !== event.pointerId) return;
    const dx = event.clientX - resize.startClient.x;
    const dy = event.clientY - resize.startClient.y;
    // Convert screen deltas to world units via the current zoom factor.
    onChange(note.id, {
      width: clampSize(resize.startWidth + dx / zoom),
      height: clampSize(resize.startHeight + dy / zoom),
    });
  };

  const endResize = (event: ReactPointerEvent<HTMLDivElement>) => {
    const resize = resizeRef.current;
    if (!resize || resize.pointerId !== event.pointerId) return;
    resizeRef.current = null;
  };

  return (
    <div
      ref={rootRef}
      data-note-id={note.id}
      role="group"
      aria-label={note.text.trim() ? `Sticky note: ${note.text.trim().slice(0, 60)}` : "Empty sticky note"}
      className={`group absolute touch-none rounded-xl outline-none select-none ${
        dragging
          ? "z-50 cursor-grabbing shadow-lg ring-2 ring-neutral-900/15"
          : selected
            ? "cursor-grab shadow-md ring-2 ring-neutral-900/15"
            : "cursor-grab shadow-sm ring-1 ring-neutral-900/5 hover:shadow-md"
      } focus-visible:ring-2 focus-visible:ring-accent/70`}
      style={{
        left: note.x,
        top: note.y,
        width: note.width,
        height: note.height,
        zIndex: note.order,
        backgroundColor: NOTE_COLOR_VALUES[note.color],
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      {editing ? (
        <textarea
          ref={textareaRef}
          className="note-editor absolute inset-0 rounded-xl p-3.5 text-[15px] leading-relaxed text-neutral-900"
          value={note.text}
          maxLength={10000}
          spellCheck={false}
          placeholder="Write something…"
          aria-label="Note text"
          onChange={(event) => onChange(note.id, { text: event.target.value })}
        />
      ) : (
        <div className="pointer-events-none absolute inset-0 overflow-hidden p-3.5 text-[15px] leading-relaxed break-words whitespace-pre-wrap text-neutral-900">
          {note.text}
        </div>
      )}

      {/* Contextual actions — appear on hover or when selected */}
      <button
        ref={menuButtonRef}
        type="button"
        aria-label="Note actions"
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((open) => !open)}
        className={`absolute top-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-md bg-black/5 text-neutral-700 opacity-0 outline-none group-hover:opacity-100 hover:bg-black/10 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-accent/70 ${
          selected || menuOpen ? "opacity-100" : ""
        }`}
      >
        <span aria-hidden="true" className="text-sm leading-none font-bold tracking-widest">
          ⋯
        </span>
      </button>

      <div
        aria-hidden="true"
        onPointerDown={handleResizePointerDown}
        onPointerMove={handleResizePointerMove}
        onPointerUp={endResize}
        onPointerCancel={endResize}
        className={`absolute -right-1 -bottom-1 flex h-6 w-6 cursor-nwse-resize items-end justify-end rounded-md p-0.5 opacity-0 outline-none group-hover:opacity-100 focus-visible:opacity-100 ${
          selected ? "opacity-100" : ""
        }`}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" className="text-neutral-700">
          <path d="M9 1L1 9M9 5L5 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>

      {menuOpen ? (
        <PopoverMenu anchorRef={menuButtonRef} onClose={() => setMenuOpen(false)}>
          <div className="flex items-center gap-1 px-1.5 pt-1 pb-2" role="group" aria-label="Note colour">
            {NOTE_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                aria-label={`Colour: ${NOTE_COLOR_LABELS[color]}`}
                aria-pressed={note.color === color}
                title={NOTE_COLOR_LABELS[color]}
                onClick={() => onSetColor(note.id, color)}
                className={`h-5 w-5 rounded-full outline-none transition-transform focus-visible:ring-2 focus-visible:ring-accent/70 motion-safe:transition-transform ${
                  note.color === color
                    ? "ring-2 ring-neutral-700 ring-offset-1"
                    : "ring-1 ring-neutral-900/10 hover:scale-110"
                }`}
                style={{ backgroundColor: NOTE_COLOR_VALUES[color] }}
              />
            ))}
          </div>
          <div className="mx-1.5 border-t border-neutral-200" />
          <div className="pt-1">
            <MenuItem
              icon={<Copy />}
              label="Duplicate"
              hint="⌘D"
              onSelect={() => {
                setMenuOpen(false);
                onDuplicate(note.id);
              }}
            />
            <MenuItem
              icon={<Trash2 />}
              label="Delete"
              hint="Del"
              danger
              onSelect={() => {
                setMenuOpen(false);
                onDelete(note.id);
              }}
            />
          </div>
        </PopoverMenu>
      ) : null}
    </div>
  );
}

/**
 * Re-renders only when this note's data or selection state changes, so
 * panning/zooming (viewport updates) does not re-render every note.
 */
export const StickyNote = memo(StickyNoteImpl);
