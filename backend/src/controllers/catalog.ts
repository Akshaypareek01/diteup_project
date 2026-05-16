/**
 * HTTP handlers for public catalog endpoints.
 */
import type { Request, Response, NextFunction } from "express";

import * as catalogService from "../services/catalog.js";

/** GET /v1/products/featured */
export async function getFeatured(_req: Request, res: Response, next: NextFunction) {
  try {
    const product = await catalogService.getFeaturedProduct();
    res.status(200).json({ product });
  } catch (err) {
    next(err);
  }
}

/** GET /v1/products/:slug */
export async function getBySlug(req: Request, res: Response, next: NextFunction) {
  try {
    const product = await catalogService.getProductBySlug(String(req.params.slug));
    res.status(200).json({ product });
  } catch (err) {
    next(err);
  }
}

/** POST /v1/pincode/check */
export async function postPincodeCheck(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await catalogService.checkPincode(req.body);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

/** POST /v1/notify-me */
export async function postNotifyMe(req: Request, res: Response, next: NextFunction) {
  try {
    const row = await catalogService.createStockNotification({
      variantId: req.body.variantId,
      email: req.body.email,
      phone: req.body.phone,
      userId: req.auth?.userId ?? null,
    });
    res.status(200).json({
      message: "You're on the list — we'll email you when this item is back.",
      id: row.id,
    });
  } catch (err) {
    next(err);
  }
}
