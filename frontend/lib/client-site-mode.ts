import { INACTIVE_SITE_MODE, type PublicSiteMode } from "@/lib/types/site-mode";

/**
 * Browser fetch for live site mode — uses Next `/v1` rewrite, never cached at build time.
 */
export async function fetchSiteModeClient(): Promise<PublicSiteMode> {
  try {
    const res = await fetch("/v1/site/mode", { cache: "no-store" });
    if (!res.ok) return INACTIVE_SITE_MODE;
    const data = (await res.json()) as { siteMode?: PublicSiteMode };
    return data.siteMode ?? INACTIVE_SITE_MODE;
  } catch {
    return INACTIVE_SITE_MODE;
  }
}
