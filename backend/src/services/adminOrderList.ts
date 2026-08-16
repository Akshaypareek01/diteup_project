/**
 * Admin order list + XLSX export (PRD §8.2) — IST timestamps, real customer name/email.
 */
import { Prisma } from "@prisma/client";
import type { OrderStatus } from "@prisma/client";
import * as XLSX from "xlsx";

import { formatIstDateTime } from "../utils/ist.js";
import { moneyNumber } from "../utils/money.js";
import { prisma } from "../utils/prisma.js";
import { adminCustomerFields } from "./adminOrderCustomer.js";

export type AdminOrderListQuery = {
  page: number;
  pageSize: number;
  status?: OrderStatus;
  q?: string;
  placedFrom?: Date;
  placedTo?: Date;
};

const listSelect = {
  id: true,
  orderNumber: true,
  status: true,
  paymentMethod: true,
  total: true,
  currency: true,
  placedAt: true,
  userId: true,
  guestEmail: true,
  shippingAddress: true,
  user: { select: { email: true, name: true } },
} as const;

/**
 * Shared filters for list + export, including logged-in email/name.
 */
export function buildAdminOrderListWhere(
  input: Omit<AdminOrderListQuery, "page" | "pageSize">,
): Prisma.OrderWhereInput {
  const where: Prisma.OrderWhereInput = {};
  if (input.status) where.status = input.status;
  if (input.placedFrom || input.placedTo) {
    where.placedAt = {};
    if (input.placedFrom) where.placedAt.gte = input.placedFrom;
    if (input.placedTo) where.placedAt.lte = input.placedTo;
  }
  if (input.q?.trim()) {
    const q = input.q.trim();
    where.OR = [
      { orderNumber: { contains: q, mode: "insensitive" } },
      { guestEmail: { contains: q, mode: "insensitive" } },
      { id: { equals: q } },
      { user: { email: { contains: q, mode: "insensitive" } } },
      { user: { name: { contains: q, mode: "insensitive" } } },
      {
        shippingAddress: {
          path: ["name"],
          string_contains: q,
          mode: "insensitive",
        },
      },
    ];
  }
  return where;
}

/**
 * Paginated admin order list with customer display fields.
 */
export async function listOrdersAdmin(input: AdminOrderListQuery) {
  const take = input.pageSize;
  const skip = (input.page - 1) * take;
  const where = buildAdminOrderListWhere(input);

  const [total, rows] = await prisma.$transaction([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      orderBy: { placedAt: "desc" },
      skip,
      take,
      select: listSelect,
    }),
  ]);

  return {
    total,
    page: input.page,
    pageSize: take,
    orders: rows.map((o) => {
      const customer = adminCustomerFields(o);
      return {
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        paymentMethod: o.paymentMethod,
        total: moneyNumber(o.total),
        currency: o.currency,
        placedAt: o.placedAt,
        userId: o.userId,
        guestEmail: o.guestEmail,
        ...customer,
      };
    }),
  };
}

/**
 * Builds an XLSX workbook of orders matching filters (max 5000 rows).
 */
export async function exportOrdersXlsx(
  input: Omit<AdminOrderListQuery, "page" | "pageSize">,
): Promise<Buffer> {
  const where = buildAdminOrderListWhere(input);
  const rows = await prisma.order.findMany({
    where,
    orderBy: { placedAt: "desc" },
    take: 5000,
    select: listSelect,
  });

  const sheet = rows.map((r) => {
    const customer = adminCustomerFields(r);
    return {
      orderNumber: r.orderNumber,
      customerName: customer.customerName ?? "",
      customerEmail: customer.customerEmail ?? "",
      isGuest: customer.isGuest ? "yes" : "no",
      status: r.status,
      paymentMethod: r.paymentMethod,
      total: moneyNumber(r.total),
      currency: r.currency,
      placedAtIst: formatIstDateTime(r.placedAt),
      placedAtUtc: r.placedAt.toISOString(),
    };
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(sheet);
  XLSX.utils.book_append_sheet(wb, ws, "Orders");
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}
