import type { Metadata } from "next";
import { PrivacyPolicyContent } from "@/components/legal/PrivacyPolicyContent";
import { SiteShell } from "@/components/layout/SiteShell";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How DiteUp collects, uses, stores and protects your information when you visit or shop from www.diteup.com.",
};

export default function PrivacyPage() {
  return (
    <SiteShell headerVariant="compact">
      <PrivacyPolicyContent />
    </SiteShell>
  );
}
