"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/Input";

export type CheckoutAddressRow = {
  id: string;
  label?: string | null;
  name: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault?: boolean;
};

export type CheckoutShippingPanelProps = {
  /** Saved book from `/v1/me/addresses` */
  addresses: CheckoutAddressRow[];
  /** Authenticated shopper with at least one saved row */
  useSavedUi: boolean;
  /** True while `/v1/me/addresses` is in flight */
  addressesLoading?: boolean;
  /** Saved row id selected, or `null` when using manual entry */
  selectedSavedAddressId: string | null;
  onSelectSaved: (row: CheckoutAddressRow) => void;
  onSelectManualEntry: () => void;
  /** Manual form mirrors (shown & editable only in manual mode) */
  shipName: string;
  shipPhone: string;
  line1: string;
  line2: string;
  city: string;
  stateField: string;
  pincode: string;
  country: string;
  onShipNameChange: (v: string) => void;
  onShipPhoneChange: (v: string) => void;
  onLine1Change: (v: string) => void;
  onLine2Change: (v: string) => void;
  onCityChange: (v: string) => void;
  onStateChange: (v: string) => void;
  onPincodeChange: (v: string) => void;
  onCountryChange: (v: string) => void;
  onPincodeBlur: () => void;
  pinStatusSummary: ReactNode;
  checkingPin: boolean;
  pinErr: string | null;
};

/** Formats saved address summary for radios and read-only recap. */
function formatAddressSnippet(a: CheckoutAddressRow): string {
  const title = [a.label, a.city].filter(Boolean).join(" · ");
  const core = `${a.city}, ${a.state} ${a.pincode}`;
  return title ? `${title} — ${core}` : core;
}

/**
 * Shipping step: logged-in shoppers pick `/v1/me/addresses`; guests / manual-mode use plain inputs.
 */
