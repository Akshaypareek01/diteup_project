/**
 * Razorpay payment verification + idempotent order confirmation (shared by `/payments/verify` and webhooks).
 */
import { createHmac, timingSafeEqual } from "node:crypto";

import { Prisma } from "@prisma/client";

import { env } from "../config/env.js";
import { prisma } from "../utils/prisma.js";
import { NotFound, PaymentFailed, ValidationError } from "../utils/errors.js";
import { confirmInventoryForOrder, loadInventoryIdsForOrder } from "./orderInventory.js";
import { fireOrderConfirmedSuite } from "./orderNotify.js";
import { logger } from "../utils/logger.js";

/**
 * Razorpay Checkout payment signature: HMAC-SHA256hex of `${order_id}|${payment_id}` using key secret.
 */
export function verifyRazorpayPaymentSignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  signature: string,
): boolean {
  if (!env.RAZORPAY_KEY_SECRET) return false;
  const body = `${razorpayOrderId}|${razorpayPaymentId}`;
  const expectedHex = createHmac("sha256", env.RAZORPAY_KEY_SECRET).update(body).digest("hex");
  try {
    const a = Buffer.from(expectedHex, "hex");
    const b = Buffer.from(signature.trim(), "hex");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/**
 * Validates `X-Razorpay-Signature` against the raw webhook body using `RAZORPAY_WEBHOOK_SECRET`.
 */
export function verifyRazorpayWebhookSignature(rawBody: Buffer, signatureHeader: string | undefined): boolean {
  if (!env.RAZORPAY_WEBHOOK_SECRET || !signatureHeader) return false;
  const expectedHex = createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET).update(rawBody).digest("hex");
  try {
    const a = Buffer.from(expectedHex, "hex");
    const b = Buffer.from(signatureHeader.trim(), "hex");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export type ConfirmedOrderResult = {
  orderNumber: string;
  status: string;
  alreadyConfirmed: boolean;
};

/**
 * After signature verification: marks payment CAPTURED, order CONFIRMED, and runs inventory confirm once.
 */
export async function confirmOrderFromRazorpayPayment(input: {
  orderNumber: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  rawPayload?: unknown;
}): Promise<ConfirmedOrderResult> {
  const result = await prisma.$transaction(async (tx) => {
    const locked = await tx.$queryRaw<{ id: string }[]>(
      Prisma.sql`
        SELECT id FROM "Order" WHERE "orderNumber" = ${input.orderNumber} FOR UPDATE
      `,
    );
    if (!locked[0]) throw NotFound("Order not found");

    const order = await tx.order.findUniqueOrThrow({
      where: { orderNumber: input.orderNumber },
      include: { payments: true },
    });

    if (order.paymentMethod !== "RAZORPAY") {
      throw ValidationError("Order is not payable online");
    }

    const payment = order.payments.find((p) => p.razorpayOrderId === input.razorpayOrderId);
    if (!payment) {
      throw NotFound("Payment record not found for this Razorpay order");
    }

    if (
      payment.razorpayPaymentId &&
      payment.razorpayPaymentId !== input.razorpayPaymentId &&
      payment.status === "CAPTURED"
    ) {
      throw ValidationError("This order was already paid with a different payment id");
    }

    if (order.status === "CONFIRMED" && payment.status === "CAPTURED") {
      return { orderNumber: order.orderNumber, status: order.status, alreadyConfirmed: true };
    }

    if (order.status !== "PLACED") {
      throw PaymentFailed("Order cannot be confirmed from this state");
    }
    if (payment.status !== "PENDING" && payment.status !== "AUTHORIZED") {
      throw PaymentFailed("Payment is not in a confirmable state");
    }

    const itemsWithInv = await loadInventoryIdsForOrder(tx, order.id);

    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: "CAPTURED",
        razorpayPaymentId: input.razorpayPaymentId,
        rawPayload: input.rawPayload === undefined ? undefined : (input.rawPayload as Prisma.InputJsonValue),
      },
    });

    await tx.order.update({
      where: { id: order.id, status: "PLACED" },
      data: { status: "CONFIRMED", confirmedAt: new Date() },
    });

    await confirmInventoryForOrder(
      tx,
      itemsWithInv.map((r) => ({ inventoryId: r.inventoryId, quantity: r.quantity })),
      order.id,
      order.userId,
    );

    await tx.orderEvent.create({
      data: {
        orderId: order.id,
        type: "PAYMENT_CAPTURED",
        payload: { razorpayPaymentId: input.razorpayPaymentId } as Prisma.InputJsonValue,
        actorId: order.userId,
      },
    });

    await tx.orderEvent.create({
      data: {
        orderId: order.id,
        type: "ORDER_CONFIRMED",
        payload: { source: "razorpay" } as Prisma.InputJsonValue,
        actorId: order.userId,
      },
    });

    return { orderNumber: order.orderNumber, status: "CONFIRMED", alreadyConfirmed: false };
  });

  if (!result.alreadyConfirmed) {
    void fireOrderConfirmedSuite(result.orderNumber).catch((err) =>
      logger.error({ err, orderNumber: result.orderNumber }, "post-confirm side effects failed"),
    );
  }

  return result;
}
