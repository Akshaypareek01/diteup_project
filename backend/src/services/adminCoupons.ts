/**
 * Admin coupons — CRUD + redemption stats + export (PRD §8.7).
 */
import { Prisma } from "@prisma/client";
import type { CouponType } from "@prisma/client";
import type { Request } from "express";
import * as XLSX from "xlsx";

import { recordAudit } from "../utils/adminAudit.js";
import { NotFound } from "../utils/errors.js";
import { moneyNumber } from "../utils/money.js";
import { prisma } from "../utils/prisma.js";

function dec2(n: number): Prisma.Decimal {
  return new Prisma.Decimal(Number(n).toFixed(2));
}

/**
 * Lists coupons with pagination.
 */
export async function listCouponsAdmin(input: { page: number; pageSize: number; active?: boolean }) {
  const take = input.pageSize;
  const skip = (input.page - 1) * take;
  const where: Prisma.CouponWhereInput = {};
  if (input.active !== undefined) where.isActive = input.active;

  const [total, rows] = await prisma.$transaction([
    prisma.coupon.count({ where }),
    prisma.coupon.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip,
      take,
    }),
  ]);

  return {
    total,
    page: input.page,
    pageSize: take,
    coupons: rows.map((c) => ({
      ...c,
      value: moneyNumber(c.value),
      minOrder: c.minOrder != null ? moneyNumber(c.minOrder) : null,
      maxDiscount: c.maxDiscount != null ? moneyNumber(c.maxDiscount) : null,
    })),
  };
}

/**
 * Coupon detail + recent redemptions.
 */
export async function getCouponAdmin(couponId: string) {
  const c = await prisma.coupon.findUnique({
    where: { id: couponId },
    include: {
      redemptions: {
        orderBy: { redeemedAt: "desc" },
        take: 50,
        include: { order: { select: { orderNumber: true, status: true, total: true } } },
      },
    },
  });
  if (!c) throw NotFound("Coupon not found");
  const { redemptions, ...couponRow } = c;
  return {
    coupon: {
      ...couponRow,
      value: moneyNumber(couponRow.value),
      minOrder: couponRow.minOrder != null ? moneyNumber(couponRow.minOrder) : null,
      maxDiscount: couponRow.maxDiscount != null ? moneyNumber(couponRow.maxDiscount) : null,
    },
    redemptions: redemptions.map((r) => ({
      ...r,
      discountAmount: moneyNumber(r.discountAmount),
      cartSubtotal: moneyNumber(r.cartSubtotal),
    })),
  };
}

/**
 * Creates a coupon (code uppercased).
 */
export async function createCouponAdmin(input: {
  code: string;
  type: CouponType;
  value: number;
  description?: string | null;
  minOrder?: number | null;
  maxDiscount?: number | null;
  usageLimit?: number | null;
  perUserLimit?: number | null;
  firstOrderOnly?: boolean;
  appliesToCOD?: boolean;
  startsAt?: Date | null;
  endsAt?: Date | null;
  isActive?: boolean;
  source?: string | null;
  actorId: string;
  req?: Request;
}) {
  const code = input.code.trim().toUpperCase();
  const c = await prisma.coupon.create({
    data: {
      code,
      description: input.description?.trim() ?? null,
      type: input.type,
      value: dec2(input.value),
      minOrder: input.minOrder != null ? dec2(input.minOrder) : null,
      maxDiscount: input.maxDiscount != null ? dec2(input.maxDiscount) : null,
      usageLimit: input.usageLimit ?? null,
      perUserLimit: input.perUserLimit ?? 1,
      firstOrderOnly: input.firstOrderOnly ?? false,
      appliesToCOD: input.appliesToCOD ?? true,
      startsAt: input.startsAt ?? null,
      endsAt: input.endsAt ?? null,
      isActive: input.isActive ?? true,
      source: input.source ?? null,
      createdBy: input.actorId,
    },
  });

  await recordAudit({
    actorId: input.actorId,
    action: "coupon.create",
    entity: "Coupon",
    entityId: c.id,
    diff: { code: c.code },
    req: input.req,
  });

  return c;
}

