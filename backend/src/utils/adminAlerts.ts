/**
 * Recipients for ops alerts (new orders, low stock).
 */
import { env } from "../config/env.js";

const FALLBACK_ADMIN_EMAIL = "order.diteup@gmail.com";

/**
 * Parses `ADMIN_ALERT_EMAILS` (comma-separated). Falls back to the DiteUp ops inbox
 * when the env var is unset so new-order alerts always have a destination.
 */
export function parseAdminAlertEmails(): string[] {
  const raw = env.ADMIN_ALERT_EMAILS?.trim() || FALLBACK_ADMIN_EMAIL;
  return raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((e) => e.includes("@"));
}
