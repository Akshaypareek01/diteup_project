"use client";

import Image from "next/image";
import Link from "next/link";
import type { CartLineMeta } from "@/components/cart/CartStateProvider";
import type { CartPricingBreakdown } from "@/lib/types/catalog";
import { formatInr } from "@/lib/format-money";

/** Matches cart / checkout fallback when line metadata has no thumbnail. */
export const CHECKOUT_FALLBACK_PRODUCT_IMAGE = "/assets/Images/prodcut_clean.png";

/**
 * Renders a single checkout line thumbnail; uses Next `Image` for local paths and `<img>` for remote URLs.
 *
 * @param src - Resolved thumbnail URL (`/assets/...` or remote CMS URL).
 * @param alt - Accessible description (product name preferred).
 */
function CheckoutLineThumb({ src, alt }: { src: string; alt: string }) {
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
    // Remote product media — avoid Next remotePatterns dependency for thumbnails.
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

export type CheckoutOrderSummaryProps = {
  preview: CartPricingBreakdown | null;
  previewErr: string | null;
  lines: CartLineMeta[];
  paymentMethod: "RAZORPAY" | "COD";
  /** Extra classes on the outer `<section>` (e.g. sticky sidebar spacing). */
  className?: string;
};

/**
 * Order lines + pricing breakdown for checkout (mobile and desktop sidebars).
 */
export function CheckoutOrderSummary({
  preview,
  previewErr,
  lines,
  paymentMethod,
  className = "",
}: CheckoutOrderSummaryProps) {
  return (
    <>
      {preview ? (
        <section
          className={`rounded-lg border border-line bg-cream p-5 lg:rounded-2xl lg:p-6 ${className}`}
          aria-label="Order summary"
        >
          <h2 className="font-mono text-eyebrow text-ink-muted">Order summary</h2>
          <ul className="mt-4 space-y-4 border-b border-line pb-4 lg:space-y-5">
            {lines.map((line) => {
              const priced = preview.lines.find((x) => x.variantId === line.variantId);
              const thumbSrc = line.imageSrc ?? CHECKOUT_FALLBACK_PRODUCT_IMAGE;
              const thumbAlt = line.imageAlt ?? line.productName;
              return (
                <li key={line.variantId} className="flex gap-3 lg:gap-4">
                  {line.slug ? (
                    <Link
                      href={`/product/${line.slug}`}
                      className="shrink-0 self-start"
                      aria-label={`View ${line.productName}`}
                    >
                      <CheckoutLineThumb src={thumbSrc} alt={thumbAlt} />
                    </Link>
                  ) : (
                    <div className="shrink-0 self-start">
                      <CheckoutLineThumb src={thumbSrc} alt={thumbAlt} />
                    </div>
                  )}
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="font-medium leading-snug text-forest lg:text-body-lg">{line.productName}</p>
                    <p className="mt-1 text-body-sm text-ink-muted">
                      {line.variantName ? `${line.variantName} · ` : null}
                      Qty {line.quantity}
                    </p>
                    {priced ? (
                      <p className="mt-2 text-body-sm font-semibold text-forest">{formatInr(priced.lineSubtotal)}</p>
                    ) : (
                      <p className="mt-2 text-body-sm text-ink-muted">Calculating…</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          <dl className="mt-4 space-y-2 text-body-sm text-forest lg:mt-5">
            <div className="flex justify-between gap-4">
              <dt>Subtotal</dt>
              <dd>{formatInr(preview.subtotal)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Discount</dt>
              <dd>{formatInr(preview.discountOnSubtotal)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Shipping</dt>
              <dd>{formatInr(preview.shippingAfterCoupon)}</dd>
            </div>
            {paymentMethod === "COD" ? (
              <div className="flex justify-between gap-4">
                <dt>COD fee</dt>
                <dd>{formatInr(preview.codCharge)}</dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-4 border-t border-line pt-2 text-base font-semibold lg:text-lg">
              <dt>Pay now</dt>
              <dd>{formatInr(preview.total)}</dd>
            </div>
          </dl>
        </section>
      ) : previewErr ? (
        <p className={`text-body-sm text-error ${className}`} role="alert">
          {previewErr}
        </p>
      ) : (
        <p className={`text-body-sm text-ink-muted ${className}`}>Loading totals…</p>
      )}
    </>
  );
}
