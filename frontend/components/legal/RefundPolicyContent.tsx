import Link from "next/link";
import { PolicySection } from "@/components/legal/PolicySection";

/**
 * Return, refund & cancellation policy for `/return-refund-policy`.
 * DiteUp Energy Bite is a food product — returns are NOT accepted once opened,
 * used or consumed. Content mirrors the client's authoritative policy document.
 */
export function RefundPolicyContent() {
  return (
    <article
      className="mx-auto max-w-[1080px] px-5 py-12"
      aria-labelledby="refund-title"
    >
      <header className="max-w-[66ch] border-b border-line pb-8">
        <h1 id="refund-title" className="font-display text-balance text-display-lg font-semibold text-forest">
          Return, refund &amp; cancellation policy
        </h1>
        <p className="mt-4 text-body-sm text-ink-muted">
          Last updated: 17 May 2026 · Applies to purchases made on www.diteup.com.
        </p>
        <p className="mt-4 text-body text-ink-soft">
          At DiteUp, customer satisfaction is important to us. Since DiteUp Energy Bite is a food
          product, we follow hygiene and safety-based return rules. For delivery questions, see our{" "}
          <Link
            href="/shipping-policy"
            className="font-medium text-gold-deep underline decoration-gold-deep/40 underline-offset-2 hover:decoration-gold-deep"
          >
            Shipping policy
          </Link>
          .
        </p>
      </header>

      <div className="mx-auto max-w-[66ch]">
        <PolicySection
          id="refund-food-policy"
          title="Food product return policy"
          body={
            <>
              <p>
                Due to the nature of food products, we do not accept returns once the product is:
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li>Opened</li>
                <li>Used</li>
                <li>Consumed</li>
                <li>Seal-broken</li>
                <li>Damaged after delivery</li>
                <li>Not stored properly by the customer</li>
              </ul>
            </>
          }
        />

        <PolicySection
          id="refund-eligibility"
          title="Replacement or refund eligibility"
          body={
            <>
              <p>A replacement or refund may be considered only in the following cases:</p>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li>Wrong product delivered</li>
                <li>Damaged product received</li>
                <li>Expired product received</li>
                <li>Product missing from package</li>
                <li>Package visibly tampered with at delivery</li>
                <li>Product quality issue reported with valid proof</li>
              </ul>
            </>
          }
        />

        <PolicySection
          id="refund-proof"
          title="Proof required"
          body={
            <>
              <p>To raise a valid request, please share:</p>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li>Order ID</li>
                <li>Registered phone number or email</li>
                <li>Clear product photos</li>
                <li>Clear packaging photos</li>
                <li>Batch number / MFG details</li>
                <li>Unboxing video taken at the time of delivery</li>
                <li>Short description of the issue</li>
              </ul>
              <p className="mt-4">
                Please do not throw away the product or packaging until the issue is reviewed. You
                can raise a request by emailing{" "}
                <a
                  href="mailto:info@diteup.com"
                  className="font-medium text-gold-deep underline decoration-gold-deep/40 underline-offset-2 hover:decoration-gold-deep"
                >
                  info@diteup.com
                </a>{" "}
                or via our{" "}
                <Link
                  href="/contact"
                  className="font-medium text-gold-deep underline decoration-gold-deep/40 underline-offset-2 hover:decoration-gold-deep"
                >
                  contact page
                </Link>
                .
              </p>
            </>
          }
        />

        <PolicySection
          id="refund-approval"
          title="Refund approval"
          body={
            <>
              <p>
                Once we receive your complaint, our team will verify the details. If approved, we may
                offer one of the following:
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li>Replacement of the product</li>
                <li>Refund to the original payment method</li>
                <li>Store credit, if mutually agreed</li>
                <li>Suitable resolution depending on the issue</li>
              </ul>
            </>
          }
        />

        <PolicySection
          id="refund-timeline"
          title="Refund timeline"
          body={
            <>
              <p>
                Approved refunds are usually processed within{" "}
                <span className="font-medium text-ink">5–7 working days</span> after approval. The
                time taken for the amount to reflect in your account may depend on your bank, payment
                gateway or UPI provider.
              </p>
            </>
          }
        />

        <PolicySection
          id="refund-non-refundable"
          title="Non-refundable cases"
          body={
            <>
              <p>Refunds or replacements will not be provided in the following cases:</p>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li>Taste preference</li>
                <li>Change of mind</li>
                <li>Customer ordered by mistake</li>
                <li>Opened, used or consumed product</li>
                <li>Incorrect address provided by customer</li>
                <li>Customer unavailable for delivery</li>
                <li>Delay caused by courier partner beyond our control</li>
                <li>Product damaged due to improper storage after delivery</li>
                <li>Minor variation in packaging, design or product appearance</li>
              </ul>
            </>
          }
        />

        <PolicySection
          id="refund-cancellation"
          title="Cancellation policy"
          body={
            <>
              <p>
                Orders can be cancelled before they are shipped. Once the order is shipped,
                cancellation may not be possible.
              </p>
              <p className="mt-4">
                For prepaid orders cancelled before shipment, the refund will be processed to the
                original payment method within{" "}
                <span className="font-medium text-ink">5–7 working days</span>.
              </p>
            </>
          }
        />

        <PolicySection
          id="refund-shipping"
          title="Return shipping"
          body={
            <>
              <p>
                If the issue is due to our error, such as a wrong product or a verified damaged
                product, DiteUp may arrange a replacement or handle the issue at no extra cost.
              </p>
              <p className="mt-4">
                If an order is returned due to an incorrect address, customer refusal or repeated
                failed delivery attempts, shipping or return-to-origin charges may be deducted from
                any eligible refund.
              </p>
            </>
          }
        />

        <PolicySection
          id="refund-contact"
          title="Contact"
          body={
            <>
              <p>
                Returns, refunds &amp; cancellations:{" "}
                <a
                  href="mailto:info@diteup.com"
                  className="font-medium text-gold-deep underline decoration-gold-deep/40 underline-offset-2 hover:decoration-gold-deep"
                >
                  info@diteup.com
                </a>
              </p>
            </>
          }
        />
      </div>
    </article>
  );
}
