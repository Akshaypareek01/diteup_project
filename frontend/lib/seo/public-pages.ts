/** Indexable static marketing/legal routes (no trailing slash). */
export const INDEXABLE_STATIC_PATHS = [
  "",
  "/contact",
  "/terms",
  "/privacy",
  "/refund-policy",
  "/shipping-policy",
] as const;

/** Paths blocked in robots.txt and excluded from sitemap.xml. */
export const ROBOTS_DISALLOW_PATHS = [
  "/admin",
  "/api",
  "/account",
  "/cart",
  "/checkout",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/order",
] as const;
