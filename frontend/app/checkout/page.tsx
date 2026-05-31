import type { Metadata } from "next";
import { CheckoutClient } from "@/components/checkout/CheckoutClient";
import { buildPrivatePageMetadata } from "@/lib/seo/private-metadata";

export const metadata: Metadata = buildPrivatePageMetadata("Checkout");

export default function CheckoutPage() {
  return <CheckoutClient />;
}
