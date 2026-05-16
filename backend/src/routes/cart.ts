/**
 * Cart and coupon routes (public; optional auth for identity-based coupon rules).
 */
import { Router } from "express";

import * as cartController from "../controllers/cart.js";
import { optionalAuth } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rateLimit.js";
import { validate } from "../middleware/validate.js";
import { CartPreviewBodySchema, CouponValidateBodySchema } from "../validators/cart.js";

const router = Router();

router.use(optionalAuth);

router.post(
  "/coupons/validate",
  rateLimit({ windowMs: 60 * 60 * 1000, max: 60 }),
  validate({ body: CouponValidateBodySchema }),
  cartController.postValidateCoupon,
);

router.post(
  "/cart/preview",
  rateLimit({ windowMs: 60 * 60 * 1000, max: 120 }),
  validate({ body: CartPreviewBodySchema }),
  cartController.postCartPreview,
);

export default router;
