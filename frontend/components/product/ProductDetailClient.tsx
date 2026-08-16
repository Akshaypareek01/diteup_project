"use client";

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
import { ProductImageGallery } from "@/components/product/ProductImageGallery";
import { NotifyMeForm } from "@/components/product/NotifyMeForm";
import { ProductPdpAccordions } from "@/components/product/ProductPdpAccordions";
import { ProductPdpAplusContent } from "@/components/product/ProductPdpAplusContent";
import { ProductPdpDeliveryCheck } from "@/components/product/ProductPdpDeliveryCheck";
import { ProductPdpFeatureStrip } from "@/components/product/ProductPdpFeatureStrip";
import { ProductPdpRatingsRow } from "@/components/product/ProductPdpRatingsRow";
import { ProductPdpReviews } from "@/components/product/ProductPdpReviews";
import { ProductPdpUspHighlight } from "@/components/product/ProductPdpUspHighlight";
import {
  computeVariantPricesPerKg,
  findBestValueVariantId,
} from "@/lib/pdp-variant-pricing";

/** Clean packaging cutout for cart / summaries when CMS media is empty. */
const ENERGY_CART_PACKAGING_SRC = "/assets/Images/prodcut_clean.webp";

export type ProductDetailClientProps = {
  product: PublicProduct;
  reviews: ProductReviewsPayload | null;
};

/**
 * Thumbnail for cart rows: first CMS image, else local packaging fallback.
 */
function resolveCartLineImage(product: PublicProduct): { imageSrc: string; imageAlt: string } {
  const first = (product.media ?? [])
    .filter((m) => Boolean(m?.url) && (m.type ?? "IMAGE").toUpperCase() !== "VIDEO")
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))[0];
  if (first?.url) {
    return { imageSrc: first.url, imageAlt: first.altText ?? product.name };
  }
  return { imageSrc: ENERGY_CART_PACKAGING_SRC, imageAlt: `${product.name} — packaging` };
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
  const perKgByVariant = useMemo(
    () => new Map(computeVariantPricesPerKg(product.variants).map((row) => [row.variantId, row])),
    [product.variants],
  );
  const bestValueVariantId = useMemo(() => findBestValueVariantId(product.variants), [product.variants]);
  const [variantId, setVariantId] = useState(defaultVariant?.id ?? "");

  const selected = product.variants.find((v) => v.id === variantId) ?? defaultVariant;
  const sale = selected ? moneyNumber(selected.priceSale) : 0;
  const mrp = selected ? moneyNumber(selected.priceMrp) : 0;
  const off = mrp > sale ? Math.round(((mrp - sale) / mrp) * 100) : 0;

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
            <ProductImageGallery product={product} />
          </div>

          <div className="lg:sticky lg:top-24 lg:z-10 lg:col-span-6 xl:col-span-5 lg:self-start lg:pt-8">
            <h1 className="mt-6 font-display text-[1.5rem] font-semibold tracking-[-0.02em] text-ink sm:text-[1.6875rem] lg:mt-0 lg:text-[1.875rem] xl:text-[2rem]">
              {product.name}
            </h1>
            <p className="mt-1.5 font-sans text-[0.9375rem] font-normal leading-snug text-ink lg:text-body-lg">
              {selected ? selected.name : "Select a pack size"}
            </p>

            <ProductPdpUspHighlight className="mt-3" />

            <ProductPdpRatingsRow
              summary={summary}
              reviewsEnabled={product.reviewsEnabled}
              className="mt-3"
            />

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
                  const perKg = perKgByVariant.get(v.id);
                  const isBestValue = bestValueVariantId === v.id && Boolean(perKg);
                  const variantPurchasable =
                    product.buyable &&
                    !siteBlocksPurchase &&
                    (v.available > 0 || Boolean(product.allowBackorder) || Boolean(product.preorderEnabled));
                  const isActive = v.id === variantId;
                  return (
                    <div key={v.id} className="relative shrink-0 pt-3 lg:w-full lg:shrink">
                      {perKg ? (
                        <span
                          className={`absolute left-1/2 top-0 z-10 -translate-x-1/2 whitespace-nowrap rounded-full px-2 py-0.5 font-sans text-[0.625rem] font-semibold tabular-nums leading-none sm:text-[0.6875rem] ${
                            isBestValue
                              ? "bg-error text-cream"
                              : "border border-line bg-paper text-ink"
                          }`}
                        >
                          {isBestValue ? "🔥 " : ""}
                          {perKg.formattedPerKg}/kg
                        </span>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => setVariantId(v.id)}
                        disabled={!variantPurchasable}
                        className={`flex min-h-[3.625rem] min-w-[5.875rem] w-full flex-col items-center justify-center rounded-[0.6875rem] px-3 py-2.5 text-center transition lg:min-h-[4rem] lg:min-w-0 ${
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
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-7 flex flex-col gap-3">
              <Button
                type="button"
                variant="primaryForest"
                size="lg"
                className="w-full rounded-xl shadow-md sm:shadow-lg"
                disabled={!canPurchase}
                onClick={handleBuyNow}
              >
                Buy now
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="lg"
                className="w-full rounded-xl"
                disabled={!canPurchase}
                onClick={handleAddToCart}
              >
                Add to cart
              </Button>
            </div>

            <ProductPdpDeliveryCheck className="mt-8" />
          </div>
        </div>

        <div className="mx-auto mt-10 max-w-lg space-y-10 lg:mt-16 lg:max-w-none lg:space-y-12">
          <ProductPdpAplusContent className="lg:mx-auto lg:max-w-4xl xl:max-w-5xl" />

          <ProductPdpAccordions product={product} className="lg:mx-auto lg:max-w-3xl xl:max-w-[42rem]" />

          <ProductPdpReviews
            productName={product.name}
            reviewsEnabled={product.reviewsEnabled}
            payload={reviews}
            className="lg:mx-auto lg:max-w-4xl xl:max-w-5xl"
          />

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
