/**
 * Order placement — cart resolution, pin/COD rules, inventory, coupons, payments.
 */
import { Prisma } from "@prisma/client";
import type { Coupon } from "@prisma/client";

import { prisma } from "../utils/prisma.js";
import { CouponInvalid, ProductUnavailable, ValidationError } from "../utils/errors.js";
import { normalizeEmail, normalizeIndianPhone } from "../utils/format.js";
import { roundMoney } from "../utils/money.js";
import { checkPincode } from "./catalog.js";
import {
  attachCouponMeta,
  computeCouponBenefit,
  validateCouponPreview,
  type CouponPreviewResult,
} from "./coupon.js";
import {
  computeCartTotals,
  mergeCartLines,
  resolveCheckoutCart,
  type CartLineRequest,
} from "./cart.js";
import { createRazorpayOrder, isRazorpayConfigured } from "./razorpay.js";
import { currentOrderYearKolkata, formatOrderNumber, nextOrderSequenceNo } from "./orderNumber.js";
import {
  assertIdempotentActor,
  buildPlacedOrderResult,
  countQualifyingOrders,
  type PlacedOrderResult,
} from "./orderPlacementResult.js";
import {
  confirmInventoryForOrder,
  reserveInventoryLines,
  type OrderTx,
} from "./orderInventory.js";
import {
  fireAdminNewOrderOnly,
  fireOrderConfirmedSuite,
  fireOrderPlacedPendingAndAdmin,
} from "./orderNotify.js";
import { logger } from "../utils/logger.js";

export type { PlacedOrderResult };

function dec2(n: number): Prisma.Decimal {
  return new Prisma.Decimal(roundMoney(n).toFixed(2));
}

export type ShippingAddressPayload = {
  name: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  pincode: string;
  country?: string;
};

export type PlaceOrderInput = {
  userId?: string | null;
  items: CartLineRequest[];
  couponCode?: string | null;
  paymentMethod: "RAZORPAY" | "COD";
  shippingAddress: ShippingAddressPayload;
  billingAddress?: ShippingAddressPayload | null;
  guestEmail?: string | null;
  guestPhone?: string | null;
  idempotencyKey?: string | null;
};

/**
 * Creates an order in a single transaction (inventory reserve, coupon redemption, COD confirm inline).
 */
