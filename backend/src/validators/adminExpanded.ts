/**
 * Zod schemas for extended `/v1/admin/*` routes (Phase 8.2–8.13).
 */
import { z } from "zod";

import { AdminPaginationQuerySchema } from "./admin.js";

const OrderStatusZ = z.enum([
  "PLACED",
  "CONFIRMED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
  "REFUNDED",
]);

const PaymentStatusZ = z.enum([
  "PENDING",
  "AUTHORIZED",
  "CAPTURED",
  "FAILED",
  "REFUNDED",
  "PARTIALLY_REFUNDED",
]);

const RoleZ = z.enum(["CUSTOMER", "ADMIN"]);

const ProductVisibilityZ = z.enum([
  "DRAFT",
  "PUBLISHED",
  "HIDDEN",
  "COMING_SOON",
  "OUT_OF_STOCK",
  "UNDER_MAINTENANCE",
  "ARCHIVED",
]);

const ProductBadgeZ = z.enum([
  "NEW",
  "BESTSELLER",
  "LIMITED",
  "SALE",
  "BACK_IN_STOCK",
]).nullable();

const MediaTypeZ = z.enum(["IMAGE", "VIDEO"]);

const CouponTypeZ = z.enum(["FLAT", "PERCENT", "FREE_SHIPPING"]);

const StockReasonZ = z.enum([
  "MANUAL_ADD",
  "MANUAL_DEDUCT",
  "ORDER_RESERVE",
  "ORDER_CONFIRM",
  "ORDER_CANCEL",
  "ORDER_REFUND",
  "IMPORT",
  "INITIAL",
]);

const EmailStatusZ = z.enum(["DRAFT", "SCHEDULED", "SENDING", "SENT", "FAILED"]);

export const AdminIdParamSchema = z.object({
  id: z.string().min(10),
});

export const AdminMediaIdParamSchema = z.object({
  mediaId: z.string().min(10),
});

export const AdminOrderListQuerySchema = AdminPaginationQuerySchema.extend({
  status: OrderStatusZ.optional(),
  q: z.string().optional(),
  placedFrom: z.coerce.date().optional(),
  placedTo: z.coerce.date().optional(),
});

export const AdminOrderExportQuerySchema = z.object({
  status: OrderStatusZ.optional(),
  q: z.string().optional(),
  placedFrom: z.coerce.date().optional(),
  placedTo: z.coerce.date().optional(),
});

export const AdminOrderStatusBodySchema = z.object({
  status: OrderStatusZ,
  awbNumber: z.string().max(120).optional().nullable(),
  shippingCarrier: z.string().max(120).optional().nullable(),
  notes: z.string().max(4000).optional().nullable(),
});

export const AdminOrderBulkStatusBodySchema = z.object({
  orderIds: z.array(z.string().min(10)).min(1).max(200),
  status: OrderStatusZ,
});

export const AdminOrderRefundBodySchema = z.object({
  reason: z.string().max(2000).optional().nullable(),
});

export const AdminPaymentListQuerySchema = AdminPaginationQuerySchema.extend({
  status: PaymentStatusZ.optional(),
  orderId: z.string().min(10).optional(),
  q: z.string().optional(),
  createdFrom: z.coerce.date().optional(),
  createdTo: z.coerce.date().optional(),
});

export const AdminPaymentRefundBodySchema = z.object({
  amountInr: z.number().positive().optional().nullable(),
  reason: z.string().max(2000).optional().nullable(),
});

export const AdminReconcileQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(90).default(14),
});

export const AdminUserListQuerySchema = AdminPaginationQuerySchema.extend({
  role: RoleZ.optional(),
  isActive: z.coerce.boolean().optional(),
  q: z.string().optional(),
});

export const AdminUserUpdateBodySchema = z.object({
  restrictions: z.record(z.string(), z.unknown()).optional().nullable(),
  tags: z.array(z.string()).optional(),
  adminNotes: z.string().max(4000).optional().nullable(),
  isActive: z.boolean().optional(),
  deactivationReason: z.string().max(2000).optional().nullable(),
});

