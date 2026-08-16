"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError, clientApiJson } from "@/lib/client-api";
import { useFormAutofillSync } from "@/hooks/useFormAutofillSync";
import { sanitizePincode } from "@/lib/india-locations";
import type { PincodeCheckPayload } from "@/lib/types/pincode";
import { cn } from "@/lib/utils";

export type ProductPdpDeliveryCheckProps = {
  className?: string;
  /** When set, `/v1/pincode/check` applies product-level shipping restrictions. */
  productId?: string;
};

/**
 * Delivery promise + live PIN serviceability (`POST /v1/pincode/check`).
 * Autofill is synced so Chrome-filled PINs still run the check.
 */
export function ProductPdpDeliveryCheck({ className, productId }: ProductPdpDeliveryCheckProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pincode, setPincode] = useState("");
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [ok, setOk] = useState<boolean | null>(null);
  const lastChecked = useRef<string | null>(null);

  useFormAutofillSync(formRef, {
    pincode: { value: pincode, set: setPincode, sanitize: sanitizePincode },
  });

  /**
   * Looks up serviceability for a 6-digit PIN.
   */
  const checkPin = useCallback(
    async (raw: string) => {
      const pin = sanitizePincode(raw);
      if (!/^\d{6}$/.test(pin)) {
        setOk(false);
        setMessage("Enter a valid 6-digit pincode.");
        return;
      }
      if (lastChecked.current === pin) return;
      lastChecked.current = pin;
      setChecking(true);
      setMessage(null);
      try {
        const body = await clientApiJson<PincodeCheckPayload>("/v1/pincode/check", {
          method: "POST",
          json: productId ? { pincode: pin, productId } : { pincode: pin },
        });
        setOk(body.serviceable);
        setMessage(
          body.serviceable
            ? `We deliver to ${pin} — typically within ${body.etaDays} business day${body.etaDays === 1 ? "" : "s"}.`
            : "We can't deliver to this pincode right now.",
        );
      } catch (e) {
        lastChecked.current = null;
        setOk(false);
        setMessage(e instanceof ApiError ? e.message : "Could not check this pincode.");
      } finally {
        setChecking(false);
      }
    },
    [productId],
  );

  useEffect(() => {
    const pin = sanitizePincode(pincode);
    if (!/^\d{6}$/.test(pin)) {
      lastChecked.current = null;
      return;
    }
    const t = window.setTimeout(() => {
      void checkPin(pin);
    }, 280);
    return () => window.clearTimeout(t);
  }, [pincode, checkPin]);

  return (
    <section
      aria-label="Delivery and shipping information"
      className={cn("rounded-xl bg-[#E8F5C8] p-4 sm:p-5", className)}
    >
      <p className="font-sans text-body font-bold text-ink">95% orders are delivered within 3 days</p>

      <form
        ref={formRef}
        className="mt-3 flex gap-2"
        autoComplete="on"
        onSubmit={(e) => {
          e.preventDefault();
          lastChecked.current = null;
          void checkPin(pincode);
        }}
      >
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
            name="pincode"
            type="text"
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={6}
            placeholder="Enter Pincode"
            value={pincode}
            onChange={(e) => setPincode(sanitizePincode(e.target.value))}
            onInput={(e) => setPincode(sanitizePincode((e.target as HTMLInputElement).value))}
            className="h-11 w-full rounded-lg border border-line bg-paper pl-10 pr-3 font-sans text-body text-ink placeholder:text-ink-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/40"
          />
        </div>
        <button
          type="submit"
          className="shrink-0 rounded-lg border border-forest bg-transparent px-4 font-sans text-body-sm font-semibold text-forest transition hover:bg-forest/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/40 disabled:opacity-50"
          disabled={checking}
        >
          {checking ? "…" : "Check"}
        </button>
      </form>

      {message ? (
        <p
          className={cn("mt-2 font-sans text-body-sm", ok ? "text-forest" : "text-ink-soft")}
          role="status"
        >
          {message}
        </p>
      ) : (
        <p className="mt-2 font-sans text-body-sm text-ink-muted">
          Browser-filled pincodes are checked automatically — no need to retype.
        </p>
      )}

      <ul className="mt-4 grid grid-cols-2 gap-3 border-t border-forest/15 pt-4">
        <li className="flex flex-col items-center gap-1.5 text-center">
          <svg className="size-6 text-forest" viewBox="0 0 24 24" fill="none" aria-hidden stroke="currentColor" strokeWidth="1.65">
            <path d="M4 12a8 8 0 1 0 8 8" strokeLinecap="round" />
            <path d="M4 12V4h8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M12 4l8 8" strokeLinecap="round" />
          </svg>
          <span className="font-sans text-[0.6875rem] font-medium leading-snug text-ink sm:text-body-sm">
            Replacement on damaged or wrong items
          </span>
        </li>
        <li className="flex flex-col items-center gap-1.5 text-center">
          <svg className="size-6 text-forest" viewBox="0 0 24 24" fill="none" aria-hidden stroke="currentColor" strokeWidth="1.65">
            <path d="M3 7h11v10H3V7zm11 0h4l3 3v4h-7V7z" strokeLinejoin="round" />
            <circle cx="7.5" cy="18" r="1.5" />
            <circle cx="17.5" cy="18" r="1.5" />
          </svg>
          <span className="font-sans text-[0.6875rem] font-medium leading-snug text-ink sm:text-body-sm">
            FREE Shipping on all orders
          </span>
        </li>
      </ul>
    </section>
  );
}
