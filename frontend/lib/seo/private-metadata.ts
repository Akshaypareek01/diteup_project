import type { Metadata } from "next";

/** Robots directive for auth, checkout, cart, account, and admin surfaces. */
export const NOINDEX_ROBOTS: Metadata["robots"] = {
  index: false,
  follow: false,
};

/**
 * Metadata for pages that must not appear in search results.
 */
export function buildPrivatePageMetadata(title: string, description?: string): Metadata {
  return {
    title,
    ...(description ? { description } : {}),
    robots: NOINDEX_ROBOTS,
  };
}