export const AdminProductListQuerySchema = AdminPaginationQuerySchema.extend({
  visibility: ProductVisibilityZ.optional(),
  q: z.string().optional(),
});

export const AdminProductCreateBodySchema = z.object({
  slug: z.string().min(1).max(200),
  name: z.string().min(1).max(200),
  description: z.string().min(1).max(8000),
  sku: z.string().min(1).max(80),
  variantName: z.string().min(1).max(200),
  priceMrp: z.coerce.number().nonnegative(),
  priceSale: z.coerce.number().nonnegative(),
  visibility: ProductVisibilityZ.optional(),
});

export const AdminProductUpdateBodySchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(8000).optional(),
  shortDesc: z.string().max(500).optional().nullable(),
  slug: z.string().min(1).max(200).optional(),
  visibility: ProductVisibilityZ.optional(),
  visibilityNote: z.string().max(2000).optional().nullable(),
  availableFrom: z.coerce.date().optional().nullable(),
  availableUntil: z.coerce.date().optional().nullable(),
  isFeatured: z.boolean().optional(),
  isRefundable: z.boolean().optional(),
  refundWindowDays: z.coerce.number().int().min(0).max(365).optional().nullable(),
  codEnabled: z.boolean().optional(),
  onlinePaymentEnabled: z.boolean().optional(),
  allowBackorder: z.boolean().optional(),
  showStockCount: z.boolean().optional(),
  reviewsEnabled: z.boolean().optional(),
  displayBadge: ProductBadgeZ.optional(),
  hsnCode: z.string().max(32).optional().nullable(),
  gstRate: z.coerce.number().min(0).max(100).optional(),
  seo: z.record(z.string(), z.unknown()).optional().nullable(),
});

export const AdminBulkVisibilityBodySchema = z.object({
  productIds: z.array(z.string().min(10)).min(1).max(300),
  visibility: ProductVisibilityZ,
});

export const AdminVariantUpsertBodySchema = z.object({
  variantId: z.string().min(10).optional().nullable(),
  sku: z.string().min(1).max(80),
  name: z.string().min(1).max(200),
  priceMrp: z.coerce.number().nonnegative(),
  priceSale: z.coerce.number().nonnegative(),
  weightGm: z.coerce.number().int().positive().optional().nullable(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const AdminProductMediaBodySchema = z.object({
  type: MediaTypeZ,
  url: z.string().url(),
  altText: z.string().max(200).optional().nullable(),
  order: z.coerce.number().int().min(0).optional(),
});

export const AdminInventoryListQuerySchema = AdminPaginationQuerySchema.extend({
  lowStockOnly: z.coerce.boolean().optional(),
  q: z.string().optional(),
});

export const AdminInventoryAdjustBodySchema = z.object({
  delta: z.coerce.number().int(),
  reason: StockReasonZ,
  note: z.string().max(500).optional().nullable(),
});

export const AdminLedgerQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(500).default(100),
});

export const AdminCouponListQuerySchema = AdminPaginationQuerySchema.extend({
  active: z.coerce.boolean().optional(),
});

export const AdminCouponCreateBodySchema = z.object({
  code: z.string().min(2).max(40),
  type: CouponTypeZ,
  value: z.coerce.number().nonnegative(),
  description: z.string().max(2000).optional().nullable(),
  minOrder: z.coerce.number().nonnegative().optional().nullable(),
  maxDiscount: z.coerce.number().nonnegative().optional().nullable(),
  usageLimit: z.coerce.number().int().positive().optional().nullable(),
  perUserLimit: z.coerce.number().int().positive().optional().nullable(),
  firstOrderOnly: z.boolean().optional(),
  appliesToCOD: z.boolean().optional(),
  startsAt: z.coerce.date().optional().nullable(),
  endsAt: z.coerce.date().optional().nullable(),
  isActive: z.boolean().optional(),
  source: z.string().max(200).optional().nullable(),
});

export const AdminCouponUpdateBodySchema = z.object({
  description: z.string().max(2000).optional().nullable(),
  type: CouponTypeZ.optional(),
  value: z.coerce.number().nonnegative().optional(),
  minOrder: z.coerce.number().nonnegative().optional().nullable(),
  maxDiscount: z.coerce.number().nonnegative().optional().nullable(),
  usageLimit: z.coerce.number().int().positive().optional().nullable(),
  perUserLimit: z.coerce.number().int().positive().optional().nullable(),
  firstOrderOnly: z.boolean().optional(),
  appliesToCOD: z.boolean().optional(),
  startsAt: z.coerce.date().optional().nullable(),
  endsAt: z.coerce.date().optional().nullable(),
  isActive: z.boolean().optional(),
  source: z.string().max(200).optional().nullable(),
});

const BroadcastSegmentSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("MARKETING_OPT_IN") }),
  z.object({
    type: z.literal("TAGS"),
    tags: z.array(z.string().min(1)).min(1).max(20),
  }),
  z.object({
    type: z.literal("EMAILS"),
    emails: z.array(z.string().email()).min(1).max(500),
  }),
  z.object({ type: z.literal("PAST_30D_BUYERS") }),
]);

