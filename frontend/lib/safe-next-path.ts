/**
 * Restricts a `?next=` redirect to a same-origin path (no protocol / protocol-relative URLs).
 */
export function safeNextPath(raw: string | null | undefined, fallback = "/account"): string {
  if (!raw) return fallback;
  return raw.startsWith("/") && !raw.includes("://") && !raw.includes("//") ? raw : fallback;
}
