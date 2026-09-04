/** Normalizes `Review.images` JSON into display + lightbox URLs. */

export type ReviewPhoto = {
  display: string;
  full: string;
};

/**
 * Picks the first non-empty string from candidate URL fields.
 *
 * @param values candidate URLs
 */
function firstUrl(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

/**
 * Parses public review `images` (array of URL objects or strings).
 *
 * @param images `Review.images` JSON from the API
 */
export function parseReviewPhotos(images: unknown): ReviewPhoto[] {
  if (!Array.isArray(images)) return [];
  const photos: ReviewPhoto[] = [];
  for (const item of images) {
    if (typeof item === "string") {
      const url = item.trim();
      if (url) photos.push({ display: url, full: url });
      continue;
    }
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const display = firstUrl(row.medium, row.thumb, row.full, row.url);
    const full = firstUrl(row.full, row.url, row.medium, row.thumb);
    if (display && full) photos.push({ display, full });
  }
  return photos;
}
