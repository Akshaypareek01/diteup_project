import type { Metadata } from "next";
import { RefundPolicyContent } from "@/components/legal/RefundPolicyContent";
import { SiteShell } from "@/components/layout/SiteShell";

export const metadata: Metadata = {
  title: "Return & refund policy · DiteUp",
  description:
    "How DiteUp handles returns, refunds, replacements, and cancellations for orders placed on our website.",
};

export default function ReturnRefundPolicyPage() {
  return (
    <SiteShell headerVariant="compact">
      <RefundPolicyContent />
    </SiteShell>
  );
}
