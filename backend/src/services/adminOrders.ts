/**
 * Admin order management — list, detail, status, bulk, refund, Excel export (PRD §8.2).
 */
import { Prisma } from "@prisma/client";
import type { OrderStatus } from "@prisma/client";
import * as XLSX from "xlsx";
import type { Request } from "express";

import { recordAudit } from "../utils/adminAudit.js";
import { NotFound, ServiceUnavailable, ValidationError } from "../utils/errors.js";
import { moneyNumber, roundMoney } from "../utils/money.js";
import { prisma } from "../utils/prisma.js";
import { loadInventoryIdsForOrder, type OrderTx } from "./orderInventory.js";
import { reverseCouponRedemption } from "./orderReadCancel.js";
import { isRazorpayConfigured, refundRazorpayPayment } from "./razorpay.js";
import {
  fireOrderCancelled,
  fireOrderDelivered,
  fireOrderShipped,
  fireRefundProcessed,
} from "./orderNotify.js";

export type AdminOrderListQuery = {
  page: number;
  pageSize: number;
  status?: OrderStatus;
  q?: string;
  placedFrom?: Date;
  placedTo?: Date;
};

/**
 * Paginated admin order list with light includes.
 */
export async function listOrdersAdmin(input: AdminOrderListQuery) {
  const take = input.pageSize;
  const skip = (input.page - 1) * take;
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
    ];
  }

  const [total, rows] = await prisma.$transaction([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      orderBy: { placedAt: "desc" },
      skip,
      take,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        paymentMethod: true,
        total: true,
        currency: true,
        placedAt: true,
        userId: true,
        guestEmail: true,
      },
    }),
  ]);

  return {
    total,
    page: input.page,
    pageSize: take,
    orders: rows.map((o) => ({
      ...o,
      total: moneyNumber(o.total),
    })),
  };
}

/**
 * Full order detail for admin (no guest gate).
 */
export async function getOrderAdminById(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: true,
      payments: true,
      events: { orderBy: { createdAt: "asc" }, take: 100 },
      user: { select: { id: true, email: true, name: true } },
    },
  });
  if (!order) throw NotFound("Order not found");
  return {
    order: {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentMethod: order.paymentMethod,
      currency: order.currency,
      subtotal: moneyNumber(order.subtotal),
      discountAmount: moneyNumber(order.discountAmount),
      shippingAmount: moneyNumber(order.shippingAmount),
      codCharge: moneyNumber(order.codCharge),
      taxAmount: moneyNumber(order.taxAmount),
      total: moneyNumber(order.total),
      couponCode: order.couponCode,
      shippingAddress: order.shippingAddress,
      billingAddress: order.billingAddress,
      notes: order.notes,
      awbNumber: order.awbNumber,
      shippingCarrier: order.shippingCarrier,
      invoiceNumber: order.invoiceNumber,
      invoicePdfUrl: order.invoicePdfUrl,
      placedAt: order.placedAt,
      confirmedAt: order.confirmedAt,
      shippedAt: order.shippedAt,
      deliveredAt: order.deliveredAt,
      cancelledAt: order.cancelledAt,
      guestEmail: order.guestEmail,
      guestPhone: order.guestPhone,
      user: order.user,
    },
    items: order.items.map((it) => ({
      id: it.id,
      variantId: it.variantId,
      sku: it.sku,
      productName: it.productName,
      variantName: it.variantName,
      quantity: it.quantity,
      unitPrice: moneyNumber(it.unitPrice),
      lineTotal: moneyNumber(it.lineTotal),
    })),
    payments: order.payments.map((p) => ({
      id: p.id,
      status: p.status,
      method: p.method,
      amount: moneyNumber(p.amount),
      refundedAmount: moneyNumber(p.refundedAmount),
      razorpayOrderId: p.razorpayOrderId,
      razorpayPaymentId: p.razorpayPaymentId,
      failureReason: p.failureReason,
      createdAt: p.createdAt,
    })),
    timeline: order.events.map((e) => ({
      type: e.type,
      at: e.createdAt,
      payload: e.payload,
      actorId: e.actorId,
    })),
  };
}

function assertStatusTransition(from: OrderStatus, to: OrderStatus): void {
  if (from === to) return;
  const allowed: Record<OrderStatus, OrderStatus[]> = {
    PLACED: ["CANCELLED", "CONFIRMED"],
    CONFIRMED: ["SHIPPED", "CANCELLED", "REFUNDED"],
    SHIPPED: ["DELIVERED", "RETURNED", "REFUNDED"],
    DELIVERED: ["RETURNED", "REFUNDED"],
    CANCELLED: [],
    RETURNED: ["REFUNDED"],
    REFUNDED: [],
  };
  if (!allowed[from]?.includes(to)) {
    throw ValidationError(`Cannot transition order from ${from} to ${to}`);
  }
}

