/**
 * Transactional order emails (PRD §10.1) + Meta CAPI hook (PRD §11.2).
 */
import { Prisma } from "@prisma/client";

import { env } from "../config/env.js";
import * as templates from "../emails/templates.js";
import { sendEmail } from "./email.js";
import { enqueueEmailSendJob } from "./jobQueue.js";
import { ensureOrderInvoice, generateOrderInvoicePdf } from "./invoice.js";
import { sendPurchaseEventForOrder } from "./metaPixel.js";
import { moneyNumber } from "../utils/money.js";
import { prisma } from "../utils/prisma.js";
import { logger } from "../utils/logger.js";

const DEDUPE = {
  PLACED_PENDING: "EMAIL_ORDER_PLACED_PENDING",
  CONFIRMED: "EMAIL_ORDER_CONFIRMED",
  ADMIN_NEW: "EMAIL_ADMIN_NEW_ORDER",
  SHIPPED: "EMAIL_ORDER_SHIPPED",
  DELIVERED: "EMAIL_ORDER_DELIVERED",
  CANCELLED: "EMAIL_ORDER_CANCELLED",
  REFUND: "EMAIL_ORDER_REFUNDED",
} as const;

function siteBase(): string {
  return env.PUBLIC_SITE_URL ?? "https://diteup.com";
}

/** Public-facing order summary URL (Phase 12 may add guest token flow). */
function orderTrackUrl(orderNumber: string): string {
  return `${siteBase()}/orders/${encodeURIComponent(orderNumber)}`;
}

async function loadOrderLite(orderNumber: string) {
  return prisma.order.findUnique({
    where: { orderNumber },
    include: { user: { select: { email: true, name: true, phone: true } } },
  });
}

function recipientEmail(order: {
  user?: { email?: string | null } | null;
  guestEmail?: string | null;
}): string | null {
  if (order.user?.email) return order.user.email.toLowerCase().trim();
  if (order.guestEmail) return order.guestEmail.toLowerCase().trim();
  return null;
}

/**
 * Runs `fn` once per order for the given dedupe `OrderEvent.type`.
 */
async function withEmailDedupe(orderId: string, dedupeType: string, fn: () => Promise<void>): Promise<void> {
  const exists = await prisma.orderEvent.findFirst({
    where: { orderId, type: dedupeType },
  });
  if (exists) return;
  await fn();
  await prisma.orderEvent.create({
    data: {
      orderId,
      type: dedupeType,
      payload: {} as Prisma.InputJsonValue,
      actorId: null,
    },
  });
}

/**
 * Razorpay `PLACED` — customer “complete payment” + admin heads-up.
 */
export async function fireOrderPlacedPendingAndAdmin(orderNumber: string): Promise<void> {
  const order = await loadOrderLite(orderNumber);
  if (!order || order.paymentMethod !== "RAZORPAY") return;

  const to = recipientEmail(order);
  if (to) {
    await withEmailDedupe(order.id, DEDUPE.PLACED_PENDING, async () => {
      const tpl = templates.orderPlacedPendingPayEmail({
        name: order.user?.name,
        orderNumber: order.orderNumber,
        total: `₹${moneyNumber(order.total).toFixed(2)}`,
        siteUrl: orderTrackUrl(order.orderNumber),
      });
      await enqueueEmailSendJob({
        to,
        subject: tpl.subject,
        html: tpl.html,
        text: tpl.text,
        template: "order_placed_pending",
        refType: "ORDER",
        refId: order.id,
      });
    });
  }

  const raw = env.ADMIN_ALERT_EMAILS?.trim();
  if (raw) {
    await withEmailDedupe(order.id, DEDUPE.ADMIN_NEW, async () => {
      const tpl = templates.adminNewOrderEmail({
        orderNumber: order.orderNumber,
        total: `₹${moneyNumber(order.total).toFixed(2)}`,
        paymentMethod: order.paymentMethod,
      });
      for (const addr of raw
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter((e) => e.includes("@"))) {
        await enqueueEmailSendJob({
          to: addr,
          subject: tpl.subject,
          html: tpl.html,
          text: tpl.text,
          template: "admin_new_order",
          refType: "ORDER",
          refId: order.id,
        });
      }
    });
  }
}

/**
 * COD / Razorpay capture — invoice, confirmation email (attach PDF when possible), Meta CAPI once.
 */
