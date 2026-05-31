/**
 * Canonical public site origin for metadata, sitemap, and JSON-LD.
 */
export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (raw) {
    return raw.replace(/\/$/, "");
  }
  if (process.env.NODE_ENV === "production") {
    return "https://diteup.com";
  }
  return "http://localhost:3000";
}

/**
 * Builds an absolute URL from a site-relative path.
 */
export function absoluteUrl(path: string): string {
  const base = getSiteUrl();
  if (!path || path === "/") return `${base}/`;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
