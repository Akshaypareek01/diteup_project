import Link from "next/link";
import { PolicySection } from "@/components/legal/PolicySection";

/**
 * Renders the full privacy policy body for the public `/privacy` route.
 * Operational details (processors, retention schedules) should be confirmed with counsel.
 */
export function PrivacyPolicyContent() {
  return (
    <article
      className="mx-auto max-w-[1080px] px-5 py-12"
      aria-labelledby="privacy-policy-title"
    >
      <header className="max-w-[66ch] border-b border-line pb-8">
        <h1
          id="privacy-policy-title"
          className="font-display text-balance text-display-lg font-semibold text-forest"
        >
          Privacy policy
        </h1>
        <p className="mt-4 text-body-sm text-ink-muted">
          Last updated: 17 May 2026 · Applies to visitors and customers of DiteUp (“we”, “us”) at
          our website and related services.
        </p>
        <p className="mt-4 text-body text-ink-soft">
          This policy describes how we collect, use, store, and share personal data. It is designed
          to align with the Digital Personal Data Protection Act, 2023 (India) and sensible global
          privacy practice. If anything here conflicts with an agreement you signed with us, that
          agreement prevails for that specific relationship.
        </p>
      </header>

      <div className="mx-auto max-w-[66ch]">
        <PolicySection
          id="privacy-who"
          title="Who we are"
          body={
            <>
              <p>
                DiteUp operates this storefront and related customer support channels. For privacy
                questions or requests, contact us at{" "}
                <a
                  href="mailto:hello@diteup.com"
                  className="font-medium text-gold-deep underline decoration-gold-deep/40 underline-offset-2 hover:decoration-gold-deep"
                >
                  hello@diteup.com
                </a>
                . You may also use our{" "}
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
          id="privacy-data"
          title="Personal data we collect"
          body={
            <>
              <p>Depending on how you use DiteUp, we may process categories such as:</p>
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  <span className="font-medium text-ink">Identity &amp; contact:</span> name,
                  email, phone number, and delivery address you provide at checkout or in your
                  account.
                </li>
                <li>
                  <span className="font-medium text-ink">Account &amp; orders:</span> login
                  identifiers, order history, preferences, and support messages.
                </li>
                <li>
                  <span className="font-medium text-ink">Payment-related data:</span> payments are
                  handled by certified payment partners; we typically receive limited transaction
                  metadata (e.g. status, last four digits where shown by the provider) — not your
                  full card number.
                </li>
                <li>
                  <span className="font-medium text-ink">Device &amp; usage:</span> IP address,
                  browser type, pages viewed, referring URLs, and approximate location derived from
                  technical logs.
                </li>
                <li>
                  <span className="font-medium text-ink">Cookies &amp; similar tech:</span> see the
                  section on cookies below.
                </li>
              </ul>
            </>
          }
        />

        <PolicySection
          id="privacy-use"
          title="How we use personal data"
          body={
            <>
              <p>We use personal data to:</p>
              <ul className="list-disc space-y-2 pl-5">
                <li>Provide, ship, and support your orders;</li>
                <li>Create and secure your account, and send transactional notices;</li>
                <li>Detect, prevent, and address fraud, abuse, or security issues;</li>
                <li>Improve our website, products, and customer experience (including analytics);</li>
                <li>Comply with law, respond to lawful requests, and enforce our terms;</li>
                <li>
                  Send marketing only where permitted — you can opt out of promotional
                  communications at any time.
                </li>
              </ul>
            </>
          }
        />

        <PolicySection
          id="privacy-basis"
          title="Legal bases (India)"
          body={
            <>
              <p>
                Where the DPDP Act applies, we rely on appropriate grounds such as your{" "}
                <span className="font-medium text-ink">consent</span> (e.g. marketing
                cookies, certain optional communications),{" "}
                <span className="font-medium text-ink">legitimate uses</span> consistent with the
                Act for providing services you request, and compliance with{" "}
                <span className="font-medium text-ink">legal obligations</span>.
              </p>
            </>
          }
        />

        <PolicySection
          id="privacy-share"
          title="Sharing & processors"
          body={
            <>
              <p>
                We do not sell your personal data. We share data with service providers who help us
                run DiteUp — for example hosting, email delivery, payments, logistics/carriers,
                customer support tools, and analytics/advertising platforms—under contracts that
                require appropriate protection and use only for our instructions.
              </p>
              <p>
                We may disclose information if required by law, to protect rights and safety, or as
                part of a merger or corporate transaction with notice where appropriate.
              </p>
            </>
          }
        />

        <PolicySection
          id="privacy-cookies"
          title="Cookies, Meta Pixel, and analytics"
          body={
            <>
              <p>
                We use essential cookies needed for security, cart/checkout, and basic site
                function. Where you accept non-essential cookies, we may use analytics or
                advertising technologies — including, when configured,{" "}
                <span className="font-medium text-ink">Meta Pixel</span> — to measure ad
                performance and site usage. You can control cookies through your browser; limiting
                cookies may affect certain features.
              </p>
            </>
          }
        />

        <PolicySection
          id="privacy-retention"
          title="Retention"
          body={
            <>
              <p>
                We keep personal data only as long as needed for the purposes above — for example,
                order records for fulfillment, accounting, and dispute windows; account data while
                your account is active; and marketing preferences until you withdraw consent. We
                delete or de-identify data when retention is no longer required, unless the law
                requires longer storage.
              </p>
            </>
          }
        />

        <PolicySection
          id="privacy-security"
          title="Security"
          body={
            <>
              <p>
                We use administrative, technical, and organizational measures appropriate to the
                risk. No online transmission is completely secure; please use a strong password and
                protect your account credentials.
              </p>
            </>
          }
        />

        <PolicySection
          id="privacy-rights"
          title="Your rights & grievances (India)"
          body={
            <>
              <p>
                Subject to applicable law, you may request access, correction, or erasure of your
                personal data, withdraw consent where processing is consent-based, nominate another
                individual where the Act allows, and seek information about our practices.
              </p>
              <p>
                You may file a grievance with our designated contact at{" "}
                <a
                  href="mailto:hello@diteup.com"
                  className="font-medium text-gold-deep underline decoration-gold-deep/40 underline-offset-2 hover:decoration-gold-deep"
                >
                  hello@diteup.com
                </a>
                . If you are not satisfied with our response, you may escalate to the Data
                Protection Board of India in accordance with the DPDP Act and rules framed
                thereunder.
              </p>
            </>
          }
        />

        <PolicySection
          id="privacy-children"
          title="Children"
          body={
            <>
              <p>
                Our services are directed to adults. We do not knowingly collect personal data from
                children without verifiable parental consent. If you believe we have collected a
                child’s data in error, contact us and we will take appropriate steps.
              </p>
            </>
          }
        />

        <PolicySection
          id="privacy-international"
          title="International transfers"
          body={
            <>
              <p>
                Our service providers may process data in India and other countries. Where data
                moves across borders, we use safeguards required by applicable law, such as
                contracts and organizational measures.
              </p>
            </>
          }
        />

        <PolicySection
          id="privacy-changes"
          title="Changes to this policy"
          body={
            <>
              <p>
                We may update this policy from time to time. We will post the revised version on
                this page and adjust the “Last updated” date. For material changes, we will provide
                additional notice or obtain consent where the law requires.
              </p>
            </>
          }
        />

        <PolicySection
          id="privacy-contact"
          title="Contact"
          body={
            <>
              <p>
                Privacy requests and questions:{" "}
                <a
                  href="mailto:hello@diteup.com"
                  className="font-medium text-gold-deep underline decoration-gold-deep/40 underline-offset-2 hover:decoration-gold-deep"
                >
                  hello@diteup.com
                </a>
                .
              </p>
            </>
          }
        />
      </div>
    </article>
  );
}
