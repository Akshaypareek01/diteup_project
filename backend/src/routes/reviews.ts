/**
 * Authenticated review mutations under `/v1/reviews/*`.
 */
import { Router } from "express";

import * as reviewsController from "../controllers/reviews.js";
import { authRequired } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rateLimit.js";
import { validate } from "../middleware/validate.js";
import {
  CreateReviewBodySchema,
  FlagReviewBodySchema,
  PresignReviewImageSchema,
  ReviewIdParamSchema,
  UpdateReviewBodySchema,
} from "../validators/reviews.js";

const router = Router();

const threeReviewsPerDay = rateLimit({
  windowMs: 24 * 60 * 60 * 1000,
  max: 3,
  message: "You can submit at most 3 reviews per day",
  keyFn: (req) => `reviews_per_day:${req.auth?.userId ?? req.ip ?? "anon"}`,
});

router.post(
  "/reviews",
  authRequired,
  threeReviewsPerDay,
  validate({ body: CreateReviewBodySchema }),
  reviewsController.postCreateReview,
);

router.put(
  "/reviews/:id",
  authRequired,
  validate({ params: ReviewIdParamSchema, body: UpdateReviewBodySchema }),
  reviewsController.putUpdateReview,
);

router.delete(
  "/reviews/:id",
  authRequired,
  validate({ params: ReviewIdParamSchema }),
  reviewsController.deleteReview,
);

router.post(
  "/reviews/:id/helpful",
  authRequired,
  rateLimit({ windowMs: 60 * 60 * 1000, max: 120 }),
  validate({ params: ReviewIdParamSchema }),
  reviewsController.postReviewHelpful,
);

router.post(
  "/reviews/:id/flag",
  authRequired,
  rateLimit({ windowMs: 60 * 60 * 1000, max: 20 }),
  validate({ params: ReviewIdParamSchema, body: FlagReviewBodySchema }),
  reviewsController.postReviewFlag,
);

router.post(
  "/reviews/images/upload-url",
  authRequired,
  rateLimit({ windowMs: 60 * 60 * 1000, max: 40 }),
  validate({ body: PresignReviewImageSchema }),
  reviewsController.postReviewImagePresign,
);

export default router;
