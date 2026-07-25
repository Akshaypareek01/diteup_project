import Link from "next/link";
import { PolicySection } from "@/components/legal/PolicySection";

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
                  href="mailto:info@diteup.com"
                  className="font-medium text-gold-deep underline decoration-gold-deep/40 underline-offset-2 hover:decoration-gold-deep"
                >
                  info@diteup.com
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
                Orders are usually processed within{" "}
                <span className="font-medium text-ink">24–48 working hours</span> after successful
                payment confirmation. Orders placed on Sundays, public holidays or during
                high-demand periods may take slightly longer to process — we notify you if there is
                an unusual delay.
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
                We currently offer{" "}
                <span className="font-medium text-ink">free standard shipping on all orders</span>{" "}
                across India — there is no minimum cart value. The checkout summary is always
                authoritative for any charges.
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
                  href="/terms-conditions"
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
                Once shipped, orders usually take{" "}
                <span className="font-medium text-ink">3–7 working days</span> to be delivered,
                depending on the delivery location and courier service availability. Delivery
                windows are <span className="font-medium text-ink">estimates only</span>, not
                guarantees. Remote locations, non-serviceable pin codes, weather, festivals,
                strikes, or courier delays can affect schedules.
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
                Couriers may attempt delivery more than once, so please ensure the phone number and
                address provided at checkout are correct. If an order cannot be delivered due to an
                incorrect address, customer unavailability, refusal to accept delivery or failed
                delivery attempts, it may be returned to us (RTO). In such cases, reshipping or
                refund may be handled after reviewing the situation, and any shipping or
                return-to-origin charges may be deducted where applicable.
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
                If the package appears damaged, opened, leaking, tampered with or unsafe at
                delivery, please do not use the product. Contact us within{" "}
                <span className="font-medium text-ink">48 hours of delivery</span> with your order
                ID, clear photos of the outer package and product, an unboxing video taken at the
                time of delivery, and the batch / MFG details visible on the pack. After
                verification, we may offer a replacement, refund or suitable resolution.
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
                  href="mailto:info@diteup.com"
                  className="font-medium text-gold-deep underline decoration-gold-deep/40 underline-offset-2 hover:decoration-gold-deep"
                >
                  info@diteup.com
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
