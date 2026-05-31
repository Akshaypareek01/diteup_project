/**
 * Public catalog: featured + PDP payloads, pincode policy, back-in-stock subscriptions.
 *
 * Visibility + stock rules: PRD §5.5 and §12.
 */
import type { Product, ProductVisibility } from "@prisma/client";

import { prisma } from "../utils/prisma.js";
import { isValidIndianPincode, normalizeEmail } from "../utils/format.js";
import { NotFound, ProductUnavailable, ValidationError } from "../utils/errors.js";
import { getPincodePolicy } from "./settings.js";

type VariantStock = {
  id: string;
  sku: string;
  name: string;
  priceMrp: unknown;
  priceSale: unknown;
  isDefault: boolean;
  isActive: boolean;
  inventory: { stockOnHand: number; stockReserved: number } | null;
};

type ProductForVisibility = Pick<
  Product,
  | "id"
  | "visibility"
  | "allowBackorder"
  | "preorderEnabled"
  | "availableFrom"
  | "availableUntil"
> & { variants: VariantStock[] };

/**
 * Computes listing visibility as seen by customers (stock overlay on PUBLISHED only).
 */
export function computeEffectiveVisibility(product: ProductForVisibility): ProductVisibility {
  const v = product.visibility;

  if (
    v === "DRAFT" ||
    v === "HIDDEN" ||
    v === "ARCHIVED" ||
    v === "COMING_SOON" ||
    v === "UNDER_MAINTENANCE"
  ) {
    return v;
  }

  const now = new Date();
  if (product.availableUntil && product.availableUntil < now) {
    return "HIDDEN";
  }

  if (v === "OUT_OF_STOCK") {
    return "OUT_OF_STOCK";
  }

  // Only PUBLISHED is auto-flipped by inventory.
  if (v !== "PUBLISHED") {
    return v;
  }

  const activeVariants = product.variants.filter((x) => x.isActive);
  if (activeVariants.length === 0) {
    return "OUT_OF_STOCK";
  }

  if (product.allowBackorder || product.preorderEnabled) {
    return "PUBLISHED";
  }

  const anyAvailable = activeVariants.some((variant) => {
    const inv = variant.inventory;
    if (!inv) return false;
    return inv.stockOnHand - inv.stockReserved > 0;
  });

  if (!anyAvailable) {
    return "OUT_OF_STOCK";
  }

  return "PUBLISHED";
}

/** Whether the storefront should expose a buyable state (API enforcement matches this on checkout). */
export function isCustomerBuyable(effective: ProductVisibility): boolean {
  return effective === "PUBLISHED";
}

const publicProductInclude = {
  media: { orderBy: { order: "asc" as const } },
  variants: {
    where: { isActive: true },
    orderBy: { createdAt: "asc" as const },
    include: {
      inventory: { select: { stockOnHand: true, stockReserved: true } },
    },
  },
  faqs: { orderBy: { order: "asc" as const } },
} as const;

function mapVariant(variant: VariantStock) {
  const inv = variant.inventory;
  const available =
    inv == null ? 0 : Math.max(0, inv.stockOnHand - inv.stockReserved);
  return {
    id: variant.id,
    sku: variant.sku,
    name: variant.name,
    priceMrp: variant.priceMrp,
    priceSale: variant.priceSale,
    isDefault: variant.isDefault,
    available,
  };
}

/**
 * Shapes a stored product + variants for anonymous/API consumers (no admin-only fields leaked).
 */
export function toPublicProductPayload(
  product: Product & {
    variants: VariantStock[];
    media: unknown[];
    faqs: unknown[];
  },
) {
  const effectiveVisibility = computeEffectiveVisibility(product);
  const buyable = isCustomerBuyable(effectiveVisibility);

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description,
    shortDesc: product.shortDesc,
    visibility: product.visibility,
    effectiveVisibility,
    buyable,
    visibilityNote: product.visibilityNote,
    media: product.media,
    variants: product.variants.filter((v) => v.isActive).map(mapVariant),
    faqs: product.faqs,
    seo: product.seo,
    displayBadge: product.displayBadge,
    ctaLabelOverride: product.ctaLabelOverride,
    reviewsEnabled: product.reviewsEnabled,
    showStockCount: product.showStockCount,
    codEnabled: product.codEnabled,
    onlinePaymentEnabled: product.onlinePaymentEnabled,
    freeShipping: product.freeShipping,
    shippingOverride: product.shippingOverride,
    codChargeOverride: product.codChargeOverride,
    minQtyPerOrder: product.minQtyPerOrder,
    maxQtyPerOrder: product.maxQtyPerOrder,
    allowBackorder: product.allowBackorder,
    preorderEnabled: product.preorderEnabled,
    preorderShipDate: product.preorderShipDate,
    requiresAgeVerification: product.requiresAgeVerification,
    gstRate: product.gstRate,
    hsnCode: product.hsnCode,
    isRefundable: product.isRefundable,
    refundWindowDays: product.refundWindowDays,
    refundPolicyText: product.refundPolicyText,
    isReturnable: product.isReturnable,
    isExchangeable: product.isExchangeable,
  };
}

/**
 * Single featured product (v1: `isFeatured`); throws NotFound when nothing is listable.
 */
