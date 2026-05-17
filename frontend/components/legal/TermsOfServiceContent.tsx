import Link from "next/link";
import { PolicySection } from "@/components/legal/PolicySection";
import { formatInr } from "@/lib/format-money";
import { FREE_SHIPPING_THRESHOLD_INR } from "@/lib/storefront-policy-constants";

/**
 * Full terms of service body for `/terms` — counsel should review before production reliance.
 */
export function TermsOfServiceContent() {
  return (
    <article
      className="mx-auto max-w-[1080px] px-5 py-12"
      aria-labelledby="terms-title"
    >
      <header className="max-w-[66ch] border-b border-line pb-8">
        <h1 id="terms-title" className="font-display text-balance text-display-lg font-semibold text-forest">
          Terms of service
        </h1>
        <p className="mt-4 text-body-sm text-ink-muted">
          Last updated: 17 May 2026 · Governs your access to and use of DiteUp’s website, checkout,
          and related customer services (collectively, the “Services”).
        </p>
        <p className="mt-4 text-body text-ink-soft">
          By placing an order, creating an account, or browsing our site, you agree to these Terms
          and our{" "}
          <Link
            href="/privacy"
            className="font-medium text-gold-deep underline decoration-gold-deep/40 underline-offset-2 hover:decoration-gold-deep"
          >
            Privacy policy
          </Link>
          . If you do not agree, please do not use the Services.
        </p>
      </header>

      <div className="mx-auto max-w-[66ch]">
        <PolicySection
          id="terms-definitions"
          title="Definitions"
          body={
            <>
              <p>
                <span className="font-medium text-ink">“DiteUp”</span>,{" "}
                <span className="font-medium text-ink">“we”</span>,{" "}
                <span className="font-medium text-ink">“us”</span> or{" "}
                <span className="font-medium text-ink">“our”</span> refers to the operator of this
                storefront. <span className="font-medium text-ink">“You”</span> means the visitor or
                customer using the Services.
              </p>
            </>
          }
        />

        <PolicySection
          id="terms-eligibility"
          title="Eligibility & accounts"
          body={
            <>
              <p>
                You represent that you are at least 18 years old and capable of entering a binding
                contract under applicable law. You are responsible for safeguarding your account
                credentials and for activity under your account. Notify us promptly at{" "}
                <a
                  href="mailto:hello@diteup.com"
                  className="font-medium text-gold-deep underline decoration-gold-deep/40 underline-offset-2 hover:decoration-gold-deep"
                >
                  hello@diteup.com
                </a>{" "}
                if you suspect unauthorized access.
              </p>
            </>
          }
        />

        <PolicySection
          id="terms-products"
          title="Products, descriptions & availability"
          body={
            <>
              <p>
                We strive to describe products accurately (including ingredients, usage, and imagery).
                Slight variation in colour, texture, or packaging may occur between batches or
                screens. We may limit quantities, refuse orders, or cancel orders where we believe
                there is fraud, stock unavailability, pricing error, or legal restriction.
              </p>
            </>
          }
        />

        <PolicySection
          id="terms-orders"
          title="Orders, pricing & taxes"
          body={
            <>
              <p>
                Product prices are shown in Indian Rupees (INR) unless stated otherwise. Applicable
                taxes and shipping appear at checkout. We may adjust prices; changes apply to future
                orders after we publish them. An order is an offer to purchase — we accept it when we
                confirm shipment or send an order confirmation, subject to payment authorization.
              </p>
            </>
          }
        />

        <PolicySection
          id="terms-payment"
          title="Payment"
          body={
            <>
              <p>
                Payment options shown at checkout (including cash on delivery where offered) are
                provided by you and our payment / logistics partners under their terms. You agree to
                pay all charges for accepted orders. Failed payments, chargebacks, or COD refusals
                may result in cancelled shipments, account restrictions, or recovery of costs where
                permitted by law.
              </p>
            </>
          }
        />

        <PolicySection
          id="terms-shipping-refunds"
          title="Shipping, delivery & returns"
          body={
            <>
              <p>
                Shipping, delivery timelines, free-shipping on qualifying orders (currently cart
                subtotal {formatInr(FREE_SHIPPING_THRESHOLD_INR)} and above, subject to change — see{" "}
                <Link
                  href="/shipping-policy"
                  className="font-medium text-gold-deep underline decoration-gold-deep/40 underline-offset-2 hover:decoration-gold-deep"
                >
                  Shipping policy
                </Link>
                ), and returns are explained in our{" "}
                <Link
                  href="/shipping-policy"
                  className="font-medium text-gold-deep underline decoration-gold-deep/40 underline-offset-2 hover:decoration-gold-deep"
                >
                  Shipping policy
                </Link>{" "}
                and{" "}
                <Link
                  href="/refund-policy"
                  className="font-medium text-gold-deep underline decoration-gold-deep/40 underline-offset-2 hover:decoration-gold-deep"
                >
                  Refund policy
                </Link>
                , which are incorporated into these Terms by reference.
              </p>
            </>
          }
        />

        <PolicySection
          id="terms-risk"
          title="Risk of loss"
          body={
            <>
              <p>
                Risk of loss and title for physical goods pass to you upon delivery to the carrier,
                except where applicable law requires otherwise.
              </p>
            </>
          }
        />

        <PolicySection
          id="terms-promotions"
          title="Coupons & promotions"
          body={
            <>
              <p>
                Promotional codes, bundles, or limited offers may have additional rules shown at the
                point of sale. We may void promotions that appear to be abused, duplicated, or used
                in breach of stated limits.
              </p>
            </>
          }
        />

        <PolicySection
          id="terms-ip"
          title="Intellectual property"
          body={
            <>
              <p>
                All content on the Services — text, graphics, logos, photographs, packaging design,
                and software — is owned by DiteUp or our licensors and protected by copyright,
                trademark, and other intellectual property laws. You may not copy, scrape, resell, or
                exploit our content or trademarks without prior written permission.
              </p>
            </>
          }
        />

        <PolicySection
          id="terms-acceptable-use"
          title="Acceptable use"
          body={
            <>
              <p>You agree not to:</p>
              <ul className="list-disc space-y-2 pl-5">
                <li>Interfere with or disrupt the Services or underlying systems;</li>
                <li>Attempt unauthorized access to accounts, data, or infrastructure;</li>
                <li>Use the Services for fraud, harassment, or unlawful activity;</li>
                <li>Circumvent security, rate limits, or geographic restrictions we apply.</li>
              </ul>
            </>
          }
        />

        <PolicySection
          id="terms-wellness"
          title="Wellness & non-medical disclaimer"
          body={
            <>
              <p>
                Our products are foods or consumer wellness items for general use unless labelled
                otherwise. They are <span className="font-medium text-ink">not</span> intended to
                diagnose, treat, cure, or prevent any disease. Consult a qualified professional for
                medical or dietary advice, especially if pregnant, nursing, or managing a health
                condition.
              </p>
            </>
          }
        />

        <PolicySection
          id="terms-warranty"
          title="Disclaimer of warranties"
          body={
            <>
              <p>
                To the fullest extent permitted by law, the Services and products are provided{" "}
                <span className="font-medium text-ink">“as is”</span> and{" "}
                <span className="font-medium text-ink">“as available”</span> without warranties of
                any kind, whether express or implied, including merchantability, fitness for a
                particular purpose, or non-infringement. Some jurisdictions do not allow certain
                disclaimers; in those cases our warranties are limited to the minimum permitted.
              </p>
            </>
          }
        />

        <PolicySection
          id="terms-liability"
          title="Limitation of liability"
          body={
            <>
              <p>
                To the fullest extent permitted by law, DiteUp and our directors, employees, and
                partners will not be liable for indirect, incidental, special, consequential, or
                punitive damages, or loss of profits, goodwill, or data. Our aggregate liability for
                claims arising from the Services or products will not exceed the amount you paid to
                DiteUp for the specific order giving rise to the claim during the three (3) months
                before the event, except where law prohibits such a cap (including consumer rights
                that cannot be waived in India).
              </p>
            </>
          }
        />

        <PolicySection
          id="terms-indemnity"
          title="Indemnity"
          body={
            <>
              <p>
                You will defend and indemnify DiteUp against third-party claims, damages, and costs
                arising from your misuse of the Services, violation of these Terms, or violation of
                third-party rights, to the extent permitted by law.
              </p>
            </>
          }
        />

        <PolicySection
          id="terms-law"
          title="Governing law & disputes"
          body={
            <>
              <p>
                These Terms are governed by the laws of India. Subject to mandatory consumer
                protection provisions, courts at Bengaluru, Karnataka shall have exclusive
                jurisdiction over disputes — replace this venue clause after confirming your
                registered legal entity and counsel’s advice.
              </p>
            </>
          }
        />

        <PolicySection
          id="terms-changes"
          title="Changes"
          body={
            <>
              <p>
                We may modify these Terms from time to time by posting an updated version on this
                page and revising the “Last updated” date. Continued use after changes constitutes
                acceptance unless applicable law requires additional consent.
              </p>
            </>
          }
        />

        <PolicySection
          id="terms-contact"
          title="Contact"
          body={
            <>
              <p>
                Questions about these Terms:{" "}
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
