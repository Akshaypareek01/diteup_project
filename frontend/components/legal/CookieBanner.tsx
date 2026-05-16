"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

/**
 * Cookie consent — dismiss persists for session only until storage wired (Phase 12.16).
 */
export function CookieBanner() {
  const [open, setOpen] = useState(true);
  const dismiss = useCallback(() => setOpen(false), []);

  if (!open) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-line bg-paper/98 p-4 shadow-lg backdrop-blur-sm md:bottom-4 md:left-4 md:right-auto md:max-w-md md:rounded-xl md:border"
      role="dialog"
      aria-label="Cookie preferences"
    >
      <p className="text-body-sm text-ink-soft">
        We use essential and analytics cookies. Persist choice + Meta consent mode before launch.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          className="inline-flex h-10 items-center rounded-lg bg-forest px-4 font-medium text-cream"
          onClick={dismiss}
        >
          Accept
        </button>
        <button
          type="button"
          className="inline-flex h-10 items-center rounded-lg border border-line px-4 font-medium text-forest"
          onClick={dismiss}
        >
          Reject non-essential
        </button>
        <Link
          href="/privacy"
          className="inline-flex h-10 items-center px-2 text-body-sm text-gold-deep underline"
        >
          Privacy
        </Link>
      </div>
    </div>
  );
}
