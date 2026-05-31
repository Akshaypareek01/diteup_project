"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FlowHeader } from "@/components/layout/FlowHeader";
import { SiteModeStrip } from "@/components/site-mode/SiteModeStrip";
import { useSiteMode } from "@/components/site-mode/SiteModeProvider";
import { RazorpayCheckoutScript } from "@/components/payments/RazorpayCheckoutScript";
import { useCartState } from "@/components/cart/CartStateProvider";
import { ApiError, clientApiJson } from "@/lib/client-api";
import type { CartPricingBreakdown } from "@/lib/types/catalog";
import type { PincodeCheckPayload } from "@/lib/types/pincode";
import { pixelAddPaymentInfo, pixelInitiateCheckout } from "@/lib/meta-pixel-events";
import { CheckoutFormSections } from "@/components/checkout/CheckoutFormSections";
import { CheckoutOrderSummary } from "@/components/checkout/CheckoutOrderSummary";
import type { CheckoutAddressRow } from "@/components/checkout/CheckoutShippingPanel";

type PaymentMethod = "RAZORPAY" | "COD";

type MeResponse = { user?: { id: string; email: string } };

type PlacedOrderResult = {
  order: { orderNumber: string; paymentMethod: string };
  payment: {
    status: string;
    razorpayKeyId?: string;
    razorpayOrderId?: string;
    amountPaise?: number;
  };
  guestToken?: string;
};

function sumCartQty(lines: Array<{ quantity: number }>): number {
  return lines.reduce((acc, l) => acc + l.quantity, 0);
}

/**
 * Checkout: cart preview totals, PIN serviceability (`POST /v1/pincode/check`), Razorpay + COD, Pixel funnel events.
 */
