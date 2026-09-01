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
import { META_ATTRIBUTION_EVENT, parseMetaAttribution } from "./metaAttribution.js";
import { buildOrderTrackingUrl } from "../utils/orderAccess.js";
import { parseAdminAlertEmails } from "../utils/adminAlerts.js";
import { moneyNumber } from "../utils/money.js";
import { prisma } from "../utils/prisma.js";
import { logger } from "../utils/logger.js";

const DEDUPE = {
  CONFIRMED: "EMAIL_ORDER_CONFIRMED",
  ADMIN_NEW: "EMAIL_ADMIN_NEW_ORDER",
  ADMIN_PAID: "EMAIL_ADMIN_ORDER_PAID",
  SHIPPED: "EMAIL_ORDER_SHIPPED",
  DELIVERED: "EMAIL_ORDER_DELIVERED",
  CANCELLED: "EMAIL_ORDER_CANCELLED",
  REFUND: "EMAIL_ORDER_REFUNDED",
} as const;

async function loadOrderLite(orderNumber: string) {
  return prisma.order.findUnique({
    where: { orderNumber },
    include: {
      user: { select: { email: true, name: true, phone: true } },
      payments: { orderBy: { createdAt: "desc" }, take: 1, select: { status: true } },
    },
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
 * Razorpay `PLACED` — admin heads-up (customer email fires after payment capture).
 */
export async function fireOrderPlacedPendingAndAdmin(orderNumber: string): Promise<void> {
  const order = await loadOrderLite(orderNumber);
  if (!order || order.paymentMethod !== "RAZORPAY") return;
  await notifyAdminNewOrder(order, DEDUPE.ADMIN_NEW);
}

/**
 * Emails ops that a new order exists, including payment method + status.
 *
 * @param order loaded order with optional user + latest payment
 * @param dedupeType `EMAIL_ADMIN_NEW_ORDER` or `EMAIL_ADMIN_ORDER_PAID`
 */
async function notifyAdminNewOrder(
  order: NonNullable<Awaited<ReturnType<typeof loadOrderLite>>>,
  dedupeType: string,
): Promise<void> {
  const recipients = parseAdminAlertEmails();
  if (recipients.length === 0) return;

  const ship = order.shippingAddress as { name?: string } | null;
  const paymentStatus =
    order.payments[0]?.status ??
    (order.status === "CONFIRMED" || order.status === "SHIPPED" || order.status === "DELIVERED"
      ? "CAPTURED"
      : "PENDING");
  const site = env.PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "";
  const adminUrl = site ? `${site}/admin/orders/${order.id}` : null;

  await withEmailDedupe(order.id, dedupeType, async () => {
    const tpl = templates.adminNewOrderEmail({
      orderNumber: order.orderNumber,
      total: `₹${moneyNumber(order.total).toFixed(2)}`,
      paymentMethod: order.paymentMethod,
      paymentStatus,
      orderStatus: order.status,
      customerName: order.user?.name ?? ship?.name ?? null,
      customerEmail: recipientEmail(order),
      adminUrl,
    });
    for (const addr of recipients) {
      const sendArgs = {
        to: addr,
        subject: tpl.subject,
        html: tpl.html,
        text: tpl.text,
        template: "admin_new_order",
        refType: "ORDER" as const,
        refId: order.id,
      };
      const sent = await sendEmail(sendArgs);
      if (!sent.ok && !sent.suppressed) {
        await enqueueEmailSendJob(sendArgs);
        logger.error(
          { to: addr, orderId: order.id, error: sent.error },
          "admin new-order email failed — queued retry",
        );
      }
    }
  });
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

  if (order.paymentMethod === "RAZORPAY") {
    await notifyAdminNewOrder(order, DEDUPE.ADMIN_PAID);
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
      } catch (err) {
        logger.error({ err, orderId: order.id }, "invoice PDF attach failed — sending confirmation without PDF");
        attachments = undefined;
      }

      const tpl = templates.orderConfirmedEmail({
        name: order.user?.name,
        orderNumber: order.orderNumber,
        invoiceNumber: inv?.invoiceNumber,
        invoiceUrl: inv?.invoicePdfUrl,
        siteUrl: buildOrderTrackingUrl(order.orderNumber),
      });
      const sendArgs = {
        to,
        subject: tpl.subject,
        html: tpl.html,
        text: tpl.text,
        template: "order_confirmed",
        refType: "ORDER",
        refId: order.id,
        attachments,
      };
      const sent = await sendEmail(sendArgs);
      if (!sent.ok && !sent.suppressed) {
        await enqueueEmailSendJob(sendArgs);
        logger.error({ to, orderId: order.id, error: sent.error }, "order confirmed email failed — queued retry");
      }
    });
  }

  const capiMarker = await prisma.orderEvent.findFirst({
    where: { orderId: order.id, type: "META_CAPI_PURCHASE" },
  });
  if (!capiMarker) {
    const attributionRow = await prisma.orderEvent.findFirst({
      where: { orderId: order.id, type: META_ATTRIBUTION_EVENT },
      orderBy: { createdAt: "desc" },
    });
    const attribution = parseMetaAttribution(attributionRow?.payload);
    const ok = await sendPurchaseEventForOrder({
      orderNumber: order.orderNumber,
      value: moneyNumber(order.total),
      currency: order.currency,
      email: order.user?.email ?? order.guestEmail,
      phone: order.user?.phone ?? order.guestPhone,
      requestIp: attribution.ip,
      userAgent: attribution.ua,
      fbp: attribution.fbp,
      fbc: attribution.fbc,
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
  await notifyAdminNewOrder(order, DEDUPE.ADMIN_NEW);
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
      siteUrl: buildOrderTrackingUrl(order.orderNumber),
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
      siteUrl: buildOrderTrackingUrl(order.orderNumber),
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
