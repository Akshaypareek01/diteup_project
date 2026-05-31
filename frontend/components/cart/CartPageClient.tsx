"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FlowHeader } from "@/components/layout/FlowHeader";
import { SiteModeStrip } from "@/components/site-mode/SiteModeStrip";
import { useSiteMode } from "@/components/site-mode/SiteModeProvider";
import { CartIconCod, CartIconLock, CartIconStarBadge, CartIconTrash } from "@/components/cart/cart-ui-icons";
import { useCartState } from "@/components/cart/CartStateProvider";
import { clientApiJson } from "@/lib/client-api";
import type { CartPricingBreakdown } from "@/lib/types/catalog";
import { formatInr, moneyNumber } from "@/lib/format-money";
import { FREE_SHIPPING_THRESHOLD_INR } from "@/lib/storefront-policy-constants";
import { cn } from "@/lib/utils";

const DEFAULT_CART_THUMB = "/assets/Images/prodcut_clean.png";
const CART_PROMO_BANNER_SRC = "/assets/Images/cart_banner.png";

/**
 * Bottom-of-cart promo graphic: artwork may be transparent; sits on a white card.
 * @param className - Optional layout classes (e.g. width caps on desktop).
 */
function CartBottomPromoCard({ className }: { className?: string }) {
  return (
    <figure
      className={cn(
        "mt-10 overflow-hidden rounded-2xl border border-line/80 bg-white p-4 shadow-xs sm:p-5 lg:mt-12 lg:p-6",
        className,
      )}
    >
      <Image
        src={CART_PROMO_BANNER_SRC}
        alt="No preservatives, no artificial flavours, no refined sugar, 100% natural, made with love in India"
        width={1120}
        height={560}
        className="mx-auto h-auto w-full max-w-full object-contain"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 896px"
      />
      <figcaption className="sr-only">
        Product promises: no preservatives, no artificial flavours, no refined sugar, one hundred percent natural, made with
        love in India.
      </figcaption>
    </figure>
  );
}

/**
 * Renders cart line thumbnail; uses Next `Image` for app-relative paths and `<img>` for remote CMS URLs.
 */
function CartLineThumb({ src, alt }: { src: string; alt: string }) {
  const isLocal = src.startsWith("/");
  if (isLocal) {
    return (
      <Image
        src={src}
        alt={alt}
        width={80}
        height={80}
        className="h-20 w-20 shrink-0 rounded-lg border border-line/70 bg-paper object-contain lg:h-24 lg:w-24"
        sizes="80px"
      />
    );
  }
  return (
    // Remote product media — avoid Next remotePatterns dependency for cart thumbnails.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={80}
      height={80}
      className="h-20 w-20 shrink-0 rounded-lg border border-line/70 bg-paper object-cover lg:h-24 lg:w-24"
      loading="lazy"
      decoding="async"
    />
  );
}

/**
 * Maps API shipping amount to summary label ("FREE" when zero).
 */
function shippingSummaryLabel(shippingAfterCoupon: unknown): string {
  return moneyNumber(shippingAfterCoupon) === 0 ? "FREE" : formatInr(shippingAfterCoupon);
}

/**
 * Full cart with `POST /v1/cart/preview` totals and optional coupon code.
 */
