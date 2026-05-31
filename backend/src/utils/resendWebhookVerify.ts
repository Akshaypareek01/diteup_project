/**
 * Resend webhook verification (Svix-signed payloads).
 */
import { createHmac, timingSafeEqual } from "node:crypto";

import { env } from "../config/env.js";

const DEFAULT_TOLERANCE_SEC = 300;

/**
 * Verifies Svix headers against the raw webhook body using `RESEND_WEBHOOK_SECRET`.
 * Returns false when secret is missing in production.
 */
export function verifyResendWebhookSignature(
  rawBody: Buffer,
  headers: {
    svixId?: string | null;
    svixTimestamp?: string | null;
    svixSignature?: string | null;
  },
): boolean {
  const secret = env.RESEND_WEBHOOK_SECRET?.trim();
  if (!secret) {
    return env.NODE_ENV !== "production";
  }

  const msgId = headers.svixId?.trim();
  const msgTimestamp = headers.svixTimestamp?.trim();
  const msgSignature = headers.svixSignature?.trim();
  if (!msgId || !msgTimestamp || !msgSignature) return false;

  const ts = Number.parseInt(msgTimestamp, 10);
  if (!Number.isFinite(ts)) return false;
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - ts) > DEFAULT_TOLERANCE_SEC) return false;

  const secretKey = secret.startsWith("whsec_") ? secret.slice(6) : secret;
  let secretBytes: Buffer;
  try {
    secretBytes = Buffer.from(secretKey, "base64");
  } catch {
    return false;
  }

  const payload = rawBody.toString("utf8");
  const signedContent = `${msgId}.${msgTimestamp}.${payload}`;
  const expectedSig = createHmac("sha256", secretBytes).update(signedContent).digest("base64");

  for (const part of msgSignature.split(" ")) {
    if (!part.startsWith("v1,")) continue;
    const provided = part.slice(3);
    try {
      const a = Buffer.from(provided);
      const b = Buffer.from(expectedSig);
      if (a.length === b.length && timingSafeEqual(a, b)) return true;
    } catch {
      /* try next signature */
    }
  }

  return false;
}
