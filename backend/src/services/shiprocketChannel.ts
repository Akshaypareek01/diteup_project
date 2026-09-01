/**
 * Channel-order-id helpers for Shiprocket. Channel `order_id` is unique even
 * after the remote order is canceled, so retries must suffix (`-R1`, `-R2`).
 */

const CHANNEL_RETRY_SUFFIX = /-R(\d+)$/;

/**
 * Channel order id to send on attempt N. Attempt 0 is the DiteUp order number;
 * later attempts are `${orderNumber}-R1`, `-R2`, …
 *
 * @param base DiteUp order number (`DU-2026-00009`)
 * @param attempt 0-based create attempt
 */
export function nextShiprocketChannelOrderId(base: string, attempt: number): string {
  if (attempt <= 0) return base;
  return `${base}-R${attempt}`;
}

/**
 * Strips a `-R<n>` retry suffix so webhook `channel_order_id` still maps to
 * the DiteUp `orderNumber`.
 *
 * @param channelOrderId value Shiprocket sent as `channel_order_id`
 */
export function baseOrderNumberFromChannelId(channelOrderId: string): string {
  return channelOrderId.trim().replace(CHANNEL_RETRY_SUFFIX, "");
}

/**
 * Next create attempt after a stored (possibly dead) channel id.
 * Base `DU-2026-00009` or a missing value → 1 (`-R1`); `-R1` → 2, etc.
 *
 * @param channelOrderId last channel id we actually sent, if any
 */
export function nextAttemptFromChannelId(channelOrderId: string | null | undefined): number {
  const raw = channelOrderId?.trim();
  if (!raw) return 1;
  const match = raw.match(CHANNEL_RETRY_SUFFIX);
  if (!match) return 1;
  return Number(match[1]) + 1;
}

/**
 * True when the remote Shiprocket order is canceled (status text or code 5).
 *
 * @param status raw `status` string from the Shiprocket API
 * @param statusCode optional numeric `status_code` (5 = canceled)
 */
export function isCanceledShiprocketStatus(
  status: string | null | undefined,
  statusCode?: number | null,
): boolean {
  if (statusCode === 5) return true;
  const normalized = String(status ?? "")
    .trim()
    .toUpperCase();
  return normalized === "CANCELED" || normalized === "CANCELLED";
}
