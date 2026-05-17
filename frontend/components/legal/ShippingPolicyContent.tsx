import Link from "next/link";
import { PolicySection } from "@/components/legal/PolicySection";
import { formatInr } from "@/lib/format-money";
import { FREE_SHIPPING_THRESHOLD_INR } from "@/lib/storefront-policy-constants";

/**
 * Shipping and delivery policy for `/shipping-policy`.
 */
export function ShippingPolicyContent() {
  return (
    <article
      className="mx-auto max-w-[1080px] px-5 py-12"
      aria-labelledby="shipping-title"
    >
      <header className="max-w-[66ch] border-b border-line pb-8">
        <h1
          id="shipping-title"
          className="font-display text-balance text-display-lg font-semibold text-forest"
        >
          Shipping policy
        </h1>
        <p className="mt-4 text-body-sm text-ink-muted">
          Last updated: 17 May 2026 · Describes how DiteUp ships orders within India.
        </p>
        <p className="mt-4 text-body text-ink-soft">
          We ship PAN-India to serviceable pincodes via our logistics partners. Remote locations,
          weather events, or carrier capacity may occasionally add delay — we appreciate your
          patience.
        </p>
      </header>

      <div className="mx-auto max-w-[66ch]">
        <PolicySection
          id="ship-coverage"
          title="Coverage"
          body={
            <>
              <p>
                We deliver to addresses in India where our carriers operate. If your pincode is not
                serviceable at checkout, we cannot fulfil the order until service expands — contact{" "}
                <a
                  href="mailto:hello@diteup.com"
                  className="font-medium text-gold-deep underline decoration-gold-deep/40 underline-offset-2 hover:decoration-gold-deep"
                >
                  hello@diteup.com
                </a>{" "}
                for assistance.
              </p>
            </>
          }
        />

        <PolicySection
          id="ship-processing"
          title="Order processing"
          body={
            <>
              <p>
                Orders are typically processed within{" "}
                <span className="font-medium text-ink">1–2 business days</span> after payment
                confirmation (excluding Sundays and public holidays observed at our warehouse).
                High-demand launches or inventory checks may extend this slightly — we notify you if
                there is an unusual delay.
              </p>
            </>
          }
        />

        <PolicySection
          id="ship-rates"
          title="Rates & free shipping"
          body={
            <>
              <p>
                Standard shipping fees (if any) are calculated at checkout based on weight,
                dimensions, destination, and active promotions. Orders with a qualifying cart
                subtotal of{" "}
                <span className="font-medium text-ink">{formatInr(FREE_SHIPPING_THRESHOLD_INR)}</span>{" "}
                or more currently receive <span className="font-medium text-ink">free standard shipping</span>
                on eligible lanes, before taxes unless we display otherwise at checkout. The
                threshold may change; the checkout summary is authoritative.
              </p>
              <p className="mt-4">
                Free shipping applies to standard service only — expedited options, if offered, may
                incur additional charges.
              </p>
            </>
          }
        />

        <PolicySection
          id="ship-carriers"
          title="Carriers & handoff"
          body={
            <>
              <p>
                Shipments are tendered to third-party couriers (e.g. national and regional partners).
                Title and risk follow our{" "}
                <Link
                  href="/terms"
                  className="font-medium text-gold-deep underline decoration-gold-deep/40 underline-offset-2 hover:decoration-gold-deep"
                >
                  Terms of service
                </Link>{" "}
                unless mandatory law says differently.
              </p>
            </>
          }
        />

        <PolicySection
          id="ship-delivery-estimates"
          title="Delivery timelines"
          body={
            <>
              <p>
                Estimated delivery windows shown at checkout or in emails are{" "}
                <span className="font-medium text-ink">estimates only</span>, not guarantees.
                Metro and tier-1 cities often see faster transit; remote areas may take longer. Weather,
                festivals, strikes, or customs-like inland checks can affect schedules.
              </p>
            </>
          }
        />

        <PolicySection
          id="ship-address"
          title="Address accuracy"
          body={
            <>
              <p>
                You are responsible for a complete, accurate shipping address, reachable phone
                number, and any gate codes or landmarks the courier may need. Fees for rerouting,
                re-shipment after a failed delivery, or address correction may be charged to you
                where permitted.
              </p>
            </>
          }
        />

        <PolicySection
          id="ship-tracking"
          title="Tracking & notifications"
          body={
            <>
              <p>
                When your order ships, we send tracking details (where the carrier supports it) to
                your registered email or phone. Tracking can take several hours to activate after
                handoff.
              </p>
            </>
          }
        />

        <PolicySection
          id="ship-delivery-attempts"
          title="Delivery attempts & RTO"
          body={
            <>
              <p>
                Couriers usually make multiple attempts or ask you to collect from a hub. If a
                package is returned to us as undeliverable (RTO), we may refund the product amount
                minus shipping and restocking costs as applicable, or re-ship at your expense after
                confirming a valid address.
              </p>
            </>
          }
        />

        <PolicySection
          id="ship-damaged"
          title="Damaged or lost shipments"
          body={
            <>
              <p>
                If your outer carton arrives crushed, wet, or tampered with, refuse acceptance if
                possible and photograph the package. If you discover concealed damage after opening,
                email us within 48 hours with photos of the box, label, and affected items. We will
                work with the carrier and offer a replacement or refund where appropriate.
              </p>
            </>
          }
        />

        <PolicySection
          id="ship-cod"
          title="Cash on delivery"
          body={
            <>
              <p>
                Where COD is available, please keep exact change ready if requested by the courier
                and inspect outer packaging before paying. COD availability can vary by pincode and
                order value.
              </p>
            </>
          }
        />

        <PolicySection
          id="ship-changes"
          title="Changes"
          body={
            <>
              <p>
                We may revise fees, partners, or thresholds — updates appear on this page with a new
                “Last updated” date.
              </p>
            </>
          }
        />

        <PolicySection
          id="ship-contact"
          title="Contact"
          body={
            <>
              <p>
                Shipping questions:{" "}
                <a
                  href="mailto:hello@diteup.com"
                  className="font-medium text-gold-deep underline decoration-gold-deep/40 underline-offset-2 hover:decoration-gold-deep"
                >
                  hello@diteup.com
                </a>{" "}
                or{" "}
                <Link
                  href="/contact"
                  className="font-medium text-gold-deep underline decoration-gold-deep/40 underline-offset-2 hover:decoration-gold-deep"
                >
                  Contact
                </Link>
                .
              </p>
            </>
          }
        />
      </div>
    </article>
  );
}
