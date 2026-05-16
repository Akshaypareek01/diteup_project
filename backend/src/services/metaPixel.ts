/**
 * Meta Conversions API — server-side Purchase (PRD §11.2).
 *
 * Credentials: `Setting` key `metaAds` JSON `{ "pixelId", "capiAccessToken" }`, else env
 * `META_PIXEL_ID` + `META_CAPI_ACCESS_TOKEN`.
 */
import { createHash } from "node:crypto";

import { logger } from "../utils/logger.js";
import { getMetaAdsIntegration } from "./settings.js";

export type PurchaseCapiPayload = {
  eventId?: string | null;
  value: number;
  currency: string;
  pixelId: string;
  accessToken: string;
  /** Hashed externally per Meta rules — pass already-normalized if available. */
  userData?: {
    em?: string[];
    ph?: string[];
    clientIpAddress?: string;
    clientUserAgent?: string;
    fbp?: string;
    fbc?: string;
  };
};

/**
 * SHA-256 hash for Meta CAPI user_data (lowercased, trimmed input).
 */
export function hashMetaPII(raw: string): string {
  const norm = raw.trim().toLowerCase();
  return createHash("sha256").update(norm).digest("hex");
}

/**
 * Sends Purchase to Graph API when pixel id + token are supplied.
 */
export async function sendPurchaseEvent(input: PurchaseCapiPayload): Promise<boolean> {
  const url = `https://graph.facebook.com/v21.0/${input.pixelId}/events?access_token=${encodeURIComponent(input.accessToken)}`;
  const body = {
    data: [
      {
        event_name: "Purchase",
        event_time: Math.floor(Date.now() / 1000),
        action_source: "website",
        user_data: input.userData ?? {},
        custom_data: {
          currency: input.currency,
          value: input.value,
        },
        event_id: input.eventId ?? undefined,
      },
    ],
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      logger.warn({ status: res.status, text: text.slice(0, 500) }, "Meta CAPI non-OK response");
      return false;
    }
    return true;
  } catch (err) {
    logger.error({ err }, "Meta CAPI request failed");
    return false;
  }
}

/**
 * Loads integration + fires Purchase for a confirmed order (`event_id` = `orderNumber` for Pixel dedupe).
 */
export async function sendPurchaseEventForOrder(input: {
  orderNumber: string;
  value: number;
  currency: string;
  email?: string | null;
  phone?: string | null;
  requestIp?: string | null;
  userAgent?: string | null;
}): Promise<boolean> {
  const creds = await getMetaAdsIntegration();
  if (!creds) {
    logger.debug("Meta CAPI skipped — no pixel/token in settings or env");
    return false;
  }

  const em = input.email?.trim() ? [hashMetaPII(input.email)] : undefined;
  const digits = input.phone?.replace(/\D/g, "") ?? "";
  const ph = digits.length >= 10 ? [hashMetaPII(digits)] : undefined;

  return sendPurchaseEvent({
    eventId: input.orderNumber,
    value: input.value,
    currency: input.currency,
    pixelId: creds.pixelId,
    accessToken: creds.accessToken,
    userData: {
      em,
      ph,
      clientIpAddress: input.requestIp ?? undefined,
      clientUserAgent: input.userAgent ?? undefined,
    },
  });
}
