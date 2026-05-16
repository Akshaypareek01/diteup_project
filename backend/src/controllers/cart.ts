/**
 * Cart + coupon public endpoints.
 */
import type { Request, Response, NextFunction } from "express";

import * as cartService from "../services/cart.js";
import { validateCouponPreview } from "../services/coupon.js";

/** POST /v1/coupons/validate */
export async function postValidateCoupon(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await validateCouponPreview({
      code: req.body.code,
      subtotal: req.body.subtotal,
      paymentMethod: req.body.paymentMethod,
      userId: req.auth?.userId ?? null,
      guestEmail: req.body.guestEmail,
      shippingBeforeDiscount: req.body.shippingBeforeDiscount,
    });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

/** POST /v1/cart/preview */
export async function postCartPreview(req: Request, res: Response, next: NextFunction) {
  try {
    const breakdown = await cartService.previewCart({
      items: req.body.items,
      couponCode: req.body.couponCode,
      paymentMethod: req.body.paymentMethod,
      userId: req.auth?.userId ?? null,
      guestEmail: req.body.guestEmail,
    });
    res.status(200).json(breakdown);
  } catch (err) {
    next(err);
  }
}
