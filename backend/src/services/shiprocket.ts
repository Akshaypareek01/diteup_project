/**
 * Thin Shiprocket API client (PRD §9 shipping).
 *
 * Owns auth-token caching (module + `Setting` row so restarts don't hit the
 * rate-limited login endpoint), order push (adhoc create), best-effort cancel,
 * and webhook status mapping. Callers (job queue / webhook controller) own
 * retries and order-status transitions.
 */
import { Prisma } from "@prisma/client";

import { getShiprocketConfig, type ShiprocketConfig } from "./settings.js";
import { prisma } from "../utils/prisma.js";
import { logger } from "../utils/logger.js";
import { AppError, NotFound, ServiceUnavailable, ValidationError } from "../utils/errors.js";
import {
  decryptSettingsSecret,
  encryptSettingsSecret,
  isSettingsEncryptionConfigured,
} from "../utils/settingsCrypto.js";

const SHIPROCKET_BASE_URL = "https://apiv2.shiprocket.in";
const TOKEN_SETTING_KEY = "shiprocketTokenSecret";
/** Shiprocket JWTs last 10 days — refresh after 9 to stay safe. */
const TOKEN_MAX_AGE_MS = 9 * 24 * 60 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 30_000;
const PUSH_ERROR_MAX_LEN = 500;

/** Header carrying the shared webhook token configured in the Shiprocket dashboard. */
export const SHIPROCKET_WEBHOOK_HEADER = "x-api-key";

/** Order shape required by `buildAdhocOrderPayload` / `pushOrderToShiprocket`. */
export type ShiprocketPushableOrder = Prisma.OrderGetPayload<{
  include: { items: { include: { variant: true } }; user: true };
}>;

/** `Order.shippingAddress` JSON shape (see checkout service). */
type ShippingAddressJson = {
  name?: string;
  phone?: string;
  line1?: string;
  line2?: string | null;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
};

// =====================================================
// AUTH TOKEN (module cache + Setting row persistence)
// =====================================================

type CachedToken = { token: string; fetchedAtMs: number };

let moduleTokenCache: CachedToken | null = null;

function isTokenFresh(cache: CachedToken): boolean {
  return Date.now() - cache.fetchedAtMs < TOKEN_MAX_AGE_MS;
}

/**
 * Reads the persisted token from the `Setting` row, tolerating missing rows,
 * undecryptable values (`v1:` payloads without the key), and parse failures.
 */
async function loadPersistedToken(): Promise<CachedToken | null> {
  let row: { value: Prisma.JsonValue } | null = null;
  try {
    row = await prisma.setting.findUnique({ where: { key: TOKEN_SETTING_KEY } });
  } catch (err) {
    logger.error({ err }, "shiprocket: failed to read persisted token");
    return null;
  }
  if (!row) return null;

  let parsed: unknown = null;
  const raw = row.value;
  if (typeof raw === "string" && raw.startsWith("v1:")) {
    if (!isSettingsEncryptionConfigured()) return null;
    try {
      parsed = JSON.parse(decryptSettingsSecret(raw));
    } catch {
      return null; // Corrupt/undecryptable — fall through to a fresh login.
    }
  } else if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    parsed = raw;
  }

  if (!parsed || typeof parsed !== "object") return null;
  const { token, fetchedAt } = parsed as { token?: unknown; fetchedAt?: unknown };
  if (typeof token !== "string" || !token) return null;
  const fetchedAtMs = typeof fetchedAt === "string" ? Date.parse(fetchedAt) : NaN;
  if (!Number.isFinite(fetchedAtMs)) return null;

  const cache: CachedToken = { token, fetchedAtMs };
  return isTokenFresh(cache) ? cache : null;
}

/**
 * Persists the token to the `Setting` row (encrypted when the key is set).
 * Best-effort — a write failure only costs an extra login after restart.
 */