export async function placeOrder(input: PlaceOrderInput): Promise<PlacedOrderResult> {
  const qtyMap = mergeCartLines(input.items);
  const resolved = await resolveCheckoutCart({ items: input.items });
  const pin = input.shippingAddress.pincode.trim();

  for (const p of resolved.uniqueProducts) {
    const chk = await checkPincode({ pincode: pin, productId: p.id });
    if (!chk.serviceable) {
      throw ProductUnavailable(
        `PIN ${pin} is not serviceable for “${p.name}”`,
        "PINCODE_RESTRICTED",
      );
    }
    if (input.paymentMethod === "RAZORPAY" && !p.onlinePaymentEnabled) {
      throw ProductUnavailable("Online payment is disabled for an item in your cart", "VISIBILITY");
    }
    if (input.paymentMethod === "COD" && !p.codEnabled) {
      throw ProductUnavailable("COD is not available for an item in your cart", "VISIBILITY");
    }
    if (input.paymentMethod === "COD") {
      const codChk = await checkPincode({ pincode: pin, productId: p.id });
      if (!codChk.codAvailable) {
        throw ValidationError("COD is not available for this delivery PIN");
      }
    }
  }

  const checkout = resolved.checkout;
  let couponResult: CouponPreviewResult | null = null;
  if (input.couponCode?.trim()) {
    couponResult = await validateCouponPreview({
      code: input.couponCode,
      subtotal: resolved.subtotal,
      paymentMethod: input.paymentMethod,
      userId: input.userId,
      guestEmail: input.guestEmail,
      shippingBeforeDiscount: resolved.shippingBeforeCoupon,
    });
    if (!couponResult.eligible) {
      throw CouponInvalid(couponResult.message);
    }
  }

  const totals = computeCartTotals({
    lineSubtotals: resolved.lines.map((l) => l.lineSubtotal),
    gstRatePercents: resolved.lines.map((l) => l.gstRatePercent),
    checkout,
    paymentMethod: input.paymentMethod,
    products: resolved.uniqueProducts,
    coupon: couponResult,
    taxInclusive: checkout.taxInclusive,
  });

  if (input.paymentMethod === "COD") {
    if (checkout.codMaxOrderValue != null && totals.total > checkout.codMaxOrderValue) {
      throw ValidationError(`COD is not available above ₹${checkout.codMaxOrderValue}`);
    }
    if (checkout.codMinOrderValue != null && totals.total < checkout.codMinOrderValue) {
      throw ValidationError(`COD requires a minimum order of ₹${checkout.codMinOrderValue}`);
    }
    if (!checkout.firstOrderCodAllowed) {
      const prior = await countQualifyingOrders(input.userId, input.guestEmail);
      if (prior === 0) {
        throw ValidationError("COD is only available for returning customers");
      }
    }
  }

  if (input.paymentMethod === "RAZORPAY" && !isRazorpayConfigured()) {
    throw ValidationError("Online payment is temporarily unavailable");
  }

  const normGuest = input.guestEmail?.trim() ? normalizeEmail(input.guestEmail) : null;

  if (!input.userId && !normGuest) {
    throw ValidationError("Email is required for guest checkout");
  }

  if (input.idempotencyKey?.trim()) {
    const existing = await prisma.order.findUnique({
      where: { idempotencyKey: input.idempotencyKey.trim() },
      include: { items: true, payments: true },
    });
    if (existing) {
      assertIdempotentActor(existing, input.userId, normGuest);
      return buildPlacedOrderResult(existing);
    }
  }

  const year = currentOrderYearKolkata();
  const guestPhoneNorm = normalizeGuestPhone(input.guestPhone);

  const orderRow = await prisma.$transaction(async (tx: OrderTx) => {
    const seq = await nextOrderSequenceNo(tx, year);
    const orderNumber = formatOrderNumber(year, seq);

    const variantsPack = await loadVariantsForOrderTx(tx, resolved.lines.map((l) => l.variantId));
    const reserveLines = variantsPack.map((v) => ({
      inventoryId: v.inventoryId,
      quantity: qtyMap.get(v.variantId) ?? 0,
      allowBackorder: v.allowBackorder,
      preorderEnabled: v.preorderEnabled,
    }));

    await reserveInventoryLines(tx, reserveLines, orderNumber);

    let couponRow: Coupon | null = null;
    if (couponResult?.eligible) {
      couponRow = await lockCouponById(tx, couponResult.couponId);
      assertCouponStillValidLocked(
        couponRow,
        couponResult,
        resolved.subtotal,
        input.paymentMethod,
        resolved.shippingBeforeCoupon,
      );
    }

    const shipJson = shippingToJson(input.shippingAddress);
    const billJson = input.billingAddress ? shippingToJson(input.billingAddress) : null;

    const created = await tx.order.create({
      data: {
        orderNumber,
        idempotencyKey: input.idempotencyKey?.trim() || null,
        userId: input.userId ?? null,
        guestEmail: input.userId ? null : normGuest,
        guestPhone: input.userId ? null : guestPhoneNorm,
        status: input.paymentMethod === "COD" ? "CONFIRMED" : "PLACED",
        paymentMethod: input.paymentMethod,
        subtotal: dec2(totals.subtotal),
        discountAmount: dec2(totals.discountOnSubtotal),
        shippingAmount: dec2(totals.shippingAfterCoupon),
        codCharge: dec2(totals.codCharge),
        taxAmount: dec2(totals.estimatedGstIncluded),
        total: dec2(totals.total),
        currency: "INR",
        couponCode:
          couponResult?.eligible && "code" in couponResult ? couponResult.code : null,
        shippingAddress: shipJson as Prisma.InputJsonValue,
        billingAddress: billJson === null ? undefined : (billJson as Prisma.InputJsonValue),
        placedAt: new Date(),
        confirmedAt: input.paymentMethod === "COD" ? new Date() : null,
        items: {
          create: resolved.lines.map((line) => {
            const v = variantsPack.find((x) => x.variantId === line.variantId)!;
            return {
              variantId: line.variantId,
              productName: v.productName,
              variantName: line.variantName,
              sku: line.sku,
              unitPrice: dec2(line.unitPrice),
              quantity: line.quantity,
              lineTotal: dec2(line.lineSubtotal),
            };
          }),
        },
        payments: {
          create: {
            method: input.paymentMethod,
            status: input.paymentMethod === "COD" ? "CAPTURED" : "PENDING",
            amount: dec2(totals.total),
          },
        },
        events: {
          create: {
            type: "ORDER_PLACED",
            payload: { paymentMethod: input.paymentMethod } as Prisma.InputJsonValue,
            actorId: input.userId ?? null,
          },
        },
      },
      include: { items: true, payments: true },
    });

    if (couponRow && couponResult?.eligible) {
      await tx.coupon.update({
        where: { id: couponRow.id },
        data: { usedCount: { increment: 1 } },
      });
      await tx.couponRedemption.create({
        data: {
          couponId: couponRow.id,
          orderId: created.id,
          userId: input.userId ?? null,
          guestEmail: input.userId ? null : normGuest,
          guestPhone: guestPhoneNorm,
          discountAmount: dec2(
            couponResult.type === "FREE_SHIPPING" ? 0 : couponResult.discountOnSubtotal,
          ),
          cartSubtotal: dec2(totals.subtotal),
        },
      });
    }

    if (input.paymentMethod === "COD") {
      await confirmInventoryForOrder(
        tx,
        reserveLines.map((r) => ({ inventoryId: r.inventoryId, quantity: r.quantity })),
        created.id,
        input.userId ?? null,
      );
      await tx.orderEvent.create({
        data: {
          orderId: created.id,
          type: "PAYMENT_CAPTURED",
          payload: { method: "COD" } as Prisma.InputJsonValue,
          actorId: input.userId ?? null,
        },
      });
      await tx.orderEvent.create({
        data: {
          orderId: created.id,
          type: "ORDER_CONFIRMED",
          payload: { source: "cod" } as Prisma.InputJsonValue,
          actorId: input.userId ?? null,
        },
      });
    }

    return created;
  });

  if (input.paymentMethod === "RAZORPAY") {
    const pay = orderRow.payments[0];
    if (!pay) throw new Error("Missing payment row");
    const paise = Math.max(100, Math.round(roundMoney(totals.total) * 100));
    const rzp = await createRazorpayOrder({
      amountPaise: paise,
      receipt: orderRow.orderNumber,
      notes: { orderNumber: orderRow.orderNumber },
    });
    await prisma.payment.update({
      where: { id: pay.id },
      data: { razorpayOrderId: rzp.id },
    });
    orderRow.payments[0] = { ...pay, razorpayOrderId: rzp.id };
  }

  void sideEffectsAfterPlaceOrder(orderRow.orderNumber, input.paymentMethod).catch((err) =>
    logger.error({ err, orderNumber: orderRow.orderNumber }, "post-place order notifications failed"),
  );

  return buildPlacedOrderResult(orderRow);
}

