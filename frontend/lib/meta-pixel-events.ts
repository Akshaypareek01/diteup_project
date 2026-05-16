"use client";

/**
 * Fire Meta Pixel Standard Events when `fbq` is present (NEXT_PUBLIC_META_PIXEL_ID set — see RootLayout).
 */

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

/**
 * Tracks optional Pixel commerce parameters (safely skips when adblock/disabled).
 */
export function pixelTrack(event: string, payload?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  try {
    window.fbq?.("track", event, payload);
  } catch {
    /* noop */
  }
}

/**
 * ViewContent — canonical product surfaced (PDP/home hero product).
 */
export function pixelViewContent(args: {
  content_ids?: string[];
  value?: number;
  currency?: string;
}): void {
  pixelTrack("ViewContent", {
    content_type: "product",
    content_ids: args.content_ids,
    value: args.value,
    currency: args.currency ?? "INR",
  });
}

/**
 * AddToCart — client-side funnel (PRD §11).
 */
export function pixelAddToCart(args: {
  content_ids: string[];
  value: number;
  currency?: string;
  num_items: number;
}): void {
  pixelTrack("AddToCart", {
    content_ids: args.content_ids,
    value: args.value,
    currency: args.currency ?? "INR",
    num_items: args.num_items,
  });
}

/**
 * InitiateCheckout — checkout page mount.
 */
export function pixelInitiateCheckout(args: {
  content_ids: string[];
  value: number;
  currency?: string;
  num_items: number;
}): void {
  pixelTrack("InitiateCheckout", {
    content_ids: args.content_ids,
    value: args.value,
    currency: args.currency ?? "INR",
    num_items: args.num_items,
  });
}

/**
 * AddPaymentInfo — user picks Razorpay vs COD (PRD §6.4).
 */
export function pixelAddPaymentInfo(args: { value: number; currency?: string }): void {
  pixelTrack("AddPaymentInfo", {
    value: args.value,
    currency: args.currency ?? "INR",
  });
}

/**
 * Purchase — order confirmed tracking page.
 */
export function pixelPurchase(args: {
  content_ids: string[];
  value: number;
  currency?: string;
  transaction_id: string;
}): void {
  pixelTrack("Purchase", {
    content_ids: args.content_ids,
    value: args.value,
    currency: args.currency ?? "INR",
    transaction_id: args.transaction_id,
  });
}

/** CompleteRegistration — successful email verification after signup */
export function pixelCompleteRegistration(): void {
  pixelTrack("CompleteRegistration");
}
