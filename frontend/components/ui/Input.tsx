"use client";

import { cn } from "@/lib/utils";
import { useId, type InputHTMLAttributes } from "react";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  hint?: string;
};

/**
 * Labelled text field — DESIGN-SYSTEM §7.2 (height 48px mobile-safe).
 */
export function Input({ label, error, hint, id, className, ...props }: InputProps) {
  const uid = useId();
  const inputId = id ?? uid;
  return (
    <div className="w-full">
      <label
        htmlFor={inputId}
        className="mb-1.5 block font-mono text-eyebrow font-semibold uppercase text-ink-muted"
      >
        {label}
      </label>
      <input
        id={inputId}
        className={cn(
          "h-12 w-full rounded-sm border bg-paper px-3 text-body text-ink outline-none transition",
          "border-line focus:border-forest focus:shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]",
          error ? "border-error" : "",
          className,
        )}
        aria-invalid={error ? true : undefined}
        aria-describedby={
          error ? `${inputId}-err` : hint ? `${inputId}-hint` : undefined
        }
        {...props}
      />
      {hint && !error ? (
        <p id={`${inputId}-hint`} className="mt-1 text-body-sm text-ink-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${inputId}-err`} className="mt-1 text-body-sm text-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
