/**
 * Guest order link token — HMAC-SHA256(orderNumber) using server secret (same strength as JWT secret).
 */
import { createHmac, timingSafeEqual } from "node:crypto";

import { env } from "../config/env.js";

/**
 * Produces a hex digest used as `?token=` on `/v1/orders/:orderNumber` for guests.
 */
export function makeOrderGuestToken(orderNumber: string): string {
  return createHmac("sha256", env.JWT_ACCESS_SECRET).update(orderNumber).digest("hex");
}

/**
 * Constant-time compare of guest token vs expected HMAC.
 */
export function verifyOrderGuestToken(orderNumber: string, token: string | undefined): boolean {
  if (!token || token.length < 32) return false;
  const expected = makeOrderGuestToken(orderNumber);
  try {
    const a = Buffer.from(expected, "hex");
    const b = Buffer.from(token, "hex");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
