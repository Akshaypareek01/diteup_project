"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { FlowHeader } from "@/components/layout/FlowHeader";
import { SiteModeStrip } from "@/components/site-mode/SiteModeStrip";
import { useSiteMode } from "@/components/site-mode/SiteModeProvider";
import { CountdownTimer } from "@/components/site-mode/CountdownTimer";
import { Button } from "@/components/ui/Button";
import { useCartState } from "@/components/cart/CartStateProvider";
import { formatInr, moneyNumber } from "@/lib/format-money";
import type { PublicProduct } from "@/lib/types/catalog";
import type { ProductReviewsPayload } from "@/lib/types/reviews";
import { pixelAddToCart } from "@/lib/meta-pixel-events";
import { NotifyMeForm } from "@/components/product/NotifyMeForm";
import { ProductPdpAccordions } from "@/components/product/ProductPdpAccordions";
import { ProductPdpFeatureStrip } from "@/components/product/ProductPdpFeatureStrip";
import { ProductPdpTrustStrip } from "@/components/product/ProductPdpTrustStrip";

const PACKAGING_FALLBACK_SRC = "/assets/Images/product_.png";
/** Clean packaging cutout for cart / summaries (Energy Bite). */
const ENERGY_CART_PACKAGING_SRC = "/assets/Images/prodcut_clean.png";
const HOW_TO_USE_SRC = "/assets/Images/howtouse.png";

export type ProductDetailClientProps = {
  product: PublicProduct;
  reviews: ProductReviewsPayload | null;
};

/**
 * Picks hero image: packaging shot for Energy Bite; otherwise CMS media, then local fallback.
 */
function resolveHeroImageSrc(product: PublicProduct): { src: string; alt: string } {
  const first = product.media?.[0];
  const slugIsEnergy = product.slug.includes("energy-bite");
  if (slugIsEnergy) {
    return { src: PACKAGING_FALLBACK_SRC, alt: `${product.name} packaging` };
  }
  if (first?.url) {
    return { src: first.url, alt: first.altText ?? product.name };
  }
  return { src: PACKAGING_FALLBACK_SRC, alt: `${product.name} packaging` };
}

/**
 * Thumbnail for cart rows: clean Energy Bite asset when applicable, else CMS or fallback.
 */
function resolveCartLineImage(product: PublicProduct): { imageSrc: string; imageAlt: string } {
  if (product.slug.includes("energy-bite")) {
    return { imageSrc: ENERGY_CART_PACKAGING_SRC, imageAlt: `${product.name} — packaging` };
  }
  const first = product.media?.[0];
  if (first?.url) {
    return { imageSrc: first.url, imageAlt: first.altText ?? product.name };
  }
  return { imageSrc: PACKAGING_FALLBACK_SRC, imageAlt: `${product.name} packaging` };
}

/** Five-star PDP row: rounded score → filled golden stars plus subtle outlines for the rest (mock-aligned). */
function StarRow({ rating }: { rating: number }) {
  const full = Math.round(Math.min(5, Math.max(0, rating)));
  const empty = Math.max(0, 5 - full);
  const starCls = "size-[0.82rem] shrink-0 sm:size-[0.875rem]";
  const StarPath =
    "M12 2.75 14.74 9.14h6.93l-5.61 4.06 2.13 6.59L12 16.93l-5.18 3.87 2.13-6.59L3.34 9.14h6.93L12 2.75z";

  return (
    <span className="inline-flex items-center gap-0.5 text-gold-deep" aria-hidden>
      {Array.from({ length: full }, (_, i) => (
        <svg key={`f-${String(i)}`} className={starCls} viewBox="0 0 24 24" fill="currentColor">
          <path d={StarPath} />
        </svg>
      ))}
      {Array.from({ length: empty }, (_, i) => (
        <svg key={`e-${String(i)}`} className={`${starCls} text-line-dark/35`} viewBox="0 0 24 24" fill="none">
          <path d={StarPath} stroke="currentColor" strokeWidth="1.45" />
        </svg>
      ))}
    </span>
  );
}

