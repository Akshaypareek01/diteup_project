/**
 * Order fetch, list, and customer cancel flows.
 */
import { Prisma } from "@prisma/client";

import { prisma } from "../utils/prisma.js";
import { Forbidden, NotFound, ValidationError } from "../utils/errors.js";
import { verifyOrderGuestToken } from "../utils/orderAccess.js";
import { moneyNumber } from "../utils/money.js";
import {
  loadInventoryIdsForOrder,
  releaseReservationForOrder,
  restockConfirmedOrder,
  type OrderTx,
} from "./orderInventory.js";
import { fireOrderCancelled } from "./orderNotify.js";

/**
 * Paginated order history for the authenticated customer (offset pagination).
 */
export async function listOrdersForUser(userId: string, offset = 0, limit = 20) {
  const take = Math.min(Math.max(limit, 1), 50);
  const skip = Math.max(0, offset);
  const rows = await prisma.order.findMany({
    where: { userId },
    orderBy: { placedAt: "desc" },
    skip,
    take: take + 1,
    select: {
      id: true,
      orderNumber: true,
      status: true,
      paymentMethod: true,
      subtotal: true,
      discountAmount: true,
      shippingAmount: true,
      codCharge: true,
      taxAmount: true,
      total: true,
      currency: true,
      couponCode: true,
      shippingAddress: true,
      placedAt: true,
      confirmedAt: true,
      items: {
        select: {
          productName: true,
          variantName: true,
          quantity: true,
          lineTotal: true,
        },
      },
    },
  });
  const hasMore = rows.length > take;
  const page = rows.slice(0, take);
  return {
    orders: page.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      paymentMethod: o.paymentMethod,
      subtotal: moneyNumber(o.subtotal),
      discountAmount: moneyNumber(o.discountAmount),
      shippingAmount: moneyNumber(o.shippingAmount),
      codCharge: moneyNumber(o.codCharge),
      taxAmount: moneyNumber(o.taxAmount),
      total: moneyNumber(o.total),
      currency: o.currency,
      couponCode: o.couponCode,
      shippingAddress: o.shippingAddress,
      placedAt: o.placedAt,
      confirmedAt: o.confirmedAt,
      items: o.items.map((it) => ({
        productName: it.productName,
        variantName: it.variantName,
        quantity: it.quantity,
        lineTotal: moneyNumber(it.lineTotal),
      })),
    })),
    nextOffset: hasMore ? skip + take : null,
  };
}

/**
 * Returns a single order if the requester is the owner or supplies a valid guest token.
 */
export async function getOrderForViewer(input: {
  orderNumber: string;
  userId?: string | null;
  guestToken?: string | null;
}) {
  const order = await prisma.order.findUnique({
    where: { orderNumber: input.orderNumber },
    include: {
      items: { include: { variant: { select: { productId: true } } } },
      payments: { select: { id: true, status: true, method: true, amount: true, createdAt: true } },
      events: { orderBy: { createdAt: "asc" }, take: 50 },
    },
  });
  if (!order) throw NotFound("Order not found");

  const allowed =
    (input.userId && order.userId === input.userId) ||
    verifyOrderGuestToken(order.orderNumber, input.guestToken ?? undefined);
  if (!allowed) throw Forbidden("You cannot access this order");

  return serializeOrderDetail(order);
}

/**
 * Customer cancel: unpaid online orders release reservation; confirmed COD pre-ship restocks.
 */
