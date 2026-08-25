/**
 * Meta Pixel identifier resolution shared by the server gate and the client loader.
 */

/**
 * Production DiteUp Meta Pixel. A pixel ID is a public identifier (visible in page
 * source on every site that uses it), so shipping it in the client bundle is safe.
 * Admin `Setting.metaAds.pixelId` and the env vars still win when present.
 */
export const DEFAULT_META_PIXEL_ID = "1408377107972075";

/**
 * Returns the first non-empty candidate, trimmed, else the shipped default.
 *
 * @param candidates Ordered by precedence (highest first).
 */
export function resolveMetaPixelId(...candidates: (string | null | undefined)[]): string {
  for (const candidate of candidates) {
    const trimmed = candidate?.trim();
    if (trimmed) return trimmed;
  }
  return DEFAULT_META_PIXEL_ID;
}
