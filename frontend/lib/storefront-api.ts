import { serverApiFetch, tryGetServerApiBase } from "@/lib/server-api";
import type { PublicProduct } from "@/lib/types/catalog";
import { INACTIVE_SITE_MODE, type PublicSiteMode } from "@/lib/types/site-mode";

/**
 * Loads active site-wide mode for banners and checkout gating.
 */
export async function fetchSiteMode(): Promise<PublicSiteMode> {
  if (!tryGetServerApiBase()) return INACTIVE_SITE_MODE;
  try {
    const res = await serverApiFetch("/v1/site/mode", { forwardCookies: false });
    if (!res.ok) return INACTIVE_SITE_MODE;
    const data = (await res.json()) as { siteMode?: PublicSiteMode };
    return data.siteMode ?? INACTIVE_SITE_MODE;
  } catch {
    return INACTIVE_SITE_MODE;
  }
}

/**
 * Resolves Meta Pixel ID from admin settings (`metaAds`) with env fallback.
 */
export async function fetchMetaPixelId(): Promise<string | null> {
  if (!tryGetServerApiBase()) {
    const envId = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim();
    return envId || null;
  }
  try {
    const res = await serverApiFetch("/v1/site/integrations", { forwardCookies: false });
    if (!res.ok) {
      const envId = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim();
      return envId || null;
    }
    const data = (await res.json()) as { metaPixelId?: string | null };
    const fromApi = data.metaPixelId?.trim();
    if (fromApi) return fromApi;
    const envId = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim();
    return envId || null;
  } catch {
    const envId = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim();
    return envId || null;
  }
}

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
 * PDP loader — 404 when unavailable. Includes embedded site mode when present.
 */
export async function fetchProductBySlug(
  slug: string,
): Promise<{ product: PublicProduct; siteMode: PublicSiteMode } | null> {
  if (!tryGetServerApiBase()) return null;
  try {
    const enc = encodeURIComponent(slug);
    const res = await serverApiFetch(`/v1/products/${enc}`, { forwardCookies: false });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    const data = (await res.json()) as { product?: PublicProduct; siteMode?: PublicSiteMode };
    if (!data.product) return null;
    return {
      product: data.product,
      siteMode: data.siteMode ?? INACTIVE_SITE_MODE,
    };
  } catch {
    return null;
  }
}
