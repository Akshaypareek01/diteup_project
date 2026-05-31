import type { MetadataRoute } from "next";

import { INDEXABLE_STATIC_PATHS } from "@/lib/seo/public-pages";
import { absoluteUrl } from "@/lib/seo/site-url";
import { fetchSitemapProducts } from "@/lib/storefront-api";

/**
 * Builds indexable public URLs — static pages plus live published product slugs.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = INDEXABLE_STATIC_PATHS.map((path) => ({
    url: absoluteUrl(path),
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : 0.6,
  }));

  let productEntries: MetadataRoute.Sitemap = [];
  try {
    const products = await fetchSitemapProducts();
    productEntries = products.map((row) => ({
      url: absoluteUrl(`/product/${row.slug}`),
      lastModified: new Date(row.updatedAt),
      changeFrequency: "weekly",
      priority: 0.9,
    }));
  } catch {
    productEntries = [];
  }

  return [...staticEntries, ...productEntries];
}
