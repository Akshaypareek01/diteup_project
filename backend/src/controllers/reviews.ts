/**
 * Customer review HTTP handlers (PRD §6.7).
 */
import type { Request, Response, NextFunction } from "express";

import * as reviewService from "../services/review.js";
import type { ProductReviewsQueryInput } from "../validators/reviews.js";
import { ServiceUnavailable, Unauthorized } from "../utils/errors.js";

/**
 * GET /v1/products/:slug/reviews — public, approved-only list + summary.
 */
export async function getProductReviews(req: Request, res: Response, next: NextFunction) {
  try {
    const q = req.query as unknown as ProductReviewsQueryInput;
    const result = await reviewService.listPublicReviewsForSlug({
      slug: String(req.params.slug),
      sort: q.sort,
      rating: q.rating,
      withImages: q.withImages,
      page: q.page,
      pageSize: q.pageSize,
    });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /v1/reviews
 */
export async function postCreateReview(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth) throw Unauthorized();
    const row = await reviewService.createReview({
      userId: req.auth.userId,
      productId: req.body.productId,
      orderId: req.body.orderId,
      rating: req.body.rating,
      title: req.body.title,
      body: req.body.body,
      displayName: req.body.displayName,
      anonymous: req.body.anonymous,
      images: req.body.images,
    });
    res.status(201).json({
      review: {
        id: row.id,
        productId: row.productId,
        orderId: row.orderId,
        rating: row.rating,
        title: row.title,
        body: row.body,
        authorName: row.authorName,
        isApproved: row.isApproved,
        isVerified: row.isVerified,
        images: row.images,
        createdAt: row.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /v1/reviews/:id
 */
export async function putUpdateReview(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth) throw Unauthorized();
    const row = await reviewService.updateReview({
      reviewId: String(req.params.id),
      userId: req.auth.userId,
      rating: req.body.rating,
      title: req.body.title,
      body: req.body.body,
      displayName: req.body.displayName,
      anonymous: req.body.anonymous,
      images: req.body.images,
    });
    res.status(200).json({
      review: {
        id: row.id,
        rating: row.rating,
        title: row.title,
        body: row.body,
        authorName: row.authorName,
        isApproved: row.isApproved,
        images: row.images,
        editedAt: row.editedAt,
        updatedAt: row.updatedAt,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /v1/reviews/:id — author soft-delete.
 */
export async function deleteReview(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth) throw Unauthorized();
    await reviewService.softDeleteReview(String(req.params.id), req.auth.userId);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

/**
 * POST /v1/reviews/:id/helpful
 */
export async function postReviewHelpful(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth) throw Unauthorized();
    const out = await reviewService.toggleReviewHelpful({
      reviewId: String(req.params.id),
      userId: req.auth.userId,
    });
    res.status(200).json(out);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /v1/reviews/:id/flag
 */
export async function postReviewFlag(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth) throw Unauthorized();
    await reviewService.flagReview({
      reviewId: String(req.params.id),
      userId: req.auth.userId,
      reason: req.body.reason,
    });
    res.status(200).json({ ok: true });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /v1/reviews/images/upload-url
 */
export async function postReviewImagePresign(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth) throw Unauthorized();
    const result = await reviewService.presignReviewImage({
      reviewId: req.body.reviewId,
      userId: req.auth.userId,
      contentType: req.body.contentType,
    });
    if (!result) {
      next(ServiceUnavailable("File uploads are not configured"));
      return;
    }
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
