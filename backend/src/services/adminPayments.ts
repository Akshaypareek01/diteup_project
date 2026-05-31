/**
 * Admin payment views + manual refund + reconciliation summary (PRD §8.3).
 */
import { Prisma } from "@prisma/client";
import type { PaymentStatus } from "@prisma/client";
import type { Request } from "express";
import * as XLSX from "xlsx";

import { recordAudit } from "../utils/adminAudit.js";
import { NotFound, ServiceUnavailable, ValidationError } from "../utils/errors.js";
import { moneyNumber, roundMoney } from "../utils/money.js";
import { prisma } from "../utils/prisma.js";
import { isRazorpayConfigured, refundRazorpayPayment } from "./razorpay.js";

export type AdminPaymentListQuery = {
  page: number;
  pageSize: number;
  status?: PaymentStatus;
  orderId?: string;
  q?: string;
  createdFrom?: Date;
  createdTo?: Date;
};

/**
 * Paginated payments for admin console.
 */
export async function listPaymentsAdmin(input: AdminPaymentListQuery) {
  const take = input.pageSize;
  const skip = (input.page - 1) * take;
  const where: Prisma.PaymentWhereInput = {};

  if (input.status) where.status = input.status;
  if (input.orderId) where.orderId = input.orderId;
  if (input.createdFrom || input.createdTo) {
    where.createdAt = {};
    if (input.createdFrom) where.createdAt.gte = input.createdFrom;
    if (input.createdTo) where.createdAt.lte = input.createdTo;
  }
  if (input.q?.trim()) {
    const q = input.q.trim();
    where.OR = [
      { id: { equals: q } },
      { razorpayOrderId: { contains: q, mode: "insensitive" } },
      { razorpayPaymentId: { contains: q, mode: "insensitive" } },
    ];
  }

  const [total, rows] = await prisma.$transaction([
    prisma.payment.count({ where }),
    prisma.payment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            paymentMethod: true,
            total: true,
          },
        },
      },
    }),
  ]);

  return {
    total,
    page: input.page,
    pageSize: take,
    payments: rows.map((p) => ({
      id: p.id,
      orderId: p.orderId,
      status: p.status,
      method: p.method,
      amount: moneyNumber(p.amount),
      refundedAmount: moneyNumber(p.refundedAmount),
      razorpayOrderId: p.razorpayOrderId,
      razorpayPaymentId: p.razorpayPaymentId,
      failureReason: p.failureReason,
      createdAt: p.createdAt,
      order: p.order
        ? {
            id: p.order.id,
            orderNumber: p.order.orderNumber,
            status: p.order.status,
            paymentMethod: p.order.paymentMethod,
            total: moneyNumber(p.order.total),
          }
        : null,
    })),
  };
}

/**
 * Single payment with order context.
 */
export async function getPaymentAdmin(paymentId: string) {
  const p = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      order: {
        include: {
          items: { select: { sku: true, quantity: true, lineTotal: true } },
        },
      },
    },
  });
  if (!p) throw NotFound("Payment not found");
  return {
    payment: {
      id: p.id,
      orderId: p.orderId,
      status: p.status,
      method: p.method,
      amount: moneyNumber(p.amount),
      refundedAmount: moneyNumber(p.refundedAmount),
      razorpayOrderId: p.razorpayOrderId,
      razorpayPaymentId: p.razorpayPaymentId,
      failureReason: p.failureReason,
      rawPayload: p.rawPayload,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    },
    order: p.order
      ? {
          id: p.order.id,
          orderNumber: p.order.orderNumber,
          status: p.order.status,
          total: moneyNumber(p.order.total),
          items: p.order.items,
        }
      : null,
  };
}

/**
 * Manual refund for one payment row (partial amount in INR, or full if omitted).
 */
