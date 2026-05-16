/**
 * Server-side cart pricing — DB-backed line totals, shipping/COD from `checkout` settings,
 * and coupon preview (PRD §8.5). Reused by `/v1/cart/preview` and future checkout.
 */
import type { Product } from "@prisma/client";

import { prisma } from "../utils/prisma.js";
import { ValidationError, ProductUnavailable } from "../utils/errors.js";
import { moneyNumber, roundMoney } from "../utils/money.js";
import { getCheckoutDefaults, type CheckoutDefaults } from "./settings.js";
import { validateCouponPreview, type CouponPreviewResult } from "./coupon.js";
import { computeEffectiveVisibility, isCustomerBuyable } from "./catalog.js";

export type CartLineRequest = { variantId: string; quantity: number };

export type CartPreviewLine = {
  variantId: string;
  productId: string;
  sku: string;
  variantName: string;
  quantity: number;
  unitPrice: number;
  lineSubtotal: number;
  gstRatePercent: number;
};

export type CartPricingBreakdown = {
  currency: "INR";
  lines: CartPreviewLine[];
  subtotal: number;
  coupon: CouponPreviewResult | null;
  discountOnSubtotal: number;
  shippingDiscountFromCoupon: number;
  shippingBeforeCoupon: number;
  shippingAfterCoupon: number;
  subtotalAfterDiscount: number;
  codCharge: number;
  taxInclusive: boolean;
  /** GST portion inside inclusive `priceSale` lines (non-additive to `total`). */
  estimatedGstIncluded: number;
  total: number;
};

/** Resolves DB lines + pre-coupon shipping (no coupon). */
export type ResolvedCheckout = {
  lines: CartPreviewLine[];
  uniqueProducts: Product[];
  productById: Map<string, Product>;
  checkout: CheckoutDefaults;
  shippingBeforeCoupon: number;
  subtotal: number;
};

/**
 * Merges duplicate `variantId` keys into summed quantities.
 */
export function mergeCartLines(items: CartLineRequest[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const { variantId, quantity } of items) {
    if (!variantId?.trim()) throw ValidationError("Each item needs a variantId");
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw ValidationError("Quantity must be a positive integer");
    }
    map.set(variantId, (map.get(variantId) ?? 0) + quantity);
  }
  return map;
}

/**
 * Loads variants, enforces visibility/qty, computes subtotal and shipping before coupon.
 * Used by `/v1/cart/preview` and `POST /v1/orders`.
 */
export async function resolveCheckoutCart(input: {
  items: CartLineRequest[];
}): Promise<ResolvedCheckout> {
  if (!input.items?.length) {
    throw ValidationError("Cart cannot be empty");
  }

  const merged = mergeCartLines(input.items);
  const variantIds = [...merged.keys()];

  const rows = await prisma.productVariant.findMany({
    where: { id: { in: variantIds }, isActive: true },
    include: {
      inventory: true,
      product: {
        include: {
          variants: {
            where: { isActive: true },
            include: { inventory: true },
          },
        },
      },
    },
  });

  if (rows.length !== variantIds.length) {
    throw ValidationError("One or more variants are invalid or inactive");
  }

  const qtyByProduct = new Map<string, number>();
  const lines: CartPreviewLine[] = [];

  for (const v of rows) {
    const qty = merged.get(v.id)!;
    const p = v.product;
    const visPayload = {
      id: p.id,
      visibility: p.visibility,
      allowBackorder: p.allowBackorder,
      preorderEnabled: p.preorderEnabled,
      availableFrom: p.availableFrom,
      availableUntil: p.availableUntil,
      variants: p.variants.map((vv) => ({
        id: vv.id,
        sku: vv.sku,
        name: vv.name,
        priceMrp: vv.priceMrp,
        priceSale: vv.priceSale,
        isDefault: vv.isDefault,
        isActive: vv.isActive,
        inventory: vv.inventory,
      })),
    };
    const effective = computeEffectiveVisibility(visPayload);
    if (!isCustomerBuyable(effective)) {
      throw ProductUnavailable(
        `“${p.name}” is not available for purchase right now`,
        "VISIBILITY",
      );
    }

    const unit = roundMoney(moneyNumber(v.priceSale));
    const lineSubtotal = roundMoney(unit * qty);
    const gstRate = moneyNumber(p.gstRate);

    lines.push({
      variantId: v.id,
      productId: p.id,
      sku: v.sku,
      variantName: v.name,
      quantity: qty,
      unitPrice: unit,
      lineSubtotal,
      gstRatePercent: gstRate,
    });

    qtyByProduct.set(p.id, (qtyByProduct.get(p.id) ?? 0) + qty);
  }

  const productById = new Map(rows.map((r) => [r.productId, r.product] as const));

  for (const [productId, totalQty] of qtyByProduct) {
    const p = productById.get(productId);
    if (!p) continue;
    if (totalQty < p.minQtyPerOrder) {
      throw ValidationError(
        `Minimum quantity for “${p.name}” is ${p.minQtyPerOrder} per order`,
      );
    }
    if (totalQty > p.maxQtyPerOrder) {
      throw ValidationError(
        `Maximum quantity for “${p.name}” is ${p.maxQtyPerOrder} per order`,
      );
    }
  }

  const checkout = await getCheckoutDefaults();
  const uniqueProducts = [...productById.values()];

  const subtotal = roundMoney(lines.reduce((s, l) => s + l.lineSubtotal, 0));

  const shippingBeforeCoupon = roundMoney(
    computeBaseShipping(subtotal, checkout, uniqueProducts),
  );

  return {
    lines,
    uniqueProducts,
    productById,
    checkout,
    shippingBeforeCoupon,
    subtotal,
  };
}