/**
 * Updates order fulfilment status (admin). Does not process payments.
 */
export async function updateOrderStatusAdmin(input: {
  orderId: string;
  status: OrderStatus;
  actorId: string;
  awbNumber?: string | null;
  shippingCarrier?: string | null;
  notes?: string | null;
  req?: Request;
}): Promise<void> {
  const order = await prisma.order.findUnique({ where: { id: input.orderId } });
  if (!order) throw NotFound("Order not found");

  assertStatusTransition(order.status, input.status);

  const data: Prisma.OrderUpdateInput = {
    status: input.status,
    ...(input.awbNumber !== undefined ? { awbNumber: input.awbNumber } : {}),
    ...(input.shippingCarrier !== undefined ? { shippingCarrier: input.shippingCarrier } : {}),
    ...(input.notes !== undefined && input.notes !== null ? { notes: input.notes } : {}),
  };

  if (input.status === "SHIPPED") {
    data.shippedAt = order.shippedAt ?? new Date();
  }
  if (input.status === "DELIVERED") {
    data.deliveredAt = order.deliveredAt ?? new Date();
  }
  if (input.status === "CANCELLED") {
    data.cancelledAt = order.cancelledAt ?? new Date();
    if (!order.cancelReason) {
      data.cancelReason = "Cancelled by admin";
    }
  }

  const before = { status: order.status };
  await prisma.order.update({ where: { id: input.orderId }, data });

  await prisma.orderEvent.create({
    data: {
      orderId: input.orderId,
      type: "ADMIN_STATUS",
      payload: {
        from: before.status,
        to: input.status,
        awb: input.awbNumber,
      } as Prisma.InputJsonValue,
      actorId: input.actorId,
    },
  });

  await recordAudit({
    actorId: input.actorId,
    action: "order.status",
    entity: "Order",
    entityId: input.orderId,
    diff: { before, after: { status: input.status } },
    req: input.req,
  });

  const fullOrder = await prisma.order.findUnique({
    where: { id: input.orderId },
    select: { orderNumber: true },
  });
  if (fullOrder) {
    if (input.status === "SHIPPED") {
      void fireOrderShipped(fullOrder.orderNumber).catch(() => undefined);
    } else if (input.status === "DELIVERED") {
      void fireOrderDelivered(fullOrder.orderNumber).catch(() => undefined);
    } else if (input.status === "CANCELLED") {
      void fireOrderCancelled(
        fullOrder.orderNumber,
        input.notes?.trim() || "Cancelled by admin",
      ).catch(() => undefined);
    }
  }
}

/**
 * Applies the same status to many orders (best-effort; skips invalid transitions).
 */
export async function bulkUpdateOrderStatusAdmin(input: {
  orderIds: string[];
  status: OrderStatus;
  actorId: string;
  req?: Request;
}): Promise<{ ok: string[]; failed: { id: string; reason: string }[] }> {
  const ok: string[] = [];
  const failed: { id: string; reason: string }[] = [];
  for (const id of input.orderIds) {
    try {
      await updateOrderStatusAdmin({
        orderId: id,
        status: input.status,
        actorId: input.actorId,
        req: input.req,
      });
      ok.push(id);
    } catch (err) {
      failed.push({
        id,
        reason: err instanceof Error ? err.message : "error",
      });
    }
  }
  await recordAudit({
    actorId: input.actorId,
    action: "order.bulk_status",
    entity: "Order",
    diff: { status: input.status, ok: ok.length, failed: failed.length },
    req: input.req,
  });
  return { ok, failed };
}

/**
 * Full refund: Razorpay API (when applicable), restock, order REFUNDED, coupon reversed.
 */