export async function fireOrderConfirmedSuite(orderNumber: string): Promise<void> {
  const order = await loadOrderLite(orderNumber);
  if (!order) return;

  try {
    await ensureOrderInvoice(order.id);
  } catch (err) {
    logger.error({ err, orderId: order.id }, "ensureOrderInvoice failed");
  }

  const to = recipientEmail(order);
  if (to) {
    await withEmailDedupe(order.id, DEDUPE.CONFIRMED, async () => {
      const inv = await prisma.order.findUnique({
        where: { id: order.id },
        select: { invoiceNumber: true, invoicePdfUrl: true },
      });

      let attachments: { filename: string; contentBase64: string }[] | undefined;
      try {
        const pdfBuf = await generateOrderInvoicePdf(order.id);
        attachments = [
          { filename: `invoice-${order.orderNumber}.pdf`, contentBase64: pdfBuf.toString("base64") },
        ];
      } catch {
        attachments = undefined;
      }

      const tpl = templates.orderConfirmedEmail({
        name: order.user?.name,
        orderNumber: order.orderNumber,
        invoiceNumber: inv?.invoiceNumber,
        invoiceUrl: inv?.invoicePdfUrl,
        siteUrl: orderTrackUrl(order.orderNumber),
      });
      await sendEmail({
        to,
        subject: tpl.subject,
        html: tpl.html,
        text: tpl.text,
        template: "order_confirmed",
        refType: "ORDER",
        refId: order.id,
        attachments,
      });
    });
  }

  const capiMarker = await prisma.orderEvent.findFirst({
    where: { orderId: order.id, type: "META_CAPI_PURCHASE" },
  });
  if (!capiMarker) {
    const ok = await sendPurchaseEventForOrder({
      orderNumber: order.orderNumber,
      value: moneyNumber(order.total),
      currency: order.currency,
      email: order.user?.email ?? order.guestEmail,
      phone: order.user?.phone ?? order.guestPhone,
    });
    if (ok) {
      await prisma.orderEvent.create({
        data: {
          orderId: order.id,
          type: "META_CAPI_PURCHASE",
          payload: { eventId: order.orderNumber } as Prisma.InputJsonValue,
          actorId: null,
        },
      });
    }
  }
}

/** New-order ping for COD (online-pay already fires in `fireOrderPlacedPendingAndAdmin`). */
export async function fireAdminNewOrderOnly(orderNumber: string): Promise<void> {
  const order = await loadOrderLite(orderNumber);
  if (!order) return;
  const raw = env.ADMIN_ALERT_EMAILS?.trim();
  if (!raw) return;
  await withEmailDedupe(order.id, DEDUPE.ADMIN_NEW, async () => {
    const tpl = templates.adminNewOrderEmail({
      orderNumber: order.orderNumber,
      total: `₹${moneyNumber(order.total).toFixed(2)}`,
      paymentMethod: order.paymentMethod,
    });
    for (const addr of raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter((e) => e.includes("@"))) {
      await enqueueEmailSendJob({
        to: addr,
        subject: tpl.subject,
        html: tpl.html,
        text: tpl.text,
        template: "admin_new_order",
        refType: "ORDER",
        refId: order.id,
      });
    }
  });
}

export async function fireOrderShipped(orderNumber: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { user: { select: { email: true, name: true } } },
  });
  if (!order) return;
  const to = recipientEmail(order);
  if (!to) return;
  await withEmailDedupe(order.id, DEDUPE.SHIPPED, async () => {
    const tpl = templates.orderShippedEmail({
      name: order.user?.name,
      orderNumber: order.orderNumber,
      carrier: order.shippingCarrier,
      awb: order.awbNumber,
      siteUrl: orderTrackUrl(order.orderNumber),
    });
    await enqueueEmailSendJob({
      to,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
      template: "order_shipped",
      refType: "ORDER",
      refId: order.id,
    });
  });
}

export async function fireOrderDelivered(orderNumber: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { user: { select: { email: true, name: true } } },
  });
  if (!order) return;
  const to = recipientEmail(order);
  if (!to) return;
  await withEmailDedupe(order.id, DEDUPE.DELIVERED, async () => {
    const tpl = templates.orderDeliveredEmail({
      name: order.user?.name,
      orderNumber: order.orderNumber,
      siteUrl: orderTrackUrl(order.orderNumber),
    });
    await enqueueEmailSendJob({
      to,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
      template: "order_delivered",
      refType: "ORDER",
      refId: order.id,
    });
  });
}

export async function fireOrderCancelled(
  orderNumber: string,
  reason?: string | null,
): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { user: { select: { email: true, name: true } } },
  });
  if (!order) return;
  const to = recipientEmail(order);
  if (!to) return;
  await withEmailDedupe(order.id, DEDUPE.CANCELLED, async () => {
    const tpl = templates.orderCancelledEmail({
      name: order.user?.name,
      orderNumber: order.orderNumber,
      reason: reason ?? order.cancelReason,
    });
    await enqueueEmailSendJob({
      to,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
      template: "order_cancelled",
      refType: "ORDER",
      refId: order.id,
    });
  });
}

export async function fireRefundProcessed(orderNumber: string, amount: number): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { user: { select: { email: true, name: true } } },
  });
  if (!order) return;
  const to = recipientEmail(order);
  if (!to) return;
  await withEmailDedupe(order.id, DEDUPE.REFUND, async () => {
    const tpl = templates.refundProcessedEmail({
      name: order.user?.name,
      orderNumber: order.orderNumber,
      amount: `₹${amount.toFixed(2)}`,
    });
    await enqueueEmailSendJob({
      to,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
      template: "refund_processed",
      refType: "ORDER",
      refId: order.id,
    });
  });
}
