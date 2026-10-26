"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/dialog";

export type ImportRequest =
  | { kind: "error"; reason: string; fileName: string }
  | { kind: "confirm"; fileName: string; incomingCount: number };

interface ImportDialogProps {
  request: ImportRequest;
  currentCount: number;
  onReplace: () => void;
  onMerge: () => void;
  onClose: () => void;
}

/**
 * Import flow: malformed files show a safe error; valid files offer an
 * explicit replace-or-merge choice. Nothing is destroyed without confirmation.
 */
export function ImportDialog({ request, currentCount, onReplace, onMerge, onClose }: ImportDialogProps) {
  const [replaceArmed, setReplaceArmed] = useState(false);

  if (request.kind === "error") {
    return (
      <Dialog
        title="Couldn’t import that file"
        description={`“${request.fileName}” was rejected.`}
        onClose={onClose}
        footer={
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:outline-none"
          >
            OK
          </button>
        }
      >
        <p className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700">
          {request.reason}
        </p>
        <p className="mt-3 text-xs text-neutral-400">
          Expected a Flexnotes JSON backup (schema version 1), exported from the
          canvas menu.
        </p>
      </Dialog>
    );
  }

  const { incomingCount, fileName } = request;
  const replaceMessage =
    currentCount === 0
      ? "Your canvas is empty, so replacing adds these notes."
      : `This permanently removes your current ${currentCount} ${currentCount === 1 ? "note" : "notes"} from this browser.`;

  return (
    <Dialog
      title={`Import ${incomingCount} ${incomingCount === 1 ? "note" : "notes"}?`}
      description={`From “${fileName}”.`}
      onClose={onClose}
      footer={
        <div className="flex flex-col gap-2 sm:flex-row-reverse">
          <button
            type="button"
            onClick={onMerge}
            className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:outline-none"
          >
            Merge with current
          </button>
          <button
            type="button"
            onClick={() => {
              if (!replaceArmed) {
                setReplaceArmed(true);
                return;
              }
              onReplace();
            }}
            className={`rounded-xl px-4 py-2 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-accent/70 ${
              replaceArmed
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-red-50 text-red-700 hover:bg-red-100"
            }`}
          >
            {replaceArmed ? "Click again to confirm" : "Replace everything…"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 focus-visible:ring-2 focus-visible:ring-accent/70 focus-visible:outline-none sm:mr-auto"
          >
            Cancel
          </button>
        </div>
      }
    >
      <ul className="space-y-2 text-sm text-neutral-600">
        <li className="rounded-xl bg-neutral-50 px-3 py-2.5">
          <strong className="font-medium text-neutral-900">Merge</strong> keeps
          your {currentCount === 1 ? "note" : "notes"} and adds the imported
          ones beside them.
        </li>
        <li className="rounded-xl bg-neutral-50 px-3 py-2.5">
          <strong className="font-medium text-neutral-900">Replace</strong>{" "}
          starts over with only the imported notes. {replaceMessage}
        </li>
      </ul>
      {currentCount > 0 ? (
        <p className="mt-3 text-xs text-neutral-400">
          Tip: export a backup first if you might want your current canvas back.
        </p>
      ) : null}
    </Dialog>
  );
}
