/** Product FAQ row from catalog API. */
export type PublicProductFaq = {
  id?: string;
  question: string;
  answer: string;
  order?: number;
};

/** Admin Tab 12 SEO JSON stored on `Product.seo`. */
export type PublicProductSeo = {
  title?: string;
  description?: string;
  ogImage?: string;
  canonical?: string;
};

/** Public product payload from `GET /v1/products/*` (subset used by UI). */
export type PublicProductMedia = {
  id?: string;
  type?: string;
  url: string;
  altText?: string | null;
  order?: number;
};

export type PublicProductVariant = {
  id: string;
  sku: string;
  name: string;
  priceMrp: unknown;
  priceSale: unknown;
  isDefault: boolean;
  available: number;
};

export type PublicProduct = {
  id: string;
  slug: string;
  name: string;
  shortDesc?: string | null;
  description?: string | null;
  displayBadge?: string | null;
  buyable: boolean;
  allowBackorder?: boolean;
  preorderEnabled?: boolean;
  effectiveVisibility?: string;
  media: PublicProductMedia[];
  variants: PublicProductVariant[];
  reviewsEnabled?: boolean;
  codEnabled?: boolean;
  onlinePaymentEnabled?: boolean;
  seo?: PublicProductSeo | Record<string, unknown> | null;
  faqs?: PublicProductFaq[];
};

/** Sitemap row from `GET /v1/products/sitemap`. */
export type SitemapProductEntry = {
  slug: string;
  updatedAt: string;
};

export type CartPricingBreakdown = {
  currency: string;
  lines: Array<{
    variantId: string;
    productId: string;
    sku: string;
    variantName: string;
    quantity: number;
    unitPrice: number;
    lineSubtotal: number;
    gstRatePercent: number;
  }>;
  subtotal: number;
  discountOnSubtotal: number;
  shippingBeforeCoupon: number;
  shippingAfterCoupon: number;
  codCharge: number;
  total: number;
  coupon: { eligible?: boolean; message?: string; code?: string | null } | null;
};
