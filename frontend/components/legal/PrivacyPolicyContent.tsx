import { PolicySection } from "@/components/legal/PolicySection";
import { SUPPORT_EMAIL } from "@/lib/brand-contact";

/**
 * Renders the full privacy policy body for the public `/privacy-policy` route.
 * Copy matches the client-provided Privacy Policy document.
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
          Privacy Policy
        </h1>
        <p className="mt-4 text-body text-ink-soft">
          At DiteUp, your privacy is important to us. This Privacy Policy explains how we collect,
          use, store and protect your information when you visit or shop from www.diteup.com.
        </p>
        <p className="mt-4 text-body text-ink-soft">
          By using our website, you agree to the practices described in this policy.
        </p>
      </header>

      <div className="mx-auto max-w-[66ch]">
        <PolicySection
          id="privacy-collect"
          title="Information We Collect"
          body={
            <>
              <p>
                We may collect the following information when you visit our website, place an order
                or contact us:
              </p>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li>Name</li>
                <li>Phone number</li>
                <li>Email address</li>
                <li>Shipping address</li>
                <li>Billing address</li>
                <li>Order details</li>
                <li>Payment status</li>
                <li>Customer support messages</li>
                <li>Website usage information</li>
                <li>Device, browser and IP-related information</li>
                <li>Marketing preferences, if you opt in</li>
              </ul>
            </>
          }
        />

        <PolicySection
          id="privacy-use"
          title="How We Use Your Information"
          body={
            <>
              <p>We use your information to:</p>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li>Process your order</li>
                <li>Deliver your product</li>
                <li>Send order updates</li>
                <li>Provide customer support</li>
                <li>Handle returns, refunds and complaints</li>
                <li>Improve our website and services</li>
                <li>Send promotional offers, only if you opt in</li>
                <li>Prevent fraud, misuse or unauthorized transactions</li>
                <li>Comply with legal and regulatory requirements</li>
              </ul>
            </>
          }
        />

        <PolicySection
          id="privacy-payment"
          title="Payment Information"
          body={
            <>
              <p>
                We do not store your full card details, UPI PIN, net banking password or sensitive
                banking information.
              </p>
              <p>Payments are processed through secure third-party payment gateway partners.</p>
            </>
          }
        />

        <PolicySection
          id="privacy-share"
          title="Sharing of Information"
          body={
            <>
              <p>We may share limited necessary information with:</p>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li>Courier partners</li>
                <li>Payment gateway providers</li>
                <li>Website hosting or technology service providers</li>
                <li>Customer support tools</li>
                <li>Legal, tax or regulatory authorities when required</li>
                <li>Marketing or communication tools, only when needed</li>
                <li>
                  Advertising measurement platforms, currently Meta — see{" "}
                  <a href="#privacy-cookies" className="underline underline-offset-2">
                    Cookies and Tracking
                  </a>
                </li>
              </ul>
              <p>We do not sell your personal information to advertisers.</p>
            </>
          }
        />

        <PolicySection
          id="privacy-cookies"
          title="Cookies and Tracking"
          body={
            <>
              <p>
                We use two kinds of cookies and similar technologies. Essential ones keep your
                cart, checkout and sign-in working, and cannot be switched off. Analytics and
                advertising ones — including the Meta (Facebook) Pixel — help us understand how the
                site is used and measure whether our advertising is working.
              </p>
              <p>
                Analytics and advertising cookies only load after you accept them in the cookie
                banner shown on your first visit. If you choose “Essential only”, the Meta Pixel
                stays switched off in your browser.
              </p>
              <p>
                Separately, when you complete an order we send details of that order to Meta
                through its Conversions API, so we can measure which advertising leads to sales.
                This happens for every completed order, whatever you chose in the cookie banner,
                because it relates to a transaction you asked us to carry out. What we send is the
                order number and value, your email address and phone number in hashed (one-way
                encrypted) form, your IP address, your browser’s user-agent string, and any Meta
                advertising identifiers already present in your browser. Hashing means we never
                send your raw email address or phone number; Meta compares the hashed values
                against its own records to match the order to an advert.
              </p>
              <p>
                Your cookie choice is stored in your browser for this site. To change it, clear the
                site data for diteup.com in your browser settings and the banner will appear
                again on your next visit. You can also block cookies entirely through your browser,
                though some parts of the site may then stop working.
              </p>
            </>
          }
        />

        <PolicySection
          id="privacy-security"
          title="Data Security"
          body={
            <>
              <p>
                We take reasonable steps to protect your personal information from unauthorized
                access, loss, misuse or disclosure.
              </p>
              <p>
                However, no online system is completely secure, so we cannot guarantee absolute
                security of data transmitted over the internet.
              </p>
            </>
          }
        />

        <PolicySection
          id="privacy-retention"
          title="Data Retention"
          body={
            <p>
              We keep your personal information only for as long as necessary for order processing,
              customer support, legal compliance, tax records, fraud prevention and business
              purposes.
            </p>
          }
        />

        <PolicySection
          id="privacy-rights"
          title="Your Rights"
          body={
            <>
              <p>You may contact us to:</p>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li>Update your personal information</li>
                <li>Request correction of incorrect details</li>
                <li>Request deletion of your information, where legally possible</li>
                <li>Opt out of marketing communication</li>
                <li>Ask questions about how your data is used</li>
              </ul>
              <p>
                Some information may need to be retained for legal, tax, accounting or
                dispute-resolution purposes.
              </p>
            </>
          }
        />

        <PolicySection
          id="privacy-third-party"
          title="Third-Party Links"
          body={
            <p>
              Our website may contain links to third-party websites, payment gateways, courier
              tracking pages or social media platforms. We are not responsible for the privacy
              practices of those third-party websites.
            </p>
          }
        />

        <PolicySection
          id="privacy-contact"
          title="Contact Us"
          body={
            <p>
              For privacy-related questions, contact:
              <br />
              Email:{" "}
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="font-medium text-gold-deep underline decoration-gold-deep/40 underline-offset-2 hover:decoration-gold-deep"
              >
                {SUPPORT_EMAIL}
              </a>
            </p>
          }
        />
      </div>
    </article>
  );
}
