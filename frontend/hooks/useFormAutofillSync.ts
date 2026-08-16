"use client";

import { useEffect, useRef, type RefObject } from "react";

export type AutofillFieldBinding = {
  value: string;
  set: (next: string) => void;
  sanitize?: (raw: string) => string;
  skip?: boolean;
};

/**
 * Pushes browser-autofilled DOM values into React state.
 * Chrome often fills inputs without firing React `onChange`, so PIN/address
 * stay empty until the shopper retypes them.
 */
export function useFormAutofillSync(
  formRef: RefObject<HTMLFormElement | null>,
  fields: Record<string, AutofillFieldBinding>,
): void {
  const fieldsRef = useRef(fields);
  fieldsRef.current = fields;

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;

    /**
     * Reads named controls and updates React only when the value actually changed.
     */
    function syncFromDom(): void {
      const map = fieldsRef.current;
      for (const [name, binding] of Object.entries(map)) {
        if (binding.skip) continue;
        const el = form.elements.namedItem(name);
        if (!(el instanceof HTMLInputElement) && !(el instanceof HTMLSelectElement) && !(el instanceof HTMLTextAreaElement)) {
          continue;
        }
        const next = (binding.sanitize ?? ((s: string) => s))(el.value);
        if (next !== binding.value) binding.set(next);
      }
    }

    const onAnim = (e: AnimationEvent) => {
      if (e.animationName === "diteup-autofill") syncFromDom();
    };

    form.addEventListener("input", syncFromDom);
    form.addEventListener("change", syncFromDom);
    form.addEventListener("focusin", syncFromDom);
    form.addEventListener("animationstart", onAnim, true);

    const delays = [0, 150, 400, 900, 1800, 3500].map((ms) => window.setTimeout(syncFromDom, ms));
    const iv = window.setInterval(syncFromDom, 700);
    const stopIv = window.setTimeout(() => window.clearInterval(iv), 15_000);

    return () => {
      form.removeEventListener("input", syncFromDom);
      form.removeEventListener("change", syncFromDom);
      form.removeEventListener("focusin", syncFromDom);
      form.removeEventListener("animationstart", onAnim, true);
      delays.forEach((id) => window.clearTimeout(id));
      window.clearInterval(iv);
      window.clearTimeout(stopIv);
    };
  }, [formRef]);
}
