/**
 * Server-side image derivatives (PRD §6.7.4 / §9.4) via Sharp.
 */
import sharp from "sharp";

import { logger } from "../utils/logger.js";

export type ImageVariantTarget = {
  /** Logical name e.g. thumb, medium */
  name: string;
  maxWidth: number;
  maxHeight: number;
  format: "webp" | "jpeg";
  quality: number;
};

const DEFAULT_TARGETS: ImageVariantTarget[] = [
  { name: "thumb", maxWidth: 200, maxHeight: 200, format: "webp", quality: 78 },
  { name: "medium", maxWidth: 800, maxHeight: 800, format: "webp", quality: 82 },
  { name: "full", maxWidth: 1600, maxHeight: 1600, format: "webp", quality: 86 },
];

/**
 * Emits resized WebP (or JPEG) buffers per target; strips most metadata via Sharp defaults.
 */
export async function deriveImageVariants(
  input: Buffer,
  targets: ImageVariantTarget[] = DEFAULT_TARGETS,
): Promise<Record<string, Buffer>> {
  const out: Record<string, Buffer> = {};
  for (const t of targets) {
    try {
      let pipeline = sharp(input).rotate().resize(t.maxWidth, t.maxHeight, {
        fit: "inside",
        withoutEnlargement: true,
      });
      if (t.format === "webp") {
        pipeline = pipeline.webp({ quality: t.quality });
      } else {
        pipeline = pipeline.jpeg({ quality: t.quality, mozjpeg: true });
      }
      out[t.name] = await pipeline.toBuffer();
    } catch (err) {
      logger.error({ err, target: t.name }, "deriveImageVariants failed for target");
    }
  }
  return out;
}

/**
 * Returns true when Sharp is available (always when this module loads).
 */
export function isImageProcessingAvailable(): boolean {
  return true;
}