export function CheckoutClient() {
  const { siteMode } = useSiteMode();
  const router = useRouter();
  const { lines, previewPayload, clear } = useCartState();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("RAZORPAY");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [shipName, setShipName] = useState("");
  const [shipPhone, setShipPhone] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [stateField, setStateField] = useState("");
  const [pincode, setPincode] = useState("");
  const [country, setCountry] = useState("IN");

  const [preview, setPreview] = useState<CartPricingBreakdown | null>(null);
  const [previewErr, setPreviewErr] = useState<string | null>(null);

  const [pinStatus, setPinStatus] = useState<PincodeCheckPayload | null>(null);
  const [pinErr, setPinErr] = useState<string | null>(null);
  const [checkingPin, setCheckingPin] = useState(false);

  const [savedAddresses, setSavedAddresses] = useState<CheckoutAddressRow[]>([]);
  const [loadingSavedAddresses, setLoadingSavedAddresses] = useState(false);
  const [selectedSavedAddressId, setSelectedSavedAddressId] = useState<string | null>(null);

  const initiateOnce = useRef(false);

  /** When cart preview resolves `productId`, re-run PIN check for accuracy (saved PIN already known). */
  const lastValidatedProductPin = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await clientApiJson<MeResponse>("/v1/auth/me");
        if (cancelled || !me.user?.email) return;
        setUserEmail(me.user.email);
        setGuestEmail(me.user.email);
        setLoadingSavedAddresses(true);
        try {
          const pack = await clientApiJson<{ addresses?: CheckoutAddressRow[] }>("/v1/me/addresses");
          if (cancelled) return;
          const list = pack.addresses ?? [];
          setSavedAddresses(list);
          const def = list.find((a) => a.isDefault) ?? list[0];
          if (def) {
            setSelectedSavedAddressId(def.id);
            setShipName(def.name);
            setShipPhone(def.phone);
            setLine1(def.line1);
            setLine2(def.line2 ?? "");
            setCity(def.city);
            setStateField(def.state);
            setPincode(def.pincode);
            setCountry(def.country || "IN");
            setPinErr(null);
            setPinStatus(null);
            lastValidatedProductPin.current = null;
          } else {
            setSelectedSavedAddressId(null);
          }
        } catch {
          setSavedAddresses([]);
          setSelectedSavedAddressId(null);
          lastValidatedProductPin.current = null;
        } finally {
          if (!cancelled) setLoadingSavedAddresses(false);
        }
      } catch {
        /* guest — manual shipping only */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const emailForPricing = userEmail ?? guestEmail.trim().toLowerCase();

  const refreshPreview = useCallback(async () => {
    const items = previewPayload();
    if (items.length === 0) {
      setPreview(null);
      return;
    }
    try {
      setPreviewErr(null);
      const data = await clientApiJson<CartPricingBreakdown>("/v1/cart/preview", {
        method: "POST",
        json: {
          items,
          paymentMethod,
          couponCode: couponCode.trim() || null,
          guestEmail: userEmail ? undefined : emailForPricing || undefined,
        },
      });
      setPreview(data);
    } catch (e) {
      setPreview(null);
      setPreviewErr(e instanceof Error ? e.message : "Could not load totals.");
    }
  }, [previewPayload, paymentMethod, couponCode, userEmail, emailForPricing]);

  useEffect(() => {
    void refreshPreview();
  }, [refreshPreview]);

  useEffect(() => {
    if (!preview?.lines?.length || initiateOnce.current) return;
    initiateOnce.current = true;
    const ids = preview.lines.map((l) => l.variantId);
    pixelInitiateCheckout({
      content_ids: ids,
      value: preview.total,
      currency: "INR",
      num_items: sumCartQty(lines),
    });
  }, [preview, lines]);

  const previewTotal = preview?.total;
  const checkoutProductId = preview?.lines?.[0]?.productId ?? null;

  useEffect(() => {
    if (previewTotal == null) return;
    pixelAddPaymentInfo({ value: previewTotal, currency: "INR" });
  }, [paymentMethod, previewTotal]);

  useEffect(() => {
    if (!pinStatus || paymentMethod !== "COD") return;
    if (!pinStatus.serviceable || !pinStatus.codAvailable) {
      setPaymentMethod("RAZORPAY");
    }
  }, [pinStatus, paymentMethod]);

  /** Validates delivery + COD eligibility for entered or saved PIN. */
  const validatePinForCart = useCallback(
    async (pinOverride?: string) => {
      const p = (pinOverride ?? pincode).trim();
      setPinErr(null);
      setPinStatus(null);
      if (!/^\d{6}$/.test(p)) {
        setPinErr("Enter a valid 6-digit PIN.");
        return;
      }
      const productId = checkoutProductId;
      setCheckingPin(true);
      try {
        const body = await clientApiJson<PincodeCheckPayload>("/v1/pincode/check", {
          method: "POST",
          json: productId ? { pincode: p, productId } : { pincode: p },
        });
        setPinStatus(body);
        if (!body.serviceable) {
          setPinErr("We can't deliver to this PIN right now.");
        } else if (paymentMethod === "COD" && !body.codAvailable) {
          setPinErr("COD isn't available here — switch to online payment.");
        }
      } catch (e) {
        setPinErr(e instanceof ApiError ? e.message : "PIN check failed.");
      } finally {
        setCheckingPin(false);
      }
    },
    [pincode, checkoutProductId, paymentMethod],
  );

  useEffect(() => {
    if (!selectedSavedAddressId || loadingSavedAddresses) return;
    const row = savedAddresses.find((a) => a.id === selectedSavedAddressId);
    const pin = row?.pincode.trim();
    if (!row || !pin || !/^\d{6}$/.test(pin)) return;
    const key = checkoutProductId ?? "_noPid";
    if (lastValidatedProductPin.current === `${key}:${pin}`) return;
    lastValidatedProductPin.current = `${key}:${pin}`;
    void validatePinForCart(pin);
  }, [savedAddresses, selectedSavedAddressId, checkoutProductId, validatePinForCart, loadingSavedAddresses]);

  /** Apply a `/v1/me/addresses` row and PIN-check it. */
  const handleSelectSavedAddress = useCallback(
    async (row: CheckoutAddressRow) => {
      setSelectedSavedAddressId(row.id);
      lastValidatedProductPin.current = null;
      setShipName(row.name);
      setShipPhone(row.phone);
      setLine1(row.line1);
      setLine2(row.line2 ?? "");
      setCity(row.city);
      setStateField(row.state);
      setPincode(row.pincode);
      setCountry(row.country || "IN");
      setGuestPhone((prev) => prev || row.phone);
      await validatePinForCart(row.pincode);
    },
    [validatePinForCart],
  );

  /** Clear saved selection — full manual capture (order still authenticated). */
  const handleManualShippingChoice = useCallback(() => {
    setSelectedSavedAddressId(null);
    lastValidatedProductPin.current = null;
    setShipName("");
    setShipPhone("");
    setLine1("");
    setLine2("");
    setCity("");
    setStateField("");
    setPincode("");
    setCountry("IN");
    setPinErr(null);
    setPinStatus(null);
  }, []);

  const redirectAfterOrder = useCallback(
    (orderNumber: string, guestToken?: string) => {
      const q = guestToken ? `?token=${encodeURIComponent(guestToken)}` : "";
      router.push(`/order/${encodeURIComponent(orderNumber)}${q}`);
    },
    [router],
  );

  const placeOrder = useCallback(async () => {
    setErr(null);
    const items = previewPayload();
    if (items.length === 0) {
      setErr("Your cart is empty.");
      return;
    }

    const email = emailForPricing;
    if (!userEmail && !email) {
      setErr("Email is required for guest checkout.");
      return;
    }

    const shippingWithSavedAddress =
      Boolean(userEmail && selectedSavedAddressId) &&
      savedAddresses.some((a) => a.id === selectedSavedAddressId);

    if (!shippingWithSavedAddress) {
      if (!shipName.trim() || !shipPhone.trim() || !line1.trim() || !city.trim() || !stateField.trim()) {
        setErr("Please complete all required address fields.");
        return;
      }
    }

    const pinForOrder =
      shippingWithSavedAddress && selectedSavedAddressId
        ? (savedAddresses.find((a) => a.id === selectedSavedAddressId)?.pincode.trim() ?? "")
        : pincode.trim();

    if (!/^\d{6}$/.test(pinForOrder)) {
      setErr("PIN code must be 6 digits for delivery.");
      return;
    }
    if (!pinStatus?.serviceable) {
      setErr("Validate your PIN for delivery — scroll to Shipping.");
      return;
    }
    if (paymentMethod === "COD" && !pinStatus.codAvailable) {
      setErr("COD is unavailable for this address. Choose Razorpay.");
      return;
    }

    setBusy(true);
    try {
      const idempotencyKey =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `idemp-${Date.now()}`;

      const shared = {
        items,
        paymentMethod,
        couponCode: couponCode.trim() || undefined,
        guestEmail: userEmail ? undefined : email,
        guestPhone: guestPhone.trim() || undefined,
        idempotencyKey,
      };

      const body =
        shippingWithSavedAddress && selectedSavedAddressId
          ? { ...shared, addressId: selectedSavedAddressId }
          : {
              ...shared,
              shippingAddress: {
                name: shipName.trim(),
                phone: shipPhone.trim(),
                line1: line1.trim(),
                line2: line2.trim() || undefined,
                city: city.trim(),
                state: stateField.trim(),
                pincode: pincode.trim(),
                country: country.trim() || "IN",
              },
            };

      const placed = await clientApiJson<PlacedOrderResult>("/v1/orders", {
        method: "POST",
        json: body,
      });

      if (paymentMethod === "COD") {
        clear();
        setBusy(false);
        redirectAfterOrder(placed.order.orderNumber, placed.guestToken);
        return;
      }

      const { razorpayOrderId, razorpayKeyId, amountPaise } = placed.payment;
      if (!razorpayOrderId || !razorpayKeyId || !amountPaise) {
        setErr("Online payment is not available for this order. Try COD or try again later.");
        setBusy(false);
        return;
      }

      if (typeof window === "undefined" || !window.Razorpay) {
        setErr("Payment SDK not loaded — refresh and try again.");
        setBusy(false);
        return;
      }

      const rzp = new window.Razorpay({
        key: razorpayKeyId,
        amount: amountPaise,
        currency: "INR",
        order_id: razorpayOrderId,
        name: "DiteUp",
        description: `Order ${placed.order.orderNumber}`,
        prefill: {
          email: email || undefined,
          contact: guestPhone.trim() || shipPhone.trim() || undefined,
        },
        handler: async (response) => {
          try {
            await clientApiJson("/v1/payments/verify", {
              method: "POST",
              json: {
                orderNumber: placed.order.orderNumber,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                guestToken: placed.guestToken,
              },
            });
            clear();
            redirectAfterOrder(placed.order.orderNumber, placed.guestToken);
          } catch (e) {
            const msg = e instanceof ApiError ? e.message : "Payment verification failed.";
            setErr(msg);
            setBusy(false);
          }
        },
        modal: {
          ondismiss: () => {
            setBusy(false);
          },
        },
      });
      rzp.open();
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Could not place order.";
      setErr(msg);
      setBusy(false);
    }
  }, [
    previewPayload,
    userEmail,
    emailForPricing,
    guestPhone,
    couponCode,
    paymentMethod,
    shipName,
    shipPhone,
    line1,
    line2,
    city,
    stateField,
    pincode,
    country,
    pinStatus,
    clear,
    redirectAfterOrder,
    selectedSavedAddressId,
    savedAddresses,
  ]);

  const codSelectable = pinStatus !== null && pinStatus.serviceable && pinStatus.codAvailable;

  const pinStatusSummary = useMemo(() => {
    if (!pinStatus?.serviceable) return null;
    return (
      <p className="text-body-sm text-success" role="status">
        Ships in ~{pinStatus.etaDays} business days · COD{" "}
        {pinStatus.codAvailable ? "available for this PIN" : "not available — pay online"}
      </p>
    );
  }, [pinStatus]);

  if (lines.length === 0) {
    return (
      <div className="min-h-screen bg-cream px-4 py-16 text-center lg:px-8">
        {siteMode.active ? <SiteModeStrip siteMode={siteMode} withShell /> : null}
        <FlowHeader backHref="/cart" />
        <p className="mx-auto mt-8 max-w-md text-body text-forest">
          Add something to your cart before checkout.
        </p>
      </div>
    );
  }

  const checkoutBlocked = siteMode.active && siteMode.blocksCheckout;

  const checkoutHeading = (
    <>
      <h1 className="font-display text-display-md font-semibold text-forest lg:text-display-lg">Checkout</h1>
      <ol
        className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-2 text-body-sm font-medium text-ink-muted lg:gap-x-4"
        aria-label="Checkout steps"
      >
        {["Contact", "Shipping", "Payment"].map((s, i) => (
          <li key={s} className="flex items-center gap-2">
            <span
              className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs lg:size-9 lg:text-sm ${
                i === 0 ? "bg-gold text-forest" : "bg-beige text-ink-muted"
              }`}
            >
              {i + 1}
            </span>
            <span className="whitespace-nowrap">{s}</span>
            {i < 2 ? <span aria-hidden>→</span> : null}
          </li>
        ))}
      </ol>
    </>
  );

  const formSectionsEl = (
    <CheckoutFormSections
      guestEmail={guestEmail}
      onGuestEmailChange={(v) => setGuestEmail(v)}
      userEmail={userEmail}
      guestPhone={guestPhone}
      onGuestPhoneChange={(v) => setGuestPhone(v)}
      savedAddresses={savedAddresses}
      loadingSavedAddresses={loadingSavedAddresses}
      selectedSavedAddressId={selectedSavedAddressId}
      onSelectSaved={(row) => void handleSelectSavedAddress(row)}
      onSelectManualEntry={handleManualShippingChoice}
      shipName={shipName}
      shipPhone={shipPhone}
      line1={line1}
      line2={line2}
      city={city}
      stateField={stateField}
      pincode={pincode}
      country={country}
      onShipNameChange={(v) => setShipName(v)}
      onShipPhoneChange={(v) => setShipPhone(v)}
      onLine1Change={(v) => setLine1(v)}
      onLine2Change={(v) => setLine2(v)}
      onCityChange={(v) => setCity(v)}
      onStateChange={(v) => setStateField(v)}
      onPincodeChange={(v) => {
        setPincode(v);
        lastValidatedProductPin.current = null;
        setPinErr(null);
        setPinStatus(null);
      }}
      onCountryChange={(v) => setCountry(v)}
      onPincodeBlur={() => void validatePinForCart()}
      pinStatusSummary={pinStatusSummary}
      checkingPin={checkingPin}
      pinErr={pinErr}
      paymentMethod={paymentMethod}
      onPaymentMethodChange={(m) => setPaymentMethod(m)}
      codSelectable={codSelectable}
      couponCode={couponCode}
      onCouponCodeChange={(v) => setCouponCode(v)}
      preview={preview}
    />
  );

  const placeOrderBtnClass =
    "flex h-14 w-full items-center justify-center rounded-2xl bg-gold font-sans text-button font-semibold uppercase tracking-wide text-forest shadow-lg transition hover:bg-gold-soft disabled:opacity-50";

  return (
    <div className="min-h-screen bg-cream pb-28 lg:pb-12">
      <RazorpayCheckoutScript />
      {siteMode.active ? <SiteModeStrip siteMode={siteMode} withShell /> : null}
      <FlowHeader backHref="/cart" />
      <div className="mx-auto max-w-[1320px] px-4 py-8 sm:px-5 lg:px-8 lg:py-10 xl:px-12">
        <div className="mb-6 lg:mb-8">{checkoutHeading}</div>

        {checkoutBlocked ? (
          <p
            className="mb-6 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-body-sm text-forest"
            role="alert"
          >
            {siteMode.message ?? `${siteMode.headline} — checkout is temporarily unavailable.`}
          </p>
        ) : null}

        <div className="flex flex-col gap-6 lg:grid lg:grid-cols-12 lg:items-start lg:gap-10 xl:gap-12">
          <CheckoutOrderSummary
            preview={preview}
            previewErr={previewErr}
            lines={lines}
            paymentMethod={paymentMethod}
            className="lg:hidden"
          />

          <div className="space-y-8 lg:col-span-7 xl:col-span-8">
            {formSectionsEl}
            {err ? (
              <p className="text-body-sm text-error" role="alert">
                {err}
              </p>
            ) : null}
          </div>

          <aside className="hidden space-y-5 lg:sticky lg:top-24 lg:z-10 lg:col-span-5 lg:block lg:self-start xl:col-span-4">
            <CheckoutOrderSummary
              preview={preview}
              previewErr={previewErr}
              lines={lines}
              paymentMethod={paymentMethod}
            />
            <button
              type="button"
              className={placeOrderBtnClass}
              disabled={busy || !preview || checkoutBlocked}
              onClick={() => void placeOrder()}
            >
              {busy ? "Processing…" : "Place order"}
            </button>
          </aside>

          <button
            type="button"
            className={`${placeOrderBtnClass} fixed inset-x-4 bottom-4 z-30 lg:hidden`}
            style={{ bottom: "max(1rem, env(safe-area-inset-bottom))" }}
            disabled={busy || !preview || checkoutBlocked}
            onClick={() => void placeOrder()}
          >
            {busy ? "Processing…" : "Place order"}
          </button>
        </div>
      </div>
    </div>
  );
}
