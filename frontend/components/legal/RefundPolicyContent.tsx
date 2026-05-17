import Link from "next/link";
import { PolicySection } from "@/components/legal/PolicySection";
import { RETURN_WINDOW_DAYS } from "@/lib/storefront-policy-constants";

/**
 * Refund and return policy for `/refund-policy` — align operational SLAs with support before launch.
 */
export function RefundPolicyContent() {
  return (
    <article
      className="mx-auto max-w-[1080px] px-5 py-12"
      aria-labelledby="refund-title"
    >
      <header className="max-w-[66ch] border-b border-line pb-8">
        <h1 id="refund-title" className="font-display text-balance text-display-lg font-semibold text-forest">
          Refund &amp; return policy
        </h1>
        <p className="mt-4 text-body-sm text-ink-muted">
          Last updated: 17 May 2026 · Applies to orders placed on the DiteUp website, subject to
          applicable consumer laws.
        </p>
        <p className="mt-4 text-body text-ink-soft">
          We want you to be confident in every order. This policy explains when you can return
          products, how refunds work, and situations that fall outside standard returns. For
          delivery questions, see our{" "}
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
          id="refund-window"
          title="Return window"
          body={
            <>
              <p>
                For eligible items (see below), you may request a return within{" "}
                <span className="font-medium text-ink">{RETURN_WINDOW_DAYS} calendar days</span> of
                confirmed delivery, or within {RETURN_WINDOW_DAYS} days of handover where delivery
                confirmation is not available —{" "}
                <span className="font-medium text-ink">whichever our carrier records support</span>
                . The window starts from the date shown on the tracking status as delivered.
              </p>
            </>
          }
        />

        <PolicySection
          id="refund-eligibility"
          title="Eligibility"
          body={
            <>
              <p>Returns are accepted when all of the following are true:</p>
              <ul className="list-disc space-y-2 pl-5">
                <li>The product is unused, unopened, and in original saleable condition;</li>
                <li>Original tags, seals, batch information, and packaging (inner and outer) are intact;</li>
                <li>You include proof of purchase (order number);</li>
                <li>The item is not in the non-returnable list below.</li>
              </ul>
              <p className="mt-4">
                Opened consumables (for food safety and quality) generally cannot be returned unless
                the product arrived damaged, defective, incorrect, or otherwise unusable through no
                fault of yours — tell us within 48 hours of delivery with photos where applicable.
              </p>
            </>
          }
        />

        <PolicySection
          id="refund-exclusions"
          title="Non-returnable & exceptions"
          body={
            <>
              <p>We cannot accept returns or refunds in cases including:</p>
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  Change of mind after opening or breaking hygiene / freshness seals on food or
                  ingestible products;
                </li>
                <li>Clearance, final sale, or gift-with-purchase items marked non-returnable;</li>
                <li>Damage caused after delivery (misuse, poor storage, or accidental spillage);</li>
                <li>
                  Address errors or failed delivery attempts due to incorrect contact or location
                  provided at checkout;
                </li>
                <li>
                  COD orders refused at the door (cash on delivery) without a valid dispute raised
                  with support in advance.
                </li>
              </ul>
            </>
          }
        />

        <PolicySection
          id="refund-howto"
          title="How to start a return"
          body={
            <>
              <p>
                Email{" "}
                <a
                  href="mailto:hello@diteup.com"
                  className="font-medium text-gold-deep underline decoration-gold-deep/40 underline-offset-2 hover:decoration-gold-deep"
                >
                  hello@diteup.com
                </a>{" "}
                or message us via the{" "}
                <Link
                  href="/contact"
                  className="font-medium text-gold-deep underline decoration-gold-deep/40 underline-offset-2 hover:decoration-gold-deep"
                >
                  contact page
                </Link>{" "}
                with your order number, item name, reason, and photos if the shipment arrived
                damaged or incorrect. We will confirm eligibility and share return instructions
                (including whether we arrange pickup or ask you to ship via a specified carrier).
              </p>
            </>
          }
        />

        <PolicySection
          id="refund-processing"
          title="Inspection & approvals"
          body={
            <>
              <p>
                Returned items are inspected on receipt. We may refuse a refund if the product fails
                eligibility checks (e.g. missing packaging, signs of use, or tampering). We will
                communicate the outcome by email.
              </p>
            </>
          }
        />

        <PolicySection
          id="refund-methods"
          title="Refunds & timing"
          body={
            <>
              <p>
                Approved refunds for prepaid orders are initiated to the original payment method
                where technically possible, otherwise to a bank account you provide for NEFT
                settlement. Refund timing depends on your bank or card issuer — typically{" "}
                <span className="font-medium text-ink">5–10 business days</span> after we process
                the refund from our side, but external delays can occur.
              </p>
              <p className="mt-4">
                For eligible COD returns where we already collected cash, we may issue a bank
                transfer or store credit after verification. Partial refunds may apply if only part
                of an order is returned or if promotional bundles require repricing.
              </p>
            </>
          }
        />

        <PolicySection
          id="refund-shipping-costs"
          title="Return shipping costs"
          body={
            <>
              <p>
                If we sent the wrong item or the product arrived damaged or defective, we will bear
                reasonable return shipping or arrange pickup. For change-of-mind returns that we
                approve at our discretion, you may be responsible for return courier charges unless
                stated otherwise in writing.
              </p>
            </>
          }
        />

        <PolicySection
          id="refund-store-credit"
          title="Store credit"
          body={
            <>
              <p>
                Where offered, store credit may be applied to future purchases and may carry an
                expiry — we will state the terms in the approval message.
              </p>
            </>
          }
        />

        <PolicySection
          id="refund-chargebacks"
          title="Chargebacks"
          body={
            <>
              <p>
                Please contact us before disputing a charge with your bank so we can resolve the
                issue. Unwarranted chargebacks may lead to account suspension.
              </p>
            </>
          }
        />

        <PolicySection
          id="refund-consumer-rights"
          title="Consumer rights"
          body={
            <>
              <p>
                Nothing in this policy limits statutory rights available to you under the Consumer
                Protection Act, 2019 or other applicable Indian law. If your jurisdiction requires a
                longer or mandatory remedy, that law prevails to the extent required.
              </p>
            </>
          }
        />

        <PolicySection
          id="refund-changes"
          title="Changes"
          body={
            <>
              <p>
                We may update this policy occasionally. The “Last updated” date reflects the latest
                version. Orders placed before a change are generally governed by the policy in force
                at purchase unless the law requires otherwise.
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
                Returns &amp; refunds:{" "}
                <a
                  href="mailto:hello@diteup.com"
                  className="font-medium text-gold-deep underline decoration-gold-deep/40 underline-offset-2 hover:decoration-gold-deep"
                >
                  hello@diteup.com
                </a>
              </p>
            </>
          }
        />
      </div>
    </article>
  );
}
