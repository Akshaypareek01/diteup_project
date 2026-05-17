import type { Metadata } from "next";
import { RefundPolicyContent } from "@/components/legal/RefundPolicyContent";
import { SiteShell } from "@/components/layout/SiteShell";

export const metadata: Metadata = {
  title: "Refund & return policy · DiteUp",
  description:
    "How DiteUp handles returns, refunds, and exchanges for orders placed on our website.",
};

export default function RefundPolicyPage() {
  return (
    <SiteShell headerVariant="compact">
      <RefundPolicyContent />
    </SiteShell>
  );
}
