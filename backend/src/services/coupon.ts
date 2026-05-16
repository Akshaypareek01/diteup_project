/**
 * Coupon validation pipeline — PRD §8.5.1 (authoritative rules for preview + order TX reuse).
 */
import type { Coupon, CouponType } from "@prisma/client";

import { prisma } from "../utils/prisma.js";
import { normalizeEmail } from "../utils/format.js";
import { moneyNumber, roundMoney } from "../utils/money.js";

/** Terminal states that count as “already ordered” for `firstOrderOnly`. */
const QUALIFYING_FIRST_ORDER_STATUSES = [
  "CONFIRMED",
  "SHIPPED",
  "DELIVERED",
  "RETURNED",
  "REFUNDED",
] as const;

export type CouponRejectReason =
  | "NOT_FOUND"
  | "INACTIVE"
  | "EXPIRED"
  | "EXHAUSTED"
  | "LIMIT_REACHED"
  | "FIRST_ORDER_ONLY"
  | "MIN_ORDER"
  | "COD_NOT_ALLOWED"
  | "FREE_SHIPPING_REDUNDANT"
  | "IDENTITY_REQUIRED";

export type CouponPreviewResult =
  | {
      eligible: true;
      couponId: string;
      code: string;
      type: CouponType;
      /** Discount applied to cart subtotal (FLAT / PERCENT). Always 0 for FREE_SHIPPING. */
      discountOnSubtotal: number;
      /** Amount of shipping waived when type is FREE_SHIPPING (equals pre-coupon shipping). */
      shippingWaivedAmount: number;
      message: string;
    }
  | {
      eligible: false;
      reason: CouponRejectReason;
      message: string;
    };

type ValidateCouponInput = {
  code: string;
  /** Cart subtotal before shipping/COD/tax (sum of line sale totals). */
  subtotal: number;
  paymentMethod: "RAZORPAY" | "COD";
  userId?: string | null;
  guestEmail?: string | null;
  /** Pre-discount shipping estimate — required to detect FREE_SHIPPING redundancy (PRD §16 #47). */
  shippingBeforeDiscount?: number;
};

function toUpperCode(code: string): string {
  return code.trim().toUpperCase();
}

/**
 * Runs the 9-step coupon pipeline and returns an eligiblity preview (never throws for business rules).
 */
export async function validateCouponPreview(
  input: ValidateCouponInput,
): Promise<CouponPreviewResult> {
  const subtotal = roundMoney(input.subtotal);
  if (subtotal < 0) {
    return { eligible: false, reason: "MIN_ORDER", message: "Invalid cart subtotal" };
  }

  const code = toUpperCode(input.code);
  const coupon = await prisma.coupon.findUnique({ where: { code } });

  if (!coupon) {
    return {
      eligible: false,
      reason: "NOT_FOUND",
      message: "Invalid or unknown coupon code",
    };
  }

  // Step 1–2: active
  if (!coupon.isActive) {
    return { eligible: false, reason: "INACTIVE", message: "This coupon is no longer active" };
  }

  // Step 2: date window
  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) {
    return { eligible: false, reason: "EXPIRED", message: "This coupon is not active yet" };
  }
  if (coupon.endsAt && coupon.endsAt < now) {
    return { eligible: false, reason: "EXPIRED", message: "This coupon has expired" };
  }

  // Step 3: global usage
  if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) {
    return {
      eligible: false,
      reason: "EXHAUSTED",
      message: "This coupon has reached its maximum redemptions",
    };
  }

  const hasIdentity = Boolean(input.userId) || Boolean(input.guestEmail?.trim());

  // Step 4: per-user usage
  if (coupon.perUserLimit != null) {
    if (!hasIdentity) {
      return {
        eligible: false,
        reason: "IDENTITY_REQUIRED",
        message: "Sign in or provide an email to validate this coupon",
      };
    }
    const used = await countNonReversedRedemptions(coupon.id, input.userId, input.guestEmail);
    if (used >= coupon.perUserLimit) {
      return {
        eligible: false,
        reason: "LIMIT_REACHED",
        message: "You have already used this coupon the maximum number of times",
      };
    }
  }

  // Step 5: first-order only
  if (coupon.firstOrderOnly) {
    if (!hasIdentity) {
      return {
        eligible: false,
        reason: "IDENTITY_REQUIRED",
        message: "Sign in or provide an email to use this first-order coupon",
      };
    }
    const prior = await countQualifyingOrders(input.userId, input.guestEmail);
    if (prior > 0) {
      return {
        eligible: false,
        reason: "FIRST_ORDER_ONLY",
        message: "This coupon is only available on your first purchase",
      };
    }
  }

  // Step 6: min order (on subtotal before shipping/COD)
  if (coupon.minOrder != null) {
    const min = moneyNumber(coupon.minOrder);
    if (subtotal < min) {
      return {
        eligible: false,
        reason: "MIN_ORDER",
        message: `Minimum order of ₹${min} required for this coupon`,
      };
    }
  }

  // Step 7: COD restriction
  if (input.paymentMethod === "COD" && !coupon.appliesToCOD) {
    return {
      eligible: false,
      reason: "COD_NOT_ALLOWED",
      message: "This coupon cannot be used with Cash on Delivery",
    };
  }

  // Steps 8–9: compute benefit + attach ids
  const benefit = computeCouponBenefit(coupon, subtotal, input.shippingBeforeDiscount);
  return attachCouponMeta(benefit, coupon);
}

