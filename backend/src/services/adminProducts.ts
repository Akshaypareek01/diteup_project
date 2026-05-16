/**
 * Admin catalog — products, variants, media, visibility (PRD §8.5).
 */
import { Prisma } from "@prisma/client";
import type {
  MediaType,
  ProductBadge,
  ProductVisibility,
} from "@prisma/client";
import type { Request } from "express";

import { recordAudit } from "../utils/adminAudit.js";
import { NotFound, ValidationError } from "../utils/errors.js";
import { prisma } from "../utils/prisma.js";

function dec2(n: number): Prisma.Decimal {
  return new Prisma.Decimal(Number(n).toFixed(2));
}

export type AdminProductListQuery = {
  page: number;
  pageSize: number;
  visibility?: ProductVisibility;
  q?: string;
};

/**
 * Paginated products for admin.
 */
export async function listProductsAdmin(input: AdminProductListQuery) {
  const take = input.pageSize;
  const skip = (input.page - 1) * take;
  const where: Prisma.ProductWhereInput = {};
  if (input.visibility) where.visibility = input.visibility;
  if (input.q?.trim()) {
    const q = input.q.trim();
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { slug: { contains: q, mode: "insensitive" } },
    ];
  }

  const [total, rows] = await prisma.$transaction([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip,
      take,
      include: {
        variants: {
          take: 5,
          include: { inventory: { select: { stockOnHand: true, stockReserved: true } } },
        },
        media: { take: 3, orderBy: { order: "asc" } },
      },
    }),
  ]);

  return { total, page: input.page, pageSize: take, products: rows };
}

/**
 * Full product graph for editor.
 */
export async function getProductAdmin(productId: string) {
  const p = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      variants: { include: { inventory: true } },
      media: { orderBy: { order: "asc" } },
      faqs: { orderBy: { order: "asc" } },
    },
  });
  if (!p) throw NotFound("Product not found");
  return p;
}

/**
 * Creates a product with an initial variant + inventory row.
 */
export async function createProductAdmin(input: {
  slug: string;
  name: string;
  description: string;
  /** First variant */
  sku: string;
  variantName: string;
  priceMrp: number;
  priceSale: number;
  visibility?: ProductVisibility;
  actorId: string;
  req?: Request;
}) {
  const slug = input.slug.trim().toLowerCase();
  const exists = await prisma.product.findUnique({ where: { slug } });
  if (exists) throw ValidationError("Slug already in use");

  const product = await prisma.$transaction(async (tx) => {
    const prod = await tx.product.create({
      data: {
        slug,
        name: input.name.trim(),
        description: input.description,
        visibility: input.visibility ?? "DRAFT",
      },
    });
    const variant = await tx.productVariant.create({
      data: {
        productId: prod.id,
        sku: input.sku.trim(),
        name: input.variantName.trim(),
        priceMrp: dec2(input.priceMrp),
        priceSale: dec2(input.priceSale),
        isDefault: true,
      },
    });
    await tx.inventory.create({
      data: { variantId: variant.id, stockOnHand: 0, lowStockThreshold: 10 },
    });
    return prod;
  });

  await recordAudit({
    actorId: input.actorId,
    action: "product.create",
    entity: "Product",
    entityId: product.id,
    diff: { slug: product.slug },
    req: input.req,
  });

  return getProductAdmin(product.id);
}

/**
 * Updates product scalar fields and scheduling.
 */
export async function updateProductAdmin(input: {
  productId: string;
  actorId: string;
  data: {
    name?: string;
    description?: string;
    shortDesc?: string | null;
    slug?: string;
    visibility?: ProductVisibility;
    visibilityNote?: string | null;
    availableFrom?: Date | null;
    availableUntil?: Date | null;
    isFeatured?: boolean;
    isRefundable?: boolean;
    refundWindowDays?: number | null;
    codEnabled?: boolean;
    onlinePaymentEnabled?: boolean;
    allowBackorder?: boolean;
    showStockCount?: boolean;
    reviewsEnabled?: boolean;
    displayBadge?: ProductBadge | null;
    hsnCode?: string | null;
    gstRate?: number;
    seo?: Prisma.InputJsonValue | null;
  };
  req?: Request;
}) {
  const existing = await prisma.product.findUnique({ where: { id: input.productId } });
  if (!existing) throw NotFound("Product not found");

  if (input.data.slug && input.data.slug !== existing.slug) {
    const slug = input.data.slug.trim().toLowerCase();
    const clash = await prisma.product.findFirst({
      where: { slug, NOT: { id: input.productId } },
    });
    if (clash) throw ValidationError("Slug already in use");
  }

  const d = input.data;
  const patch: Prisma.ProductUpdateInput = {};
  if (d.name !== undefined) patch.name = d.name.trim();
  if (d.description !== undefined) patch.description = d.description;
  if (d.shortDesc !== undefined) patch.shortDesc = d.shortDesc;
  if (d.slug !== undefined) patch.slug = d.slug.trim().toLowerCase();
  if (d.visibility !== undefined) patch.visibility = d.visibility;
  if (d.visibilityNote !== undefined) patch.visibilityNote = d.visibilityNote;
  if (d.availableFrom !== undefined) patch.availableFrom = d.availableFrom;
  if (d.availableUntil !== undefined) patch.availableUntil = d.availableUntil;
  if (d.isFeatured !== undefined) patch.isFeatured = d.isFeatured;
  if (d.isRefundable !== undefined) patch.isRefundable = d.isRefundable;
  if (d.refundWindowDays !== undefined) patch.refundWindowDays = d.refundWindowDays;
  if (d.codEnabled !== undefined) patch.codEnabled = d.codEnabled;
  if (d.onlinePaymentEnabled !== undefined) patch.onlinePaymentEnabled = d.onlinePaymentEnabled;
  if (d.allowBackorder !== undefined) patch.allowBackorder = d.allowBackorder;
  if (d.showStockCount !== undefined) patch.showStockCount = d.showStockCount;
  if (d.reviewsEnabled !== undefined) patch.reviewsEnabled = d.reviewsEnabled;
  if (d.displayBadge !== undefined) patch.displayBadge = d.displayBadge;
  if (d.hsnCode !== undefined) patch.hsnCode = d.hsnCode;
  if (d.gstRate !== undefined) patch.gstRate = dec2(d.gstRate);
  if (d.seo !== undefined) {
    patch.seo =
      d.seo === null ? Prisma.JsonNull : (d.seo as Prisma.InputJsonValue);
  }

  await prisma.product.update({ where: { id: input.productId }, data: patch });

  await recordAudit({
    actorId: input.actorId,
    action: "product.update",
    entity: "Product",
    entityId: input.productId,
    diff: { patch },
    req: input.req,
  });

  return getProductAdmin(input.productId);
}

