import { serverApiFetch, tryGetServerApiBase } from "@/lib/server-api";
import type { PublicProduct } from "@/lib/types/catalog";

/**
 * Loads the featured product for the home page (best-effort when API is down).
 */
export async function fetchFeaturedProduct(): Promise<PublicProduct | null> {
  if (!tryGetServerApiBase()) return null;
  try {
    const res = await serverApiFetch("/v1/products/featured", { forwardCookies: false });
    if (!res.ok) return null;
    const data = (await res.json()) as { product?: PublicProduct };
    return data.product ?? null;
  } catch {
    return null;
  }
}

/**
 * PDP loader — 404 when unavailable.
 */
export async function fetchProductBySlug(slug: string): Promise<PublicProduct | null> {
  if (!tryGetServerApiBase()) return null;
  try {
    const enc = encodeURIComponent(slug);
    const res = await serverApiFetch(`/v1/products/${enc}`, { forwardCookies: false });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    const data = (await res.json()) as { product?: PublicProduct };
    return data.product ?? null;
  } catch {
    return null;
  }
}
