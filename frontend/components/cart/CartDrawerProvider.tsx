"use client";

import { type ReactNode, createContext, useCallback, useContext, useMemo, useState } from "react";
import { CartDrawerPanel } from "@/components/cart/CartDrawerPanel";

type CartDrawerContextValue = {
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
};

const CartDrawerContext = createContext<CartDrawerContextValue | null>(null);

/**
 * Provides slide-out mini-cart state for the site shell.
 */
export function CartDrawerProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false);
  const openCart = useCallback(() => setOpen(true), []);
  const closeCart = useCallback(() => setOpen(false), []);
  const value = useMemo(
    () => ({ isOpen, openCart, closeCart }),
    [isOpen, openCart, closeCart],
  );

  return (
    <CartDrawerContext.Provider value={value}>
      {children}
      <CartDrawerPanel open={isOpen} onClose={closeCart} />
    </CartDrawerContext.Provider>
  );
}

export function useCartDrawer(): CartDrawerContextValue {
  const ctx = useContext(CartDrawerContext);
  if (!ctx) {
    throw new Error("useCartDrawer must be used within CartDrawerProvider");
  }
  return ctx;
}
