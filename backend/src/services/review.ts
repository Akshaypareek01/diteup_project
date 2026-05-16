/**
 * Customer reviews — PRD §6.7 (verified DELIVERED orders, moderation, helpful, flag, images).
 */
import { Prisma } from "@prisma/client";

import { prisma } from "../utils/prisma.js";
import {
  Forbidden,
  NotFound,
  ProductUnavailable,
  ValidationError,
} from "../utils/errors.js";
import { containsProfanity } from "../utils/profanity.js";
import { presignUpload } from "./storage.js";

const MAX_IMAGES = 5;
const BODY_MIN = 20;
const BODY_MAX = 2000;
const TITLE_MAX = 120;
const EDIT_WINDOW_DAYS = 7;

export type ReviewImageInput = {
  thumb?: string;
  medium?: string;
  full?: string;
  /** Raw client upload URL before derivative pipeline (PRD §6.7.4). */
  url?: string;
};

type Restrictions = { reviewsBlocked?: boolean };

/**
 * Reads `User.restrictions.reviewsBlocked` (PRD §6.7.1).
 */
export function isReviewsBlocked(restrictions: unknown): boolean {
  if (!restrictions || typeof restrictions !== "object" || restrictions === null) return false;
  return Boolean((restrictions as Restrictions).reviewsBlocked);
}

/**
 * Default display name: first name + last initial (PRD §6.7.2).
 */
export function defaultDisplayName(userName: string | null | undefined): string {
  const raw = userName?.trim();
  if (!raw) return "Customer";
  const parts = raw.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0]!;
  const first = parts[0]!;
  const last = parts[parts.length - 1]!;
  const initial = last[0]!.toUpperCase();
  return `${first} ${initial}.`;
}

function normalizeImages(images: unknown): ReviewImageInput[] | Prisma.InputJsonValue {
  if (images === undefined || images === null) return [];
  if (!Array.isArray(images)) {
    throw ValidationError("images must be an array");
  }
  if (images.length > MAX_IMAGES) {
    throw ValidationError(`At most ${MAX_IMAGES} images per review`);
  }
  const out: ReviewImageInput[] = [];
  for (const item of images) {
    if (!item || typeof item !== "object") {
      throw ValidationError("Each image must be an object with URL fields");
    }
    const o = item as Record<string, unknown>;
    const thumb = typeof o.thumb === "string" ? o.thumb : undefined;
    const medium = typeof o.medium === "string" ? o.medium : undefined;
    const full = typeof o.full === "string" ? o.full : undefined;
    const url = typeof o.url === "string" ? o.url : undefined;
    if (!thumb && !medium && !full && !url) {
      throw ValidationError("Each image needs at least one of thumb, medium, full, url");
    }
    out.push({ thumb, medium, full, url });
  }
  return out as unknown as Prisma.InputJsonValue;
}

function hasImagesValue(images: unknown): boolean {
  if (!images || !Array.isArray(images)) return false;
  return images.length > 0;
}

/**
 * Creates a pending review (isApproved=false); verifies DELIVERED order contains product (PRD §6.7.1).
 */
