"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { FlowHeader } from "@/components/layout/FlowHeader";
import { IconPlaceholder } from "@/components/placeholders/IconPlaceholder";
import { ImagePlaceholder } from "@/components/placeholders/ImagePlaceholder";
import { Button } from "@/components/ui/Button";
import { useCartDrawer } from "@/components/cart/CartDrawerProvider";
import { useCartState } from "@/components/cart/CartStateProvider";
import { formatInr, moneyNumber } from "@/lib/format-money";
import type { PublicProduct } from "@/lib/types/catalog";
import type { ProductReviewsPayload } from "@/lib/types/reviews";
import { pixelAddToCart } from "@/lib/meta-pixel-events";
import { NotifyMeForm } from "@/components/product/NotifyMeForm";
import { ProductReviewsSection } from "@/components/product/ProductReviewsSection";

export type ProductDetailClientProps = {
  product: PublicProduct;
  reviews: ProductReviewsPayload | null;
};

/**
 * Interactive PDP: variant selection, add to cart, buy now with live pricing labels.
 */
export function ProductDetailClient({ product, reviews }: ProductDetailClientProps) {
  const router = useRouter();
  const { addLine, replaceWithLine } = useCartState();
  const { openCart } = useCartDrawer();

  const defaultVariant = useMemo(
    () => product.variants.find((v) => v.isDefault) ?? product.variants[0],
    [product.variants],
  );
  const [variantId, setVariantId] = useState(defaultVariant?.id ?? "");

  const selected = product.variants.find((v) => v.id === variantId) ?? defaultVariant;
  const sale = selected ? moneyNumber(selected.priceSale) : 0;
  const mrp = selected ? moneyNumber(selected.priceMrp) : 0;
  const off = mrp > sale ? Math.round(((mrp - sale) / mrp) * 100) : 0;

  const primaryMedia = product.media?.[0];

  function handleAddToCart() {
    if (!selected || !product.buyable) return;
    const qty = 1;
    const lineValue = sale * qty;
    addLine({
      variantId: selected.id,
      slug: product.slug,
      productName: product.name,
      variantName: selected.name,
      quantity: qty,
    });
    pixelAddToCart({
      content_ids: [selected.id],
      value: lineValue,
      currency: "INR",
      num_items: qty,
    });
    openCart();
  }

  function handleBuyNow() {
    if (!selected || !product.buyable) return;
    replaceWithLine({
      variantId: selected.id,
      quantity: 1,
      slug: product.slug,
      productName: product.name,
      variantName: selected.name,
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
    (selected!.available > 0 || Boolean(product.allowBackorder) || Boolean(product.preorderEnabled));

  const showNotifyMe = Boolean(selected) && !canPurchase && product.slug;

  return (
    <div className="min-h-screen bg-cream pb-28">
      <FlowHeader backHref="/" />
      <div className="mx-auto max-w-lg px-4 py-4">
        <nav aria-label="Breadcrumb" className="text-body-sm text-ink-muted">
          <Link href="/" className="hover:text-forest">
            Home
          </Link>
          <span aria-hidden> / </span>
          <span className="text-forest">{product.name}</span>
        </nav>

        <div className="relative mt-4">
          {primaryMedia?.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={primaryMedia.url}
              alt={primaryMedia.altText ?? product.name}
              className="w-full rounded-2xl object-cover aspect-square"
            />
          ) : (
            <ImagePlaceholder variant="gallery" label={`PDP — ${product.name}`} />
          )}
          {product.displayBadge ? (
            <span className="absolute left-3 top-3 rounded-full bg-gold px-3 py-1 font-mono text-eyebrow text-forest">
              {product.displayBadge}
            </span>
          ) : null}
          <button
            type="button"
            className="absolute right-3 top-3 inline-flex size-11 items-center justify-center rounded-full bg-cream/90 shadow-sm"
            aria-label="Add to wishlist (coming soon)"
            disabled
          >
            <IconPlaceholder label="Heart / wishlist icon" size="md" />
          </button>
        </div>

        <h1 className="font-display text-display-md mt-6 text-forest">{product.name}</h1>
        <p className="text-body-sm text-ink-muted">
          {selected ? `${selected.name}` : "Select a variant"}
          {product.reviewsEnabled ? " · Reviews enabled" : ""}
        </p>
        {selected ? (
          <p className="mt-3 text-2xl font-semibold text-forest">
            {formatInr(sale)}{" "}
            {mrp > sale ? (
              <>
                <span className="text-lg font-normal text-ink-muted line-through">{formatInr(mrp)}</span>{" "}
                <span className="text-body-sm font-semibold text-success">({off}% OFF)</span>
              </>
            ) : null}
          </p>
        ) : null}

        {!product.buyable ? (
          <p className="mt-4 rounded-lg border border-warning/40 bg-warning/10 p-3 text-body-sm text-forest">
            This product is not available for purchase right now ({product.effectiveVisibility ?? "check back soon"}).
          </p>
        ) : null}

        <div className="mt-8">
          <p className="font-mono text-eyebrow text-ink-muted">Select variant</p>
          <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Product variant">
            {product.variants.map((v) => {
              const variantPurchasable =
                product.buyable &&
                (v.available > 0 || Boolean(product.allowBackorder) || Boolean(product.preorderEnabled));
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setVariantId(v.id)}
                  className={`h-11 min-w-[4.5rem] rounded-lg border px-4 font-medium ${
                    v.id === variantId
                      ? "border-forest bg-forest text-cream"
                      : !variantPurchasable
                        ? "border-line bg-beige/50 text-ink-muted opacity-90"
                        : "border-line bg-paper text-forest"
                  }`}
                >
                  {v.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            variant="primaryGold"
            size="lg"
            className="flex-1"
            disabled={!canPurchase}
            onClick={handleAddToCart}
          >
            Add to cart
          </Button>
          <Button
            type="button"
            variant="primaryForest"
            size="lg"
            className="flex-1"
            disabled={!canPurchase}
            onClick={handleBuyNow}
          >
            Buy now
          </Button>
        </div>

        {showNotifyMe && selected ? (
          <NotifyMeForm variantId={selected.id} productLabel={`${product.name} — ${selected.name}`} />
        ) : null}

        {product.reviewsEnabled ? (
          <ProductReviewsSection productName={product.name} payload={reviews} />
        ) : null}
      </div>
    </div>
  );
}
