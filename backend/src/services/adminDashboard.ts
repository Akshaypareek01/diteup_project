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
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const start7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const start30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const paidStatuses = ["CONFIRMED", "SHIPPED", "DELIVERED", "RETURNED"] as const;

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
    revenueToday,
    revenue7d,
    revenue30,
    customers,
    pendingReviews,
    pendingOrders,
    ordersByStatus,
  ] = await prisma.$transaction([
    prisma.order.count({ where: { placedAt: { gte: start7 } } }),
    prisma.order.count({ where: { placedAt: { gte: start30 } } }),
    prisma.order.aggregate({
      where: { placedAt: { gte: startOfDay }, status: { in: [...paidStatuses] } },
      _sum: { total: true },
    }),
    prisma.order.aggregate({
      where: { placedAt: { gte: start7 }, status: { in: [...paidStatuses] } },
      _sum: { total: true },
    }),
    prisma.order.aggregate({
      where: { placedAt: { gte: start30 }, status: { in: [...paidStatuses] } },
      _sum: { total: true },
    }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.review.count({
      where: { isApproved: false, deletedAt: null, isFlagged: false },
    }),
    prisma.order.count({ where: { status: { in: ["PLACED", "CONFIRMED"] } } }),
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
    gmvToday: revenueToday._sum.total != null ? moneyNumber(revenueToday._sum.total) : 0,
    gmvLast7Days: revenue7d._sum.total != null ? moneyNumber(revenue7d._sum.total) : 0,
    gmvLast30Days: revenue30._sum.total != null ? moneyNumber(revenue30._sum.total) : 0,
    pendingOrdersCount: pendingOrders,
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