export async function createReview(input: {
  userId: string;
  productId: string;
  orderId: string;
  rating: number;
  title?: string | null;
  body: string;
  displayName?: string | null;
  anonymous?: boolean;
  images?: unknown;
}) {
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { id: true, name: true, restrictions: true, isActive: true },
  });
  if (!user?.isActive) throw Forbidden("Account is not eligible to review");
  if (isReviewsBlocked(user.restrictions)) {
    throw Forbidden("Your account cannot submit reviews");
  }

  const product = await prisma.product.findUnique({
    where: { id: input.productId },
    select: { id: true, reviewsEnabled: true, name: true },
  });
  if (!product) throw NotFound("Product not found");
  if (!product.reviewsEnabled) {
    throw ProductUnavailable("Reviews are disabled for this product", "VISIBILITY");
  }

  const order = await prisma.order.findFirst({
    where: {
      id: input.orderId,
      userId: input.userId,
      status: "DELIVERED",
    },
    include: {
      items: { include: { variant: { select: { productId: true } } } },
    },
  });
  if (!order) {
    throw ValidationError("Only delivered orders can be reviewed — order not found or not delivered");
  }
  const purchased = order.items.some((it) => it.variant.productId === input.productId);
  if (!purchased) {
    throw ValidationError("This order did not include this product");
  }

  if (input.rating < 1 || input.rating > 5 || !Number.isInteger(input.rating)) {
    throw ValidationError("Rating must be an integer between 1 and 5");
  }

  const body = input.body.trim();
  if (body.length < BODY_MIN || body.length > BODY_MAX) {
    throw ValidationError(`Review body must be ${BODY_MIN}–${BODY_MAX} characters`);
  }

  let title: string | null = null;
  if (input.title?.trim()) {
    title = input.title.trim().slice(0, TITLE_MAX);
    if (containsProfanity(title)) {
      throw ValidationError("Title contains blocked words");
    }
  }
  if (containsProfanity(body)) {
    throw ValidationError("Review text contains blocked words");
  }

  let authorName: string;
  if (input.anonymous) {
    authorName = "Anonymous";
  } else if (input.displayName?.trim()) {
    authorName = input.displayName.trim().slice(0, 120);
    if (containsProfanity(authorName)) {
      throw ValidationError("Display name contains blocked words");
    }
  } else {
    authorName = defaultDisplayName(user.name);
  }

  const imagesJson = normalizeImages(input.images);
  const hasIm = hasImagesValue(imagesJson as unknown);

  try {
    return await prisma.review.create({
      data: {
        productId: input.productId,
        userId: input.userId,
        orderId: input.orderId,
        authorName,
        rating: input.rating,
        title,
        body,
        images:
          Array.isArray(imagesJson) && imagesJson.length === 0 ? Prisma.DbNull : imagesJson,
        hasImages: hasIm,
        isApproved: false,
        isVerified: true,
      },
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw ValidationError("You have already reviewed this purchase");
    }
    throw e;
  }
}

/**
 * Edit within 7 days of `createdAt`; resets `isApproved` for re-moderation (PRD §6.7.3).
 */
export async function updateReview(input: {
  reviewId: string;
  userId: string;
  rating?: number;
  title?: string | null;
  body?: string;
  displayName?: string | null;
  anonymous?: boolean;
  images?: unknown;
}) {
  const existing = await prisma.review.findFirst({
    where: { id: input.reviewId, userId: input.userId, deletedAt: null },
  });
  if (!existing) throw NotFound("Review not found");

  const ageMs = Date.now() - existing.createdAt.getTime();
  if (ageMs > EDIT_WINDOW_DAYS * 24 * 60 * 60 * 1000) {
    throw ValidationError(`Reviews can only be edited within ${EDIT_WINDOW_DAYS} days of submission`);
  }

  const nextRating = input.rating !== undefined ? input.rating : existing.rating;
  if (nextRating < 1 || nextRating > 5 || !Number.isInteger(nextRating)) {
    throw ValidationError("Rating must be an integer between 1 and 5");
  }

  let body = existing.body;
  if (input.body !== undefined) {
    body = input.body.trim();
    if (body.length < BODY_MIN || body.length > BODY_MAX) {
      throw ValidationError(`Review body must be ${BODY_MIN}–${BODY_MAX} characters`);
    }
    if (containsProfanity(body)) {
      throw ValidationError("Review text contains blocked words");
    }
  }

  let title = existing.title;
  if (input.title !== undefined) {
    title = input.title?.trim() ? input.title.trim().slice(0, TITLE_MAX) : null;
    if (title && containsProfanity(title)) {
      throw ValidationError("Title contains blocked words");
    }
  }

  let authorName = existing.authorName;
  if (input.anonymous === true) {
    authorName = "Anonymous";
  } else if (input.displayName?.trim()) {
    authorName = input.displayName.trim().slice(0, 120);
    if (containsProfanity(authorName)) {
      throw ValidationError("Display name contains blocked words");
    }
  } else if (input.anonymous === false) {
    const user = await prisma.user.findUnique({
      where: { id: input.userId },
      select: { name: true },
    });
    authorName = defaultDisplayName(user?.name);
  }

  let imagesJson: Prisma.InputJsonValue | typeof Prisma.DbNull = existing.images as Prisma.InputJsonValue;
  let hasIm = existing.hasImages;
  if (input.images !== undefined) {
    const norm = normalizeImages(input.images);
    imagesJson =
      Array.isArray(norm) && norm.length === 0 ? Prisma.DbNull : (norm as Prisma.InputJsonValue);
    hasIm = hasImagesValue(norm as unknown);
  }

  return prisma.review.update({
    where: { id: existing.id },
    data: {
      rating: nextRating,
      title,
      body,
      authorName,
      images: imagesJson,
      hasImages: hasIm,
      isApproved: false,
      isFeatured: false,
      editedAt: new Date(),
    },
  });
}

