/**
 * Typed reads from the `Setting` table (site-wide config from PRD §7.10).
 */
import { prisma } from "../utils/prisma.js";
import { env } from "../config/env.js";

export type MetaAdsSettingJson = {
  pixelId?: string;
  capiAccessToken?: string;
};

/**
 * Meta Pixel + CAPI — admin can override env via `Setting` key `metaAds`.
 */
export async function getMetaAdsIntegration(): Promise<{
  pixelId: string;
  accessToken: string;
} | null> {
  const row = await prisma.setting.findUnique({ where: { key: "metaAds" } });
  const fromDb =
    row?.value && typeof row.value === "object" && row.value !== null
      ? (row.value as MetaAdsSettingJson)
      : {};
  const pixelId = String(fromDb.pixelId || env.META_PIXEL_ID || "").trim();
  const accessToken = String(fromDb.capiAccessToken || env.META_CAPI_ACCESS_TOKEN || "").trim();
  if (!pixelId || !accessToken) return null;
  return { pixelId, accessToken };
}

/**
 * Public Meta Pixel ID for browser-side tracking (no secrets).
 */
export async function getPublicMetaPixelId(): Promise<string | null> {
  const row = await prisma.setting.findUnique({ where: { key: "metaAds" } });
  const fromDb =
    row?.value && typeof row.value === "object" && row.value !== null
      ? (row.value as MetaAdsSettingJson)
      : {};
  const pixelId = String(fromDb.pixelId || env.META_PIXEL_ID || "").trim();
  return pixelId || null;
}

export type PincodePolicy = {
  /** If non-empty, only these pincodes are serviceable; if empty/omitted = PAN-India minus restrictions. */
  serviceablePincodes?: string[];
  /** Blocked pincodes site-wide. */
  restrictedPincodes?: string[];
  /** If non-empty, COD only where listed; if empty/omitted = COD allowed wherever serviceable (subject to master COD flag). */
  codPincodes?: string[];
  /** Shown on PDP + checkout. */
  estimatedDeliveryDays?: number;
  /** Master COD switch (AND with product-level). Default true when missing. */
  codEnabled?: boolean;
};

const defaultPincodePolicy: PincodePolicy = {
  estimatedDeliveryDays: 5,
  codEnabled: true,
};

/**
 * Loads a JSON setting object, falling back when the row is missing or malformed.
 */
export async function getPincodePolicy(): Promise<PincodePolicy> {
  const row = await prisma.setting.findUnique({ where: { key: "pincodePolicy" } });
  if (!row?.value || typeof row.value !== "object" || row.value === null) {
    return { ...defaultPincodePolicy };
  }
  return {
    ...defaultPincodePolicy,
    ...(row.value as Record<string, unknown>),
  } as PincodePolicy;
}

/** Checkout defaults (PRD §7.10 Shipping / COD / GST display). */
export type CheckoutDefaults = {
  shippingFlatRate: number;
  /** Subtotal ≥ this ⇒ ₹0 shipping (unless overridden by product rules). */
  freeShippingThreshold: number | null;
  codChargeDefault: number;
  /** When true, `priceSale` includes GST — we expose extracted GST as informational only. */
  taxInclusive: boolean;
  /** Block COD above this cart total (₹). Omit = no limit. */
  codMaxOrderValue: number | null;
  /** Block COD below this total. */
  codMinOrderValue: number | null;
  /** When false, only repeat customers may use COD (PRD §7.10). */
  firstOrderCodAllowed: boolean;
  /** Minutes before unpaid `PLACED` (online pay) orders auto-cancel. */
  orderCancelAfterMinutes: number;
};

const defaultCheckout: CheckoutDefaults = {
  shippingFlatRate: 49,
  freeShippingThreshold: 499,
  codChargeDefault: 40,
  taxInclusive: true,
  codMaxOrderValue: null,
  codMinOrderValue: null,
  firstOrderCodAllowed: true,
  orderCancelAfterMinutes: 30,
};

/**
 * Loads `checkout` JSON from `Setting` or returns v1-safe defaults.
 */
