"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export type ProductPdpDeliveryCheckProps = {
  className?: string;
};

/**
 * Delivery promise, pincode checker (UI stub), and trust markers (CRO issue 6).
 */
export function ProductPdpDeliveryCheck({ className }: ProductPdpDeliveryCheckProps) {
  const [pincode, setPincode] = useState("");
  const [deliveryMessage, setDeliveryMessage] = useState<string | null>(null);

  /**
   * Client-side stub: validates 6-digit Indian pincode and shows a static ETA.
   */
  function handleCheckPincode() {
    const trimmed = pincode.trim();
    if (!/^\d{6}$/.test(trimmed)) {
      setDeliveryMessage("Enter a valid 6-digit pincode.");
      return;
    }
    setDeliveryMessage("Estimated delivery: 2–3 business days to this pincode.");
  }

  return (
    <section
      aria-label="Delivery and shipping information"
      className={cn("rounded-xl bg-[#E8F5C8] p-4 sm:p-5", className)}
    >
      <p className="font-sans text-body font-bold text-ink">95% orders are delivered within 3 days</p>

      <div className="mt-3 flex gap-2">
        <label htmlFor="pdp-pincode" className="sr-only">
          Enter pincode
        </label>
        <div className="relative flex-1">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path d="M12 21s-6-5.25-9-9.75C1.5 9.75 4.5 6 8.25 6 10.5 6 12 7.5 12 7.5S13.5 6 15.75 6C19.5 6 22.5 9.75 22.5 12.75 19.5 17.25 12 21 12 21z" />
            <circle cx="12" cy="11.5" r="2.25" />
          </svg>
          <input
            id="pdp-pincode"
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="Enter Pincode"
            value={pincode}
            onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
            className="h-11 w-full rounded-lg border border-line bg-paper pl-10 pr-3 font-sans text-body text-ink placeholder:text-ink-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/40"
          />
        </div>
        <button
          type="button"
          onClick={handleCheckPincode}
          className="shrink-0 rounded-lg border border-forest bg-transparent px-4 font-sans text-body-sm font-semibold text-forest transition hover:bg-forest/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/40"
        >
          Check
        </button>
      </div>

      {deliveryMessage ? (
        <p className="mt-2 font-sans text-body-sm text-ink-soft" role="status">
          {deliveryMessage}
        </p>
      ) : null}

      <ul className="mt-4 grid grid-cols-2 gap-3 border-t border-forest/15 pt-4">
        <li className="flex flex-col items-center gap-1.5 text-center">
          <svg className="size-6 text-forest" viewBox="0 0 24 24" fill="none" aria-hidden stroke="currentColor" strokeWidth="1.65">
            <path d="M4 12a8 8 0 1 0 8 8" strokeLinecap="round" />
            <path d="M4 12V4h8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 4l8 8" strokeLinecap="round" />
          </svg>
          <span className="font-sans text-[0.6875rem] font-medium leading-snug text-ink sm:text-body-sm">
            7 days return and refund
          </span>
        </li>
        <li className="flex flex-col items-center gap-1.5 text-center">
          <svg className="size-6 text-forest" viewBox="0 0 24 24" fill="none" aria-hidden stroke="currentColor" strokeWidth="1.65">
            <path d="M3 7h11v10H3V7zm11 0h4l3 3v4h-7V7z" strokeLinejoin="round" />
            <circle cx="7.5" cy="18" r="1.5" />
            <circle cx="17.5" cy="18" r="1.5" />
          </svg>
          <span className="font-sans text-[0.6875rem] font-medium leading-snug text-ink sm:text-body-sm">
            FREE Shipping on orders above ₹399
          </span>
        </li>
      </ul>
    </section>
  );
}
