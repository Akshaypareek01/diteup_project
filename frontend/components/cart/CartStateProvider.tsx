"use client";

import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

/** Persisted cart line — metadata for UI before preview returns. */
export type CartLineMeta = {
  variantId: string;
  quantity: number;
  slug: string;
  productName: string;
  variantName: string;
};

const STORAGE_KEY = "diteup_cart_v1";

type CartStateContextValue = {
  lines: CartLineMeta[];
  /** Adds or merges quantity for the same `variantId`. */
  addLine: (line: Omit<CartLineMeta, "quantity"> & { quantity?: number }) => void;
  /** Replaces cart with a single line (e.g. Buy now). */
  replaceWithLine: (line: CartLineMeta) => void;
  setQty: (variantId: string, quantity: number) => void;
  removeLine: (variantId: string) => void;
  clear: () => void;
  previewPayload: () => { variantId: string; quantity: number }[];
};

const CartStateContext = createContext<CartStateContextValue | null>(null);

function readStorage(): CartLineMeta[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is CartLineMeta =>
        x &&
        typeof x === "object" &&
        typeof (x as CartLineMeta).variantId === "string" &&
        typeof (x as CartLineMeta).quantity === "number",
    );
  } catch {
    return [];
  }
}

/**
 * Guest/cross-cart state synced to `localStorage`; server totals come from `POST /v1/cart/preview`.
 */
export function CartStateProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLineMeta[]>([]);
  const hydrated = useRef(false);

  useEffect(() => {
    setLines(readStorage());
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch (err) {
      console.error("Cart persist failed", err);
    }
  }, [lines]);

  const addLine = useCallback((line: Omit<CartLineMeta, "quantity"> & { quantity?: number }) => {
    const q = line.quantity ?? 1;
    setLines((prev) => {
      const i = prev.findIndex((l) => l.variantId === line.variantId);
      if (i === -1) {
        return [
          ...prev,
          {
            variantId: line.variantId,
            quantity: q,
            slug: line.slug,
            productName: line.productName,
            variantName: line.variantName,
          },
        ];
      }
      const next = [...prev];
      next[i] = {
        ...next[i],
        quantity: next[i].quantity + q,
        slug: line.slug,
        productName: line.productName,
        variantName: line.variantName,
      };
      return next;
    });
  }, []);

  const replaceWithLine = useCallback((line: CartLineMeta) => {
    setLines([line]);
  }, []);

  const setQty = useCallback((variantId: string, quantity: number) => {
    if (quantity < 1) {
      setLines((prev) => prev.filter((l) => l.variantId !== variantId));
      return;
    }
    setLines((prev) => prev.map((l) => (l.variantId === variantId ? { ...l, quantity } : l)));
  }, []);

  const removeLine = useCallback((variantId: string) => {
    setLines((prev) => prev.filter((l) => l.variantId !== variantId));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const previewPayload = useCallback(
    () => lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity })),
    [lines],
  );

  const value = useMemo(
    () => ({
      lines,
      addLine,
      replaceWithLine,
      setQty,
      removeLine,
      clear,
      previewPayload,
    }),
    [lines, addLine, replaceWithLine, setQty, removeLine, clear, previewPayload],
  );

  return <CartStateContext.Provider value={value}>{children}</CartStateContext.Provider>;
}

export function useCartState(): CartStateContextValue {
  const ctx = useContext(CartStateContext);
  if (!ctx) {
    throw new Error("useCartState must be used within CartStateProvider");
  }
  return ctx;
}
