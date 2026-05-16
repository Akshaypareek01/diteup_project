/**
 * Razorpay client callback — verify signature then confirm order (idempotent).
 */
import type { Request, Response, NextFunction } from "express";

import {
  confirmOrderFromRazorpayPayment,
  verifyRazorpayPaymentSignature,
} from "../services/orderPayment.js";
import { PaymentFailed } from "../utils/errors.js";

/**
 * POST /v1/payments/verify — after Checkout.js success.
 */
export async function postVerifyPayment(req: Request, res: Response, next: NextFunction) {
  try {
    const ok = verifyRazorpayPaymentSignature(
      req.body.razorpay_order_id,
      req.body.razorpay_payment_id,
      req.body.razorpay_signature,
    );
    if (!ok) {
      next(PaymentFailed("Invalid payment signature"));
      return;
    }
    const result = await confirmOrderFromRazorpayPayment({
      orderNumber: req.body.orderNumber,
      razorpayOrderId: req.body.razorpay_order_id,
      razorpayPaymentId: req.body.razorpay_payment_id,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}
