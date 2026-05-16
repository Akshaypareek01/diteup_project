"use client";

import { useId, type InputHTMLAttributes } from "react";

export type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
};

/**
 * 20×20 checkbox target — DESIGN-SYSTEM §7.4.
 */
export function Checkbox({ label, id, className, ...props }: CheckboxProps) {
  const uid = useId();
  const cid = id ?? uid;
  return (
    <label className={`flex cursor-pointer items-start gap-3 ${className ?? ""}`}>
      <input
        id={cid}
        type="checkbox"
        className="mt-0.5 size-5 shrink-0 rounded border-line text-forest focus:ring-2 focus:ring-gold"
        {...props}
      />
      <span className="text-body-sm text-ink">{label}</span>
    </label>
  );
}