/**
 * Archives product (soft delete for storefront).
 */
export async function archiveProductAdmin(input: {
  productId: string;
  actorId: string;
  req?: Request;
}): Promise<void> {
  const existing = await prisma.product.findUnique({ where: { id: input.productId } });
  if (!existing) throw NotFound("Product not found");
  await prisma.product.update({
    where: { id: input.productId },
    data: { visibility: "ARCHIVED" },
  });
  await recordAudit({
    actorId: input.actorId,
    action: "product.archive",
    entity: "Product",
    entityId: input.productId,
    req: input.req,
  });
}

/**
 * Bulk visibility for merchandising ops.
 */
export async function bulkSetProductVisibilityAdmin(input: {
  productIds: string[];
  visibility: ProductVisibility;
  actorId: string;
  req?: Request;
}): Promise<{ updated: number }> {
  const res = await prisma.product.updateMany({
    where: { id: { in: input.productIds } },
    data: { visibility: input.visibility },
  });
  await recordAudit({
    actorId: input.actorId,
    action: "product.bulk_visibility",
    entity: "Product",
    diff: { count: res.count, visibility: input.visibility },
    req: input.req,
  });
  return { updated: res.count };
}

/**
 * Adds or replaces variants; ensures inventory row exists.
 */
export async function upsertVariantAdmin(input: {
  productId: string;
  variantId?: string | null;
  sku: string;
  name: string;
  priceMrp: number;
  priceSale: number;
  weightGm?: number | null;
  isDefault?: boolean;
  isActive?: boolean;
  actorId: string;
  req?: Request;
}) {
  const product = await prisma.product.findUnique({ where: { id: input.productId } });
  if (!product) throw NotFound("Product not found");

  const sku = input.sku.trim();
  const skuOwner = await prisma.productVariant.findFirst({
    where: input.variantId ? { sku, NOT: { id: input.variantId } } : { sku },
  });
  if (skuOwner) throw ValidationError("SKU already in use");

  if (input.variantId) {
    await prisma.productVariant.update({
      where: { id: input.variantId },
      data: {
        sku,
        name: input.name.trim(),
        priceMrp: dec2(input.priceMrp),
        priceSale: dec2(input.priceSale),
        weightGm: input.weightGm ?? undefined,
        isDefault: input.isDefault,
        isActive: input.isActive,
      },
    });
  } else {
    await prisma.$transaction(async (tx) => {
      const v = await tx.productVariant.create({
        data: {
          productId: input.productId,
          sku,
          name: input.name.trim(),
          priceMrp: dec2(input.priceMrp),
          priceSale: dec2(input.priceSale),
          weightGm: input.weightGm ?? null,
          isDefault: input.isDefault ?? false,
          isActive: input.isActive ?? true,
        },
      });
      await tx.inventory.create({
        data: { variantId: v.id, stockOnHand: 0, lowStockThreshold: 10 },
      });
    });
  }

  await recordAudit({
    actorId: input.actorId,
    action: input.variantId ? "variant.update" : "variant.create",
    entity: "ProductVariant",
    entityId: input.variantId ?? input.productId,
    req: input.req,
  });

  return getProductAdmin(input.productId);
}

/**
 * Adds media asset reference.
 */
export async function addProductMediaAdmin(input: {
  productId: string;
  type: MediaType;
  url: string;
  altText?: string | null;
  order?: number;
  actorId: string;
  req?: Request;
}): Promise<void> {
  const product = await prisma.product.findUnique({ where: { id: input.productId } });
  if (!product) throw NotFound("Product not found");

  const maxOrder = await prisma.productMedia.aggregate({
    where: { productId: input.productId },
    _max: { order: true },
  });
  const nextOrder = input.order ?? (maxOrder._max.order ?? -1) + 1;

  await prisma.productMedia.create({
    data: {
      productId: input.productId,
      type: input.type,
      url: input.url.trim(),
      altText: input.altText?.trim() ?? null,
      order: nextOrder,
    },
  });

  await recordAudit({
    actorId: input.actorId,
    action: "product.media_add",
    entity: "Product",
    entityId: input.productId,
    diff: { url: input.url },
    req: input.req,
  });
}

/**
 * Removes a media row.
 */
export async function deleteProductMediaAdmin(input: {
  mediaId: string;
  actorId: string;
  req?: Request;
}): Promise<void> {
  const row = await prisma.productMedia.findUnique({ where: { id: input.mediaId } });
  if (!row) throw NotFound("Media not found");
  await prisma.productMedia.delete({ where: { id: input.mediaId } });
  await recordAudit({
    actorId: input.actorId,
    action: "product.media_delete",
    entity: "Product",
    entityId: row.productId,
    diff: { mediaId: input.mediaId },
    req: input.req,
  });
}
