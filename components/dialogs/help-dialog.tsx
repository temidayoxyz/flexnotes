"use client";

import { SHORTCUTS } from "@/lib/keyboard/shortcuts";
import { Dialog } from "@/components/ui/dialog";

interface HelpDialogProps {
  onClose: () => void;
}

/** Compact shortcut reference + privacy note. */
export function HelpDialog({ onClose }: HelpDialogProps) {
  return (
    <Dialog
      title="Keyboard shortcuts"
      description="Fast ways to move around the canvas."
      onClose={onClose}
    >
      <ul className="divide-y divide-neutral-100">
        {SHORTCUTS.map((shortcut) => (
          <li key={shortcut.keys} className="flex items-center justify-between gap-4 py-2">
            <span className="text-sm text-neutral-700">{shortcut.description}</span>
            <span className="shrink-0 text-xs text-neutral-500">{shortcut.keys}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 border-t border-neutral-100 pt-3 text-xs leading-relaxed text-neutral-400">
        Notes are stored only in this browser (localStorage) and never leave your
        device. Use <strong>Export backup</strong> in the canvas menu to save a
        JSON copy.
      </p>
    </Dialog>
  );
}