export function CartPageClient() {
  const { siteMode } = useSiteMode();
  const { lines, setQty, removeLine, previewPayload } = useCartState();
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [breakdown, setBreakdown] = useState<CartPricingBreakdown | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  const lineCount = lines.reduce((n, l) => n + l.quantity, 0);

  const freeShipProgress = useMemo(() => {
    if (!breakdown) return { pct: 0, remaining: FREE_SHIPPING_THRESHOLD_INR, unlocked: false };
    const sub = moneyNumber(breakdown.subtotal);
    const pct = Math.min(100, Math.max(0, (sub / FREE_SHIPPING_THRESHOLD_INR) * 100));
    const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD_INR - sub);
    const unlocked = sub >= FREE_SHIPPING_THRESHOLD_INR;
    return { pct, remaining, unlocked };
  }, [breakdown]);

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
    <div className="min-h-screen bg-[#FDFBF7] pb-24 lg:pb-16">
      {siteMode.active ? <SiteModeStrip siteMode={siteMode} withShell /> : null}
      <FlowHeader backHref="/" />
      <div className="mx-auto max-w-[1320px] px-4 py-6 sm:px-5 lg:px-8 lg:py-8 xl:px-12">
        <h1 className="font-sans text-lg font-bold uppercase tracking-[0.12em] text-ink lg:text-xl">
          Your cart ({lineCount})
        </h1>

        {lines.length === 0 ? (
          <p className="mt-6 max-w-md text-body text-ink-soft">
            Nothing here yet.{" "}
            <Link href="/" className="font-medium text-forest underline decoration-forest/40 underline-offset-2">
              Continue shopping
            </Link>
            .
          </p>
        ) : (
          <div className="mt-6 lg:mt-8 lg:grid lg:grid-cols-12 lg:items-start lg:gap-8 xl:gap-10">
            <div className="lg:col-span-7 xl:col-span-8 lg:space-y-8">
              <ul className="space-y-4 lg:space-y-5">
                {lines.map((line) => {
                  const priced = breakdown?.lines?.find((x) => x.variantId === line.variantId);
                  const thumbSrc = line.imageSrc ?? DEFAULT_CART_THUMB;
                  const thumbAlt = line.imageAlt ?? line.productName;
                  return (
                    <li
                      key={line.variantId}
                      className="relative flex gap-3 rounded-2xl border border-line/80 bg-white p-3 shadow-xs lg:gap-5 lg:p-5"
                    >
                      <Link
                        href={`/product/${line.slug}`}
                        className="shrink-0 self-start"
                        aria-label={`View ${line.productName}`}
                      >
                        <CartLineThumb src={thumbSrc} alt={thumbAlt} />
                      </Link>
                      <div className="min-w-0 flex-1 pr-11 lg:pr-12">
                        <h2 className="font-sans text-base font-semibold text-ink lg:text-lg">{line.productName}</h2>
                        <p className="mt-0.5 text-body-sm text-ink-muted">{line.variantName}</p>
                        {priced ? (
                          <p className="mt-2 font-sans text-body font-semibold text-forest">{formatInr(priced.lineSubtotal)}</p>
                        ) : (
                          <p className="mt-2 text-body-sm text-ink-muted">Calculating…</p>
                        )}
                        <div className="mt-3 inline-flex items-stretch overflow-hidden rounded-md border border-line bg-[#FDFBF7]">
                          <button
                            type="button"
                            className="flex h-10 w-10 items-center justify-center text-lg font-medium text-forest transition hover:bg-beige/60 lg:h-11 lg:w-11"
                            aria-label="Decrease quantity"
                            onClick={() => setQty(line.variantId, line.quantity - 1)}
                          >
                            −
                          </button>
                          <span className="flex min-w-[2.5rem] items-center justify-center border-x border-line bg-white text-body-sm font-semibold text-ink lg:min-w-[3rem]">
                            {line.quantity}
                          </span>
                          <button
                            type="button"
                            className="flex h-10 w-10 items-center justify-center text-lg font-medium text-forest transition hover:bg-beige/60 lg:h-11 lg:w-11"
                            aria-label="Increase quantity"
                            onClick={() => setQty(line.variantId, line.quantity + 1)}
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full border border-line text-ink-muted transition hover:border-error/40 hover:bg-error/5 hover:text-error lg:right-4 lg:top-4"
                        aria-label={`Remove ${line.productName} from cart`}
                        onClick={() => removeLine(line.variantId)}
                      >
                        <CartIconTrash className="size-5" />
                      </button>
                    </li>
                  );
                })}
              </ul>

              <div>
                <label htmlFor="coupon" className="text-body-sm font-medium text-ink">
                  Have a coupon code?
                </label>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-stretch">
                  <input
                    id="coupon"
                    name="coupon"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="Enter coupon code"
                    autoComplete="off"
                    className="h-12 min-w-0 flex-1 rounded-xl border border-line bg-white px-3 text-body text-ink placeholder:text-ink-muted/70 outline-none focus:border-forest focus:ring-2 focus:ring-forest/15"
                  />
                  <button
                    type="button"
                    className="h-12 shrink-0 rounded-xl bg-forest px-6 font-sans text-body-sm font-bold uppercase tracking-wide text-white shadow-sm transition hover:bg-sage sm:w-auto sm:px-8"
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
                <p className="text-body-sm text-error" role="alert">
                  {loadErr}
                </p>
              ) : null}
            </div>

            <aside className="mt-8 space-y-4 lg:sticky lg:top-24 lg:z-10 lg:col-span-5 xl:col-span-4 lg:mt-0 lg:space-y-5 lg:self-start">
              <div className="space-y-3 rounded-2xl border border-line/80 bg-white/80 p-4 shadow-xs lg:p-5">
                <h2 className="sr-only">Order summary</h2>
                {breakdown ? (
                  <dl className="space-y-3 text-body-sm text-ink">
                    <div className="flex justify-between gap-4">
                      <dt className="text-ink-muted">Subtotal</dt>
                      <dd className="font-medium text-ink">{formatInr(breakdown.subtotal)}</dd>
                    </div>
                    {moneyNumber(breakdown.discountOnSubtotal) > 0 ? (
                      <div className="flex justify-between gap-4">
                        <dt className="text-ink-muted">Discount</dt>
                        <dd className="font-medium text-success">−{formatInr(breakdown.discountOnSubtotal)}</dd>
                      </div>
                    ) : null}
                    <div className="flex justify-between gap-4">
                      <dt className="text-ink-muted">Shipping</dt>
                      <dd
                        className={`font-semibold ${moneyNumber(breakdown.shippingAfterCoupon) === 0 ? "uppercase text-forest" : "text-ink"}`}
                      >
                        {shippingSummaryLabel(breakdown.shippingAfterCoupon)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4 border-t border-line/90 pt-3 font-sans text-lg font-bold text-ink">
                      <dt>Total</dt>
                      <dd>{formatInr(breakdown.total)}</dd>
                    </div>
                  </dl>
                ) : (
                  <p className="text-body-sm text-ink-muted">Updating totals…</p>
                )}
              </div>

              {breakdown && lines.length > 0 ? (
                <div className="rounded-2xl border border-beige/90 bg-[#F5EDE0] px-4 py-3 lg:px-5 lg:py-4">
                  <p className="text-center text-body-sm font-medium text-ink lg:text-body">
                    {freeShipProgress.unlocked
                      ? "You've unlocked FREE shipping!"
                      : `You are ${formatInr(freeShipProgress.remaining)} away from FREE shipping!`}
                  </p>
                  <div className="relative mt-3 px-0.5">
                    <div
                      className="h-2.5 w-full overflow-hidden rounded-full bg-white/90"
                      role="progressbar"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Math.round(freeShipProgress.pct)}
                      aria-label="Progress toward free shipping"
                    >
                      <div
                        className="h-full rounded-full bg-forest transition-[width] duration-300"
                        style={{ width: `${String(freeShipProgress.pct)}%` }}
                      />
                    </div>
                    <span
                      className="absolute -top-1.5 z-10 flex size-6 -translate-x-1/2 items-center justify-center text-gold-deep drop-shadow-sm"
                      style={{ left: `clamp(0%, ${String(freeShipProgress.pct)}%, 100%)` }}
                      aria-hidden
                    >
                      <CartIconStarBadge className="size-5" />
                    </span>
                  </div>
                  <div className="mt-1 flex justify-between font-mono text-[0.6875rem] uppercase tracking-wider text-ink-muted">
                    <span>{formatInr(0)}</span>
                    <span>{formatInr(FREE_SHIPPING_THRESHOLD_INR)}</span>
                  </div>
                </div>
              ) : null}

              {siteMode.blocksCheckout ? (
                <p className="rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-center text-body-sm text-forest" role="alert">
                  {siteMode.message ?? `${siteMode.headline} — checkout is temporarily unavailable.`}
                </p>
              ) : null}

              {siteMode.blocksCheckout ? (
                <span
                  className="flex h-14 w-full cursor-not-allowed items-center justify-center rounded-2xl bg-gold/50 font-sans text-button font-bold uppercase tracking-[0.14em] text-forest/60 shadow-md"
                  aria-disabled="true"
                >
                  Proceed to checkout
                </span>
              ) : (
                <Link
                  href="/checkout"
                  className="flex h-14 w-full items-center justify-center rounded-2xl bg-gold font-sans text-button font-bold uppercase tracking-[0.14em] text-forest shadow-md transition hover:bg-gold-soft"
                >
                  Proceed to checkout
                </Link>
              )}
              <div className="space-y-2.5 text-body-sm text-ink-muted lg:text-left">
                <p className="flex items-center justify-center gap-2 lg:justify-start">
                  <CartIconLock className="size-4 shrink-0 text-forest" aria-hidden />
                  <span>100% Secure Payments</span>
                </p>
                <p className="flex items-center justify-center gap-2 lg:justify-start">
                  <CartIconCod className="size-4 shrink-0 text-forest" aria-hidden />
                  <span>COD Available</span>
                </p>
              </div>
            </aside>
          </div>
        )}

        <CartBottomPromoCard className="lg:mx-auto lg:max-w-4xl xl:max-w-5xl" />
      </div>
    </div>
  );
}