export async function cancelOrderForViewer(input: {
  orderNumber: string;
  userId?: string | null;
  guestToken?: string | null;
  reason?: string | null;
}): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { orderNumber: input.orderNumber },
    include: { items: true, payments: true },
  });
  if (!order) throw NotFound("Order not found");

  const allowed =
    (input.userId && order.userId === input.userId) ||
    verifyOrderGuestToken(order.orderNumber, input.guestToken ?? undefined);
  if (!allowed) throw Forbidden("You cannot cancel this order");

  await prisma.$transaction(async (tx: OrderTx) => {
    const locked = await tx.$queryRaw<{ id: string; status: string; shippedAt: Date | null }[]>(
      Prisma.sql`SELECT id, status, "shippedAt" FROM "Order" WHERE "orderNumber" = ${input.orderNumber} FOR UPDATE`,
    );
    const row = locked[0];
    if (!row) throw NotFound("Order not found");
    if (row.status === "CANCELLED") return;

    if (order.paymentMethod === "RAZORPAY") {
      if (row.status !== "PLACED") {
        throw ValidationError("This order can no longer be cancelled online");
      }
      const oneHourMs = 60 * 60 * 1000;
      if (Date.now() - order.placedAt.getTime() > oneHourMs) {
        throw ValidationError("Cancellation window expired (1 hour after placement for unpaid orders).");
      }
      const itemsInv = await loadInventoryIdsForOrder(tx, order.id);
      await releaseReservationForOrder(
        tx,
        itemsInv.map((i) => ({ inventoryId: i.inventoryId, quantity: i.quantity })),
      );
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
          cancelReason: input.reason?.trim() || "Customer cancelled",
        },
      });
      for (const p of order.payments) {
        if (p.status === "PENDING") {
          await tx.payment.update({
            where: { id: p.id },
            data: { status: "FAILED", failureReason: "Customer cancelled before payment" },
          });
        }
      }
      await tx.orderEvent.create({
        data: {
          orderId: order.id,
          type: "ORDER_CANCELLED",
          payload: { by: "customer" } as Prisma.InputJsonValue,
          actorId: input.userId ?? null,
        },
      });
      return;
    }

    if (row.status === "PLACED") {
      throw ValidationError("Unexpected COD order state");
    }
    if (row.status !== "CONFIRMED") {
      throw ValidationError("This order can no longer be cancelled online");
    }
    if (row.shippedAt) {
      throw ValidationError("Cannot cancel an order that has shipped");
    }
    const itemsInv = await loadInventoryIdsForOrder(tx, order.id);
    await restockConfirmedOrder(
      tx,
      itemsInv.map((i) => ({ inventoryId: i.inventoryId, quantity: i.quantity })),
      order.id,
      input.userId ?? null,
    );
    await tx.order.update({
      where: { id: order.id },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancelReason: input.reason?.trim() || "Customer cancelled",
      },
    });
    for (const p of order.payments) {
      if (p.status === "CAPTURED") {
        await tx.payment.update({
          where: { id: p.id },
          data: { status: "REFUNDED", failureReason: "Order cancelled — COD not collected" },
        });
      }
    }
    await tx.orderEvent.create({
      data: {
        orderId: order.id,
        type: "ORDER_CANCELLED",
        payload: { by: "customer", method: "COD" } as Prisma.InputJsonValue,
        actorId: input.userId ?? null,
      },
    });
  });

  if (order.couponCode) {
    await reverseCouponRedemption(order.id);
  }

  void fireOrderCancelled(order.orderNumber, input.reason?.trim() || undefined).catch(() => undefined);
}

/**
 * Background job: expires unpaid Razorpay checkouts — releases reservations and fails pending payments.
 */
export async function systemAutoCancelUnpaidOrder(orderNumber: string): Promise<boolean> {
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { payments: true },
  });
  if (!order || order.paymentMethod !== "RAZORPAY" || order.status !== "PLACED") {
    return false;
  }

  await prisma.$transaction(async (tx: OrderTx) => {
    const locked = await tx.$queryRaw<{ status: string }[]>(
      Prisma.sql`SELECT status FROM "Order" WHERE "orderNumber" = ${orderNumber} FOR UPDATE`,
    );
    if (!locked[0] || locked[0].status !== "PLACED") return;

    const itemsInv = await loadInventoryIdsForOrder(tx, order.id);
    await releaseReservationForOrder(
      tx,
      itemsInv.map((i) => ({ inventoryId: i.inventoryId, quantity: i.quantity })),
    );
    await tx.order.update({
      where: { id: order.id },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        cancelReason: "Auto-cancelled: payment not completed in time",
      },
    });
    for (const p of order.payments) {
      if (p.status === "PENDING") {
        await tx.payment.update({
          where: { id: p.id },
          data: { status: "FAILED", failureReason: "Auto-cancelled (timeout)" },
        });
      }
    }
    await tx.orderEvent.create({
      data: {
        orderId: order.id,
        type: "ORDER_CANCELLED",
        payload: { by: "system", reason: "payment_timeout" } as Prisma.InputJsonValue,
        actorId: null,
      },
    });
  });

  if (order.couponCode) {
    await reverseCouponRedemption(order.id);
  }
  void fireOrderCancelled(order.orderNumber, "Payment not completed in time").catch(() => undefined);
  return true;
}

