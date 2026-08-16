/**
 * Maps settings UI sections to `Setting` row keys (see backend `settings.ts` / admin settings).
 */
export const SETTINGS_SECTION_KEYS: Record<string, string[]> = {
  meta: ["metaAds"],
  shipping: ["pincodePolicy"],
  shiprocket: ["shiprocket", "shiprocketSecret"],
  cod: ["checkout"],
  payments: [],
  email: [],
  general: [],
  gst: [],
  refunds: [],
  inventory: [],
  orders: [],
  seo: ["siteSeo"],
  banners: ["homepageBanners"],
  site: ["siteMode"],
  security: [],
};
