import type { Metadata } from "next";
import { ShippingPolicyContent } from "@/components/legal/ShippingPolicyContent";
import { SiteShell } from "@/components/layout/SiteShell";

export const metadata: Metadata = {
  title: "Shipping policy · DiteUp",
  description:
    "DiteUp shipping coverage across India, processing times, free shipping thresholds, and delivery expectations.",
};

export default function ShippingPolicyPage() {
  return (
    <SiteShell headerVariant="compact">
      <ShippingPolicyContent />
    </SiteShell>
  );
}