/**
 * Async transactional emails + admin pings (PRD §10.1).
 */
function sideEffectsAfterPlaceOrder(
  orderNumber: string,
  paymentMethod: "RAZORPAY" | "COD",
): Promise<void> {
  if (paymentMethod === "RAZORPAY") {
    return fireOrderPlacedPendingAndAdmin(orderNumber);
  }
  return Promise.all([
    fireAdminNewOrderOnly(orderNumber),
    fireOrderConfirmedSuite(orderNumber),
  ]).then(() => undefined);
}

/** Normalizes optional guest phone; returns null when absent or invalid. */
function normalizeGuestPhone(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  try {
    return normalizeIndianPhone(raw);
  } catch {
    return null;
  }
}

function shippingToJson(a: ShippingAddressPayload) {
  return {
    name: a.name.trim(),
    phone: a.phone,
    line1: a.line1.trim(),
    line2: a.line2?.trim() ?? null,
    city: a.city.trim(),
    state: a.state.trim(),
    pincode: a.pincode.trim(),
    country: a.country ?? "IN",
  };
}

async function loadVariantsForOrderTx(
  tx: OrderTx,
  variantIds: string[],
): Promise<
  {
    variantId: string;
    inventoryId: string;
    productName: string;
    variantName: string;
    allowBackorder: boolean;
    preorderEnabled: boolean;
  }[]
> {
  const rows = await tx.productVariant.findMany({
    where: { id: { in: variantIds }, isActive: true },
    include: {
      inventory: true,
      product: { select: { name: true, allowBackorder: true, preorderEnabled: true } },
    },
  });
  if (rows.length !== variantIds.length) {
    throw ValidationError("One or more variants are invalid or inactive");
  }
  return rows.map((v) => {
    if (!v.inventory) {
      throw ValidationError("Variant is missing inventory; contact support");
    }
    return {
      variantId: v.id,
      inventoryId: v.inventory.id,
      productName: v.product.name,
      variantName: v.name,
      allowBackorder: v.product.allowBackorder,
      preorderEnabled: v.product.preorderEnabled,
    };
  });
}

async function lockCouponById(tx: OrderTx, couponId: string): Promise<Coupon> {
  const rows = await tx.$queryRaw<Coupon[]>(
    Prisma.sql`SELECT * FROM "Coupon" WHERE id = ${couponId} FOR UPDATE`,
  );
  const c = rows[0];
  if (!c) throw CouponInvalid("Coupon not found");
  return c;
}

/**
 * Re-validates coupon row after `FOR UPDATE` (usage limits, window, min order, COD rule).
 */
function assertCouponStillValidLocked(
  c: Coupon,
  preview: CouponPreviewResult,
  subtotal: number,
  paymentMethod: "RAZORPAY" | "COD",
  shippingBeforeDiscount: number,
): void {
  if (!preview.eligible) throw CouponInvalid("Coupon not applicable");
  if (!c.isActive) throw CouponInvalid("Coupon is inactive");
  const now = new Date();
  if (c.startsAt && c.startsAt > now) throw CouponInvalid("Coupon is not active yet");
  if (c.endsAt && c.endsAt < now) throw CouponInvalid("Coupon has expired");
  if (c.usageLimit != null && c.usedCount >= c.usageLimit) {
    throw CouponInvalid("Coupon is exhausted");
  }
  if (paymentMethod === "COD" && !c.appliesToCOD) {
    throw CouponInvalid("This coupon cannot be used with COD");
  }
  const fresh = attachCouponMeta(
    computeCouponBenefit(c, subtotal, shippingBeforeDiscount),
    c,
  );
  if (!fresh.eligible) throw CouponInvalid(fresh.message);
}
