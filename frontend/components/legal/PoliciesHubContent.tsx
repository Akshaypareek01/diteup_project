import Link from "next/link";
import { PolicySection } from "@/components/legal/PolicySection";
import { FSSAI_LICENSE_NO } from "@/lib/brand-contact";
import { POLICY_DETAIL_LINKS } from "@/lib/policy-nav-links";

/**
 * Main policies overview for `/policies` — brand, product, and links to detailed policies.
 */
export function PoliciesHubContent() {
  return (
    <article className="mx-auto max-w-[1080px] px-5 py-12" aria-labelledby="policies-title">
      <header className="max-w-[66ch] border-b border-line pb-8">
        <h1
          id="policies-title"
          className="font-display text-balance text-display-lg font-semibold text-forest"
        >
          DiteUp policies
        </h1>
        <p className="mt-4 text-body-sm text-ink-muted">
          Applies to all purchases made through www.diteup.com.
        </p>
        <p className="mt-4 text-body text-ink-soft">
          Welcome to DiteUp. We aim to provide a clean, simple and transparent shopping experience
          for our customers. These policies apply to all purchases made through our website.
        </p>
        <nav className="mt-6" aria-label="Detailed policy pages">
          <ul className="flex flex-wrap gap-x-4 gap-y-2 font-sans text-body-sm">
            {POLICY_DETAIL_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="font-medium text-gold-deep underline decoration-gold-deep/40 underline-offset-2 hover:decoration-gold-deep"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <div className="mx-auto max-w-[66ch]">
        <PolicySection
          id="policies-brand"
          title="Brand & product information"
          body={
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <span className="font-medium text-ink">Brand name:</span> DiteUp
              </li>
              <li>
                <span className="font-medium text-ink">Product name:</span> DiteUp Energy Bite
              </li>
              <li>
                <span className="font-medium text-ink">Net weight:</span> 750g
              </li>
              <li>
                <span className="font-medium text-ink">Pack size:</span> 15 mini sachets × 50g
              </li>
              <li>
                <span className="font-medium text-ink">Food type:</span> Vegetarian
              </li>
              <li>
                <span className="font-medium text-ink">FSSAI lic. no.:</span> {FSSAI_LICENSE_NO}
              </li>
              <li>
                <span className="font-medium text-ink">MRP:</span> ₹1099
              </li>
              <li>
                <span className="font-medium text-ink">Selling price:</span> ₹799
              </li>
              <li>
                <span className="font-medium text-ink">Included:</span> 15 mini sachets, free bowl
                and spoon
              </li>
              <li>
                <span className="font-medium text-ink">Usage:</span> Soak at night and eat in the
                morning
              </li>
              <li>
                <span className="font-medium text-ink">Storage:</span> Store in a cool, dry place.
                Keep away from direct sunlight.
              </li>
            </ul>
          }
        />

        <PolicySection
          id="policies-ingredients"
          title="Ingredients"
          body={
            <p>
              DiteUp Energy Bite contains: Chana, Moong, Peanut, Cashew, Almond, Raisin, Pumpkin
              Seeds and Sunflower Seeds.
            </p>
          }
        />

        <PolicySection
          id="policies-allergy"
          title="Important allergy information"
          body={
            <p>
              This product contains peanuts, nuts and seeds. Customers with food allergies should
              read the ingredient list carefully before use.
            </p>
          }
        />

        <PolicySection
          id="policies-promise"
          title="Our promise"
          body={
            <>
              <p>We aim to provide:</p>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li>Clean and transparent product information</li>
                <li>Secure payments</li>
                <li>Free shipping on all orders</li>
                <li>Customer support for order-related issues</li>
                <li>Clear return, refund and replacement guidelines</li>
                <li>Safe and hygienic packing</li>
              </ul>
            </>
          }
        />

        <PolicySection
          id="policies-support"
          title="Customer support"
          body={
            <p>
              For any order, shipping, refund or product-related query, contact us at{" "}
              <a
                href="mailto:info@diteup.com"
                className="font-medium text-gold-deep underline decoration-gold-deep/40 underline-offset-2 hover:decoration-gold-deep"
              >
                info@diteup.com
              </a>
              .
            </p>
          }
        />

        <PolicySection
          id="policies-updates"
          title="Policy updates"
          body={
            <p>
              DiteUp may update these policies from time to time. The latest version will always be
              available on this website.
            </p>
          }
        />
      </div>
    </article>
  );
}
