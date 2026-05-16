/**
 * Daily-style Razorpay vs DB sanity check (PRD §10.7).
 */
import { prisma } from "../utils/prisma.js";
import { logger } from "../utils/logger.js";
import { isRazorpayConfigured, getRazorpayClient } from "../services/razorpay.js";

const SETTING_KEY = "jobRuns:razorpayReconcile";

type ReconcileState = {
  lastRunAt: string;
  note?: string;
};

const MIN_INTERVAL_MS = 22 * 60 * 60 * 1000;

/**
 * Compares captured payment rows in DB with a Razorpay list sample when keys exist.
 */
export async function runRazorpayReconcileIfDue(): Promise<void> {
  const now = new Date();
  const row = await prisma.setting.findUnique({ where: { key: SETTING_KEY } });
  const state = (row?.value as ReconcileState | null) ?? null;
  if (state?.lastRunAt) {
    const last = new Date(state.lastRunAt);
    if (now.getTime() - last.getTime() < MIN_INTERVAL_MS) {
      return;
    }
  }

  const start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const dbCaptured = await prisma.payment.count({
    where: {
      status: "CAPTURED",
      createdAt: { gte: start, lte: now },
    },
  });

  let rzpSample = 0;
  let rzpNote = "razorpay_not_configured";

  if (isRazorpayConfigured()) {
    try {
      const rzp = getRazorpayClient();
      const fromSec = Math.floor(start.getTime() / 1000);
      const res = (await rzp.payments.all({
        from: fromSec,
        count: 100,
      })) as { items?: unknown[] };
      rzpSample = Array.isArray(res.items) ? res.items.length : 0;
      rzpNote = "ok";
    } catch (err) {
      rzpNote = err instanceof Error ? err.message.slice(0, 500) : "rzp_error";
      logger.error({ err }, "Razorpay reconciliation API failed");
    }
  }

  logger.info(
    { dbCaptured24h: dbCaptured, rzpListSampleCount: rzpSample, rzpNote },
    "razorpay reconciliation snapshot",
  );

  await prisma.setting.upsert({
    where: { key: SETTING_KEY },
    create: {
      key: SETTING_KEY,
      value: {
        lastRunAt: now.toISOString(),
        dbCaptured24h: dbCaptured,
        rzpSample,
        note: rzpNote,
      } as object,
    },
    update: {
      value: {
        lastRunAt: now.toISOString(),
        dbCaptured24h: dbCaptured,
        rzpSample,
        note: rzpNote,
      } as object,
    },
  });
}
