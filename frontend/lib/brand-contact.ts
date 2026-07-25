/**
 * Single source of truth for public-facing brand contact + regulatory values.
 *
 * ⚠️ HUMAN CONFIRMATION REQUIRED before launch — see each field below.
 * These are surfaced across the footer, contact form, legal/policy pages, FAQ,
 * and the regulatory trust strip. Keep them here so they can never drift apart.
 */

/**
 * Canonical customer support / contact email.
 * NOTE: unified to `info@diteup.com` (used by footer, all legal pages, and site SEO).
 * ⚠️ CONFIRM this is the correct public support address before launch.
 */
export const SUPPORT_EMAIL = "info@diteup.com";

/**
 * FSSAI licence number shown on policy pages, the FAQ, and the regulatory strip.
 * Override in deployment via `NEXT_PUBLIC_FSSAI_LICENSE_NO`.
 * ⚠️ CONFIRM the correct licence number before launch — this value (`20526004000209`)
 *    is taken from the policies document; a previously-used `10112233400234` was a
 *    self-described dummy default and has been removed.
 */
export const FSSAI_LICENSE_NO =
  typeof process.env.NEXT_PUBLIC_FSSAI_LICENSE_NO === "string" &&
  process.env.NEXT_PUBLIC_FSSAI_LICENSE_NO.trim().length > 0
    ? process.env.NEXT_PUBLIC_FSSAI_LICENSE_NO.trim()
    : "20526004000209";

/** A social profile link. An empty `href` means "no real URL yet" and hides the icon. */
export type SocialLink = {
  label: string;
  /**
   * Real profile URL. Leave as an empty string to HIDE the icon entirely
   * (we never link to a bare instagram.com / facebook.com / youtube.com homepage).
   * ⚠️ Paste the real DiteUp profile URL here to re-show the icon.
   */
  href: string;
};

/**
 * Footer social links.
 * ⚠️ HUMAN TODO before/after launch: paste the real DiteUp profile URLs below.
 *    Any link left as "" is hidden in the footer (see SiteFooter); adding a URL re-shows it.
 */
export const SOCIAL_LINKS: readonly SocialLink[] = [
  { label: "Instagram", href: "" },
  { label: "Facebook", href: "" },
  { label: "YouTube", href: "" },
] as const;

/** True when a social link has a real URL and should be rendered. */
export function isRealSocialLink(link: SocialLink): boolean {
  return link.href.trim().length > 0;
}
