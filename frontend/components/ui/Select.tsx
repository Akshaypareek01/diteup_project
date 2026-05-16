"use client";

import { useId, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
};

/**
 * Native select skinned to design tokens — Radix replacement can drop in later.
 */
export function Select({ label, id, className, children, ...props }: SelectProps) {
  const uid = useId();
  const selectId = id ?? uid;
  return (
    <div className="w-full">
      <label
        htmlFor={selectId}
        className="mb-1.5 block font-mono text-eyebrow font-semibold uppercase text-ink-muted"
      >
        {label}
      </label>
      <select
        id={selectId}
        className={cn(
          "h-12 w-full rounded-sm border border-line bg-paper px-3 text-body text-ink outline-none focus:border-forest",
          className,
        )}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}
