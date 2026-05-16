"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { FlowHeader } from "@/components/layout/FlowHeader";
import { IconPlaceholder } from "@/components/placeholders/IconPlaceholder";
import { ImagePlaceholder } from "@/components/placeholders/ImagePlaceholder";
import { useCartState } from "@/components/cart/CartStateProvider";
import { clientApiJson } from "@/lib/client-api";
import type { CartPricingBreakdown } from "@/lib/types/catalog";
import { formatInr } from "@/lib/format-money";

/**
 * Full cart with `POST /v1/cart/preview` totals and optional coupon code.
 */
export function CartPageClient() {
  const { lines, setQty, removeLine, previewPayload } = useCartState();
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [breakdown, setBreakdown] = useState<CartPricingBreakdown | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  const refreshPreview = useCallback(async () => {
    const items = previewPayload();
    if (items.length === 0) {
      setBreakdown(null);
      setLoadErr(null);
      return;
    }
    try {
      setLoadErr(null);
      const data = await clientApiJson<CartPricingBreakdown>("/v1/cart/preview", {
        method: "POST",
        json: {
          items,
          paymentMethod: "RAZORPAY",
          couponCode: appliedCoupon?.trim() || null,
        },
      });
      setBreakdown(data);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not load cart.";
      setLoadErr(msg);
      setBreakdown(null);
    }
  }, [previewPayload, appliedCoupon]);

  useEffect(() => {
    void refreshPreview();
  }, [refreshPreview]);

  function applyCoupon() {
    const c = couponInput.trim();
    setAppliedCoupon(c.length ? c : null);
  }

  return (
    <div className="min-h-screen bg-cream pb-28">
      <FlowHeader backHref="/" />
      <div className="mx-auto max-w-lg px-4 py-6">
        <h1 className="font-display text-display-md font-semibold text-forest">
          Your cart ({lines.length})
        </h1>

        {lines.length === 0 ? (
          <p className="mt-6 text-body text-ink-soft">
            Nothing here yet.{" "}
            <Link href="/" className="text-gold-deep underline">
              Continue shopping
            </Link>
            .
          </p>
        ) : (
          <ul className="mt-6 space-y-4">
            {lines.map((line) => {
              const priced = breakdown?.lines?.find((x) => x.variantId === line.variantId);
              return (
                <li key={line.variantId} className="flex gap-4 rounded-lg border border-line bg-paper p-4 shadow-sm">
                  <Link href={`/product/${line.slug}`} className="shrink-0" aria-label={line.productName}>
                    <ImagePlaceholder variant="thumb" label={line.productName} />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-semibold text-forest">{line.productName}</h2>
                    <p className="text-body-sm text-ink-muted">{line.variantName}</p>
                    {priced ? (
                      <p className="mt-1 font-semibold text-forest">{formatInr(priced.lineSubtotal)}</p>
                    ) : (
                      <p className="mt-1 text-body-sm text-ink-muted">Calculating…</p>
                    )}
                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex items-center rounded-lg border border-line bg-cream">
                        <button
                          type="button"
                          className="px-3 py-2 text-lg"
                          aria-label="Decrease quantity"
                          onClick={() => setQty(line.variantId, line.quantity - 1)}
                        >
                          −
                        </button>
                        <span className="min-w-[2ch] text-center text-body-sm font-semibold">
                          {line.quantity}
                        </span>
                        <button
                          type="button"
                          className="px-3 py-2 text-lg"
                          aria-label="Increase quantity"
                          onClick={() => setQty(line.variantId, line.quantity + 1)}
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        className="inline-flex size-10 items-center justify-center rounded-full border border-error/30 text-error"
                        aria-label="Remove item"
                        onClick={() => removeLine(line.variantId)}
                      >
                        <IconPlaceholder label="Delete icon" size="sm" />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {lines.length > 0 ? (
          <>
            <div className="mt-6">
              <label htmlFor="coupon" className="font-mono text-eyebrow text-ink-muted">
                Have a coupon code?
              </label>
              <div className="mt-2 flex gap-2">
                <input
                  id="coupon"
                  name="coupon"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  placeholder="CODE"
                  className="h-12 min-w-0 flex-1 rounded-lg border border-line bg-paper px-3 text-body outline-none focus:border-forest"
                />
                <button
                  type="button"
                  className="shrink-0 rounded-lg bg-gold px-5 font-sans text-button font-semibold uppercase tracking-wide text-forest"
                  onClick={applyCoupon}
                >
                  Apply
                </button>
              </div>
              {breakdown?.coupon ? (
                <p className="mt-2 text-body-sm text-ink-muted" role="status">
                  {breakdown.coupon.message ?? (breakdown.coupon.eligible ? "Coupon applied" : "")}
                </p>
              ) : null}
            </div>

            {loadErr ? (
              <p className="mt-4 text-body-sm text-error" role="alert">
                {loadErr}
              </p>
            ) : null}

            <div className="mt-8 rounded-lg border border-line bg-cream p-4">
              <h2 className="font-mono text-eyebrow text-ink-muted">Order summary</h2>
              {breakdown ? (
                <dl className="mt-3 space-y-2 text-body-sm">
                  <div className="flex justify-between">
                    <dt>Subtotal</dt>
                    <dd>{formatInr(breakdown.subtotal)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Discount</dt>
                    <dd>{formatInr(breakdown.discountOnSubtotal)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt>Shipping</dt>
                    <dd>{formatInr(breakdown.shippingAfterCoupon)}</dd>
                  </div>
                  <div className="flex justify-between border-t border-line pt-2 text-base font-semibold text-forest">
                    <dt>Total</dt>
                    <dd>{formatInr(breakdown.total)}</dd>
                  </div>
                </dl>
              ) : (
                <p className="mt-3 text-body-sm text-ink-muted">Updating totals…</p>
              )}
            </div>

            <Link
              href="/checkout"
              className="mt-6 flex h-14 w-full items-center justify-center rounded-lg bg-gold font-sans text-button font-semibold uppercase tracking-wide text-forest shadow-md"
            >
              Proceed to checkout
            </Link>
            <p className="mt-3 flex items-center justify-center gap-2 text-body-sm text-ink-muted">
              <IconPlaceholder label="Lock secure payment" size="sm" />
              100% secure payments
            </p>
          </>
        ) : null}
      </div>
    </div>
  );
}
