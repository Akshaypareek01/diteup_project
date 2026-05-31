import type { Metadata } from "next";

import { absoluteUrl } from "@/lib/seo/site-url";

/** Launch defaults when admin `siteSeo` is unset. */
export const DEFAULT_SITE_TITLE = "DiteUp — Clean Nutrition, Zero Hassle";
export const DEFAULT_SITE_DESCRIPTION =
  "Pre-portioned soaked breakfast packs with 10 powerful ingredients. High protein, no added sugar — just soak overnight and start your day the smart way. Ships across India.";

/**
 * Default OG image path (1200×630 banner art on CDN/static host).
 */
export function defaultOgImageUrl(): string {
  return absoluteUrl("/assets/Images/desktop_banner_light.png");
}

/**
 * Shared Open Graph + Twitter defaults for public marketing pages.
 */
export function buildSharedSocialMetadata(input: {
  title: string;
  description: string;
  path?: string;
  ogImage?: string | null;
  twitterHandle?: string | null;
}): Pick<Metadata, "openGraph" | "twitter" | "alternates"> {
  const url = absoluteUrl(input.path ?? "/");
  const image = input.ogImage?.trim() || defaultOgImageUrl();

  return {
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: "en_IN",
      url,
      siteName: "DiteUp",
      title: input.title,
      description: input.description,
      images: [{ url: image, width: 1200, height: 630, alt: input.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
      images: [image],
      ...(input.twitterHandle ? { site: `@${input.twitterHandle.replace(/^@/, "")}` } : {}),
    },
  };
}
