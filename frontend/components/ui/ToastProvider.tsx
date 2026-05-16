"use client";

import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";

type ToastVariant = "success" | "error" | "info";

type ToastItem = { id: number; message: string; variant: ToastVariant };

type ToastContextValue = {
  /** @param variant maps to icon color in production */
  showToast: (message: string, variant?: ToastVariant) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * Bottom-right toasts (desktop) / top on small screens per DESIGN-SYSTEM §7.12.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, variant: ToastVariant = "success") => {
    const id = Date.now();
    setItems((x) => [...x, { id, message, variant }]);
    window.setTimeout(() => {
      setItems((x) => x.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed left-4 right-4 top-4 z-[95] flex flex-col items-stretch gap-2 sm:left-auto sm:right-4 sm:top-auto sm:bottom-4 sm:items-end"
        aria-live="polite"
      >
        <AnimatePresence>
          {items.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className={`pointer-events-auto max-w-sm rounded-lg border px-4 py-3 shadow-sm ${
                t.variant === "error"
                  ? "border-error/40 bg-paper text-error"
                  : t.variant === "info"
                    ? "border-info/40 bg-paper text-info"
                    : "border-olive/40 bg-paper text-forest"
              }`}
              role="status"
            >
              <p className="text-body-sm font-medium">{t.message}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
