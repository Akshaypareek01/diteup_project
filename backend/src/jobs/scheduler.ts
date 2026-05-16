/**
 * Central scheduler for Phase 10 background work (intervals + DB job queue drain).
 */
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";
import {
  recoverStaleProcessingJobs,
  runEmailJobQueueOnce,
} from "../services/jobQueue.js";
import { runBackupVerifyIfDue } from "./backupVerify.js";
import { runBackInStockNotificationBatchOnce } from "./backInStockBatch.js";
import { runStaleOrderCancellationOnce } from "./cancelStaleOrders.js";
import { runLowStockAlertOnce } from "./lowStockAlert.js";
import { runProductVisibilityScheduleOnce } from "./productVisibility.js";
import { runRazorpayReconcileIfDue } from "./razorpayReconcile.js";

const FIFTEEN_MIN = 15 * 60 * 1000;
const FIVE_MIN = 5 * 60 * 1000;
const SIX_HOURS = 6 * 60 * 60 * 1000;
const ONE_HOUR = 60 * 60 * 1000;

/**
 * Starts all recurring timers; no-op when `ENABLE_BACKGROUND_JOBS` is false.
 */
export function startBackgroundSchedulers(): void {
  if (!env.ENABLE_BACKGROUND_JOBS) {
    logger.info("Background jobs disabled via ENABLE_BACKGROUND_JOBS=false");
    return;
  }

  const safe = (name: string, fn: () => Promise<unknown>) => () => {
    void fn().catch((err) => logger.error({ err }, `${name} failed`));
  };

  setInterval(safe("stale_order_cancel", runStaleOrderCancellationOnce), env.STALE_ORDER_JOB_INTERVAL_MS);

  setInterval(safe("email_job_queue", () => runEmailJobQueueOnce(20)), env.JOB_EMAIL_QUEUE_POLL_MS);

  setInterval(safe("product_visibility", runProductVisibilityScheduleOnce), FIVE_MIN);

  setInterval(safe("back_in_stock_batch", runBackInStockNotificationBatchOnce), FIFTEEN_MIN);

  setInterval(safe("low_stock_digest", () => runLowStockAlertOnce(24)), SIX_HOURS);

  setInterval(safe("razorpay_reconcile", runRazorpayReconcileIfDue), ONE_HOUR);

  setInterval(safe("backup_verify", runBackupVerifyIfDue), ONE_HOUR);

  setInterval(safe("job_queue_recover", () => recoverStaleProcessingJobs()), ONE_HOUR);

  void runStaleOrderCancellationOnce().catch((err) => logger.error({ err }, "initial stale order pass"));
  void runEmailJobQueueOnce(20).catch((err) => logger.error({ err }, "initial email queue pass"));
  void runProductVisibilityScheduleOnce().catch((err) =>
    logger.error({ err }, "initial visibility pass"),
  );

  logger.info(
    {
      staleOrderMs: env.STALE_ORDER_JOB_INTERVAL_MS,
      emailPollMs: env.JOB_EMAIL_QUEUE_POLL_MS,
    },
    "Background schedulers started",
  );
}
