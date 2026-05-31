import { CheckoutClient } from "@/components/checkout/CheckoutClient";
import { fetchSiteMode } from "@/lib/storefront-api";

export default async function CheckoutPage() {
  const siteMode = await fetchSiteMode();
  return <CheckoutClient siteMode={siteMode} />;
}
