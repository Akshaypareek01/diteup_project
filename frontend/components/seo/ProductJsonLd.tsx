import { JsonLdScript } from "@/components/seo/JsonLdScript";
import { resolveProductOgImage } from "@/lib/seo/product-seo";
import { absoluteUrl } from "@/lib/seo/site-url";
import { moneyNumber } from "@/lib/format-money";
import type { PublicProduct } from "@/lib/types/catalog";
import type { PublicReviewSummary } from "@/lib/types/reviews";

type ProductJsonLdProps = {
  product: PublicProduct;
  reviewSummary?: PublicReviewSummary | null;
};

/**
 * Product + Offer (+ AggregateRating when reviews exist) JSON-LD for PDP.
 */
export function ProductJsonLd({ product, reviewSummary }: ProductJsonLdProps) {
  const variant = product.variants.find((v) => v.isDefault) ?? product.variants[0];
  const image = resolveProductOgImage(product);
  const price = variant ? moneyNumber(variant.priceSale) : undefined;
  const mrp = variant ? moneyNumber(variant.priceMrp) : undefined;

  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDesc ?? product.description ?? product.name,
    sku: variant?.sku,
    url: absoluteUrl(`/product/${product.slug}`),
    ...(image ? { image: [image] } : {}),
    offers: {
      "@type": "Offer",
      url: absoluteUrl(`/product/${product.slug}`),
      priceCurrency: "INR",
      availability:
        product.buyable && (variant?.available ?? 0) > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      ...(price !== undefined ? { price: price.toFixed(2) } : {}),
      ...(mrp !== undefined && mrp > (price ?? 0)
        ? { priceValidUntil: new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10) }
        : {}),
    },
  };

  if (reviewSummary && reviewSummary.totalCount > 0) {
    data.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: reviewSummary.averageRating.toFixed(1),
      reviewCount: reviewSummary.totalCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return <JsonLdScript data={data} />;
}
