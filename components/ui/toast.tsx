"use client";

import { useEffect, useRef } from "react";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastProps {
  message: string;
  action?: ToastAction;
  onDismiss: () => void;
  durationMs?: number;
}

/** Single transient toast with an optional action (e.g. Undo). */
export function Toast({ message, action, onDismiss, durationMs = 6000 }: ToastProps) {
  const dismissRef = useRef(onDismiss);

  useEffect(() => {
    dismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    const timer = setTimeout(() => dismissRef.current(), durationMs);
    return () => clearTimeout(timer);
  }, [message, durationMs]);

  return (
    <div
      role="status"
      className="pointer-events-auto fixed bottom-24 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full bg-neutral-900 py-2 pr-2 pl-5 text-sm text-white shadow-lg"
    >
      <span>{message}</span>
      {action ? (
        <button
          type="button"
          onClick={action.onClick}
          className="rounded-full bg-white/15 px-3 py-1 text-sm font-medium text-white hover:bg-white/25 focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:outline-none"
        >
          {action.label}
        </button>
      ) : null}
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={onDismiss}
        className="flex h-7 w-7 items-center justify-center rounded-full text-white/70 hover:text-white focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:outline-none"
      >
        ×
      </button>
    </div>
  );
}
