import type { Metadata } from "next";
import { ContactMailForm } from "@/components/contact/ContactMailForm";
import { SiteShell } from "@/components/layout/SiteShell";
import { buildSharedSocialMetadata } from "@/lib/seo/defaults";

export const metadata: Metadata = {
  title: "Contact DiteUp",
  description:
    "Contact DiteUp for orders, product questions, FSSAI compliance, and customer support. Email info@diteup.com.",
  ...buildSharedSocialMetadata({
    title: "Contact DiteUp",
    description:
      "Contact DiteUp for orders, product questions, FSSAI compliance, and customer support.",
    path: "/contact",
  }),
};

export default function ContactPage() {
  return (
    <SiteShell headerVariant="compact">
      <div className="mx-auto max-w-[680px] px-5 py-12">
        <h1 className="font-display text-display-lg font-semibold text-forest">Contact</h1>
        <p className="mt-2 text-body text-ink-soft">FSSAI / support — same details as the site footer.</p>
        <ContactMailForm />
      </div>
    </SiteShell>
  );
}
