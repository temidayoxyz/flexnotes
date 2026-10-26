"use client";

import { useEffect, useRef, type ReactNode, type RefObject } from "react";

interface PopoverMenuProps {
  /** Ref of the element (usually a button) the menu is anchored to. */
  anchorRef: RefObject<HTMLElement | null>;
  onClose: () => void;
  children: ReactNode;
  align?: "left" | "right";
}

/**
 * Small popover menu anchored under a trigger element. Closes on outside
 * pointer-down and Escape; focus stays with the trigger for simplicity.
 * Render the menu conditionally (only while open) from the parent.
 */
export function PopoverMenu({
  anchorRef,
  onClose,
  children,
  align = "left",
}: PopoverMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const menu = menuRef.current;
      if (!menu) return;
      const target = event.target as Node;
      if (!menu.contains(target) && !anchorRef.current?.contains(target)) onClose();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        anchorRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown, true);
    };
  }, [anchorRef, onClose]);

  return (
    <div
      ref={menuRef}
      role="menu"
      className={`floating-panel absolute top-full z-30 mt-2 min-w-[220px] p-1.5 ${
        align === "right" ? "right-0" : "left-0"
      }`}
    >
      {children}
    </div>
  );
}

interface MenuItemProps {
  icon?: ReactNode;
  label: string;
  hint?: string;
  danger?: boolean;
  onSelect: () => void;
}

export function MenuItem({ icon, label, hint, danger = false, onSelect }: MenuItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onSelect}
      className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent/70 ${
        danger
          ? "text-red-600 hover:bg-red-50"
          : "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900"
      }`}
    >
      {icon ? <span className="shrink-0 [&>svg]:h-4 [&>svg]:w-4">{icon}</span> : null}
      <span className="flex-1">{label}</span>
      {hint ? <span className="text-xs text-neutral-400">{hint}</span> : null}
    </button>
  );
}
