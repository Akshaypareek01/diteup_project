import { CartPageClient } from "@/components/cart/CartPageClient";
import { fetchSiteMode } from "@/lib/storefront-api";

export default async function CartPage() {
  const siteMode = await fetchSiteMode();
  return <CartPageClient siteMode={siteMode} />;
}
