import type { Metadata } from "next";
import { TermsOfServiceContent } from "@/components/legal/TermsOfServiceContent";
import { SiteShell } from "@/components/layout/SiteShell";

export const metadata: Metadata = {
  title: "Terms of service · DiteUp",
  description:
    "Terms governing orders, payments, shipping, returns, and use of the DiteUp website and services.",
};

export default function TermsPage() {
  return (
    <SiteShell headerVariant="compact">
      <TermsOfServiceContent />
    </SiteShell>
  );
}
