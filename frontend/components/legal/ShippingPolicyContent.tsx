import { PolicySection } from "@/components/legal/PolicySection";

/**
 * Shipping and delivery policy for `/shipping-policy`.
 * Content mirrors the client's authoritative policy document.
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
          Shipping Policy
        </h1>
        <p className="mt-4 text-body-sm text-ink-muted">
          Last updated: 16 August 2026 · Applies to all orders placed on www.diteup.com.
        </p>
        <p className="mt-4 text-body text-ink-soft">
          At DiteUp, we work to deliver your order safely, hygienically and on time. This Shipping
          Policy applies to all orders placed on www.diteup.com.
        </p>
      </header>

      <div className="mx-auto max-w-[66ch]">
        <PolicySection
          id="ship-processing"
          title="Order Processing Time"
          body={
            <>
              <p>
                Orders are usually processed within{" "}
                <span className="font-medium text-ink">24–48 working hours</span> after successful
                payment confirmation.
              </p>
              <p>
                Orders placed on Sundays, public holidays or during high-demand periods may take
                slightly longer to process.
              </p>
            </>
          }
        />

        <PolicySection
          id="ship-delivery-time"
          title="Delivery Time"
          body={
            <>
              <p>
                Once shipped, orders usually take{" "}
                <span className="font-medium text-ink">3–7 working days</span> to be delivered,
                depending on the delivery location and courier service availability.
              </p>
              <p>
                Remote locations, non-serviceable pin codes, weather issues, courier delays or
                public holidays may affect delivery timelines.
              </p>
            </>
          }
        />

        <PolicySection
          id="ship-charges"
          title="Shipping Charges"
          body={
            <>
              <p>
                We offer{" "}
                <span className="font-medium text-ink">FREE SHIPPING</span> on DiteUp Energy Bite
                orders, unless stated otherwise at checkout.
              </p>
              <p>
                Any applicable shipping charges, if introduced in the future, will be clearly shown
                before checkout.
              </p>
            </>
          }
        />

        <PolicySection
          id="ship-locations"
          title="Delivery Locations"
          body={
            <>
              <p>We currently ship across serviceable pin codes in India.</p>
              <p>
                If your pin code is not serviceable, you may not be able to place an order or
                delivery may take longer than usual.
              </p>
            </>
          }
        />

        <PolicySection
          id="ship-tracking"
          title="Order Tracking"
          body={
            <>
              <p>
                Once your order is shipped, tracking details may be shared through SMS, email,
                WhatsApp or the order tracking page.
              </p>
              <p>You can use the tracking link to check the current delivery status.</p>
            </>
          }
        />

        <PolicySection
          id="ship-delivery-attempts"
          title="Delivery Attempts"
          body={
            <>
              <p>
                Our courier partner may attempt delivery more than once. Please ensure that the
                phone number and address provided at checkout are correct.
              </p>
              <p>
                If the order cannot be delivered due to incorrect address, customer unavailability,
                refusal to accept delivery or failed delivery attempts, the order may be returned to
                us.
              </p>
              <p>
                In such cases, reshipping or refund may be handled after reviewing the situation.
                Any shipping or return-to-origin charges may be deducted where applicable.
              </p>
            </>
          }
        />

        <PolicySection
          id="ship-damaged"
          title="Damaged or Tampered Package"
          body={
            <>
              <p>
                If the package appears damaged, opened, leaking, tampered with or unsafe at the time
                of delivery, please do not use the product.
              </p>
              <p>Please contact us within 48 hours of delivery with:</p>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li>Order ID</li>
                <li>Clear photos of the outer package</li>
                <li>Clear photos of the product</li>
                <li>Unboxing video, at the time of delivery</li>
                <li>Batch/MFG details visible on the pack</li>
              </ul>
              <p>
                After verification, we may offer a replacement, refund or suitable resolution.
              </p>
            </>
          }
        />

        <PolicySection
          id="ship-delayed"
          title="Delayed Delivery"
          body={
            <>
              <p>
                Delivery timelines are estimates and may vary due to courier delays, weather,
                festivals, remote locations, strikes, natural events or other situations beyond our
                control.
              </p>
              <p>If your order is delayed, please contact us and we will help you track it.</p>
            </>
          }
        />
      </div>
    </article>
  );
}
