import type { MetadataRoute } from "next";
import { fetchFeaturedProduct } from "@/lib/storefront-api";

/**
 * Builds public URLs — adds live featured product slug when the API exposes one.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://diteup.com";
  const paths = [
    "",
    "/cart",
    "/checkout",
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/account",
    "/terms",
    "/privacy",
    "/refund-policy",
    "/shipping-policy",
    "/contact",
  ];

  let featuredSlug: string | undefined;
  try {
    featuredSlug = (await fetchFeaturedProduct())?.slug;
  } catch {
    featuredSlug = undefined;
  }
  if (featuredSlug) {
    paths.push(`/product/${featuredSlug}`);
  }

  const unique = Array.from(new Set(paths));
  return unique.map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
  }));
}
