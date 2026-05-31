/**
 * Public storefront API — products, PIN validation, back-in-stock signups.
 */
import { Router } from "express";

import * as catalogController from "../controllers/catalog.js";
import * as siteController from "../controllers/site.js";
import * as reviewsController from "../controllers/reviews.js";
import { optionalAuth } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rateLimit.js";
import { validate } from "../middleware/validate.js";
import {
  NotifyMeSchema,
  PincodeCheckSchema,
  ProductSlugParamSchema,
} from "../validators/catalog.js";
import { ProductReviewsQuerySchema } from "../validators/reviews.js";

const router = Router();

router.get("/site/mode", siteController.getSiteMode);
router.get("/site/integrations", siteController.getSiteIntegrations);

router.get("/products/featured", catalogController.getFeatured);

router.get(
  "/products/:slug/reviews",
  validate({ params: ProductSlugParamSchema, query: ProductReviewsQuerySchema }),
  reviewsController.getProductReviews,
);

router.get(
  "/products/:slug",
  validate({ params: ProductSlugParamSchema }),
  catalogController.getBySlug,
);

router.post(
  "/pincode/check",
  rateLimit({ windowMs: 60 * 60 * 1000, max: 120 }),
  validate({ body: PincodeCheckSchema }),
  catalogController.postPincodeCheck,
);

router.post(
  "/notify-me",
  optionalAuth,
  rateLimit({ windowMs: 60 * 60 * 1000, max: 5 }),
  validate({ body: NotifyMeSchema }),
  catalogController.postNotifyMe,
);

export default router;
