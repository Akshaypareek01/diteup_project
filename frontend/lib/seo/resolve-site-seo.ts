import type { Metadata } from "next";

import {
  DEFAULT_SITE_DESCRIPTION,
  DEFAULT_SITE_TITLE,
  buildSharedSocialMetadata,
  defaultOgImageUrl,
} from "@/lib/seo/defaults";
import { getSiteUrl } from "@/lib/seo/site-url";
import { serverApiFetch, tryGetServerApiBase } from "@/lib/server-api";

/** Admin `Setting` key `siteSeo` — public subset for SSR metadata. */
export type PublicSiteSeo = {
  siteTitle: string;
  defaultDescription: string;
  defaultOgImage: string;
  twitterHandle: string | null;
  googleSiteVerification: string | null;
  organizationName: string;
  organizationLogo: string;
  contactEmail: string;
};

const DEFAULTS: PublicSiteSeo = {
  siteTitle: DEFAULT_SITE_TITLE,
  defaultDescription: DEFAULT_SITE_DESCRIPTION,
  defaultOgImage: defaultOgImageUrl(),
  twitterHandle: null,
  googleSiteVerification: null,
  organizationName: "DiteUp",
  organizationLogo: defaultOgImageUrl(),
  contactEmail: "info@diteup.com",
};

/**
 * Loads public site-wide SEO settings from the API with safe fallbacks.
 */
export async function resolveSiteSeo(): Promise<PublicSiteSeo> {
  if (!tryGetServerApiBase()) return DEFAULTS;
  try {
    const res = await serverApiFetch("/v1/site/seo", { forwardCookies: false });
    if (!res.ok) return DEFAULTS;
    const data = (await res.json()) as Partial<PublicSiteSeo>;
    return {
      siteTitle: data.siteTitle?.trim() || DEFAULTS.siteTitle,
      defaultDescription: data.defaultDescription?.trim() || DEFAULTS.defaultDescription,
      defaultOgImage: data.defaultOgImage?.trim() || DEFAULTS.defaultOgImage,
      twitterHandle: data.twitterHandle?.trim() || null,
      googleSiteVerification: data.googleSiteVerification?.trim() || null,
      organizationName: data.organizationName?.trim() || DEFAULTS.organizationName,
      organizationLogo: data.organizationLogo?.trim() || DEFAULTS.organizationLogo,
      contactEmail: data.contactEmail?.trim() || DEFAULTS.contactEmail,
    };
  } catch {
    return DEFAULTS;
  }
}

/**
 * Root layout metadata — merges admin SEO settings with Next.js Metadata API defaults.
 */
export function buildRootMetadata(siteSeo: PublicSiteSeo): Metadata {
  const siteUrl = getSiteUrl();
  const social = buildSharedSocialMetadata({
    title: siteSeo.siteTitle,
    description: siteSeo.defaultDescription,
    path: "/",
    ogImage: siteSeo.defaultOgImage,
    twitterHandle: siteSeo.twitterHandle,
  });

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: siteSeo.siteTitle,
      template: "%s · DiteUp",
    },
    description: siteSeo.defaultDescription,
    referrer: "strict-origin-when-cross-origin",
    ...social,
    ...(siteSeo.googleSiteVerification
      ? { verification: { google: siteSeo.googleSiteVerification } }
      : {}),
  };
}

/**
 * Home page metadata — keyword-rich override while inheriting site SEO fallbacks.
 */
export function buildHomeMetadata(siteSeo: PublicSiteSeo): Metadata {
  const title =
    "Soaked Breakfast Packs — High Protein, No Added Sugar | DiteUp";
  const description = siteSeo.defaultDescription;

  return {
    title: { absolute: title },
    description,
    ...buildSharedSocialMetadata({
      title,
      description,
      path: "/",
      ogImage: siteSeo.defaultOgImage,
      twitterHandle: siteSeo.twitterHandle,
    }),
  };
}
