/**
 * Homepage hero banners — `Setting` key `homepageBanners`.
 */
import { prisma } from "../utils/prisma.js";
import { ServiceUnavailable, ValidationError } from "../utils/errors.js";
import { presignUpload, uploadScopedObject, type PresignResult, type StoredObject } from "./storage.js";

export const MAX_HOMEPAGE_BANNERS = 8;

export type HomepageBannerSlide = {
  id: string;
  desktopUrl: string;
  mobileUrl: string;
  href: string;
  alt: string;
  order: number;
};

export type HomepageBannersSetting = {
  slides: HomepageBannerSlide[];
};

/**
 * Public, ordered slides for the storefront hero.
 */
export async function getPublicHomepageBanners(): Promise<HomepageBannersSetting> {
  const row = await prisma.setting.findUnique({ where: { key: "homepageBanners" } });
  const raw =
    row?.value && typeof row.value === "object" && row.value !== null
      ? (row.value as { slides?: unknown })
      : {};
  const slides = Array.isArray(raw.slides) ? raw.slides : [];
  const parsed: HomepageBannerSlide[] = [];

  for (const item of slides) {
    if (!item || typeof item !== "object") continue;
    const s = item as Record<string, unknown>;
    const desktopUrl = typeof s.desktopUrl === "string" ? s.desktopUrl.trim() : "";
    const mobileUrl = typeof s.mobileUrl === "string" ? s.mobileUrl.trim() : "";
    const href = typeof s.href === "string" ? s.href.trim() : "";
    if (!desktopUrl || !mobileUrl || !href) continue;
    parsed.push({
      id: typeof s.id === "string" && s.id.trim() ? s.id.trim() : `slide-${parsed.length}`,
      desktopUrl,
      mobileUrl,
      href,
      alt: typeof s.alt === "string" ? s.alt.trim() : "",
      order: Number.isFinite(Number(s.order)) ? Number(s.order) : parsed.length,
    });
  }

  parsed.sort((a, b) => a.order - b.order);
  return { slides: parsed.slice(0, MAX_HOMEPAGE_BANNERS) };
}

/**
 * Presigned PUT for a homepage banner image (`scope: banners`).
 */
export async function presignHomepageBanner(contentType: string): Promise<PresignResult | null> {
  return presignUpload({
    scope: "banners",
    ownerId: "homepage",
    contentType,
  });
}

const ALLOWED_BANNER_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

/**
 * Admin banner bytes → R2 via the API (no browser CORS).
 */
export async function uploadHomepageBannerImage(input: {
  contentType: string;
  buffer: Buffer;
}): Promise<StoredObject> {
  if (!ALLOWED_BANNER_TYPES.has(input.contentType)) {
    throw ValidationError("Use JPEG, PNG, or WebP images only.");
  }
  if (!input.buffer?.length) {
    throw ValidationError("Empty image upload.");
  }
  if (input.buffer.length > 8 * 1024 * 1024) {
    throw ValidationError("Each banner must be 8MB or smaller.");
  }
  const stored = await uploadScopedObject({
    scope: "banners",
    ownerId: "homepage",
    contentType: input.contentType,
    buffer: input.buffer,
  });
  if (!stored) {
    throw ServiceUnavailable("File uploads are not configured");
  }
  return stored;
}
