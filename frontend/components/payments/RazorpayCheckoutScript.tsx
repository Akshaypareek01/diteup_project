"use client";

import Script from "next/script";

const RAZORPAY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

/**
 * Loads Razorpay checkout script once — use with `Razorpay()` after order create (Phase 12.18).
 */
export function RazorpayCheckoutScript() {
  if (!RAZORPAY_ID) return null;
  return <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />;
}
