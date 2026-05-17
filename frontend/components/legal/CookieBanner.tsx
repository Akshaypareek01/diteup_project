"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  readCookieConsent,
  syncMetaPixelConsent,
  writeCookieConsent,
  type CookieConsentValue,
} from "@/lib/cookie-consent";

type BannerPhase = "pending" | "visible" | "hidden";

/**
 * Cookie consent bar: persists essential vs analytics choice and syncs Meta consent mode.
 */
export function CookieBanner() {
  const [phase, setPhase] = useState<BannerPhase>("pending");

  useEffect(() => {
    const stored = readCookieConsent();
    setPhase(stored === null ? "visible" : "hidden");
  }, []);

  const choose = useCallback((value: CookieConsentValue) => {
    writeCookieConsent(value);
    setPhase("hidden");
    const apply = () => syncMetaPixelConsent(value);
    if (typeof window.fbq === "function") {
      apply();
      return;
    }
    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      if (typeof window.fbq === "function") {
        apply();
        window.clearInterval(timer);
      } else if (attempts >= 40) {
        window.clearInterval(timer);
        console.warn("Meta Pixel did not load in time to apply consent choice");
      }
    }, 50);
  }, []);

  if (phase !== "visible") return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-line-dark/25 bg-paper p-4 text-ink shadow-lg md:bottom-4 md:left-4 md:right-auto md:max-w-md md:rounded-xl md:border md:border-line-dark/20 md:shadow-xl"
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-banner-title"
      aria-describedby="cookie-banner-desc"
    >
      <h2 id="cookie-banner-title" className="sr-only">
        Cookie preferences
      </h2>
      <p id="cookie-banner-desc" className="text-body text-ink">
        We use essential cookies for security, cart, and checkout. With your permission we also use
        analytics cookies (including Meta Pixel) to understand how our site is used. See our{" "}
        <Link href="/privacy" className="font-medium text-gold-deep underline underline-offset-2">
          Privacy
        </Link>{" "}
        policy for details.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          className="inline-flex h-10 min-h-[44px] items-center justify-center rounded-lg bg-forest px-4 font-medium text-cream shadow-sm transition hover:bg-sage focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
          onClick={() => choose("analytics_accepted")}
        >
          Accept analytics
        </button>
        <button
          type="button"
          className="inline-flex h-10 min-h-[44px] items-center justify-center rounded-lg border-2 border-line-dark/35 bg-cream px-4 font-medium text-ink shadow-sm transition hover:border-forest/40 hover:bg-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
          onClick={() => choose("essential_only")}
        >
          Essential only
        </button>
      </div>
    </div>
  );
}