/**
 * Exported input shape for `/v1/coupons/validate` and cart preview.
 */
export type CouponValidateParams = ValidateCouponInput;

/**
 * Pure benefit calculation once structural checks passed — also reused from order TX (in-memory coupon row).
 */
export function computeCouponBenefit(
  coupon: Pick<Coupon, "type" | "value" | "maxDiscount">,
  subtotal: number,
  shippingBeforeDiscount?: number,
): CouponPreviewResult {
  const value = moneyNumber(coupon.value);

  if (coupon.type === "FREE_SHIPPING") {
    const ship = roundMoney(shippingBeforeDiscount ?? 0);
    if (ship <= 0) {
      return {
        eligible: false,
        reason: "FREE_SHIPPING_REDUNDANT",
        message: "Shipping is already free for this cart",
      };
    }
    return {
      eligible: true,
      couponId: "", // filled by caller when coupon row is known
      code: "",
      type: "FREE_SHIPPING",
      discountOnSubtotal: 0,
      shippingWaivedAmount: ship,
      message: "Free shipping applied",
    };
  }

  if (coupon.type === "FLAT") {
    const discount = roundMoney(Math.min(value, subtotal));
    return {
      eligible: true,
      couponId: "",
      code: "",
      type: "FLAT",
      discountOnSubtotal: discount,
      shippingWaivedAmount: 0,
      message: `₹${discount} off your order`,
    };
  }

  // PERCENT
  const pct = value;
  let discount = roundMoney((subtotal * pct) / 100);
  if (coupon.maxDiscount != null) {
    discount = roundMoney(Math.min(discount, moneyNumber(coupon.maxDiscount)));
  }
  discount = roundMoney(Math.min(discount, subtotal));
  return {
    eligible: true,
    couponId: "",
    code: "",
    type: "PERCENT",
    discountOnSubtotal: discount,
    shippingWaivedAmount: 0,
    message: `${pct}% off (₹${discount})`,
  };
}

/** Fills `couponId` + `code` on successful previews (wrapper around `computeCouponBenefit`). */
export function attachCouponMeta(
  result: CouponPreviewResult,
  coupon: Pick<Coupon, "id" | "code">,
): CouponPreviewResult {
  if (!result.eligible) return result;
  return {
    ...result,
    couponId: coupon.id,
    code: coupon.code,
  };
}

async function countNonReversedRedemptions(
  couponId: string,
  userId?: string | null,
  guestEmail?: string | null,
): Promise<number> {
  if (userId) {
    return prisma.couponRedemption.count({
      where: { couponId, isReversed: false, userId },
    });
  }
  if (guestEmail?.trim()) {
    return prisma.couponRedemption.count({
      where: {
        couponId,
        isReversed: false,
        guestEmail: normalizeEmail(guestEmail),
      },
    });
  }
  return 0;
}

async function countQualifyingOrders(
  userId?: string | null,
  guestEmail?: string | null,
): Promise<number> {
  if (userId) {
    return prisma.order.count({
      where: {
        userId,
        status: { in: [...QUALIFYING_FIRST_ORDER_STATUSES] },
      },
    });
  }
  if (guestEmail?.trim()) {
    const e = normalizeEmail(guestEmail);
    return prisma.order.count({
      where: {
        status: { in: [...QUALIFYING_FIRST_ORDER_STATUSES] },
        OR: [{ guestEmail: e }, { user: { email: e } }],
      },
    });
  }
  return 0;
}