/**
 * Patch coupon fields.
 */
export async function updateCouponAdmin(input: {
  couponId: string;
  actorId: string;
  data: {
    description?: string | null;
    type?: CouponType;
    value?: number;
    minOrder?: number | null;
    maxDiscount?: number | null;
    usageLimit?: number | null;
    perUserLimit?: number | null;
    firstOrderOnly?: boolean;
    appliesToCOD?: boolean;
    startsAt?: Date | null;
    endsAt?: Date | null;
    isActive?: boolean;
    source?: string | null;
  };
  req?: Request;
}) {
  const existing = await prisma.coupon.findUnique({ where: { id: input.couponId } });
  if (!existing) throw NotFound("Coupon not found");

  const d = input.data;
  const patch: Prisma.CouponUpdateInput = {};
  if (d.description !== undefined) patch.description = d.description;
  if (d.type !== undefined) patch.type = d.type;
  if (d.value !== undefined) patch.value = dec2(d.value);
  if (d.minOrder !== undefined) patch.minOrder = d.minOrder == null ? null : dec2(d.minOrder);
  if (d.maxDiscount !== undefined) {
    patch.maxDiscount = d.maxDiscount == null ? null : dec2(d.maxDiscount);
  }
  if (d.usageLimit !== undefined) patch.usageLimit = d.usageLimit;
  if (d.perUserLimit !== undefined) patch.perUserLimit = d.perUserLimit;
  if (d.firstOrderOnly !== undefined) patch.firstOrderOnly = d.firstOrderOnly;
  if (d.appliesToCOD !== undefined) patch.appliesToCOD = d.appliesToCOD;
  if (d.startsAt !== undefined) patch.startsAt = d.startsAt;
  if (d.endsAt !== undefined) patch.endsAt = d.endsAt;
  if (d.isActive !== undefined) patch.isActive = d.isActive;
  if (d.source !== undefined) patch.source = d.source;

  await prisma.coupon.update({ where: { id: input.couponId }, data: patch });

  await recordAudit({
    actorId: input.actorId,
    action: "coupon.update",
    entity: "Coupon",
    entityId: input.couponId,
    diff: patch,
    req: input.req,
  });
}

/**
 * Redemption analytics for one coupon.
 */
export async function couponAnalyticsAdmin(couponId: string) {
  const c = await prisma.coupon.findUnique({ where: { id: couponId } });
  if (!c) throw NotFound("Coupon not found");

  const [active, reversed, sumDisc] = await prisma.$transaction([
    prisma.couponRedemption.count({ where: { couponId, isReversed: false } }),
    prisma.couponRedemption.count({ where: { couponId, isReversed: true } }),
    prisma.couponRedemption.aggregate({
      where: { couponId, isReversed: false },
      _sum: { discountAmount: true },
    }),
  ]);

  return {
    couponId,
    code: c.code,
    redemptionsActive: active,
    redemptionsReversed: reversed,
    totalDiscountGiven:
      sumDisc._sum.discountAmount != null ? moneyNumber(sumDisc._sum.discountAmount) : 0,
  };
}

/**
 * XLSX of redemptions for a coupon.
 */
export async function exportCouponRedemptionsXlsx(couponId: string): Promise<Buffer> {
  const c = await prisma.coupon.findUnique({ where: { id: couponId } });
  if (!c) throw NotFound("Coupon not found");

  const rows = await prisma.couponRedemption.findMany({
    where: { couponId },
    orderBy: { redeemedAt: "desc" },
    take: 10000,
    include: {
      order: { select: { orderNumber: true, status: true, placedAt: true } },
    },
  });

  const sheet = rows.map((r) => ({
    orderNumber: r.order?.orderNumber ?? "",
    status: r.order?.status ?? "",
    placedAt: r.order?.placedAt?.toISOString() ?? "",
    discountAmount: moneyNumber(r.discountAmount),
    cartSubtotal: moneyNumber(r.cartSubtotal),
    isReversed: r.isReversed,
    guestEmail: r.guestEmail ?? "",
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sheet), "Redemptions");
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}