export async function refundOrderAdmin(input: {
  orderId: string;
  actorId: string;
  reason?: string | null;
  req?: Request;
}): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: input.orderId },
    include: { payments: true },
  });
  if (!order) throw NotFound("Order not found");
  if (order.status === "REFUNDED") return;
  if (order.status === "PLACED") {
    throw ValidationError("Refund unavailable — order not paid");
  }

  const captured = order.payments.find((p) => p.status === "CAPTURED");
  if (!captured) {
    throw ValidationError("No captured payment to refund");
  }

  const paid = roundMoney(Number(captured.amount));
  const already = roundMoney(Number(captured.refundedAmount));
  const remaining = roundMoney(paid - already);
  if (remaining <= 0) {
    throw ValidationError("Payment already fully refunded");
  }

  if (order.paymentMethod === "RAZORPAY") {
    if (!captured.razorpayPaymentId) {
      throw ValidationError("Missing Razorpay payment id");
    }
    if (!isRazorpayConfigured()) {
      throw ServiceUnavailable("Razorpay is not configured");
    }
    const amountPaise = Math.round(remaining * 100);
    await refundRazorpayPayment({
      razorpayPaymentId: captured.razorpayPaymentId,
      amountPaise,
      notes: { orderNumber: order.orderNumber, reason: input.reason?.slice(0, 200) ?? "admin" },
    });
  }

  await prisma.$transaction(async (tx: OrderTx) => {
    await tx.payment.update({
      where: { id: captured.id },
      data: {
        refundedAmount: new Prisma.Decimal(paid.toFixed(2)),
        status: "REFUNDED",
      },
    });

    const itemsInv = await loadInventoryIdsForOrder(tx, order.id);
    for (const item of itemsInv) {
      const rows = await tx.$queryRaw<{ id: string }[]>(
        Prisma.sql`SELECT id FROM "Inventory" WHERE id = ${item.inventoryId} FOR UPDATE`,
      );
      if (!rows[0]) continue;
      await tx.inventory.update({
        where: { id: item.inventoryId },
        data: { stockOnHand: { increment: item.quantity } },
      });
      await tx.stockLedger.create({
        data: {
          inventoryId: item.inventoryId,
          delta: item.quantity,
          reason: "ORDER_REFUND",
          refOrderId: order.id,
          actorUserId: input.actorId,
          note: input.reason?.slice(0, 500) ?? "Admin refund",
        },
      });
    }

    await tx.order.update({
      where: { id: order.id },
      data: { status: "REFUNDED" },
    });

    await tx.orderEvent.create({
      data: {
        orderId: order.id,
        type: "ORDER_REFUNDED",
        payload: { by: "admin", amount: remaining } as Prisma.InputJsonValue,
        actorId: input.actorId,
      },
    });
  });

  await reverseCouponRedemption(order.id);

  await recordAudit({
    actorId: input.actorId,
    action: "order.refund",
    entity: "Order",
    entityId: order.id,
    diff: { orderNumber: order.orderNumber, amount: remaining },
    req: input.req,
  });

  void fireRefundProcessed(order.orderNumber, remaining).catch(() => undefined);
}

/**
 * Builds an XLSX workbook of orders matching filters (max 5000 rows).
 */
export async function exportOrdersXlsx(input: Omit<AdminOrderListQuery, "page" | "pageSize">): Promise<Buffer> {
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
    ];
  }

  const rows = await prisma.order.findMany({
    where,
    orderBy: { placedAt: "desc" },
    take: 5000,
    select: {
      orderNumber: true,
      status: true,
      paymentMethod: true,
      total: true,
      currency: true,
      placedAt: true,
      guestEmail: true,
      userId: true,
    },
  });

  const sheet = rows.map((r) => ({
    orderNumber: r.orderNumber,
    status: r.status,
    paymentMethod: r.paymentMethod,
    total: moneyNumber(r.total),
    currency: r.currency,
    placedAt: r.placedAt.toISOString(),
    guestEmail: r.guestEmail ?? "",
    userId: r.userId ?? "",
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(sheet);
  XLSX.utils.book_append_sheet(wb, ws, "Orders");
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

/**
 * Parses uploaded XLSX: expects column `orderNumber` + `status`; applies admin status updates per row.
 */
export async function importOrdersStatusXlsx(input: {
  buffer: Buffer;
  actorId: string;
  req?: Request;
}): Promise<{ updated: number; errors: { row: number; message: string }[] }> {
  const wb = XLSX.read(input.buffer, { type: "buffer" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
  let updated = 0;
  const errors: { row: number; message: string }[] = [];
  const statuses = new Set<string>([
    "PLACED",
    "CONFIRMED",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
    "RETURNED",
    "REFUNDED",
  ]);

  for (let i = 0; i < json.length; i++) {
    const row = json[i];
    const orderNumber = String(row.orderNumber ?? row.OrderNumber ?? "").trim();
    const statusRaw = String(row.status ?? row.Status ?? "").trim().toUpperCase();
    if (!orderNumber) {
      errors.push({ row: i + 2, message: "missing orderNumber" });
      continue;
    }
    if (!statusRaw || !statuses.has(statusRaw)) {
      errors.push({ row: i + 2, message: "invalid status" });
      continue;
    }
    const o = await prisma.order.findUnique({ where: { orderNumber } });
    if (!o) {
      errors.push({ row: i + 2, message: "order not found" });
      continue;
    }
    try {
      await updateOrderStatusAdmin({
        orderId: o.id,
        status: statusRaw as OrderStatus,
        actorId: input.actorId,
        req: input.req,
      });
      updated += 1;
    } catch (err) {
      errors.push({
        row: i + 2,
        message: err instanceof Error ? err.message : "failed",
      });
    }
  }

  await recordAudit({
    actorId: input.actorId,
    action: "order.import_status",
    entity: "Order",
    diff: { updated, errorCount: errors.length },
    req: input.req,
  });

  return { updated, errors };
}
