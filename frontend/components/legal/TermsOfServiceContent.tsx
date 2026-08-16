import Link from "next/link";
import { PolicySection } from "@/components/legal/PolicySection";
import { FSSAI_LICENSE_NO, SUPPORT_EMAIL } from "@/lib/brand-contact";

/**
 * Terms & Conditions body for `/terms-conditions`.
 * Content mirrors the client's authoritative policy document.
 */
export function TermsOfServiceContent() {
  return (
    <article
      className="mx-auto max-w-[1080px] px-5 py-12"
      aria-labelledby="terms-title"
    >
      <header className="max-w-[66ch] border-b border-line pb-8">
        <h1
          id="terms-title"
          className="font-display text-balance text-display-lg font-semibold text-forest"
        >
          Terms &amp; Conditions
        </h1>
        <p className="mt-4 text-body-sm text-ink-muted">
          Last updated: 16 August 2026 · Governs your use of www.diteup.com and your purchase of
          products from our website.
        </p>
        <p className="mt-4 text-body text-ink-soft">Welcome to DiteUp.</p>
        <p className="mt-4 text-body text-ink-soft">
          These Terms &amp; Conditions govern your use of www.diteup.com and your purchase of
          products from our website.
        </p>
        <p className="mt-4 text-body text-ink-soft">
          By using this website or placing an order, you agree to these Terms &amp; Conditions.
        </p>
      </header>

      <div className="mx-auto max-w-[66ch]">
        <PolicySection
          id="terms-business"
          title="Business Information"
          body={
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <span className="font-medium text-ink">Brand Name:</span> DiteUp
              </li>
              <li>
                <span className="font-medium text-ink">Product Name:</span> DiteUp Energy Bite
              </li>
              <li>
                <span className="font-medium text-ink">Website:</span> www.diteup.com
              </li>
              <li>
                <span className="font-medium text-ink">Contact Email:</span>{" "}
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="font-medium text-gold-deep underline decoration-gold-deep/40 underline-offset-2 hover:decoration-gold-deep"
                >
                  {SUPPORT_EMAIL}
                </a>
              </li>
              <li>
                <span className="font-medium text-ink">FSSAI Lic. No.:</span> {FSSAI_LICENSE_NO}
              </li>
            </ul>
          }
        />

        <PolicySection
          id="terms-product-info"
          title="Product Information"
          body={
            <>
              <p>
                We make reasonable efforts to display product details accurately, including product
                name, ingredients, net weight, price, usage instructions and storage instructions.
              </p>
              <p>
                However, product packaging, design, images, color and presentation may slightly vary
                from website images due to photography, screen display, packaging updates or
                manufacturing changes.
              </p>
            </>
          }
        />

        <PolicySection
          id="terms-product-details"
          title="Product Details"
          body={
            <>
              <p>
                DiteUp Energy Bite is a vegetarian food product made with chana, moong, peanut,
                cashew, almond, raisin, pumpkin seeds and sunflower seeds.
              </p>
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  <span className="font-medium text-ink">Net Weight:</span> 750g
                </li>
                <li>
                  <span className="font-medium text-ink">Pack Size:</span> 15 mini sachets × 50g
                </li>
                <li>
                  <span className="font-medium text-ink">Usage:</span> Soak at night and eat in the
                  morning.
                </li>
                <li>
                  <span className="font-medium text-ink">Storage:</span> Store in a cool, dry place.
                  Keep away from direct sunlight.
                </li>
              </ul>
            </>
          }
        />

        <PolicySection
          id="terms-allergy"
          title="Allergy Disclaimer"
          body={
            <>
              <p>This product contains peanuts, nuts, seeds.</p>
              <p>
                Customers with allergies, food sensitivities or dietary restrictions should read the
                ingredient list carefully before purchasing or consuming the product.
              </p>
              <p>
                DiteUp is not responsible for allergic reactions caused by ingredients clearly
                mentioned on the product label or website.
              </p>
            </>
          }
        />

        <PolicySection
          id="terms-health"
          title="Health Disclaimer"
          body={
            <>
              <p>DiteUp Energy Bite is a food product and not a medicine.</p>
              <p>It is not intended to diagnose, treat, cure or prevent any disease.</p>
              <p>
                Individual results may vary depending on diet, lifestyle, health condition and
                usage.
              </p>
              <p>
                If you have any medical condition, allergy, pregnancy-related concern or specific
                dietary restriction, please consult a qualified healthcare professional before use.
              </p>
            </>
          }
        />

        <PolicySection
          id="terms-pricing"
          title="Pricing"
          body={
            <>
              <p>All prices listed on the website are in Indian Rupees.</p>
              <p>Current product pricing:</p>
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  <span className="font-medium text-ink">MRP:</span> ₹1099
                </li>
                <li>
                  <span className="font-medium text-ink">Selling Price:</span> ₹799
                </li>
              </ul>
              <p>Prices, offers, discounts and availability may change without prior notice.</p>
              <p>The final price shown at checkout will apply to your order.</p>
            </>
          }
        />

        <PolicySection
          id="terms-orders"
          title="Orders"
          body={
            <>
              <p>
                After placing an order, you may receive an order confirmation by email, SMS or
                WhatsApp.
              </p>
              <p>We reserve the right to cancel or refuse an order in cases such as:</p>
              <ul className="list-disc space-y-2 pl-5">
                <li>Payment failure</li>
                <li>Incorrect pricing</li>
                <li>Stock unavailability</li>
                <li>Incomplete address</li>
                <li>Suspicious or fraudulent order</li>
                <li>Misuse of offer or coupon</li>
                <li>Serviceability issue at delivery pin code</li>
              </ul>
              <p>
                If a prepaid order is cancelled by us, the eligible refund will be processed to the
                original payment method.
              </p>
            </>
          }
        />

        <PolicySection
          id="terms-payments"
          title="Payments"
          body={
            <>
              <p>
                We may accept payment methods shown at checkout, including UPI, cards, net banking,
                wallets or other payment options supported by our payment partner.
              </p>
              <p>
                Payment processing is handled by third-party payment gateway providers. DiteUp does
                not store full card, UPI PIN or bank login details.
              </p>
            </>
          }
        />

        <PolicySection
          id="terms-shipping"
          title="Shipping"
          body={
            <>
              <p>
                Shipping timelines, delivery availability, delays and related details are governed
                by our{" "}
                <Link
                  href="/shipping-policy"
                  className="font-medium text-gold-deep underline decoration-gold-deep/40 underline-offset-2 hover:decoration-gold-deep"
                >
                  Shipping Policy
                </Link>
                .
              </p>
              <p>
                Please ensure that the shipping address and contact number entered at checkout are
                correct.
              </p>
            </>
          }
        />

        <PolicySection
          id="terms-returns"
          title="Return, Refund and Cancellation"
          body={
            <>
              <p>
                Return, refund and cancellation requests are governed by our{" "}
                <Link
                  href="/return-refund-policy"
                  className="font-medium text-gold-deep underline decoration-gold-deep/40 underline-offset-2 hover:decoration-gold-deep"
                >
                  Return &amp; Refund Policy
                </Link>
                .
              </p>
              <p>
                Due to the nature of food products, returns are not accepted once the product is
                opened, used or consumed.
              </p>
            </>
          }
        />

        <PolicySection
          id="terms-offers"
          title="Offers and Discounts"
          body={
            <>
              <p>Any offer, discount or coupon is valid only for the period mentioned.</p>
              <p>
                DiteUp reserves the right to modify, withdraw or cancel any offer without prior
                notice.
              </p>
              <p>Offers may not be combined unless clearly stated.</p>
            </>
          }
        />

        <PolicySection
          id="terms-content"
          title="Website Content"
          body={
            <>
              <p>
                All website content, including logos, product images, graphics, designs, text,
                banners, icons, product packaging visuals and brand elements, belongs to DiteUp or
                its authorized owners.
              </p>
              <p>
                You may not copy, reproduce, modify, distribute or use any content from this website
                without written permission.
              </p>
            </>
          }
        />

        <PolicySection
          id="terms-conduct"
          title="User Conduct"
          body={
            <p>
              You agree not to misuse the website, attempt unauthorized access, place fraudulent
              orders, upload harmful code, copy website content or use the website for unlawful
              purposes.
            </p>
          }
        />

        <PolicySection
          id="terms-liability"
          title="Limitation of Liability"
          body={
            <>
              <p>
                DiteUp is not liable for indirect, incidental or consequential losses arising from
                use of the website or product, except where required by applicable law.
              </p>
              <p>
                Our responsibility for any valid claim is limited to the value of the product
                purchased by the customer.
              </p>
            </>
          }
        />

        <PolicySection
          id="terms-force-majeure"
          title="Force Majeure"
          body={
            <p>
              DiteUp will not be responsible for delays or failure to perform obligations due to
              events beyond our reasonable control, including natural disasters, strikes, courier
              disruption, lockdowns, government restrictions, technical failures or other unexpected
              events.
            </p>
          }
        />

        <PolicySection
          id="terms-changes"
          title="Changes to Terms"
          body={
            <>
              <p>
                We may update these Terms &amp; Conditions from time to time. The updated version
                will be posted on this website.
              </p>
              <p>
                Continued use of the website after updates means you accept the revised terms.
              </p>
            </>
          }
        />

        <PolicySection
          id="terms-law"
          title="Governing Law"
          body={
            <p>These Terms &amp; Conditions are governed by the laws of India.</p>
          }
        />

        <PolicySection
          id="terms-contact"
          title="Contact Us"
          body={
            <p>
              For any questions, contact:
              <br />
              Email:{" "}
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="font-medium text-gold-deep underline decoration-gold-deep/40 underline-offset-2 hover:decoration-gold-deep"
              >
                {SUPPORT_EMAIL}
              </a>
              .
            </p>
          }
        />
      </div>
    </article>
  );
}
