/**
 * PRD §6.7.4 — fetch review originals, emit Sharp derivatives, upload to R2.
 */
import { prisma } from "../utils/prisma.js";
import { logger } from "../utils/logger.js";
import { deriveImageVariants } from "../services/imageProcessor.js";
import { uploadPublicBuffer } from "../services/storage.js";
import type { ReviewImageInput } from "../services/review.js";

export type ProcessReviewImageJobPayload = {
  reviewId: string;
  imageKey: string;
};

/**
 * Fire-and-forget hook (admin approve or future queue).
 */
export function scheduleReviewImageProcessing(payload: ProcessReviewImageJobPayload): void {
  void processReviewImagesForReview(payload.reviewId).catch((err) =>
    logger.error({ err, reviewId: payload.reviewId }, "review image pipeline failed"),
  );
}

/**
 * For each image with a source `url` but missing derivatives, generates thumb/medium WebP on R2.
 */
export async function processReviewImagesForReview(reviewId: string): Promise<void> {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review?.images || !Array.isArray(review.images)) return;

  const images = review.images as ReviewImageInput[];
  const next: ReviewImageInput[] = [...images];
  let changed = false;

  for (let i = 0; i < next.length; i++) {
    const img = next[i]!;
    if (img.thumb && img.medium) continue;
    const srcUrl = img.url ?? img.full;
    if (!srcUrl) continue;

    try {
      const res = await fetch(srcUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      const variants = await deriveImageVariants(buf);
      const thumbBin = variants.thumb;
      const mediumBin = variants.medium;
      if (!thumbBin || !mediumBin) continue;

      const base = `reviews/${reviewId}/slot-${i}`;
      const thumbUrl = await uploadPublicBuffer({
        key: `${base}/thumb.webp`,
        buffer: thumbBin,
        contentType: "image/webp",
      });
      const mediumUrl = await uploadPublicBuffer({
        key: `${base}/medium.webp`,
        buffer: mediumBin,
        contentType: "image/webp",
      });
      if (thumbUrl && mediumUrl) {
        next[i] = { ...img, thumb: thumbUrl, medium: mediumUrl, full: img.full ?? srcUrl };
        changed = true;
      }
    } catch (err) {
      logger.warn({ err, reviewId, index: i }, "review image derivative row skipped");
    }
  }

  if (changed) {
    await prisma.review.update({
      where: { id: reviewId },
      data: { images: next as unknown as object },
    });
  }
}
