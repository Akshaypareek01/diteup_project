"use client";

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";
import { CartStateProvider } from "@/components/cart/CartStateProvider";
import { CartDrawerProvider } from "@/components/cart/CartDrawerProvider";
import { HeroBannerVariantProvider } from "@/components/home/HeroBannerVariantProvider";
import { ToastProvider } from "@/components/ui/ToastProvider";

/**
 * Client providers: reduced-motion aware Framer config, cart drawer, toasts.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <ToastProvider>
        <CartStateProvider>
          <CartDrawerProvider>
            <HeroBannerVariantProvider>{children}</HeroBannerVariantProvider>
          </CartDrawerProvider>
        </CartStateProvider>
      </ToastProvider>
    </MotionConfig>
  );
}