export function CheckoutShippingPanel({
  addresses,
  addressesLoading = false,
  useSavedUi,
  selectedSavedAddressId,
  onSelectSaved,
  onSelectManualEntry,
  shipName,
  shipPhone,
  line1,
  line2,
  city,
  stateField,
  pincode,
  country,
  onShipNameChange,
  onShipPhoneChange,
  onLine1Change,
  onLine2Change,
  onCityChange,
  onStateChange,
  onPincodeChange,
  onCountryChange,
  onPincodeBlur,
  pinStatusSummary,
  checkingPin,
  pinErr,
}: CheckoutShippingPanelProps) {
  const manualMode = !useSavedUi || selectedSavedAddressId === null;
  const picked = addresses.find((a) => a.id === selectedSavedAddressId);
  const showSavedRadios = useSavedUi && !addressesLoading;
  const showManualBlock = !addressesLoading && (!useSavedUi || manualMode);

  return (
    <section className="rounded-lg border border-line bg-paper p-5 lg:rounded-2xl lg:p-6" aria-labelledby="co-ship">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 id="co-ship" className="font-semibold text-forest">
          Shipping
        </h2>
        {showSavedRadios ? (
          <Link href="/account/addresses" className="text-body-sm font-medium text-gold-deep underline underline-offset-2">
            Manage addresses
          </Link>
        ) : null}
      </div>

      {addressesLoading ? <p className="mt-4 text-body-sm text-ink-muted">Loading your saved addresses…</p> : null}

      {showSavedRadios ? (
        <div className="mt-4 rounded-lg bg-parchment/60 p-3" role="radiogroup" aria-label="Choose shipping address">
          <p className="mb-2 text-body-sm font-semibold text-forest">Choose from your saved addresses</p>
          <ul className="space-y-2">
            {addresses.map((a) => (
              <li key={a.id}>
                <label className="flex cursor-pointer gap-3 rounded-lg border border-line bg-paper px-3 py-2 hover:border-gold-muted">
                  <input
                    type="radio"
                    className="mt-1 shrink-0"
                    name="saved-ship-address"
                    checked={selectedSavedAddressId === a.id && !manualMode}
                    onChange={() => onSelectSaved(a)}
                  />
                  <span className="flex-1 text-body-sm">
                    <span className="block font-medium text-forest">{formatAddressSnippet(a)}</span>
                    <span className="text-ink-muted">
                      {a.name} · {a.phone}
                    </span>
                    {a.line2 ? (
                      <span className="mt-1 block truncate text-body-sm text-ink-muted">
                        {a.line1}, {a.line2}
                      </span>
                    ) : (
                      <span className="mt-1 block truncate text-body-sm text-ink-muted">{a.line1}</span>
                    )}
                  </span>
                </label>
              </li>
            ))}
          </ul>
          <label className="mt-3 flex cursor-pointer gap-3 rounded-lg border border-dashed border-line px-3 py-2">
            <input
              type="radio"
              className="mt-1 shrink-0"
              name="saved-ship-address"
              checked={manualMode}
              onChange={onSelectManualEntry}
            />
            <span className="text-body-sm font-medium text-forest">Use a different address (enter below)</span>
          </label>
        </div>
      ) : null}

      {!addressesLoading && useSavedUi && picked && !manualMode ? (
        <div className="mt-4 rounded-lg border border-line bg-parchment/40 px-4 py-3 text-body-sm" aria-live="polite">
          <p className="font-semibold text-forest">Delivering to</p>
          <address className="mt-2 not-italic leading-relaxed text-forest">
            {picked.name}
            <br />
            {picked.line1}
            {picked.line2 ? (
              <>
                <br />
                {picked.line2}
              </>
            ) : null}
            <br />
            {picked.city}, {picked.state} {picked.pincode}
            <br />
            {picked.country} · {picked.phone}
          </address>
          <div className="mt-4 space-y-2">
            <label className="block font-mono text-eyebrow text-ink-muted" htmlFor="co-pin-readonly-note">
              PIN verification
            </label>
            <p id="co-pin-readonly-note" className="text-body-sm text-ink-muted">
              Delivering on PIN{" "}
              <span className="font-mono font-semibold text-forest">{picked.pincode}</span>
              {checkingPin ? " — checking serviceability…" : null}
            </p>
            {pinStatusSummary}
            {pinErr ? (
              <p className="text-body-sm text-error" role="alert">
                {pinErr}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {showManualBlock ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Input
            label="Full name"
            name="ship-name"
            value={shipName}
            onChange={(e) => onShipNameChange(e.target.value)}
            required
          />
          <Input label="Phone" name="ship-phone" value={shipPhone} onChange={(e) => onShipPhoneChange(e.target.value)} required />
          <Input className="sm:col-span-2" label="Address line 1" name="line1" value={line1} onChange={(e) => onLine1Change(e.target.value)} required />
          <Input className="sm:col-span-2" label="Address line 2 (optional)" name="line2" value={line2} onChange={(e) => onLine2Change(e.target.value)} />
          <Input label="City" name="city" value={city} onChange={(e) => onCityChange(e.target.value)} required />
          <Input label="State" name="state" value={stateField} onChange={(e) => onStateChange(e.target.value)} required />
          <div className="sm:col-span-2 space-y-2">
            <Input
              label="PIN code"
              name="pincode"
              inputMode="numeric"
              autoComplete="postal-code"
              value={pincode}
              onChange={(e) => onPincodeChange(e.target.value)}
              onBlur={onPincodeBlur}
              required
              maxLength={6}
            />
            <p className="text-body-sm text-ink-muted">
              We validate serviceability automatically on blur.{checkingPin ? " Checking…" : ""}
            </p>
            {pinStatusSummary}
            {pinErr ? (
              <p className="text-body-sm text-error" role="alert">
                {pinErr}
              </p>
            ) : null}
          </div>
          <Input label="Country" name="country" value={country} onChange={(e) => onCountryChange(e.target.value)} required />
        </div>
      ) : null}
    </section>
  );
}
