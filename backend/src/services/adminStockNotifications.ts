/**
 * Stock notification waitlist — admin views + manual notify (PRD §8.13).
 */
import type { Request } from "express";

import { recordAudit } from "../utils/adminAudit.js";
import { NotFound, ValidationError } from "../utils/errors.js";
import { prisma } from "../utils/prisma.js";
import { notifyPendingWaitlistForVariant } from "./stockWaitlist.js";

import type { Prisma } from "@prisma/client";

export type AdminStockNotifyListQuery = {
  page: number;
  pageSize: number;
  variantId?: string;
  pendingOnly?: boolean;
};

/**
 * Paginated stock notification subscriptions.
 */
export async function listStockNotificationsAdmin(input: AdminStockNotifyListQuery) {
  const take = input.pageSize;
  const skip = (input.page - 1) * take;
  const where: Prisma.StockNotificationWhereInput = {};
  if (input.variantId) where.variantId = input.variantId;
  if (input.pendingOnly) where.notifiedAt = null;

  const [total, rows] = await prisma.$transaction([
    prisma.stockNotification.count({ where }),
    prisma.stockNotification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include: {
        variant: {
          select: {
            id: true,
            sku: true,
            name: true,
            product: { select: { id: true, name: true } },
          },
        },
      },
    }),
  ]);

  return { total, page: input.page, pageSize: take, notifications: rows };
}

/**
 * Sends back-in-stock email to all pending subscribers for a variant when stock is available.
 */
export async function triggerBackInStockNotifyAdmin(input: {
  variantId: string;
  actorId: string;
  req?: Request;
}): Promise<{ notified: number; skipped: number }> {
  const r = await notifyPendingWaitlistForVariant(input.variantId);
  if (r.blockedReason === "not_found") throw NotFound("Variant not found");
  if (r.blockedReason === "no_inventory") throw NotFound("Inventory row missing");
  if (r.blockedReason === "no_stock") {
    throw ValidationError("No sellable stock — cannot notify");
  }

  await recordAudit({
    actorId: input.actorId,
    action: "stock.notify_waitlist",
    entity: "ProductVariant",
    entityId: input.variantId,
    diff: { notified: r.notified, skipped: r.skipped },
    req: input.req,
  });

  return { notified: r.notified, skipped: r.skipped };
}
