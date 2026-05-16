"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { slideInFromRight } from "@/lib/motion";
import { Button } from "@/components/ui/Button";
import { clientApiJson } from "@/lib/client-api";
import type { CartPricingBreakdown } from "@/lib/types/catalog";
import { formatInr } from "@/lib/format-money";
import { useCartState } from "@/components/cart/CartStateProvider";

export type CartDrawerPanelProps = {
  open: boolean;
  onClose: () => void;
};

/**
 * Mini-cart with live totals from `POST /v1/cart/preview`.
 */
export function CartDrawerPanel({ open, onClose }: CartDrawerPanelProps) {
  const { lines, previewPayload } = useCartState();
  const [breakdown, setBreakdown] = useState<CartPricingBreakdown | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    const items = previewPayload();
    if (items.length === 0) {
      setBreakdown(null);
      setPreviewError(null);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setPreviewError(null);
        const data = await clientApiJson<CartPricingBreakdown>("/v1/cart/preview", {
          method: "POST",
          json: {
            items,
            paymentMethod: "RAZORPAY",
          },
        });
        if (!cancelled) {
          setBreakdown(data);
        }
      } catch (e) {
        if (!cancelled) {
          const msg = e instanceof Error ? e.message : "Could not update cart totals.";
          setPreviewError(msg);
          setBreakdown(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, lines, previewPayload]);

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Close cart"
            className="fixed inset-0 z-[70] bg-forest/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Shopping cart"
            className="fixed inset-y-0 right-0 z-[80] flex w-full max-w-md flex-col bg-cream shadow-lg"
            variants={slideInFromRight}
            initial="hidden"
            animate="show"
            exit="exit"
          >
            <header className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="font-display text-lg font-semibold text-forest">Your cart</h2>
              <button
                type="button"
                className="rounded-full px-3 py-1 text-body-sm font-medium text-ink-muted hover:text-forest"
                onClick={onClose}
              >
                Close
              </button>
            </header>

            <div className="flex flex-1 flex-col overflow-y-auto px-5 py-4">
              {lines.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
                  <div
                    className="flex size-24 items-center justify-center rounded-2xl border border-dashed border-line text-body-sm text-ink-muted"
                    role="img"
                    aria-label="Empty cart"
                  >
                    Bowl
                  </div>
                  <p className="text-body text-ink-soft">Your cart is empty.</p>
                </div>
              ) : (
                <ul className="space-y-4" aria-label="Cart lines">
                  {lines.map((l) => {
                    const priced = breakdown?.lines?.find((x) => x.variantId === l.variantId);
                    return (
                      <li key={l.variantId} className="rounded-lg border border-line bg-paper p-3">
                        <p className="font-medium text-forest">{l.productName}</p>
                        <p className="text-body-sm text-ink-muted">{l.variantName}</p>
                        <p className="mt-1 text-body-sm">
                          Qty {l.quantity}
                          {priced ? ` · ${formatInr(priced.lineSubtotal)}` : ""}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              )}

              {previewError ? (
                <p className="mt-4 text-body-sm text-error" role="alert">
                  {previewError}
                </p>
              ) : null}

              {lines.length > 0 && breakdown ? (
                <dl className="mt-6 space-y-2 border-t border-line pt-4 text-body-sm">
                  <div className="flex justify-between">
                    <dt>Subtotal</dt>
                    <dd>{formatInr(breakdown.subtotal)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Shipping</dt>
                    <dd>{formatInr(breakdown.shippingAfterCoupon)}</dd>
                  </div>
                  <div className="flex justify-between text-base font-semibold text-forest">
                    <dt>Total</dt>
                    <dd>{formatInr(breakdown.total)}</dd>
                  </div>
                </dl>
              ) : null}
            </div>

            <footer className="border-t border-line p-4">
              <Button
                href="/cart"
                variant="secondary"
                className="w-full"
                size="lg"
                onClick={onClose}
              >
                View full cart
              </Button>
            </footer>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}
