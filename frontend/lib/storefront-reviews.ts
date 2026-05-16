import { serverApiFetch, tryGetServerApiBase } from "@/lib/server-api";
import type { ProductReviewsPayload } from "@/lib/types/reviews";

/**
 * Loads approved reviews for a product slug (SSR). Returns null when API unavailable or slug empty.
 */
export async function fetchProductReviewsBySlug(
  slug: string,
  query: Record<string, string> = {},
): Promise<ProductReviewsPayload | null> {
  if (!tryGetServerApiBase() || !slug) return null;
  const qp = new URLSearchParams(query);
  if (!qp.has("page")) qp.set("page", "1");
  if (!qp.has("pageSize")) qp.set("pageSize", "12");
  const enc = encodeURIComponent(slug);
  try {
    const res = await serverApiFetch(`/v1/products/${enc}/reviews?${qp.toString()}`, {
      forwardCookies: false,
    });
    if (!res.ok) return null;
    return (await res.json()) as ProductReviewsPayload;
  } catch {
    return null;
  }
}