/**
 * Pure pricing math from resolved lines + checkout defaults + optional coupon result.
 */
export function computeCartTotals(args: {
  lineSubtotals: number[];
  gstRatePercents: number[];
  checkout: CheckoutDefaults;
  paymentMethod: "RAZORPAY" | "COD";
  products: Pick<
    Product,
    "freeShipping" | "shippingOverride" | "codChargeOverride"
  >[];
  coupon: CouponPreviewResult | null;
  taxInclusive: boolean;
}): Pick<
  CartPricingBreakdown,
  | "subtotal"
  | "discountOnSubtotal"
  | "shippingDiscountFromCoupon"
  | "shippingBeforeCoupon"
  | "shippingAfterCoupon"
  | "subtotalAfterDiscount"
  | "codCharge"
  | "taxInclusive"
  | "estimatedGstIncluded"
  | "total"
> {
  const subtotal = roundMoney(args.lineSubtotals.reduce((a, b) => a + b, 0));

  let estimatedGstRaw = 0;
  for (let i = 0; i < args.lineSubtotals.length; i++) {
    const lineTotal = args.lineSubtotals[i]!;
    const rate = args.gstRatePercents[i] ?? 0;
    if (args.taxInclusive && rate > 0) {
      estimatedGstRaw += (lineTotal * rate) / (100 + rate);
    }
  }
  const estimatedGstIncluded = roundMoney(estimatedGstRaw);

  const shippingBeforeCoupon = roundMoney(
    computeBaseShipping(subtotal, args.checkout, args.products),
  );

  const codCharge =
    args.paymentMethod === "COD"
      ? roundMoney(computeCodCharge(args.checkout, args.products))
      : 0;

  let discountOnSubtotal = 0;
  let shippingDiscountFromCoupon = 0;
  let shippingAfterCoupon = shippingBeforeCoupon;

  if (args.coupon?.eligible) {
    if (args.coupon.type === "FREE_SHIPPING") {
      shippingDiscountFromCoupon = shippingBeforeCoupon;
      shippingAfterCoupon = 0;
    } else {
      discountOnSubtotal = args.coupon.discountOnSubtotal;
    }
  }

  const subtotalAfterDiscount = roundMoney(Math.max(0, subtotal - discountOnSubtotal));
  const total = roundMoney(subtotalAfterDiscount + shippingAfterCoupon + codCharge);

  return {
    subtotal,
    discountOnSubtotal,
    shippingDiscountFromCoupon,
    shippingBeforeCoupon,
    shippingAfterCoupon,
    subtotalAfterDiscount,
    codCharge,
    taxInclusive: args.taxInclusive,
    estimatedGstIncluded,
    total,
  };
}

/**
 * Loads variants, validates sellability + per-product qty bounds, applies coupon + totals.
 */
export async function previewCart(input: {
  items: CartLineRequest[];
  couponCode?: string | null;
  paymentMethod: "RAZORPAY" | "COD";
  userId?: string | null;
  guestEmail?: string | null;
}): Promise<CartPricingBreakdown> {
  const resolved = await resolveCheckoutCart({ items: input.items });

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
  }

  const totals = computeCartTotals({
    lineSubtotals: resolved.lines.map((l) => l.lineSubtotal),
    gstRatePercents: resolved.lines.map((l) => l.gstRatePercent),
    checkout: resolved.checkout,
    paymentMethod: input.paymentMethod,
    products: resolved.uniqueProducts,
    coupon: couponResult,
    taxInclusive: resolved.checkout.taxInclusive,
  });

  return {
    currency: "INR",
    lines: resolved.lines,
    coupon: couponResult,
    ...totals,
  };
}

function computeBaseShipping(
  subtotal: number,
  checkout: CheckoutDefaults,
  products: Pick<Product, "freeShipping" | "shippingOverride">[],
): number {
  if (checkout.freeShippingThreshold != null && subtotal >= checkout.freeShippingThreshold) {
    return 0;
  }
  if (products.some((p) => p.freeShipping)) {
    return 0;
  }
  const rates = products.map((p) =>
    p.shippingOverride != null ? moneyNumber(p.shippingOverride) : checkout.shippingFlatRate,
  );
  return Math.max(checkout.shippingFlatRate, ...rates);
}

function computeCodCharge(
  checkout: CheckoutDefaults,
  products: Pick<Product, "codChargeOverride">[],
): number {
  const rates = products.map((p) =>
    p.codChargeOverride != null
      ? moneyNumber(p.codChargeOverride)
      : checkout.codChargeDefault,
  );
  return Math.max(checkout.codChargeDefault, ...rates);
}
