import type { PublicSiteMode } from "@/lib/types/site-mode";
import { fetchSiteMode } from "@/lib/storefront-api";
import { SiteModeStrip } from "@/components/site-mode/SiteModeStrip";

/**
 * Server wrapper — fetches site mode and renders the promo strip when active.
 */
export async function SiteModeBanner() {
  const siteMode = await fetchSiteMode();
  return <SiteModeStrip siteMode={siteMode} />;
}

export type { PublicSiteMode };