async function persistToken(cache: CachedToken): Promise<void> {
  // Never write the JWT to the DB in plaintext — without an encryption key the
  // module-level cache suffices (restart just costs one extra login).
  if (!isSettingsEncryptionConfigured()) return;
  const json = JSON.stringify({ token: cache.token, fetchedAt: new Date(cache.fetchedAtMs).toISOString() });
  const value: Prisma.InputJsonValue = encryptSettingsSecret(json);
  try {
    await prisma.setting.upsert({
      where: { key: TOKEN_SETTING_KEY },
      create: { key: TOKEN_SETTING_KEY, value },
      update: { value },
    });
  } catch (err) {
    logger.error({ err }, "shiprocket: failed to persist auth token");
  }
}

async function clearTokenCaches(): Promise<void> {
  moduleTokenCache = null;
  try {
    await prisma.setting.deleteMany({ where: { key: TOKEN_SETTING_KEY } });
  } catch (err) {
    logger.error({ err }, "shiprocket: failed to clear persisted token");
  }
}

/**
 * Logs into Shiprocket and caches the JWT (module + Setting row).
 */
async function loginAndCacheToken(config: ShiprocketConfig): Promise<string> {
  const res = await fetch(`${SHIPROCKET_BASE_URL}/v1/external/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: config.email, password: config.password }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  const bodyText = await res.text();
  let token = "";
  try {
    const body = JSON.parse(bodyText) as { token?: unknown };
    if (typeof body.token === "string") token = body.token;
  } catch {
    // Non-JSON body — handled below.
  }
  if (!res.ok || !token) {
    throw ServiceUnavailable(
      `Shiprocket login failed (HTTP ${res.status}): ${truncate(bodyText, 200)}`,
    );
  }
  const cache: CachedToken = { token, fetchedAtMs: Date.now() };
  moduleTokenCache = cache;
  await persistToken(cache);
  return token;
}

/**
 * Returns a fresh auth token: module cache → persisted Setting row → login.
 */
async function getShiprocketToken(config: ShiprocketConfig): Promise<string> {
  if (moduleTokenCache && isTokenFresh(moduleTokenCache)) return moduleTokenCache.token;
  const persisted = await loadPersistedToken();
  if (persisted) {
    moduleTokenCache = persisted;
    return persisted.token;
  }
  return loginAndCacheToken(config);
}

/**
 * Authenticated fetch against the Shiprocket API. On 401 it clears both token
 * caches, re-logs-in once and retries once. No other retries — the job queue
 * owns retry/backoff.
 */
async function shiprocketFetch(
  path: string,
  init: RequestInit,
  config: ShiprocketConfig,
): Promise<Response> {
  const doFetch = (token: string): Promise<Response> =>
    fetch(`${SHIPROCKET_BASE_URL}${path}`, {
      ...init,
      headers: {
        ...(init.headers as Record<string, string> | undefined),
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

  let res = await doFetch(await getShiprocketToken(config));
  if (res.status === 401) {
    await clearTokenCaches();
    res = await doFetch(await loginAndCacheToken(config));
  }
  return res;
}

// =====================================================
// PAYLOAD BUILDING
// =====================================================

/**
 * Normalises an Indian mobile number to exactly 10 digits (6-9 leading).
 * Returns null when the input can't be salvaged.
 */
function normalizeIndianPhone(raw: string): string | null {
  let digits = raw.replace(/\D/g, "");
  if (digits.length >= 11 && digits.length <= 12) {
    if (digits.startsWith("91")) digits = digits.slice(2);
    else if (digits.startsWith("0")) digits = digits.slice(1);
  }
  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
}

/** Formats a date as "YYYY-MM-DD HH:mm" in IST (Asia/Kolkata, no DST). */
function formatIstOrderDate(d: Date): string {
  const ist = new Date(d.getTime() + 330 * 60 * 1000); // UTC+5:30
  const p = (n: number) => String(n).padStart(2, "0");
  return `${ist.getUTCFullYear()}-${p(ist.getUTCMonth() + 1)}-${p(ist.getUTCDate())} ${p(
    ist.getUTCHours(),
  )}:${p(ist.getUTCMinutes())}`;
}

function truncate(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

/**
 * Builds the Shiprocket "adhoc" order-create payload from a loaded order.
 * Pure + exported for tests. Throws `ValidationError` with admin-diagnosable
 * messages when the order can't be shipped as-is.
 */
export function buildAdhocOrderPayload(
  order: ShiprocketPushableOrder,
  config: ShiprocketConfig,
): Record<string, unknown> {
  const addr =
    order.shippingAddress && typeof order.shippingAddress === "object" && !Array.isArray(order.shippingAddress)
      ? (order.shippingAddress as ShippingAddressJson)
      : null;
  if (!addr) {
    throw ValidationError("Order has no shipping address — cannot push to Shiprocket");
  }

  const name = String(addr.name ?? "").trim();
  if (!name) {
    throw ValidationError("Shipping address has no customer name — edit the order address");
  }
  const [firstName, ...restName] = name.split(/\s+/);

  const rawPhone = String(addr.phone ?? "").trim();
  const phone = rawPhone ? normalizeIndianPhone(rawPhone) : null;
  if (!phone) {
    throw ValidationError(
      "Shipping phone is missing or invalid — Shiprocket needs a 10-digit Indian mobile number starting with 6-9",
    );
  }

  const pincode = String(addr.pincode ?? "").trim();
  if (!/^\d{6}$/.test(pincode)) {
    throw ValidationError(
      `Shipping pincode "${pincode || "(empty)"}" is invalid — must be exactly 6 digits`,
    );
  }

  const line1 = String(addr.line1 ?? "").trim();
  if (!line1) {
    throw ValidationError("Shipping address line 1 is empty — edit the order address");
  }
  const city = String(addr.city ?? "").trim();
  if (!city) {
    throw ValidationError("Shipping address city is empty — edit the order address");
  }
  const state = String(addr.state ?? "").trim();
  if (!state) {
    throw ValidationError("Shipping address state is empty — edit the order address");
  }

  const email = (order.user?.email ?? order.guestEmail ?? "").trim();
  if (!email) {
    throw ValidationError(
      "Order has no customer email (neither account email nor guest email) — Shiprocket requires one",
    );
  }

  if (order.items.length === 0) {
    throw ValidationError("Order has no items — cannot push to Shiprocket");
  }

  const weightGm = order.items.reduce((sum, item) => {
    const perUnit =
      item.variant.weightGm && item.variant.weightGm > 0
        ? item.variant.weightGm
        : config.defaultWeightKg * 1000;
    return sum + perUnit * item.quantity;
  }, 0);
  const weightKg = Math.round(weightGm) / 1000;
  if (!(weightKg > 0)) {
    throw ValidationError(
      "Total package weight is 0 kg — set a weight on the product variants or a default weight in Shiprocket settings",
    );
  }

  return {
    order_id: order.orderNumber,
    order_date: formatIstOrderDate(order.placedAt),
    pickup_location: config.pickupLocation,
    billing_customer_name: firstName,
    billing_last_name: restName.join(" "),
    billing_address: line1,
    billing_address_2: String(addr.line2 ?? "").trim(),
    billing_city: city,
    billing_state: state,
    billing_country: "India",
    billing_pincode: pincode,
    billing_email: email,
    billing_phone: phone,
    shipping_is_billing: true,
    order_items: order.items.map((item) => ({
      name: item.variantName.trim()
        ? `${item.productName} — ${item.variantName}`
        : item.productName,
      sku: item.sku,
      units: item.quantity,
      selling_price: Number(item.unitPrice),
    })),
    payment_method: order.paymentMethod === "COD" ? "COD" : "Prepaid",
    sub_total: Number(order.subtotal),
    total_discount: Number(order.discountAmount),
    // COD fee folded into shipping so COD collectable equals order.total.
    shipping_charges: Number(order.shippingAmount) + Number(order.codCharge),
    giftwrap_charges: 0,
    transaction_charges: 0,
    length: config.defaultDimensionsCm.length,
    breadth: config.defaultDimensionsCm.breadth,
    height: config.defaultDimensionsCm.height,
    weight: weightKg,
  };
}

// =====================================================
// ORDER PUSH
// =====================================================

async function markPushFailed(orderId: string, message: string): Promise<void> {
  await prisma.order.update({
    where: { id: orderId },
    data: {
      shiprocketPushStatus: "FAILED",
      shiprocketPushError: truncate(message, PUSH_ERROR_MAX_LEN),
    },
  });
}

async function markPushed(
  orderId: string,
  shiprocketOrderId: string | null,
  shipmentId: string | null,
): Promise<void> {
  await prisma.$transaction([
    prisma.order.update({
      where: { id: orderId },
      data: {
        ...(shiprocketOrderId ? { shiprocketOrderId } : {}),
        ...(shipmentId ? { shiprocketShipmentId: shipmentId } : {}),
        shiprocketPushStatus: "PUSHED",
        shiprocketPushError: null,
      },
    }),
    prisma.orderEvent.create({
      data: {
        orderId,
        type: "SHIPROCKET_PUSHED",
        payload: { shiprocketOrderId, shipmentId },
        actorId: null,
      },
    }),
  ]);
}

/**
 * Pushes an order to Shiprocket via the adhoc create API. Idempotent: no-ops
 * when already pushed. Records FAILED + reason without throwing for permanent
 * conditions (cancelled order, integration unconfigured); throws for anything
 * retryable so the job queue can back off and retry.
 */
export async function pushOrderToShiprocket(orderId: string): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { variant: true } }, user: true },
  });
  if (!order) throw NotFound(`Order ${orderId} not found`);

  if (order.shiprocketOrderId) return; // Already pushed — idempotent no-op.

  if (order.status === "CANCELLED" || order.status === "RETURNED") {
    await markPushFailed(order.id, `Order is ${order.status} — not pushed to Shiprocket`);
    return;
  }

  if (order.status === "PLACED") {
    await markPushFailed(
      order.id,
      "Order is not confirmed yet (payment pending) — it will be pushed automatically once confirmed",
    );
    return;
  }

  const config = await getShiprocketConfig();
  if (!config) {
    await markPushFailed(order.id, "Shiprocket not configured");
    return;
  }

  let payload: Record<string, unknown>;
  try {
    payload = buildAdhocOrderPayload(order, config);
  } catch (err) {
    // Deterministic data problem — retrying can't fix it. Record for the admin
    // panel and complete the job; admins re-push after fixing the order data.
    const message = err instanceof Error ? err.message : String(err);
    await markPushFailed(order.id, message);
    return;
  }

  let res: Response;
  let bodyText: string;
  try {
    res = await shiprocketFetch(
      "/v1/external/orders/create/adhoc",
      { method: "POST", body: JSON.stringify(payload) },
      config,
    );
    bodyText = await res.text();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error({ err, orderId, orderNumber: order.orderNumber }, "shiprocket: order push request failed");
    await markPushFailed(order.id, `Shiprocket request failed: ${message}`);
    throw err instanceof AppError ? err : ServiceUnavailable(`Shiprocket request failed: ${message}`);
  }

  let body: Record<string, unknown> = {};
  try {
    const parsed = JSON.parse(bodyText) as unknown;
    if (parsed && typeof parsed === "object") body = parsed as Record<string, unknown>;
  } catch {
    // Non-JSON body — handled by the failure path below.
  }

  const respOrderId =
    body.order_id !== undefined && body.order_id !== null && body.order_id !== ""
      ? String(body.order_id)
      : null;
  const respShipmentId =
    body.shipment_id !== undefined && body.shipment_id !== null && body.shipment_id !== ""
      ? String(body.shipment_id)
      : null;

  if (res.ok && respOrderId) {
    await markPushed(order.id, respOrderId, respShipmentId);
    await cancelIfOrderCancelledMeanwhile(order.id);
    return;
  }

  // Shiprocket rejects duplicate channel order ids — that means a previous
  // push already succeeded, so treat it as success rather than retrying.
  if (/already exists?/i.test(bodyText)) {
    await markPushed(order.id, respOrderId, respShipmentId);
    await cancelIfOrderCancelledMeanwhile(order.id);
    return;
  }

  const message = `${res.status}: ${truncate(bodyText, PUSH_ERROR_MAX_LEN)}`;
  logger.error(
    { orderId, orderNumber: order.orderNumber, status: res.status },
    "shiprocket: order push rejected",
  );
  await markPushFailed(order.id, message);

  // 4xx rejections (bad pickup location, payload rejected, …) are permanent —
  // retrying the same payload can't succeed. 401/408/429 and 5xx are retryable.
  const permanent = res.status >= 400 && res.status < 500 && ![401, 408, 429].includes(res.status);
  if (permanent) return;
  throw ServiceUnavailable(`Shiprocket order push failed — ${message}`);
}

/**
 * Closes the push-vs-cancel race: if the order was cancelled locally while the
 * push request was in flight, the cancel hook saw no `shiprocketOrderId` and
 * no-oped — so cancel the freshly created remote order now.
 */
async function cancelIfOrderCancelledMeanwhile(orderId: string): Promise<void> {
  const current = await prisma.order.findUnique({
    where: { id: orderId },
    select: { status: true },
  });
  if (current && (current.status === "CANCELLED" || current.status === "REFUNDED")) {
    await cancelShiprocketOrderBestEffort(orderId);
  }
}

// =====================================================
// CANCEL (best effort)
// =====================================================

/**
 * Cancels the Shiprocket order for a cancelled DiteUp order. Best effort:
 * never throws — failures are logged and recorded on the order timeline.
 */
export async function cancelShiprocketOrderBestEffort(orderId: string): Promise<void> {
  try {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order?.shiprocketOrderId) return;

    const config = await getShiprocketConfig();
    if (!config) return;

    const remoteId = Number(order.shiprocketOrderId);
    if (!Number.isFinite(remoteId)) {
      logger.error(
        { orderId, shiprocketOrderId: order.shiprocketOrderId },
        "shiprocket: non-numeric remote order id — cannot cancel",
      );
      return;
    }

    const res = await shiprocketFetch(
      "/v1/external/orders/cancel",
      { method: "POST", body: JSON.stringify({ ids: [remoteId] }) },
      config,
    );

    if (res.ok) {
      await prisma.orderEvent.create({
        data: {
          orderId: order.id,
          type: "SHIPROCKET_CANCELLED",
          payload: { shiprocketOrderId: order.shiprocketOrderId },
          actorId: null,
        },
      });
      return;
    }

    const bodyText = truncate(await res.text().catch(() => ""), PUSH_ERROR_MAX_LEN);
    logger.error(
      { orderId, shiprocketOrderId: order.shiprocketOrderId, status: res.status, body: bodyText },
      "shiprocket: cancel rejected",
    );
    await prisma.orderEvent.create({
      data: {
        orderId: order.id,
        type: "SHIPROCKET_CANCEL_FAILED",
        payload: { message: `${res.status}: ${bodyText}` },
        actorId: null,
      },
    });
  } catch (err) {
    logger.error({ err, orderId }, "shiprocket: cancel failed");
    try {
      await prisma.orderEvent.create({
        data: {
          orderId,
          type: "SHIPROCKET_CANCEL_FAILED",
          payload: { message: err instanceof Error ? err.message : String(err) },
          actorId: null,
        },
      });
    } catch {
      // Best effort — never reject.
    }
  }
}

// =====================================================
// WEBHOOK STATUS MAPPING
// =====================================================

const STATUS_MAP: Record<string, "SHIPPED" | "DELIVERED" | "RETURNED"> = {
  "PICKED UP": "SHIPPED",
  SHIPPED: "SHIPPED",
  "IN TRANSIT": "SHIPPED",
  "OUT FOR DELIVERY": "SHIPPED",
  "REACHED AT DESTINATION HUB": "SHIPPED",
  "OUT FOR PICKUP": "SHIPPED",
  DELIVERED: "DELIVERED",
  "RTO INITIATED": "RETURNED",
  "RTO IN TRANSIT": "RETURNED",
  "RTO DELIVERED": "RETURNED",
  "RTO ACKNOWLEDGED": "RETURNED",
};

/**
 * Maps a raw Shiprocket webhook status to our order status, or null when the
 * status doesn't change the order (e.g. "PICKUP SCHEDULED", "CANCELED").
 */
export function mapShiprocketStatus(raw: string): "SHIPPED" | "DELIVERED" | "RETURNED" | null {
  return STATUS_MAP[raw.trim().toUpperCase()] ?? null;
}
