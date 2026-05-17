import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { SiteHeaderBar } from "@/components/layout/SiteHeaderBar";
import { buildPrimaryNavLinks } from "@/components/layout/site-nav-links";
import { resolveShopNavHref } from "@/lib/resolve-shop-nav-href";

export type SiteHeaderProps = {
  variant?: "default" | "compact";
};

/**
 * Marketing header: evergreen promo strip, cream nav row with logo, desktop links, toolbar icons.
 */
export async function SiteHeader({ variant = "default" }: SiteHeaderProps) {
  const isCompact = variant === "compact";
  const shopHref = await resolveShopNavHref();
  const navLinks = buildPrimaryNavLinks(shopHref);
  return (
    <header className="sticky top-0 z-50">
      <AnnouncementBar />
      <SiteHeaderBar isCompact={isCompact} navLinks={navLinks} />
    </header>
  );
}
