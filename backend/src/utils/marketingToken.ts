/**
 * Signed one-click marketing unsubscribe tokens (List-Unsubscribe).
 */
import { createHmac, timingSafeEqual } from "node:crypto";

import { env } from "../config/env.js";

/**
 * Builds an opaque token encoding the subscriber email.
 */
export function signMarketingUnsubscribeToken(email: string): string {
  const e = email.toLowerCase().trim();
  const sig = createHmac("sha256", env.JWT_ACCESS_SECRET).update(`unsub:${e}`).digest("base64url");
  return Buffer.from(JSON.stringify({ e, sig }), "utf8").toString("base64url");
}

/**
 * Verifies token and returns normalized email, or null.
 */
export function verifyMarketingUnsubscribeToken(token: string): string | null {
  try {
    const raw = JSON.parse(Buffer.from(token, "base64url").toString("utf8")) as {
      e: string;
      sig: string;
    };
    const expected = createHmac("sha256", env.JWT_ACCESS_SECRET)
      .update(`unsub:${raw.e}`)
      .digest("base64url");
    const a = Buffer.from(expected);
    const b = Buffer.from(raw.sig);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    return raw.e.toLowerCase().trim();
  } catch {
    return null;
  }
}
