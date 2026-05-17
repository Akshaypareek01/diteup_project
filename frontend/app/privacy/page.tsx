import type { Metadata } from "next";
import { PrivacyPolicyContent } from "@/components/legal/PrivacyPolicyContent";
import { SiteShell } from "@/components/layout/SiteShell";

export const metadata: Metadata = {
  title: "Privacy policy · DiteUp",
  description:
    "How DiteUp collects, uses, and protects personal data — including cookies, orders, and your rights under Indian privacy law.",
};

export default function PrivacyPage() {
  return (
    <SiteShell headerVariant="compact">
      <PrivacyPolicyContent />
    </SiteShell>
  );
}
