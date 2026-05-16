/**
 * Batch back-in-stock notifications (PRD §10.5).
 */
import { logger } from "../utils/logger.js";
import {
  listVariantsWithPendingStockNotifications,
  notifyPendingWaitlistForVariant,
} from "../services/stockWaitlist.js";

/**
 * Processes all variants that still have pending waitlist rows.
 */
export async function runBackInStockNotificationBatchOnce(): Promise<{
  variantsProcessed: number;
  totalNotified: number;
}> {
  const ids = await listVariantsWithPendingStockNotifications();
  let totalNotified = 0;
  for (const variantId of ids) {
    const r = await notifyPendingWaitlistForVariant(variantId);
    if (r.blockedReason === "no_stock" || r.blockedReason === "not_found") {
      continue;
    }
    totalNotified += r.notified;
    if (r.notified > 0) {
      logger.info({ variantId, notified: r.notified, skipped: r.skipped }, "back-in-stock batch");
    }
  }
  return { variantsProcessed: ids.length, totalNotified };
}
