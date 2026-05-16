/**
 * Order placement response shaping + idempotency / COD prior-order checks.
 */
import { Prisma } from "@prisma/client";

import { prisma } from "../utils/prisma.js";
import { Conflict } from "../utils/errors.js";
import { normalizeEmail } from "../utils/format.js";
import { makeOrderGuestToken } from "../utils/orderAccess.js";
import { moneyNumber } from "../utils/money.js";
import { getRazorpayKeyId, isRazorpayConfigured } from "./razorpay.js";

const QUALIFYING = ["CONFIRMED", "SHIPPED", "DELIVERED", "RETURNED", "REFUNDED"] as const;

export type PlacedOrderResult = {
  order: {
    id: string;
    orderNumber: string;
    status: string;
    paymentMethod: string;
    currency: string;
    subtotal: number;
    discountAmount: number;
    shippingAmount: number;
    codCharge: number;
    taxAmount: number;
    total: number;
    couponCode: string | null;
    placedAt: Date;
    confirmedAt: Date | null;
    shippingAddress: unknown;
  };
  items: {
    variantId: string;
    sku: string;
    productName: string;
    variantName: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }[];
  payment: {
    status: string;
    razorpayKeyId?: string;
    razorpayOrderId?: string;
    amountPaise?: number;
  };
  guestToken?: string;
};

/**
 * Counts fulfilled orders for COD “returning customer” rules.
 */
export async function countQualifyingOrders(
  userId?: string | null,
  guestEmail?: string | null,
): Promise<number> {
  if (userId) {
    return prisma.order.count({
      where: { userId, status: { in: [...QUALIFYING] } },
    });
  }
  if (guestEmail?.trim()) {
    const e = normalizeEmail(guestEmail);
    return prisma.order.count({
      where: {
        status: { in: [...QUALIFYING] },
        OR: [{ guestEmail: e }, { user: { email: e } }],
      },
    });
  }
  return 0;
}

/**
 * Ensures a replayed idempotency key matches the same actor (user or guest email).
 */
export function assertIdempotentActor(
  order: { userId: string | null; guestEmail: string | null },
  userId?: string | null,
  guestEmail?: string | null,
): void {
  if (userId && order.userId && order.userId !== userId) {
    throw Conflict("Idempotency key belongs to another account");
  }
  if (!userId && guestEmail && order.guestEmail && order.guestEmail !== normalizeEmail(guestEmail)) {
    throw Conflict("Idempotency key belongs to another guest identity");
  }
}

/**
 * Public JSON shape for `POST /v1/orders` (adds Razorpay key + guest link token when applicable).
 */
export function buildPlacedOrderResult(orderRow: {
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
  placedAt: Date;
  confirmedAt: Date | null;
  shippingAddress: unknown;
  userId: string | null;
  guestEmail: string | null;
  items: {
    variantId: string;
    sku: string;
    productName: string;
    variantName: string;
    quantity: number;
    unitPrice: Prisma.Decimal;
    lineTotal: Prisma.Decimal;
  }[];
  payments: {
    status: string;
    razorpayOrderId: string | null;
    amount: Prisma.Decimal;
  }[];
}): PlacedOrderResult {
  const pay0 = orderRow.payments[0];
  const base: PlacedOrderResult = {
    order: {
      id: orderRow.id,
      orderNumber: orderRow.orderNumber,
      status: orderRow.status,
      paymentMethod: orderRow.paymentMethod,
      currency: orderRow.currency,
      subtotal: moneyNumber(orderRow.subtotal),
      discountAmount: moneyNumber(orderRow.discountAmount),
      shippingAmount: moneyNumber(orderRow.shippingAmount),
      codCharge: moneyNumber(orderRow.codCharge),
      taxAmount: moneyNumber(orderRow.taxAmount),
      total: moneyNumber(orderRow.total),
      couponCode: orderRow.couponCode,
      placedAt: orderRow.placedAt,
      confirmedAt: orderRow.confirmedAt,
      shippingAddress: orderRow.shippingAddress,
    },
    items: orderRow.items.map((it) => ({
      variantId: it.variantId,
      sku: it.sku,
      productName: it.productName,
      variantName: it.variantName,
      quantity: it.quantity,
      unitPrice: moneyNumber(it.unitPrice),
      lineTotal: moneyNumber(it.lineTotal),
    })),
    payment: {
      status: pay0?.status ?? "PENDING",
      razorpayOrderId: pay0?.razorpayOrderId ?? undefined,
      amountPaise:
        orderRow.paymentMethod === "RAZORPAY"
          ? Math.round(moneyNumber(pay0?.amount ?? 0) * 100)
          : undefined,
    },
  };
  if (orderRow.paymentMethod === "RAZORPAY" && isRazorpayConfigured()) {
    base.payment.razorpayKeyId = getRazorpayKeyId();
  }
  if (!orderRow.userId && orderRow.guestEmail) {
    base.guestToken = makeOrderGuestToken(orderRow.orderNumber);
  }
  return base;
}
