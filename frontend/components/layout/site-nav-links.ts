export type SiteNavLink = {
  href: string;
  /** Sentence-case label used in mobile drawer and for accessible name hints */
  label: string;
};

/**
 * Primary storefront anchors for header and footer; pass `shopHref` from {@link resolveShopNavHref}.
 */
export function buildPrimaryNavLinks(shopHref: string): SiteNavLink[] {
  return [
    { href: "/", label: "Home" },
    { href: shopHref, label: "Shop" },
    { href: "/#ingredients", label: "Ingredients" },
    { href: "/#reviews", label: "Reviews" },
    { href: "/#faq", label: "FAQ" },
  ];
}
