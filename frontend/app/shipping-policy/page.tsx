import type { Metadata } from "next";
import { ShippingPolicyContent } from "@/components/legal/ShippingPolicyContent";
import { SiteShell } from "@/components/layout/SiteShell";

export const metadata: Metadata = {
  title: "Shipping Policy · DiteUp",
  description:
    "DiteUp Shipping Policy: order processing, delivery times, free shipping, tracking, and damaged package handling.",
};

export default function ShippingPolicyPage() {
  return (
    <SiteShell headerVariant="compact">
      <ShippingPolicyContent />
    </SiteShell>
  );
}
