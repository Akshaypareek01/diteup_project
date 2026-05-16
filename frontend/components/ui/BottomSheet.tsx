"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { slideUpSheet } from "@/lib/motion";

export type BottomSheetProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
};

/**
 * Mobile-first bottom sheet — DESIGN-SYSTEM §7.11 (md+ centers as panel).
 */
export function BottomSheet({ open, title, onClose, children }: BottomSheetProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-[90] md:flex md:items-end md:justify-center">
          <motion.button
            type="button"
            aria-label="Dismiss"
            className="absolute inset-0 bg-forest/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl border border-line bg-cream p-6 shadow-lg md:relative md:inset-auto md:mb-8 md:w-full md:max-w-md md:rounded-2xl"
            variants={slideUpSheet}
            initial="hidden"
            animate="show"
            exit="exit"
          >
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="font-display text-lg font-semibold text-forest">{title}</h2>
              <button
                type="button"
                className="rounded-full px-3 py-1 text-body-sm text-ink-muted hover:text-forest"
                onClick={onClose}
              >
                Close
              </button>
            </div>
            {children}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
