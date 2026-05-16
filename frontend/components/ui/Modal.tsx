"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { fadeIn, modal as modalMotion } from "@/lib/motion";

export type ModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  labelledBy?: string;
};

/**
 * Focus-trap-light modal (ESC + backdrop) — DESIGN-SYSTEM §7.11.
 */
export function Modal({ open, title, onClose, children, labelledBy }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      prev?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  const titleId = labelledBy ?? "modal-title";

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <motion.button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-forest/40 backdrop-blur-sm"
        variants={fadeIn}
        initial="hidden"
        animate="show"
        onClick={onClose}
      />
      <motion.div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-line bg-cream p-6 shadow-lg"
        variants={modalMotion}
        initial="hidden"
        animate="show"
        exit="exit"
      >
        <h2 id={titleId} className="font-display text-display-md font-semibold text-forest">
          {title}
        </h2>
        <div className="mt-4">{children}</div>
      </motion.div>
    </div>
  );
}
