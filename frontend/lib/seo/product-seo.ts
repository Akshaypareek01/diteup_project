import type { PublicProduct } from "@/lib/types/catalog";

/** Admin product Tab 12 — SEO JSON shape. */
export type ProductSeoJson = {
  title?: string;
  description?: string;
  ogImage?: string;
  canonical?: string;
};

/**
 * Parses `Product.seo` JSON from the catalog API into typed fields.
 */
export function parseProductSeo(raw: unknown): ProductSeoJson {
  if (!raw || typeof raw !== "object") return {};
  const obj = raw as Record<string, unknown>;
  return {
    title: typeof obj.title === "string" ? obj.title : undefined,
    description: typeof obj.description === "string" ? obj.description : undefined,
    ogImage: typeof obj.ogImage === "string" ? obj.ogImage : undefined,
    canonical: typeof obj.canonical === "string" ? obj.canonical : undefined,
  };
}

/**
 * Resolves PDP hero image URL for OG tags and JSON-LD.
 */
export function resolveProductOgImage(product: PublicProduct): string | undefined {
  const seo = parseProductSeo(product.seo);
  if (seo.ogImage?.trim()) return seo.ogImage.trim();
  const first = product.media?.[0];
  if (first?.url?.trim()) return first.url.trim();
  return undefined;
}

/**
 * Resolves human-readable PDP title for metadata.
 */
export function resolveProductTitle(product: PublicProduct): string {
  const seo = parseProductSeo(product.seo);
  if (seo.title?.trim()) return seo.title.trim();
  return product.name;
}

/**
 * Resolves PDP meta description with fallbacks.
 */
export function resolveProductDescription(product: PublicProduct): string {
  const seo = parseProductSeo(product.seo);
  if (seo.description?.trim()) return seo.description.trim();
  if (product.shortDesc?.trim()) return product.shortDesc.trim();
  if (product.description?.trim()) {
    const plain = product.description.replace(/\s+/g, " ").trim();
    return plain.length > 160 ? `${plain.slice(0, 157)}…` : plain;
  }
  return `Buy ${product.name} on DiteUp — clean nutrition delivered across India.`;
}
