import type { Metadata } from "next";
import { PoliciesHubContent } from "@/components/legal/PoliciesHubContent";
import { SiteShell } from "@/components/layout/SiteShell";

export const metadata: Metadata = {
  title: "Policies · DiteUp",
  description:
    "DiteUp brand, product, and shopping policies — including shipping, returns, privacy, and terms.",
};

export default function PoliciesPage() {
  return (
    <SiteShell headerVariant="compact">
      <PoliciesHubContent />
    </SiteShell>
  );
}
