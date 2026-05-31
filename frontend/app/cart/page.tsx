import type { Metadata } from "next";
import { CartPageClient } from "@/components/cart/CartPageClient";
import { buildPrivatePageMetadata } from "@/lib/seo/private-metadata";

export const metadata: Metadata = buildPrivatePageMetadata("Your cart");

export default function CartPage() {
  return <CartPageClient />;
}
