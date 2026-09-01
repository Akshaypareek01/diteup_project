/**
 * Hourly Shiprocket vs DB check: PUSHED orders whose remote shipment is
 * canceled or gone get re-enqueued so push recreates with `-Rn`.
 */
import { prisma } from "../utils/prisma.js";
import { logger } from "../utils/logger.js";
import { getShiprocketConfig } from "../services/settings.js";
import { isCanceledShiprocketStatus } from "../services/shiprocketChannel.js";
import { lookupRemoteShiprocketOrder } from "../services/shiprocket.js";
import { maybeEnqueueShiprocketPushForOrder } from "../services/jobQueue.js";

const SETTING_KEY = "jobRuns:shiprocketReconcile";
const BATCH_SIZE = 25;
const MIN_INTERVAL_MS = 50 * 60 * 1000;
const PUSH_ERROR_MAX_LEN = 500;

type ReconcileState = {
  lastRunAt: string;
};

/**
 * Scans a batch of PUSHED orders without AWB and heals canceled/missing remotes.
 */
export async function runShiprocketReconcileIfDue(): Promise<void> {
  const now = new Date();
  const row = await prisma.setting.findUnique({ where: { key: SETTING_KEY } });
  const state = (row?.value as ReconcileState | null) ?? null;
  if (state?.lastRunAt) {
    const last = new Date(state.lastRunAt);
    if (now.getTime() - last.getTime() < MIN_INTERVAL_MS) {
      return;
    }
  }

  const config = await getShiprocketConfig();
  if (!config) {
    await persistRun(now, { skipped: "shiprocket_not_configured", healed: 0, checked: 0 });
    return;
  }

  const orders = await prisma.order.findMany({
    where: {
      status: { in: ["CONFIRMED", "SHIPPED"] },
      shiprocketPushStatus: "PUSHED",
      shiprocketOrderId: { not: null },
      OR: [{ awbNumber: null }, { awbNumber: "" }],
    },
    select: {
      id: true,
      orderNumber: true,
      shiprocketOrderId: true,
    },
    orderBy: { confirmedAt: "asc" },
    take: BATCH_SIZE,
  });

  let healed = 0;
  let unavailable = 0;

  for (const order of orders) {
    const remoteId = order.shiprocketOrderId;
    if (!remoteId) continue;
    try {
      const lookup = await lookupRemoteShiprocketOrder(remoteId, config);
      if (lookup.kind === "unavailable") {
        unavailable += 1;
        logger.warn(
          { orderId: order.id, orderNumber: order.orderNumber, reason: lookup.reason },
          "shiprocket reconcile: show unavailable — skipped",
        );
        continue;
      }
      const dead =
        lookup.kind === "missing" ||
        (lookup.kind === "found" &&
          isCanceledShiprocketStatus(lookup.summary.status, lookup.summary.statusCode));
      if (!dead) continue;

      const lastStatus = lookup.kind === "found" ? lookup.summary.status : "CANCELED";
      const message = truncate(
        `Remote Shiprocket order ${remoteId} is ${lastStatus.toLowerCase()} — re-pushing with a new channel id`,
        PUSH_ERROR_MAX_LEN,
      );
      await prisma.order.update({
        where: { id: order.id },
        data: {
          shiprocketPushStatus: "FAILED",
          shiprocketPushError: message,
          shiprocketLastStatus: lastStatus,
          shiprocketStatusAt: now,
        },
      });
      await maybeEnqueueShiprocketPushForOrder(order.id);
      healed += 1;
      logger.info(
        { orderId: order.id, orderNumber: order.orderNumber, shiprocketOrderId: remoteId },
        "shiprocket reconcile: re-enqueued dead remote",
      );
    } catch (err) {
      logger.error(
        { err, orderId: order.id, orderNumber: order.orderNumber },
        "shiprocket reconcile: order failed",
      );
    }
  }

  await persistRun(now, { checked: orders.length, healed, unavailable });
}

/**
 * Truncates a reconcile error string for the Order.shiprocketPushError column.
 *
 * @param s full message
 * @param max max length including ellipsis
 */
function truncate(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

/**
 * Writes the last-run timestamp and counters onto the Setting row.
 *
 * @param now run timestamp
 * @param extra snapshot fields for logs/debug
 */
async function persistRun(now: Date, extra: Record<string, unknown>): Promise<void> {
  const value = { lastRunAt: now.toISOString(), ...extra };
  await prisma.setting.upsert({
    where: { key: SETTING_KEY },
    create: { key: SETTING_KEY, value: value as object },
    update: { value: value as object },
  });
  logger.info(extra, "shiprocket reconciliation snapshot");
}
