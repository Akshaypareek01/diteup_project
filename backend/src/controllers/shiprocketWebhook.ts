/**
 * Shiprocket webhook — static token header auth (Shiprocket has no HMAC);
 * updates tracking fields and maps courier statuses onto the order lifecycle.
 */
import { createHash, timingSafeEqual } from "node:crypto";
import type { Request, Response, NextFunction } from "express";

import { prisma } from "../utils/prisma.js";
import { logger } from "../utils/logger.js";
import { getShiprocketWebhookToken } from "../services/settings.js";
import { mapShiprocketStatus, SHIPROCKET_WEBHOOK_HEADER } from "../services/shiprocket.js";
import { applyOrderStatusTransition } from "../services/adminOrders.js";

type ShiprocketWebhookBody = {
  /** Our orderNumber (sent as `order_id` on the create adhoc call). */
  channel_order_id?: string | number;
  order_id?: string | number;
  sr_order_id?: string | number;
  awb?: string | number;
  courier_name?: string;
  current_status?: string;
  shipment_status?: string;
};

function tokensMatch(provided: string, expected: string): boolean {
  const a = createHash("sha256").update(provided, "utf8").digest();
  const b = createHash("sha256").update(expected, "utf8").digest();
  return timingSafeEqual(a, b);
}

/** Strips control chars + angle brackets and caps length — these values flow into the DB, admin UI, and customer emails. */
function sanitizeText(raw: unknown, maxLen: number): string {
  return String(raw ?? "")
    .replace(/[<>]/g, "")
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim()
    .slice(0, maxLen);
}

/**
 * POST /v1/webhooks/shiprocket — always ACK processing outcomes with 200
 * (Shiprocket disables webhooks that keep failing); only bad auth gets 401.
 * `shiprocketLastStatus` is persisted only after successful handling so a
 * rejected transition can be retried by a later delivery of the same status.
 */
export async function postShiprocketWebhook(req: Request, res: Response, next: NextFunction) {
  try {
    const webhookToken = await getShiprocketWebhookToken();
    if (!webhookToken) {
      res.status(401).json({ ok: false, error: "Webhook not configured" });
      return;
    }
    const provided = req.get(SHIPROCKET_WEBHOOK_HEADER) ?? "";
    if (!provided || !tokensMatch(provided, webhookToken)) {
      res.status(401).json({ ok: false, error: "Invalid webhook token" });
      return;
    }

    const body = (req.body ?? {}) as ShiprocketWebhookBody;
    const orderNumber = String(body.channel_order_id ?? body.order_id ?? "").trim();
    const rawStatus = sanitizeText(body.current_status ?? body.shipment_status, 60);

    if (!orderNumber || !rawStatus) {
      res.json({ ok: true });
      return;
    }

    let order = await prisma.order.findUnique({ where: { orderNumber } });
    if (!order && body.sr_order_id !== undefined) {
      order = await prisma.order.findFirst({
        where: { shiprocketOrderId: String(body.sr_order_id) },
      });
    }
    // Only act on orders we actually pushed to Shiprocket; ack everything else
    // with an identical body (no order-number enumeration).
    if (!order?.shiprocketOrderId) {
      logger.warn({ orderNumber }, "Shiprocket webhook: unknown or unpushed order");
      res.json({ ok: true });
      return;
    }

    // Same status as the last successfully handled one — duplicate delivery.
    if (order.shiprocketLastStatus === rawStatus) {
      res.json({ ok: true });
      return;
    }

    const awbRaw = body.awb !== undefined && body.awb !== null ? String(body.awb).trim() : "";
    const awb = /^[A-Za-z0-9-]{1,40}$/.test(awbRaw) ? awbRaw : "";
    const courier = sanitizeText(body.courier_name, 60);

    if (awb || courier) {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          ...(awb ? { awbNumber: awb } : {}),
          ...(courier ? { shippingCarrier: courier } : {}),
        },
      });
    }

    const mapped = mapShiprocketStatus(rawStatus);
    if (mapped && mapped !== order.status) {
      // Courier saying DELIVERED/RTO implies the order shipped — ladder through
      // SHIPPED when the pickup webhook was missed, so the matrix allows it.
      const ladder: ("SHIPPED" | "DELIVERED" | "RETURNED")[] =
        order.status === "CONFIRMED" && mapped !== "SHIPPED" ? ["SHIPPED", mapped] : [mapped];
      try {
        for (const status of ladder) {
          await applyOrderStatusTransition({
            orderId: order.id,
            status,
            actorId: null,
            source: "SHIPROCKET",
            notes: null,
          });
        }
      } catch (err) {
        // Invalid transition (e.g. order CANCELLED locally) — ack without
        // persisting shiprocketLastStatus so a later delivery can retry.
        logger.warn(
          { err, orderNumber, rawStatus, mapped, currentStatus: order.status },
          "Shiprocket webhook: status transition rejected",
        );
        res.json({ ok: true });
        return;
      }
    }

    await prisma.order.update({
      where: { id: order.id },
      data: { shiprocketLastStatus: rawStatus, shiprocketStatusAt: new Date() },
    });

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}
