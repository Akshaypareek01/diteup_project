/**
 * Low-stock digest to ops inbox (PRD §10.6).
 */
import { Prisma } from "@prisma/client";

import { env } from "../config/env.js";
import { prisma } from "../utils/prisma.js";
import { logger } from "../utils/logger.js";
import { sendEmail } from "../services/email.js";

const SETTING_KEY = "jobRuns:lowStockDigest";

type LowStockDigestState = {
  lastDigestAt: string;
};

/**
 * Sends at most one digest per `minHoursBetween` when low-stock SKUs exist.
 */
export async function runLowStockAlertOnce(minHoursBetween = 24): Promise<void> {
  const recipients = parseAdminEmails();
  if (recipients.length === 0) {
    logger.debug("Low-stock digest skipped — ADMIN_ALERT_EMAILS empty");
    return;
  }

  const now = new Date();
  const row = await prisma.setting.findUnique({ where: { key: SETTING_KEY } });
  const state = (row?.value as LowStockDigestState | null) ?? null;
  if (state?.lastDigestAt) {
    const last = new Date(state.lastDigestAt);
    if (now.getTime() - last.getTime() < minHoursBetween * 60 * 60 * 1000) {
      return;
    }
  }

  const lines = await prisma.$queryRaw<{ sku: string; stockOnHand: number; threshold: number }[]>(
    Prisma.sql`
      SELECT v.sku, i."stockOnHand", i."lowStockThreshold" as threshold
      FROM "Inventory" i
      INNER JOIN "ProductVariant" v ON v.id = i."variantId"
      WHERE i."stockOnHand" <= i."lowStockThreshold"
      ORDER BY i."stockOnHand" ASC
      LIMIT 100
    `,
  );

  if (lines.length === 0) return;

  const firstSku = lines[0]?.sku ?? "SKU";
  const body = lines
    .map((l) => `${l.sku}\t${l.stockOnHand}\tthreshold ${l.threshold}`)
    .join("\n");
  const subject = `⚠️ Low stock alert: ${firstSku} (${lines.length} SKU${lines.length === 1 ? "" : "s"})`;
  const html = `<pre style="font-family:monospace">${body.replace(/</g, "&lt;")}</pre>`;
  const text = body;

  for (const to of recipients) {
    await sendEmail({
      to,
      subject,
      html,
      text,
      template: "low_stock_digest",
    });
  }

  await prisma.setting.upsert({
    where: { key: SETTING_KEY },
    create: { key: SETTING_KEY, value: { lastDigestAt: now.toISOString() } as object },
    update: { value: { lastDigestAt: now.toISOString() } as object },
  });

  logger.info({ count: lines.length, recipients: recipients.length }, "low-stock digest sent");
}

function parseAdminEmails(): string[] {
  const raw = env.ADMIN_ALERT_EMAILS?.trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((e) => e.includes("@"));
}