/**
 * PDP: mobile-first single column; `lg` two-column gallery + sticky buy box, wider container on desktop.
 */
export function ProductDetailClient({ product, reviews }: ProductDetailClientProps) {
  const router = useRouter();
  const { siteMode, refreshSiteMode } = useSiteMode();
  const { addLine, replaceWithLine } = useCartState();

  const siteBlocksPurchase = siteMode.active && siteMode.blocksCheckout;

  const defaultVariant = useMemo(
    () => product.variants.find((v) => v.isDefault) ?? product.variants[0],
    [product.variants],
  );
  const [variantId, setVariantId] = useState(defaultVariant?.id ?? "");

  const selected = product.variants.find((v) => v.id === variantId) ?? defaultVariant;
  const sale = selected ? moneyNumber(selected.priceSale) : 0;
  const mrp = selected ? moneyNumber(selected.priceMrp) : 0;
  const off = mrp > sale ? Math.round(((mrp - sale) / mrp) * 100) : 0;

  const hero = resolveHeroImageSrc(product);

  function handleAddToCart() {
    if (!selected || !product.buyable || siteBlocksPurchase) return;
    const qty = 1;
    const lineValue = sale * qty;
    addLine({
      variantId: selected.id,
      slug: product.slug,
      productName: product.name,
      variantName: selected.name,
      quantity: qty,
      ...resolveCartLineImage(product),
    });
    pixelAddToCart({
      content_ids: [selected.id],
      value: lineValue,
      currency: "INR",
      num_items: qty,
    });
    router.push("/cart");
  }

  function handleBuyNow() {
    if (!selected || !product.buyable || siteBlocksPurchase) return;
    replaceWithLine({
      variantId: selected.id,
      quantity: 1,
      slug: product.slug,
      productName: product.name,
      variantName: selected.name,
      ...resolveCartLineImage(product),
    });
    pixelAddToCart({
      content_ids: [selected.id],
      value: sale,
      currency: "INR",
      num_items: 1,
    });
    router.push("/checkout");
  }

  const canPurchase =
    Boolean(selected) &&
    product.buyable &&
    !siteBlocksPurchase &&
    (selected!.available > 0 || Boolean(product.allowBackorder) || Boolean(product.preorderEnabled));

  const showNotifyMe = Boolean(selected) && !canPurchase && product.slug;

  const summary = reviews?.summary;
  const showRatings = product.reviewsEnabled && summary && summary.totalCount > 0;

  return (
    <div className="min-h-screen bg-cream pb-20 lg:pb-14">
      {siteMode.active ? <SiteModeStrip siteMode={siteMode} withShell /> : null}
      <FlowHeader backHref="/" showShare />
      <div className="mx-auto max-w-[1320px] px-4 pb-8 pt-2 sm:px-5 lg:px-8 lg:pb-12 lg:pt-4 xl:px-12">
        <nav aria-label="Breadcrumb" className="hidden text-body-sm text-ink-muted sm:flex sm:flex-wrap sm:items-center">
          <Link href="/" className="hover:text-forest">
            Home
          </Link>
          <span aria-hidden className="px-1.5 text-ink-muted/70">
            &gt;
          </span>
          <span className="text-forest">{product.name}</span>
        </nav>

        <div className="lg:grid lg:grid-cols-12 lg:items-start lg:gap-x-8 xl:gap-x-12">
          <div className="lg:col-span-6 xl:col-span-7 lg:flex lg:justify-center xl:justify-end xl:pr-4">
            <div className="relative mx-auto mt-4 w-full max-w-[520px] lg:mx-0 lg:mt-8 lg:max-w-[480px] xl:max-w-[540px]">
              <div className="relative overflow-hidden rounded-[1.125rem] border border-line/70 bg-gradient-to-b from-paper to-cream shadow-xs">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={hero.src}
                  alt={hero.alt}
                  className="aspect-square w-full object-contain p-4 sm:p-8 lg:p-10"
                />
                {product.displayBadge ? (
                  <span className="absolute left-3 top-3 rounded-md bg-[#E89B2A] px-2.5 py-1 text-body-sm font-semibold text-ink shadow-sm">
                    {product.displayBadge}
                  </span>
                ) : null}
                <button
                  type="button"
                  className="absolute right-3 top-3 inline-flex size-11 items-center justify-center rounded-full border border-line bg-cream/95 text-forest shadow-sm backdrop-blur-sm"
                  aria-label="Add to wishlist (coming soon)"
                  disabled
                >
                  <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                    <path
                      d="M12 21s-6.5-4.35-9-8.75C.5 8.5 3 5 5.75 5 8 5 10 6.5 12 9c2-2.5 4-4 6.25-4C21 5 23.5 8.5 21 12.25 18.5 16.65 12 21 12 21z"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div className="lg:sticky lg:top-24 lg:z-10 lg:col-span-6 xl:col-span-5 lg:self-start lg:pt-8">
            <h1 className="mt-6 font-display text-[1.5rem] font-semibold tracking-[-0.02em] text-ink sm:text-[1.6875rem] lg:mt-0 lg:text-[1.875rem] xl:text-[2rem]">
              {product.name}
            </h1>
            <p className="mt-1.5 font-sans text-[0.9375rem] font-normal leading-snug text-ink lg:text-body-lg">
              {selected ? selected.name : "Select a pack size"}
            </p>

            {showRatings && summary ? (
              <p className="mt-3 flex flex-wrap items-center gap-2 font-sans text-[0.8125rem] text-ink leading-snug lg:text-body-sm">
                <StarRow rating={summary.averageRating} />
                <span className="font-semibold text-forest">{summary.averageRating.toFixed(1)}</span>
                <span className="text-ink">
                  ({summary.totalCount} {summary.totalCount === 1 ? "Review" : "Reviews"})
                </span>
              </p>
            ) : null}

            {selected ? (
              <div className="mt-5 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="font-sans text-[1.75rem] font-bold tabular-nums tracking-tight text-ink leading-none sm:text-[1.9375rem] lg:text-[2.125rem]">
                  {formatInr(sale)}
                </span>
                {mrp > sale ? (
                  <>
                    <span className="text-[0.9375rem] tabular-nums text-ink-muted line-through">{formatInr(mrp)}</span>
                    <span className="text-[0.8125rem] font-bold uppercase tracking-[0.04em] text-forest whitespace-nowrap">
                      ({off}% OFF)
                    </span>
                  </>
                ) : null}
              </div>
            ) : null}

            {!product.buyable ? (
              <p className="mt-4 rounded-lg border border-warning/40 bg-warning/10 p-3 text-body-sm text-forest">
                This product is not available for purchase right now ({product.effectiveVisibility ?? "check back soon"}).
              </p>
            ) : null}

            {siteBlocksPurchase && siteMode.endsAt ? (
              <div
                className="mt-4 rounded-lg border border-forest/25 bg-[#142920]/5 p-3 text-body-sm text-forest"
                role="status"
              >
                <p className="font-semibold uppercase tracking-wide">{siteMode.headline}</p>
                {siteMode.message ? <p className="mt-1 text-ink-soft">{siteMode.message}</p> : null}
                <p className="mt-2 font-mono text-body-sm font-semibold tabular-nums text-gold-deep">
                  <CountdownTimer endsAt={siteMode.endsAt} onExpire={() => void refreshSiteMode()} />
                </p>
                <p className="mt-1 text-ink-muted">Purchases are temporarily unavailable.</p>
              </div>
            ) : null}

            <ProductPdpFeatureStrip className="mt-7 lg:mt-8" />

            <div className="mt-8">
              <p className="font-sans text-[0.6875rem] font-bold uppercase leading-normal tracking-[0.14em] text-ink-soft">
                Select pack size
              </p>
              <div
                className="mt-3 flex gap-2.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:grid lg:grid-cols-2 lg:gap-2.5 lg:overflow-visible lg:pb-0 xl:grid-cols-3"
                role="group"
                aria-label="Pack size and price"
              >
                {product.variants.map((v) => {
                  const variantSale = moneyNumber(v.priceSale);
                  const variantMrp = moneyNumber(v.priceMrp);
                  const variantPurchasable =
                    product.buyable &&
                    !siteBlocksPurchase &&
                    (v.available > 0 || Boolean(product.allowBackorder) || Boolean(product.preorderEnabled));
                  const isActive = v.id === variantId;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setVariantId(v.id)}
                      disabled={!variantPurchasable}
                      className={`flex min-h-[3.625rem] min-w-[5.875rem] shrink-0 flex-col items-center justify-center rounded-[0.6875rem] px-3 py-2.5 text-center transition lg:min-h-[4rem] lg:w-full lg:min-w-0 lg:shrink ${
                        isActive
                          ? "border-[2px] border-forest bg-paper shadow-sm"
                          : "border border-line bg-transparent hover:border-line-dark/45"
                      } ${!variantPurchasable ? "opacity-55" : ""}`}
                      aria-pressed={isActive}
                    >
                      <span className="font-sans text-[0.875rem] font-semibold tabular-nums leading-tight tracking-tight text-ink">
                        {v.name}{" "}
                        <span className="whitespace-nowrap">{formatInr(variantSale)}</span>
                      </span>
                      {variantMrp > variantSale ? (
                        <span className="mt-0.5 block text-[0.6875rem] font-medium tabular-nums leading-none text-ink-muted line-through">
                          {formatInr(variantMrp)}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row xl:gap-4">
              <Button
                type="button"
                variant="primaryGoldInk"
                size="lg"
                className="w-full rounded-xl border-gold-deep/35 shadow-sm sm:flex-1 xl:flex-1"
                disabled={!canPurchase}
                onClick={handleAddToCart}
              >
                Add to cart
              </Button>
              <Button
                type="button"
                variant="primaryForest"
                size="lg"
                className="w-full rounded-xl shadow-sm sm:flex-1 xl:flex-1"
                disabled={!canPurchase}
                onClick={handleBuyNow}
              >
                Buy now
              </Button>
            </div>

            <ProductPdpTrustStrip product={product} className="mt-9 border-t border-line/70 pt-7" />
          </div>
        </div>

        <div className="mx-auto mt-10 max-w-lg space-y-10 lg:mt-16 lg:max-w-none lg:space-y-12">
          {product.slug.includes("energy-bite") ? (
            <section
              aria-labelledby="pdp-how-to-enjoy-heading"
              className="overflow-hidden rounded-2xl border border-line/60 bg-cream lg:mx-auto lg:max-w-4xl xl:max-w-5xl"
            >
              <h2 id="pdp-how-to-enjoy-heading" className="sr-only">
                How to enjoy
              </h2>
              <figure className="m-0 bg-cream px-2 py-3 sm:px-3 sm:py-4 lg:px-6 lg:py-6">
                <Image
                  src={HOW_TO_USE_SRC}
                  alt="How to enjoy: soak overnight for six to eight hours, eat in the morning for steady energy — add water, soak overnight, enjoy fresh."
                  width={1536}
                  height={1024}
                  className="h-auto w-full object-contain"
                  sizes="(max-width: 1024px) 100vw, 896px"
                  priority={false}
                />
              </figure>
            </section>
          ) : null}

          <ProductPdpAccordions product={product} className="lg:mx-auto lg:max-w-3xl xl:max-w-[42rem]" />

          {showNotifyMe && selected ? (
            <div className="lg:mx-auto lg:max-w-3xl">
              <NotifyMeForm variantId={selected.id} productLabel={`${product.name} — ${selected.name}`} />
            </div>
          ) : null}

          <p className="flex items-center justify-center gap-2 pb-6 text-body-sm text-ink-muted lg:pb-8">
            <svg className="size-4 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden stroke="currentColor" strokeWidth="2">
              <path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6l8-4z" strokeLinejoin="round" />
            </svg>
            100% Secure Payments
          </p>
        </div>
      </div>
    </div>
  );
}
