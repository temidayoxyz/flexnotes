import type { ButtonHTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  label: string;
  active?: boolean;
}

/** Accessible icon-only button with a consistent hover/focus treatment. */
export function IconButton({
  icon: Icon,
  label,
  active = false,
  className = "",
  type,
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type ?? "button"}
      aria-label={label}
      title={label}
      aria-pressed={active || undefined}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-xl outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent/70 ${
        active
          ? "bg-neutral-900 text-white hover:bg-neutral-800"
          : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
      } motion-safe:transition-colors ${className}`}
      {...rest}
    >
      <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
    </button>
  );
}
