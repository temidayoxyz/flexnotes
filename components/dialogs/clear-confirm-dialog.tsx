"use client";

import { Dialog } from "@/components/ui/dialog";

interface ClearConfirmDialogProps {
  noteCount: number;
  onClear: () => void;
  onClose: () => void;
}

/** Destructive confirmation for removing every note on the canvas. */
export function ClearConfirmDialog({ noteCount, onClear, onClose }: ClearConfirmDialogProps) {
  return (
    <Dialog
      title="Clear the whole canvas?"
      description={`This removes all ${noteCount} ${noteCount === 1 ? "note" : "notes"} from this browser. It can’t be undone.`}
      onClose={onClose}
      footer={
        <div className="flex gap-2 sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:outline-none"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onClear}
            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:outline-none"
          >
            Clear canvas
          </button>
        </div>
      }
    >
      <p className="text-sm text-neutral-600">
        Tip: use <strong>Export backup</strong> first if you might want these
        notes back later.
      </p>
    </Dialog>
  );
}
