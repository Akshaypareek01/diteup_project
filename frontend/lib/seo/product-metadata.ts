import type { Metadata } from "next";

import { buildSharedSocialMetadata } from "@/lib/seo/defaults";
import {
  parseProductSeo,
  resolveProductDescription,
  resolveProductOgImage,
  resolveProductTitle,
} from "@/lib/seo/product-seo";
import { absoluteUrl } from "@/lib/seo/site-url";
import type { PublicProduct } from "@/lib/types/catalog";

/**
 * Builds Next.js Metadata for a product detail page from catalog + SEO JSON.
 */
export function buildProductMetadata(product: PublicProduct): Metadata {
  const seo = parseProductSeo(product.seo);
  const title = resolveProductTitle(product);
  const description = resolveProductDescription(product);
  const path = `/product/${product.slug}`;
  const canonical = seo.canonical?.trim() || absoluteUrl(path);
  const ogImage = resolveProductOgImage(product);

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      locale: "en_IN",
      url: canonical,
      siteName: "DiteUp",
      title,
      description,
      images: ogImage
        ? [{ url: ogImage, alt: title }]
        : buildSharedSocialMetadata({ title, description, path, ogImage }).openGraph?.images,
    },
    twitter: buildSharedSocialMetadata({ title, description, path, ogImage }).twitter,
  };
}
