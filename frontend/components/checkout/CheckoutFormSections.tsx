"use client";

import { useRef } from "react";
import { Input } from "@/components/ui/Input";
import { CheckoutShippingPanel, type CheckoutAddressRow } from "@/components/checkout/CheckoutShippingPanel";
import { useFormAutofillSync } from "@/hooks/useFormAutofillSync";
import {
  normalizeCheckoutCountry,
  normalizeIndianState,
  sanitizePincode,
} from "@/lib/india-locations";
import type { CartPricingBreakdown } from "@/lib/types/catalog";
import type { ReactNode } from "react";
import {
  CheckoutPaymentMethod,
  type CheckoutPaymentMethodValue,
} from "@/components/checkout/CheckoutPaymentMethod";

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
  couponCode: string;
  onCouponCodeChange: (v: string) => void;
  preview: CartPricingBreakdown | null;
  paymentMethod: CheckoutPaymentMethodValue;
  onPaymentMethodChange: (method: CheckoutPaymentMethodValue) => void;
  codDisabled: boolean;
  codDisabledReason: string | null;
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
  couponCode,
  onCouponCodeChange,
  preview,
  paymentMethod,
  onPaymentMethodChange,
  codDisabled,
  codDisabledReason,
}: CheckoutFormSectionsProps) {
  const formRef = useRef<HTMLFormElement>(null);
  useFormAutofillSync(formRef, {
    email: { value: guestEmail, set: onGuestEmailChange, skip: Boolean(userEmail) },
    phone: { value: guestPhone, set: onGuestPhoneChange },
    "ship-name": { value: shipName, set: onShipNameChange },
    "ship-phone": { value: shipPhone, set: onShipPhoneChange },
    line1: { value: line1, set: onLine1Change },
    line2: { value: line2, set: onLine2Change },
    city: { value: city, set: onCityChange },
    state: { value: stateField, set: onStateChange, sanitize: normalizeIndianState },
    pincode: { value: pincode, set: onPincodeChange, sanitize: sanitizePincode },
    country: { value: country, set: onCountryChange, sanitize: normalizeCheckoutCountry },
    coupon: { value: couponCode, set: onCouponCodeChange, sanitize: (s) => s.trim().toUpperCase() },
  });

  return (
    <form
      ref={formRef}
      autoComplete="on"
      className="space-y-8"
      onSubmit={(e) => e.preventDefault()}
    >
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
        <CheckoutPaymentMethod
          value={paymentMethod}
          onChange={onPaymentMethodChange}
          codDisabled={codDisabled}
          codDisabledReason={codDisabledReason}
        />
        <div className="mt-4">
          <Input
            label="Coupon (optional)"
            name="coupon"
            autoComplete="off"
            value={couponCode}
            onChange={(e) => onCouponCodeChange(e.target.value.toUpperCase())}
            hint="Totals update as you type."
          />
          {preview?.coupon?.message ? (
            <p className="mt-2 text-body-sm text-ink-muted" role="status">
              {preview.coupon.message}
            </p>
          ) : null}
        </div>
      </section>
    </form>
  );
}
