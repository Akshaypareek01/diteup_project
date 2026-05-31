/**
 * Resend email events — bounces / complaints → suppression + EmailLog (PRD §10.3).
 */
import type { Request, Response, NextFunction } from "express";

import { prisma } from "../utils/prisma.js";
import { logger } from "../utils/logger.js";
import { normalizeEmail } from "../utils/format.js";
import { verifyResendWebhookSignature } from "../utils/resendWebhookVerify.js";

type ResendLikePayload = {
  type?: string;
  data?: {
    email_id?: string;
    to?: string | string[];
    email?: string;
    bounce?: { message?: string };
  };
};

/**
 * POST /v1/webhooks/resend — raw body; Svix signature when `RESEND_WEBHOOK_SECRET` is set.
 */
export async function postResendWebhook(req: Request, res: Response, next: NextFunction) {
  try {
    const raw = req.body as Buffer;
    if (!Buffer.isBuffer(raw)) {
      res.status(400).json({ ok: false, error: "Invalid webhook body" });
      return;
    }

    const ok = verifyResendWebhookSignature(raw, {
      svixId: req.get("svix-id"),
      svixTimestamp: req.get("svix-timestamp"),
      svixSignature: req.get("svix-signature"),
    });
    if (!ok) {
      res.status(400).json({ ok: false, error: "Invalid signature" });
      return;
    }

    let body: ResendLikePayload;
    try {
      body = JSON.parse(raw.toString("utf8")) as ResendLikePayload;
    } catch {
      res.status(400).json({ ok: false, error: "Invalid JSON" });
      return;
    }

    const t = String(body.type ?? "").toLowerCase();
    const toRaw = body.data?.to ?? body.data?.email;
    const to = Array.isArray(toRaw) ? toRaw[0] : toRaw;
    const email = typeof to === "string" ? normalizeEmail(to) : null;
    const msgId = body.data?.email_id;

    if (email && (t.includes("bounce") || t.includes("complaint") || t.includes("failed"))) {
      await prisma.emailSuppression.upsert({
        where: { email },
        create: { email, reason: `resend:${t}`.slice(0, 500) },
        update: { reason: `resend:${t}`.slice(0, 500) },
      });
      if (msgId) {
        await prisma.emailLog.updateMany({
          where: { providerMessageId: msgId },
          data: {
            status: "FAILED",
            error: body.data?.bounce?.message ?? t,
          },
        });
      }
      logger.warn({ email, type: t }, "Resend webhook — recipient suppressed");
    }

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}