export async function manualRefundPaymentAdmin(input: {
  paymentId: string;
  amountInr?: number | null;
  actorId: string;
  reason?: string | null;
  req?: Request;
}): Promise<void> {
  const p = await prisma.payment.findUnique({
    where: { id: input.paymentId },
    include: { order: true },
  });
  if (!p) throw NotFound("Payment not found");
  if (p.status !== "CAPTURED" && p.status !== "PARTIALLY_REFUNDED") {
    throw ValidationError("Payment is not in a refundable state");
  }

  const order = p.order;
  if (!order) throw NotFound("Order missing for payment");

  const paid = roundMoney(Number(p.amount));
  const already = roundMoney(Number(p.refundedAmount));
  const remaining = roundMoney(paid - already);
  if (remaining <= 0) throw ValidationError("Nothing left to refund");

  const want =
    input.amountInr != null && input.amountInr > 0
      ? roundMoney(Math.min(input.amountInr, remaining))
      : remaining;

  if (want <= 0) throw ValidationError("Invalid refund amount");

  if (p.method === "RAZORPAY") {
    if (!p.razorpayPaymentId) throw ValidationError("Missing Razorpay payment id");
    if (!isRazorpayConfigured()) throw ServiceUnavailable("Razorpay is not configured");
    await refundRazorpayPayment({
      razorpayPaymentId: p.razorpayPaymentId,
      amountPaise: Math.round(want * 100),
      notes: { reason: input.reason?.slice(0, 200) ?? "admin" },
    });
  }

  const newRefunded = roundMoney(already + want);
  const newStatus: PaymentStatus =
    newRefunded >= paid ? "REFUNDED" : "PARTIALLY_REFUNDED";

  await prisma.payment.update({
    where: { id: p.id },
    data: {
      refundedAmount: new Prisma.Decimal(newRefunded.toFixed(2)),
      status: newStatus,
    },
  });

  await prisma.orderEvent.create({
    data: {
      orderId: order.id,
      type: "PAYMENT_REFUND_MANUAL",
      payload: {
        paymentId: p.id,
        amount: want,
        status: newStatus,
      } as Prisma.InputJsonValue,
      actorId: input.actorId,
    },
  });

  await recordAudit({
    actorId: input.actorId,
    action: "payment.refund",
    entity: "Payment",
    entityId: p.id,
    diff: { amount: want, newStatus },
    req: input.req,
  });
}

/**
 * Daily captured vs failed totals for reconciliation (last N days).
 */
export async function paymentReconciliationSummary(days = 14) {
  const start = new Date();
  start.setUTCDate(start.getUTCDate() - days);

  const rows = await prisma.payment.groupBy({
    by: ["status"],
    where: { createdAt: { gte: start } },
    _sum: { amount: true },
    _count: true,
  });

  const byStatus = Object.fromEntries(
    rows.map((r) => [
      r.status,
      {
        count: r._count,
        amount: r._sum.amount != null ? moneyNumber(r._sum.amount) : 0,
      },
    ]),
  );

  return { since: start.toISOString(), days, byStatus };
}

/**
 * Builds an XLSX workbook of payments matching filters (max 5000 rows).
 */
export async function exportPaymentsXlsx(
  input: Omit<AdminPaymentListQuery, "page" | "pageSize">,
): Promise<Buffer> {
  const where: Prisma.PaymentWhereInput = {};
  if (input.status) where.status = input.status;
  if (input.orderId) where.orderId = input.orderId;
  if (input.createdFrom || input.createdTo) {
    where.createdAt = {};
    if (input.createdFrom) where.createdAt.gte = input.createdFrom;
    if (input.createdTo) where.createdAt.lte = input.createdTo;
  }
  if (input.q?.trim()) {
    const q = input.q.trim();
    where.OR = [
      { id: { equals: q } },
      { razorpayOrderId: { contains: q, mode: "insensitive" } },
      { razorpayPaymentId: { contains: q, mode: "insensitive" } },
    ];
  }

  const rows = await prisma.payment.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 5000,
    include: {
      order: { select: { orderNumber: true, guestEmail: true, status: true } },
    },
  });

  const sheet = rows.map((p) => ({
    paymentId: p.id,
    orderNumber: p.order.orderNumber,
    orderStatus: p.order.status,
    guestEmail: p.order.guestEmail ?? "",
    status: p.status,
    method: p.method,
    amount: moneyNumber(p.amount),
    refundedAmount: moneyNumber(p.refundedAmount),
    razorpayOrderId: p.razorpayOrderId ?? "",
    razorpayPaymentId: p.razorpayPaymentId ?? "",
    createdAt: p.createdAt.toISOString(),
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sheet), "Payments");
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}