export const AdminBroadcastPreviewQuerySchema = z.object({
  sampleEmail: z.string().email().optional(),
});

export const AdminBroadcastCreateBodySchema = z.object({
  subject: z.string().min(1).max(200),
  bodyHtml: z.string().min(1).max(200_000),
  segment: BroadcastSegmentSchema,
  scheduledAt: z.coerce.date().optional().nullable(),
});

export const AdminBroadcastUpdateBodySchema = z.object({
  subject: z.string().min(1).max(200).optional(),
  bodyHtml: z.string().min(1).max(200_000).optional(),
  segment: BroadcastSegmentSchema.optional(),
  scheduledAt: z.coerce.date().optional().nullable(),
});

export const AdminBroadcastListQuerySchema = AdminPaginationQuerySchema.extend({
  status: EmailStatusZ.optional(),
});

export const AdminEmailLogQuerySchema = AdminPaginationQuerySchema.extend({
  status: z.string().optional(),
  to: z.string().optional(),
});

export const AdminSuppressionBodySchema = z.object({
  email: z.string().email(),
  reason: z.string().min(1).max(500),
});

export const AdminSuppressionDeleteBodySchema = z.object({
  email: z.string().email(),
});

export const AdminSettingKeyParamSchema = z.object({
  key: z.string().min(1).max(120),
});

export const AdminSettingUpsertBodySchema = z.object({
  key: z.string().min(1).max(120),
  value: z.unknown(),
});

export const AdminAuditListQuerySchema = AdminPaginationQuerySchema.extend({
  actorId: z.string().min(10).optional(),
  entity: z.string().min(1).max(80).optional(),
  entityId: z.string().optional(),
});

export const AdminStockNotifyListQuerySchema = AdminPaginationQuerySchema.extend({
  variantId: z.string().min(10).optional(),
  pendingOnly: z.coerce.boolean().optional(),
});

export type AdminOrderListQueryInput = z.infer<typeof AdminOrderListQuerySchema>;
export type AdminPaymentListQueryInput = z.infer<typeof AdminPaymentListQuerySchema>;
export type AdminUserListQueryInput = z.infer<typeof AdminUserListQuerySchema>;
export type AdminProductListQueryInput = z.infer<typeof AdminProductListQuerySchema>;
export type AdminInventoryListQueryInput = z.infer<typeof AdminInventoryListQuerySchema>;
export type AdminCouponListQueryInput = z.infer<typeof AdminCouponListQuerySchema>;
export type AdminBroadcastListQueryInput = z.infer<typeof AdminBroadcastListQuerySchema>;
export type AdminEmailLogQueryInput = z.infer<typeof AdminEmailLogQuerySchema>;
export type AdminAuditListQueryInput = z.infer<typeof AdminAuditListQuerySchema>;
export type AdminStockNotifyListQueryInput = z.infer<typeof AdminStockNotifyListQuerySchema>;
