/**
 * Public marketing endpoints — List-Unsubscribe target (PRD §10.2).
 */
import type { Request, Response, NextFunction } from "express";

import { prisma } from "../utils/prisma.js";
import { normalizeEmail } from "../utils/format.js";
import { verifyMarketingUnsubscribeToken } from "../utils/marketingToken.js";

/**
 * GET /v1/marketing/unsubscribe?t=...
 */
export async function getMarketingUnsubscribe(req: Request, res: Response, next: NextFunction) {
  try {
    const token = String(req.query.t ?? "");
    const email = verifyMarketingUnsubscribeToken(token);
    if (!email) {
      res.status(400).type("text/plain").send("Invalid or expired unsubscribe link.");
      return;
    }
    const norm = normalizeEmail(email);
    await prisma.user.updateMany({
      where: { email: norm, role: "CUSTOMER" },
      data: { marketingOptIn: false },
    });
    await prisma.emailSuppression.upsert({
      where: { email: norm },
      create: { email: norm, reason: "marketing_one_click_unsubscribe" },
      update: { reason: "marketing_one_click_unsubscribe" },
    });
    res
      .status(200)
      .type("text/html")
      .send(
        "<!DOCTYPE html><html><head><meta charset='utf-8'><title>Unsubscribed</title></head><body style='font-family:system-ui;padding:2rem'>You are unsubscribed from marketing emails.</body></html>",
      );
  } catch (err) {
    next(err);
  }
}
