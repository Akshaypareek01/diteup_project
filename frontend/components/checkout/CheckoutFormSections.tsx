"use client";

import { Input } from "@/components/ui/Input";
import { CheckoutShippingPanel, type CheckoutAddressRow } from "@/components/checkout/CheckoutShippingPanel";
import type { CartPricingBreakdown } from "@/lib/types/catalog";
import type { ReactNode } from "react";

export type CheckoutFormSectionsProps = {
  guestEmail: string;
  onGuestEmailChange: (v: string) => void;
  userEmail: string | null;
  guestPhone: string;
  onGuestPhoneChange: (v: string) => void;
  savedAddresses: CheckoutAddressRow[];
  loadingSavedAddresses: boolean;
  selectedSavedAddressId: string | null;
  onSelectSaved: (row: CheckoutAddressRow) => void;
  onSelectManualEntry: () => void;
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
  paymentMethod: "RAZORPAY" | "COD";
  onPaymentMethodChange: (m: "RAZORPAY" | "COD") => void;
  codSelectable: boolean;
  couponCode: string;
  onCouponCodeChange: (v: string) => void;
  preview: CartPricingBreakdown | null;
};

/**
 * Contact, shipping, and payment blocks shared between mobile and desktop checkout layouts.
 */
export function CheckoutFormSections({
  guestEmail,
  onGuestEmailChange,
  userEmail,
  guestPhone,
  onGuestPhoneChange,
  savedAddresses,
  loadingSavedAddresses,
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
  paymentMethod,
  onPaymentMethodChange,
  codSelectable,
  couponCode,
  onCouponCodeChange,
  preview,
}: CheckoutFormSectionsProps) {
  return (
    <>
      <section className="rounded-lg border border-line bg-paper p-5 lg:rounded-2xl lg:p-6" aria-labelledby="co-contact">
        <h2 id="co-contact" className="font-semibold text-forest">
          Contact
        </h2>
        <div className="mt-4 space-y-3">
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            name="email"
            value={guestEmail}
            onChange={(e) => onGuestEmailChange(e.target.value)}
            disabled={Boolean(userEmail)}
            required
          />
          <Input
            label="Phone"
            type="tel"
            autoComplete="tel"
            name="phone"
            value={guestPhone}
            onChange={(e) => onGuestPhoneChange(e.target.value)}
          />
        </div>
      </section>

      <CheckoutShippingPanel
        addresses={savedAddresses}
        useSavedUi={Boolean(userEmail && savedAddresses.length > 0)}
        addressesLoading={Boolean(userEmail && loadingSavedAddresses)}
        selectedSavedAddressId={selectedSavedAddressId}
        onSelectSaved={onSelectSaved}
        onSelectManualEntry={onSelectManualEntry}
        shipName={shipName}
        shipPhone={shipPhone}
        line1={line1}
        line2={line2}
        city={city}
        stateField={stateField}
        pincode={pincode}
        country={country}
        onShipNameChange={onShipNameChange}
        onShipPhoneChange={onShipPhoneChange}
        onLine1Change={onLine1Change}
        onLine2Change={onLine2Change}
        onCityChange={onCityChange}
        onStateChange={onStateChange}
        onPincodeChange={onPincodeChange}
        onCountryChange={onCountryChange}
        onPincodeBlur={onPincodeBlur}
        pinStatusSummary={pinStatusSummary}
        checkingPin={checkingPin}
        pinErr={pinErr}
      />

      <section className="rounded-lg border border-line bg-paper p-5 lg:rounded-2xl lg:p-6" aria-labelledby="co-pay">
        <h2 id="co-pay" className="font-semibold text-forest">
          Payment
        </h2>
        <div className="mt-4 space-y-3">
          <label className="flex cursor-pointer items-center gap-2 text-body-sm">
            <input
              type="radio"
              name="pay"
              checked={paymentMethod === "RAZORPAY"}
              onChange={() => onPaymentMethodChange("RAZORPAY")}
            />
            Pay online (Razorpay)
          </label>
          <label className={`flex cursor-pointer items-center gap-2 text-body-sm ${!codSelectable ? "text-ink-muted" : ""}`}>
            <input
              type="radio"
              name="pay"
              checked={paymentMethod === "COD"}
              disabled={!codSelectable}
              onChange={() => onPaymentMethodChange("COD")}
            />
            Cash on delivery
            {!codSelectable ? " (validate PIN · COD-eligible zones only)" : ""}
          </label>
        </div>
        <div className="mt-4">
          <Input label="Coupon (optional)" name="coupon" value={couponCode} onChange={(e) => onCouponCodeChange(e.target.value)} />
          {preview?.coupon?.message ? (
            <p className="mt-2 text-body-sm text-ink-muted" role="status">
              {preview.coupon.message}
            </p>
          ) : null}
        </div>
      </section>
    </>
  );
}
