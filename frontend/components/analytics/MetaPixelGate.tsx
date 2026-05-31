import { MetaPixel } from "@/components/analytics/MetaPixel";
import { fetchMetaPixelId } from "@/lib/storefront-api";

/**
 * Server wrapper — resolves Meta Pixel ID from admin settings (fallback env).
 */
export async function MetaPixelGate() {
  const pixelId = await fetchMetaPixelId();
  return <MetaPixel pixelId={pixelId} />;
}
