/**
 * Admin dashboard KPIs (PRD §7.2 snapshot tiles — backend aggregates).
 */
import { Prisma } from "@prisma/client";

import { prisma } from "../utils/prisma.js";
import { moneyNumber } from "../utils/money.js";

/**
 * Returns counts and revenue rollups for admin home.
 */
export async function getAdminDashboardStats() {
  const now = new Date();
  const start7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const start30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const lowStockRows = await prisma.$queryRaw<
    { id: string; variantId: string; stockOnHand: number; lowStockThreshold: number }[]
  >(
    Prisma.sql`
      SELECT id, "variantId", "stockOnHand", "lowStockThreshold"
      FROM "Inventory"
      WHERE "stockOnHand" <= "lowStockThreshold"
      LIMIT 50
    `,
  );

  const [
    orders7d,
    orders30d,
    revenue30,
    customers,
    pendingReviews,
    ordersByStatus,
  ] = await prisma.$transaction([
    prisma.order.count({ where: { placedAt: { gte: start7 } } }),
    prisma.order.count({ where: { placedAt: { gte: start30 } } }),
    prisma.order.aggregate({
      where: {
        placedAt: { gte: start30 },
        status: { in: ["CONFIRMED", "SHIPPED", "DELIVERED", "RETURNED"] },
      },
      _sum: { total: true },
    }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.review.count({
      where: { isApproved: false, deletedAt: null, isFlagged: false },
    }),
    prisma.order.groupBy({
      by: ["status"],
      _count: true,
    }),
  ]);

  const statusCounts = Object.fromEntries(ordersByStatus.map((r) => [r.status, r._count])) as Record<
    string,
    number
  >;

  return {
    generatedAt: now.toISOString(),
    ordersLast7Days: orders7d,
    ordersLast30Days: orders30d,
    gmvLast30Days: revenue30._sum.total != null ? moneyNumber(revenue30._sum.total) : 0,
    customerCount: customers,
    reviewsPendingModeration: pendingReviews,
    lowStockVariants: lowStockRows.map((r) => ({
      inventoryId: r.id,
      variantId: r.variantId,
      stockOnHand: r.stockOnHand,
      lowStockThreshold: r.lowStockThreshold,
    })),
    ordersByStatus: statusCounts,
  };
}
