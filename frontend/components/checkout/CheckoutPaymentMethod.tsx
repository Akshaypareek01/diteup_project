"use client";

export type CheckoutPaymentMethodValue = "RAZORPAY" | "COD";

export type CheckoutPaymentMethodProps = {
  value: CheckoutPaymentMethodValue;
  onChange: (method: CheckoutPaymentMethodValue) => void;
  /** When true, COD radio is not selectable. */
  codDisabled: boolean;
  /** Explains why COD is off (PIN or a prepaid-only cart item). */
  codDisabledReason: string | null;
};

/**
 * Prepaid vs cash-on-delivery radios for checkout.
 */
export function CheckoutPaymentMethod({
  value,
  onChange,
  codDisabled,
  codDisabledReason,
}: CheckoutPaymentMethodProps) {
  return (
    <div className="mt-4 space-y-3">
      <div role="radiogroup" aria-label="Payment method" className="space-y-2">
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-cream/60 px-4 py-3 has-[:checked]:border-gold has-[:checked]:bg-gold/10">
          <input
            type="radio"
            name="checkout-payment-method"
            className="mt-1 size-4 accent-forest"
            checked={value === "RAZORPAY"}
            onChange={() => onChange("RAZORPAY")}
          />
          <span>
            <span className="block font-medium text-forest">Pay online</span>
            <span className="mt-0.5 block text-body-sm text-ink-muted">
              UPI, cards, and netbanking via Razorpay.
            </span>
          </span>
        </label>
        <label
          className={`flex items-start gap-3 rounded-xl border border-line px-4 py-3 has-[:checked]:border-gold has-[:checked]:bg-gold/10 ${
            codDisabled ? "cursor-not-allowed opacity-60" : "cursor-pointer bg-cream/60"
          }`}
        >
          <input
            type="radio"
            name="checkout-payment-method"
            className="mt-1 size-4 accent-forest"
            checked={value === "COD"}
            disabled={codDisabled}
            onChange={() => onChange("COD")}
          />
          <span>
            <span className="block font-medium text-forest">Cash on delivery</span>
            <span className="mt-0.5 block text-body-sm text-ink-muted">
              Pay in cash when your order arrives. A COD fee may apply.
            </span>
          </span>
        </label>
      </div>
      {codDisabled && codDisabledReason ? (
        <p className="text-body-sm text-ink-muted" role="status">
          {codDisabledReason}
        </p>
      ) : null}
    </div>
  );
}