/**
 * Marks coupon redemption reversed and decrements global usage when possible.
 */
export async function reverseCouponRedemption(orderId: string): Promise<void> {
  const redemption = await prisma.couponRedemption.findUnique({ where: { orderId } });
  if (!redemption || redemption.isReversed) return;
  await prisma.$transaction(async (tx) => {
    await tx.couponRedemption.update({
      where: { orderId },
      data: {
        isReversed: true,
        reversedAt: new Date(),
        reversalReason: "Order cancelled",
      },
    });
    await tx.coupon.update({
      where: { id: redemption.couponId },
      data: { usedCount: { decrement: 1 } },
    });
  });
}

function serializeOrderDetail(order: {
  id: string;
  orderNumber: string;
  status: string;
  paymentMethod: string;
  currency: string;
  subtotal: Prisma.Decimal;
  discountAmount: Prisma.Decimal;
  shippingAmount: Prisma.Decimal;
  codCharge: Prisma.Decimal;
  taxAmount: Prisma.Decimal;
  total: Prisma.Decimal;
  couponCode: string | null;
  shippingAddress: unknown;
  billingAddress: unknown;
  placedAt: Date;
  confirmedAt: Date | null;
  shippedAt: Date | null;
  deliveredAt: Date | null;
  cancelledAt: Date | null;
  items: {
    variantId: string;
    sku: string;
    productName: string;
    variantName: string;
    quantity: number;
    unitPrice: Prisma.Decimal;
    lineTotal: Prisma.Decimal;
    variant: { productId: string };
  }[];
  payments: {
    id: string;
    status: string;
    method: string;
    amount: Prisma.Decimal;
    createdAt: Date;
  }[];
  events: { type: string; createdAt: Date; payload: unknown }[];
}) {
  return {
    order: {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentMethod: order.paymentMethod,
      currency: order.currency,
      subtotal: moneyNumber(order.subtotal),
      discountAmount: moneyNumber(order.discountAmount),
      shippingAmount: moneyNumber(order.shippingAmount),
      codCharge: moneyNumber(order.codCharge),
      taxAmount: moneyNumber(order.taxAmount),
      total: moneyNumber(order.total),
      couponCode: order.couponCode,
      shippingAddress: order.shippingAddress,
      billingAddress: order.billingAddress,
      placedAt: order.placedAt,
      confirmedAt: order.confirmedAt,
      shippedAt: order.shippedAt,
      deliveredAt: order.deliveredAt,
      cancelledAt: order.cancelledAt,
    },
    items: order.items.map((it) => ({
      productId: it.variant.productId,
      variantId: it.variantId,
      sku: it.sku,
      productName: it.productName,
      variantName: it.variantName,
      quantity: it.quantity,
      unitPrice: moneyNumber(it.unitPrice),
      lineTotal: moneyNumber(it.lineTotal),
    })),
    payments: order.payments.map((p) => ({
      id: p.id,
      status: p.status,
      method: p.method,
      amount: moneyNumber(p.amount),
      createdAt: p.createdAt,
    })),
    timeline: order.events.map((e) => ({ type: e.type, at: e.createdAt, payload: e.payload })),
  };
}
