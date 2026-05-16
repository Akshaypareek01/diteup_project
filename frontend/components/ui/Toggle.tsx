"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

export type ToggleProps = {
  label: string;
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  disabled?: boolean;
  className?: string;
};

/**
 * 44×24 switch — DESIGN-SYSTEM §7.5.
 */
export function Toggle({
  label,
  checked,
  onCheckedChange,
  disabled,
  className,
}: ToggleProps) {
  const id = useId();
  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      <span className="text-body-sm font-medium text-ink" id={`${id}-label`}>
        {label}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={`${id}-label`}
        disabled={disabled}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          "relative h-7 w-12 shrink-0 rounded-full border border-transparent transition-colors",
          checked ? "bg-forest" : "bg-line",
          disabled && "opacity-50",
        )}
      >
        <span
          className={cn(
            "absolute left-0.5 top-0.5 size-6 rounded-full bg-paper shadow-sm transition-transform duration-200 ease-out",
            checked ? "translate-x-[22px]" : "translate-x-0",
          )}
        />
      </button>
    </div>
  );
}
