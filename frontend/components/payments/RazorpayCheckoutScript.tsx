"use client";

import Script from "next/script";

/**
 * Preloads Razorpay checkout.js on checkout routes.
 * Publishable key comes from `POST /v1/orders` — no frontend env var required.
 */
export function RazorpayCheckoutScript() {
  return <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />;
}
