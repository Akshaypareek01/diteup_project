import type { Metadata } from "next";
import { TermsOfServiceContent } from "@/components/legal/TermsOfServiceContent";
import { SiteShell } from "@/components/layout/SiteShell";

export const metadata: Metadata = {
  title: "Terms & Conditions · DiteUp",
  description:
    "Terms & Conditions for www.diteup.com: product details, orders, payments, shipping, returns, and use of the DiteUp website.",
};

export default function TermsPage() {
  return (
    <SiteShell headerVariant="compact">
      <TermsOfServiceContent />
    </SiteShell>
  );
}