export async function getFeaturedProduct() {
  const raw = await prisma.product.findFirst({
    where: { isFeatured: true },
    include: publicProductInclude,
  });

  if (!raw) throw NotFound("No featured product configured");

  const effective = computeEffectiveVisibility(raw);
  if (effective === "DRAFT" || effective === "HIDDEN" || effective === "ARCHIVED") {
    throw NotFound("Product not available");
  }

  return toPublicProductPayload(raw);
}

/**
 * Product detail by slug — 404 for unavailable or non-listable effective states.
 */
export async function getProductBySlug(slug: string) {
  const raw = await prisma.product.findUnique({
    where: { slug },
    include: publicProductInclude,
  });

  if (!raw) throw NotFound("Product not found");

  const effective = computeEffectiveVisibility(raw);
  if (
    effective === "DRAFT" ||
    effective === "HIDDEN" ||
    effective === "ARCHIVED"
  ) {
    throw NotFound("Product not found");
  }

  return toPublicProductPayload(raw);
}

export type SitemapProductRow = {
  slug: string;
  updatedAt: string;
};

/**
 * Published product slugs for sitemap.xml — excludes draft, hidden, and archived effective states.
 */
export async function getSitemapProducts(): Promise<SitemapProductRow[]> {
  const rows = await prisma.product.findMany({
    where: {
      visibility: { notIn: ["DRAFT", "HIDDEN", "ARCHIVED"] },
    },
    select: {
      id: true,
      slug: true,
      updatedAt: true,
      visibility: true,
      allowBackorder: true,
      preorderEnabled: true,
      availableFrom: true,
      availableUntil: true,
      variants: {
        where: { isActive: true },
        orderBy: { createdAt: "asc" as const },
        include: {
          inventory: { select: { stockOnHand: true, stockReserved: true } },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return rows
    .filter((row) => {
      const effective = computeEffectiveVisibility(row);
      return (
        effective !== "DRAFT" &&
        effective !== "HIDDEN" &&
        effective !== "ARCHIVED"
      );
    })
    .map((row) => ({
      slug: row.slug,
      updatedAt: row.updatedAt.toISOString(),
    }));
}

export type PincodeCheckResult = {
  serviceable: boolean;
  codAvailable: boolean;
  etaDays: number;
  reason?: "SITE_RESTRICTED" | "SERVICE_AREA" | "PRODUCT_RESTRICTED" | "COD_NOT_OFFERED";
};

/**
 * Validates serviceability + COD eligibility for a PIN (and optional product restrictions).
 */
export async function checkPincode(input: {
  pincode: string;
  productId?: string;
}): Promise<PincodeCheckResult> {
  const pin = input.pincode.trim();
  if (!isValidIndianPincode(pin)) {
    throw ValidationError("Invalid Indian PIN code");
  }

  const policy = await getPincodePolicy();
  const etaDays = policy.estimatedDeliveryDays ?? 5;
  const siteCodEnabled = policy.codEnabled !== false;

  const restricted = new Set(policy.restrictedPincodes ?? []);
  if (restricted.has(pin)) {
    return {
      serviceable: false,
      codAvailable: false,
      etaDays,
      reason: "SITE_RESTRICTED",
    };
  }

  const serviceableList = policy.serviceablePincodes ?? [];
  if (serviceableList.length > 0 && !serviceableList.includes(pin)) {
    return {
      serviceable: false,
      codAvailable: false,
      etaDays,
      reason: "SERVICE_AREA",
    };
  }

  let productRestricted = false;
  if (input.productId) {
    const product = await prisma.product.findUnique({
      where: { id: input.productId },
      select: { id: true, restrictedPincodes: true, codEnabled: true },
    });
    if (!product) throw NotFound("Product not found");
    const list = product.restrictedPincodes;
    if (Array.isArray(list) && list.some((p) => String(p) === pin)) {
      productRestricted = true;
    }
    if (productRestricted) {
      return {
        serviceable: false,
        codAvailable: false,
        etaDays,
        reason: "PRODUCT_RESTRICTED",
      };
    }
    if (!product.codEnabled) {
      return { serviceable: true, codAvailable: false, etaDays, reason: "COD_NOT_OFFERED" };
    }
  }

  const codList = policy.codPincodes ?? [];
  const codAvailable =
    siteCodEnabled && (codList.length === 0 || codList.includes(pin));

  return {
    serviceable: true,
    codAvailable,
    etaDays,
    ...(codAvailable ? {} : { reason: "COD_NOT_OFFERED" as const }),
  };
}

/**
 * Subscribe an email to stock alerts for a variant (deduped per variant + email).
 */
export async function createStockNotification(input: {
  variantId: string;
  email: string;
  phone?: string;
  userId?: string | null;
}) {
  const variant = await prisma.productVariant.findFirst({
    where: { id: input.variantId, isActive: true },
    select: { id: true, productId: true },
  });
  if (!variant) {
    throw ProductUnavailable("Variant is not available for notifications");
  }

  const email = normalizeEmail(input.email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw ValidationError("Invalid email address");
  }

  return prisma.stockNotification.upsert({
    where: {
      variantId_email: { variantId: variant.id, email },
    },
    create: {
      variantId: variant.id,
      email,
      phone: input.phone ?? null,
      userId: input.userId ?? null,
    },
    update: {
      phone: input.phone ?? null,
      userId: input.userId ?? null,
      notifiedAt: null,
    },
  });
}
