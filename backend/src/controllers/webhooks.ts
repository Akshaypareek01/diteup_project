/**
 * Razorpay webhook — raw body HMAC; confirms `payment.captured` idempotently.
 */
import type { Request, Response, NextFunction } from "express";

import { prisma } from "../utils/prisma.js";
import { logger } from "../utils/logger.js";
import { ValidationError } from "../utils/errors.js";
import {
  confirmOrderFromRazorpayPayment,
  verifyRazorpayWebhookSignature,
} from "../services/orderPayment.js";

type RzpWebhookPayload = {
  event?: string;
  payload?: {
    payment?: {
      entity?: {
        id?: string;
        order_id?: string;
      };
    };
  };
};

/**
 * POST /v1/webhooks/razorpay — must use `express.raw` middleware.
 */
export async function postRazorpayWebhook(req: Request, res: Response, next: NextFunction) {
  try {
    const raw = req.body as Buffer;
    if (!Buffer.isBuffer(raw)) {
      next(ValidationError("Invalid webhook body"));
      return;
    }
    const sig = req.get("x-razorpay-signature");
    if (!verifyRazorpayWebhookSignature(raw, sig)) {
      res.status(400).json({ ok: false, error: "Invalid signature" });
      return;
    }

    let body: RzpWebhookPayload;
    try {
      body = JSON.parse(raw.toString("utf8")) as RzpWebhookPayload;
    } catch (err) {
      logger.warn({ err }, "Razorpay webhook JSON parse failed");
      res.status(400).json({ ok: false, error: "Invalid JSON" });
      return;
    }

    if (body.event !== "payment.captured") {
      res.json({ ok: true, ignored: body.event });
      return;
    }

    const payId = body.payload?.payment?.entity?.id;
    const orderId = body.payload?.payment?.entity?.order_id;
    if (!payId || !orderId) {
      res.json({ ok: true, ignored: "missing entity" });
      return;
    }

    const paymentRow = await prisma.payment.findFirst({
      where: { razorpayOrderId: orderId },
      include: { order: { select: { orderNumber: true } } },
    });
    if (!paymentRow?.order) {
      logger.warn({ orderId }, "Webhook: no payment row for Razorpay order");
      res.json({ ok: true, ignored: "unknown order" });
      return;
    }

    await confirmOrderFromRazorpayPayment({
      orderNumber: paymentRow.order.orderNumber,
      razorpayOrderId: orderId,
      razorpayPaymentId: payId,
      rawPayload: body as unknown,
    });

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}
