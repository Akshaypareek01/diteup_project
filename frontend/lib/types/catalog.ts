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