export async function getCheckoutDefaults(): Promise<CheckoutDefaults> {
  const row = await prisma.setting.findUnique({ where: { key: "checkout" } });
  if (!row?.value || typeof row.value !== "object" || row.value === null) {
    return { ...defaultCheckout };
  }
  const v = row.value as Record<string, unknown>;
  return {
    shippingFlatRate: numOr(v.shippingFlatRate, defaultCheckout.shippingFlatRate),
    freeShippingThreshold:
      v.freeShippingThreshold === null || v.freeShippingThreshold === undefined
        ? defaultCheckout.freeShippingThreshold
        : Number(v.freeShippingThreshold),
    codChargeDefault: numOr(v.codChargeDefault, defaultCheckout.codChargeDefault),
    taxInclusive:
      typeof v.taxInclusive === "boolean" ? v.taxInclusive : defaultCheckout.taxInclusive,
    codMaxOrderValue:
      v.codMaxOrderValue === undefined
        ? defaultCheckout.codMaxOrderValue
        : v.codMaxOrderValue === null
          ? null
          : Number(v.codMaxOrderValue),
    codMinOrderValue:
      v.codMinOrderValue === undefined
        ? defaultCheckout.codMinOrderValue
        : v.codMinOrderValue === null
          ? null
          : Number(v.codMinOrderValue),
    firstOrderCodAllowed:
      typeof v.firstOrderCodAllowed === "boolean"
        ? v.firstOrderCodAllowed
        : defaultCheckout.firstOrderCodAllowed,
    orderCancelAfterMinutes: numOr(
      v.orderCancelAfterMinutes,
      defaultCheckout.orderCancelAfterMinutes,
    ),
  };
}

function numOr(raw: unknown, fallback: number): number {
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

/** Site-wide storefront mode reasons (PRD §7.10). */
export type SiteModeReason = "COMING_SOON" | "UNDER_MAINTENANCE" | "SALE";

/** Admin `Setting` key `siteMode` JSON shape. */
export type SiteModeSetting = {
  enabled: boolean;
  reason: SiteModeReason;
  /** ISO 8601 UTC — required when enabled. */
  endsAt: string;
  headline?: string;
  message?: string;
};

/** Public storefront payload for banners + checkout gating. */
export type PublicSiteMode = {
  active: boolean;
  reason: SiteModeReason | null;
  endsAt: string | null;
  headline: string;
  message: string | null;
  blocksCheckout: boolean;
};

const INACTIVE_SITE_MODE: PublicSiteMode = {
  active: false,
  reason: null,
  endsAt: null,
  headline: "",
  message: null,
  blocksCheckout: false,
};

/**
 * Returns true when the site mode reason blocks checkout (Coming soon / Under maintenance).
 */
export function blocksCheckoutForReason(reason: SiteModeReason): boolean {
  return reason === "COMING_SOON" || reason === "UNDER_MAINTENANCE";
}

/**
 * Default banner headline when admin omits a custom headline.
 */
export function defaultHeadlineForReason(reason: SiteModeReason): string {
  switch (reason) {
    case "COMING_SOON":
      return "Coming soon";
    case "UNDER_MAINTENANCE":
      return "Under maintenance";
    case "SALE":
      return "Sale ends in";
  }
}

/**
 * Loads raw `siteMode` from DB without expiry evaluation.
 */
export async function getSiteModeRaw(): Promise<SiteModeSetting> {
  const row = await prisma.setting.findUnique({ where: { key: "siteMode" } });
  const defaults: SiteModeSetting = {
    enabled: false,
    reason: "COMING_SOON",
    endsAt: "",
  };
  if (!row?.value || typeof row.value !== "object" || row.value === null) {
    return defaults;
  }
  const v = row.value as Record<string, unknown>;
  const reason = v.reason;
  const validReason: SiteModeReason =
    reason === "COMING_SOON" || reason === "UNDER_MAINTENANCE" || reason === "SALE"
      ? reason
      : "COMING_SOON";
  return {
    enabled: typeof v.enabled === "boolean" ? v.enabled : false,
    reason: validReason,
    endsAt: typeof v.endsAt === "string" ? v.endsAt : "",
    headline: typeof v.headline === "string" ? v.headline : undefined,
    message: typeof v.message === "string" ? v.message : undefined,
  };
}

/**
 * Resolves active site mode — auto-expires when `endsAt` is missing, invalid, or in the past.
 */
export async function getEffectiveSiteMode(): Promise<PublicSiteMode> {
  const raw = await getSiteModeRaw();
  if (!raw.enabled) return INACTIVE_SITE_MODE;

  const endsAtMs = Date.parse(raw.endsAt);
  if (!raw.endsAt || !Number.isFinite(endsAtMs) || endsAtMs <= Date.now()) {
    return INACTIVE_SITE_MODE;
  }

  const headline = (raw.headline?.trim() || defaultHeadlineForReason(raw.reason)).trim();
  const message = raw.message?.trim() || null;

  return {
    active: true,
    reason: raw.reason,
    endsAt: raw.endsAt,
    headline,
    message,
    blocksCheckout: blocksCheckoutForReason(raw.reason),
  };
}