/**
 * Author soft-delete (PRD TASK 7.4).
 */
export async function softDeleteReview(reviewId: string, userId: string): Promise<void> {
  const r = await prisma.review.updateMany({
    where: { id: reviewId, userId, deletedAt: null },
    data: { deletedAt: new Date(), isApproved: false, isFeatured: false },
  });
  if (r.count === 0) throw NotFound("Review not found");
}

/**
 * Toggle helpful vote (PRD §6.7.5); `@@unique([reviewId, userId])`.
 */
export async function toggleReviewHelpful(input: { reviewId: string; userId: string }) {
  const review = await prisma.review.findFirst({
    where: {
      id: input.reviewId,
      deletedAt: null,
      isApproved: true,
      isFlagged: false,
    },
    select: { id: true, userId: true, helpfulCount: true },
  });
  if (!review) throw NotFound("Review not found");
  if (review.userId === input.userId) {
    throw ValidationError("You cannot mark your own review as helpful");
  }

  const existing = await prisma.reviewHelpful.findUnique({
    where: {
      reviewId_userId: { reviewId: input.reviewId, userId: input.userId },
    },
  });

  if (existing) {
    await prisma.$transaction([
      prisma.reviewHelpful.delete({ where: { id: existing.id } }),
      prisma.review.update({
        where: { id: input.reviewId },
        data: { helpfulCount: { decrement: 1 } },
      }),
    ]);
    return { helpful: false, helpfulCount: Math.max(0, review.helpfulCount - 1) };
  }

  await prisma.$transaction([
    prisma.reviewHelpful.create({
      data: { reviewId: input.reviewId, userId: input.userId },
    }),
    prisma.review.update({
      where: { id: input.reviewId },
      data: { helpfulCount: { increment: 1 } },
    }),
  ]);
  return { helpful: true, helpfulCount: review.helpfulCount + 1 };
}

/**
 * Report review — sets `isFlagged`, hides from public list until admin clears (PRD §6.7.3).
 */
export async function flagReview(input: {
  reviewId: string;
  userId: string;
  reason: string;
}): Promise<void> {
  const review = await prisma.review.findFirst({
    where: {
      id: input.reviewId,
      deletedAt: null,
      userId: { not: input.userId },
    },
  });
  if (!review) throw NotFound("Review not found");

  const note = input.reason.trim().slice(0, 500);
  const merged =
    review.isFlagged && review.flagReason ? `${review.flagReason}\n— ${note}` : note;

  await prisma.review.update({
    where: { id: input.reviewId },
    data: { isFlagged: true, flagReason: merged.slice(0, 2000) },
  });
}

/**
 * Presigned PUT for review image (PRD §6.7.4); author only.
 */
export async function presignReviewImage(input: {
  reviewId: string;
  userId: string;
  contentType: string;
}) {
  const review = await prisma.review.findFirst({
    where: { id: input.reviewId, userId: input.userId, deletedAt: null },
  });
  if (!review) throw NotFound("Review not found");

  const imgs = review.images;
  const count = Array.isArray(imgs) ? imgs.length : 0;
  if (count >= MAX_IMAGES) {
    throw ValidationError(`Maximum ${MAX_IMAGES} images per review`);
  }

  return presignUpload({
    scope: "reviews",
    ownerId: input.reviewId,
    contentType: input.contentType,
  });
}

export { listPublicReviewsForSlug } from "./reviewPublicList.js";
