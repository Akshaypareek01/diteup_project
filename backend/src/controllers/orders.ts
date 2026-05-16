/**
 * Checkout: create order, fetch, cancel.
 */
import type { Request, Response, NextFunction } from "express";

import { prisma } from "../utils/prisma.js";
import { Forbidden, NotFound } from "../utils/errors.js";
import * as orderService from "../services/order.js";
import {
  cancelOrderForViewer,
  getOrderForViewer,
} from "../services/orderReadCancel.js";

/**
 * POST /v1/orders — optional auth; guests must send `guestEmail`.
 */
export async function postCreateOrder(req: Request, res: Response, next: NextFunction) {
  try {
    let shipping = req.body.shippingAddress;
    if (req.body.addressId) {
      if (!req.auth) {
        next(Forbidden("addressId requires authentication"));
        return;
      }
      const addr = await prisma.address.findFirst({
        where: { id: req.body.addressId, userId: req.auth.userId },
      });
      if (!addr) {
        next(NotFound("Address not found"));
        return;
      }
      shipping = {
        name: addr.name,
        phone: addr.phone,
        line1: addr.line1,
        line2: addr.line2 ?? undefined,
        city: addr.city,
        state: addr.state,
        pincode: addr.pincode,
        country: addr.country,
      };
    }

    const result = await orderService.placeOrder({
      userId: req.auth?.userId ?? null,
      items: req.body.items,
      couponCode: req.body.couponCode ?? null,
      paymentMethod: req.body.paymentMethod,
      shippingAddress: shipping,
      billingAddress: req.body.billingAddress ?? null,
      guestEmail: req.body.guestEmail ?? null,
      guestPhone: req.body.guestPhone ?? null,
      idempotencyKey: req.body.idempotencyKey ?? null,
    });
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /v1/orders/:orderNumber — owner or `?token=` guest HMAC.
 */
export async function getOneOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const detail = await getOrderForViewer({
      orderNumber: String(req.params.orderNumber),
      userId: req.auth?.userId ?? null,
      guestToken: req.query.token as string | undefined,
    });
    res.json(detail);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /v1/orders/:orderNumber/cancel
 */
export async function postCancelOrder(req: Request, res: Response, next: NextFunction) {
  try {
    await cancelOrderForViewer({
      orderNumber: String(req.params.orderNumber),
      userId: req.auth?.userId ?? null,
      guestToken: req.body.guestToken,
      reason: req.body.reason,
    });
    res.status(200).json({ ok: true });
  } catch (err) {
    next(err);
  }
}
