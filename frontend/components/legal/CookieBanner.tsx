"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
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
  /** Drives the slide-in; set a frame after mount so the transition has a start state. */
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const stored = readCookieConsent();
    setPhase(stored === null ? "visible" : "hidden");
  }, []);

  useEffect(() => {
    if (phase !== "visible") return;
    const frame = window.requestAnimationFrame(() => setEntered(true));
    return () => window.cancelAnimationFrame(frame);
  }, [phase]);

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
      className={`fixed inset-x-0 bottom-0 z-[60] border-t border-line-dark/25 bg-paper p-4 text-ink shadow-lg transition duration-300 ease-out md:bottom-4 md:left-4 md:right-auto md:max-w-md md:rounded-xl md:border md:border-line-dark/20 md:shadow-xl ${
        entered ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
      }`}
      role="region"
      aria-labelledby="cookie-banner-title"
      aria-describedby="cookie-banner-desc"
    >
      <h2 id="cookie-banner-title" className="font-display text-body-lg font-semibold text-forest">
        Get the good stuff
      </h2>
      <p id="cookie-banner-desc" className="mt-2 text-body text-ink">
        Essential cookies keep your cart and checkout working. With your permission, we also use
        analytics and advertising cookies (including Meta Pixel) to show you offers worth seeing and
        to measure whether our ads are working.
      </p>
      <p className="mt-2 text-body-sm text-ink-muted">
        Completing an order also shares purchase details with Meta so we can measure advertising,
        regardless of your choice here. More in our{" "}
        <Link
          href="/privacy-policy#privacy-cookies"
          className="font-medium text-gold-deep underline underline-offset-2"
        >
          Privacy policy
        </Link>
        .
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button
          variant="primaryForest"
          size="md"
          className="w-full sm:w-auto"
          onClick={() => choose("analytics_accepted")}
        >
          Accept analytics
        </Button>
        <Button
          variant="secondary"
          size="md"
          className="w-full sm:w-auto"
          onClick={() => choose("essential_only")}
        >
          Essential only
        </Button>
      </div>
    </div>
  );
}
