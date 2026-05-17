import { cache } from "react";

import { fetchFeaturedProduct } from "@/lib/storefront-api";

/**
 * Resolves the storefront “Shop” nav target: optional public slug override, else featured PDP, else home hero anchor.
 */
export const resolveShopNavHref = cache(async (): Promise<string> => {
  const fromEnv = process.env.NEXT_PUBLIC_SHOP_PRODUCT_SLUG?.trim();
  if (fromEnv) {
    return `/product/${encodeURIComponent(fromEnv)}`;
  }
  const featured = await fetchFeaturedProduct();
  if (featured?.slug) {
    return `/product/${encodeURIComponent(featured.slug)}`;
  }
  return "/#shop";
});
