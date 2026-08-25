"use client";

/**
 * Reads the Meta ad-attribution signals the Conversions API needs (`_fbp`, `_fbc`).
 *
 * These are sent with the order so the server-side Purchase can be matched to a
 * person and an ad click. Razorpay confirms via webhook, where no browser context
 * exists, so they must be captured here and replayed by the backend.
 */

const FBC_STORAGE_KEY = "dt_fbc";

/**
 * Reads a browser cookie by name.
 */
function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const prefix = `${name}=`;
  for (const part of document.cookie.split("; ")) {
    if (part.startsWith(prefix)) {
      return decodeURIComponent(part.slice(prefix.length)) || undefined;
    }
  }
  return undefined;
}

/**
 * Builds Meta's `_fbc` value from a click id: `fb.<subdomainIndex>.<createdMs>.<fbclid>`.
 */
function deriveFbc(fbclid: string): string {
  return `fb.1.${Date.now()}.${fbclid}`;
}

/**
 * Persists an `fbclid` from the landing URL so attribution survives the journey to
 * checkout. fbevents.js writes `_fbc` itself, but only once analytics consent is
 * granted — this keeps the click id for visitors who accept cookies later.
 */
export function captureFbclidFromUrl(search: string): void {
  if (typeof window === "undefined") return;
  try {
    const fbclid = new URLSearchParams(search).get("fbclid")?.trim();
    if (!fbclid) return;
    if (window.sessionStorage.getItem(FBC_STORAGE_KEY)) return;
    window.sessionStorage.setItem(FBC_STORAGE_KEY, deriveFbc(fbclid));
  } catch (err) {
    console.warn("Meta click id capture failed", err);
  }
}

/**
 * Collects the attribution signals available right now for the order payload.
 *
 * @returns Only the keys that resolved, so the request body stays clean.
 */
export function readMetaAttribution(): { fbp?: string; fbc?: string } {
  const fbp = readCookie("_fbp");
  let fbc = readCookie("_fbc");
  if (!fbc) {
    try {
      fbc = window.sessionStorage.getItem(FBC_STORAGE_KEY) ?? undefined;
    } catch (err) {
      console.warn("Meta click id read failed", err);
    }
  }
  return { ...(fbp ? { fbp } : {}), ...(fbc ? { fbc } : {}) };
}
