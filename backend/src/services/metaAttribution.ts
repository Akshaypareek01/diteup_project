/**
 * Meta ad-attribution signals captured in the browser at order placement.
 *
 * Razorpay orders are confirmed by a webhook with no browser context, so these are
 * persisted as an `OrderEvent` at creation and replayed when the Conversions API
 * Purchase fires. Stored as an order event rather than `Order` columns to keep this
 * migration-free — see `sendPurchaseEventForOrder`.
 */

/** `OrderEvent.type` holding the captured signals. */
export const META_ATTRIBUTION_EVENT = "META_ATTRIBUTION";

export type MetaAttribution = {
  /** `_fbp` browser cookie set by fbevents.js. */
  fbp?: string;
  /** `_fbc` click cookie, or one derived from an `fbclid` URL parameter. */
  fbc?: string;
  /** Client IP as seen by Express (`trust proxy` is enabled). */
  ip?: string;
  /** Browser user-agent string. */
  ua?: string;
};

/** Meta caps these well below the limits used here; the caps only guard against junk input. */
const MAX_LENGTHS: Record<keyof MetaAttribution, number> = {
  fbp: 256,
  fbc: 256,
  ip: 64,
  ua: 512,
};

/**
 * Trims and length-caps a single signal, returning undefined for empty values.
 */
function clean(raw: unknown, max: number): string | undefined {
  if (typeof raw !== "string") return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, max);
}

/**
 * Normalizes raw signals into a storable object, omitting anything empty.
 *
 * @returns The attribution object, or null when no usable signal was supplied.
 */
export function buildMetaAttribution(raw: {
  fbp?: unknown;
  fbc?: unknown;
  ip?: unknown;
  ua?: unknown;
}): MetaAttribution | null {
  const result: MetaAttribution = {};
  const fbp = clean(raw.fbp, MAX_LENGTHS.fbp);
  const fbc = clean(raw.fbc, MAX_LENGTHS.fbc);
  const ip = clean(raw.ip, MAX_LENGTHS.ip);
  const ua = clean(raw.ua, MAX_LENGTHS.ua);
  if (fbp) result.fbp = fbp;
  if (fbc) result.fbc = fbc;
  if (ip) result.ip = ip;
  if (ua) result.ua = ua;
  return Object.keys(result).length ? result : null;
}

/**
 * Reads back a persisted `META_ATTRIBUTION` payload, tolerating legacy or malformed rows.
 */
export function parseMetaAttribution(payload: unknown): MetaAttribution {
  if (!payload || typeof payload !== "object") return {};
  return buildMetaAttribution(payload as Record<string, unknown>) ?? {};
}
