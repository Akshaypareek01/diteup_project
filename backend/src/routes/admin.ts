/**
 * Admin routes — `/v1/admin/*` (PRD Phase 8).
 */
import express from "express";
import { Router } from "express";

import * as adminController from "../controllers/admin.js";
import * as adminFulfillment from "../controllers/adminFulfillment.js";
import * as adminCatalog from "../controllers/adminMerchCatalog.js";
import * as adminOps from "../controllers/adminMerchOps.js";
import { authRequired, roleRequired } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  AdminReviewIdParamSchema,
  ListReviewsModerationQuerySchema,
  ModerateReviewBodySchema,
  SetReviewAdminReplyBodySchema,
} from "../validators/admin.js";
import {
  AdminAuditListQuerySchema,
  AdminBroadcastCreateBodySchema,
  AdminBroadcastListQuerySchema,
  AdminBroadcastPreviewQuerySchema,
  AdminBroadcastUpdateBodySchema,
  AdminBulkVisibilityBodySchema,
  AdminCouponCreateBodySchema,
  AdminCouponListQuerySchema,
  AdminCouponUpdateBodySchema,
  AdminEmailLogQuerySchema,
  AdminIdParamSchema,
  AdminInventoryAdjustBodySchema,
  AdminInventoryListQuerySchema,
  AdminLedgerQuerySchema,
  AdminMediaIdParamSchema,
  AdminOrderBulkStatusBodySchema,
  AdminOrderExportQuerySchema,
  AdminOrderListQuerySchema,
  AdminOrderRefundBodySchema,
  AdminOrderStatusBodySchema,
  AdminPaymentExportQuerySchema,
  AdminPaymentListQuerySchema,
  AdminPaymentRefundBodySchema,
  AdminProductCreateBodySchema,
  AdminProductListQuerySchema,
  AdminProductMediaBodySchema,
  AdminProductUpdateBodySchema,
  AdminReconcileQuerySchema,
  AdminSettingKeyParamSchema,
  AdminSettingUpsertBodySchema,
  AdminStockNotifyListQuerySchema,
  AdminSuppressionBodySchema,
  AdminSuppressionDeleteBodySchema,
  AdminUserListQuerySchema,
  AdminUserUpdateBodySchema,
  AdminVariantUpsertBodySchema,
} from "../validators/adminExpanded.js";

const router = Router();
const adminOnly = [authRequired, roleRequired("ADMIN")];

/** XLSX uploads — raw body; place only on import routes. */
const rawXlsx = express.raw({ limit: "15mb", type: () => true });

// ---- Dashboard + reviews (existing) ----
router.get("/admin/dashboard/stats", ...adminOnly, adminController.getDashboardStats);

router.get(
  "/admin/reviews",
  ...adminOnly,
  validate({ query: ListReviewsModerationQuerySchema }),
  adminController.getReviewsModeration,
);

router.patch(
  "/admin/reviews/:id",
  ...adminOnly,
  validate({ params: AdminReviewIdParamSchema, body: ModerateReviewBodySchema }),
  adminController.patchModerateReview,
);

router.put(
  "/admin/reviews/:id/reply",
  ...adminOnly,
  validate({ params: AdminReviewIdParamSchema, body: SetReviewAdminReplyBodySchema }),
  adminController.putReviewAdminReply,
);

// ---- Reports hub ----
router.get("/admin/reports", ...adminOnly, adminOps.getAdminReportsHub);

// ---- Audit ----
router.get(
  "/admin/audit-log",
  ...adminOnly,
  validate({ query: AdminAuditListQuerySchema }),
  adminOps.getAdminAuditLog,
);

// ---- Settings ----
router.get("/admin/settings", ...adminOnly, adminOps.getAdminSettings);

router.get(
  "/admin/settings/:key",
  ...adminOnly,
  validate({ params: AdminSettingKeyParamSchema }),
  adminOps.getAdminSettingByKey,
);

router.put(
  "/admin/settings",
  ...adminOnly,
  validate({ body: AdminSettingUpsertBodySchema }),
  adminOps.putAdminSetting,
);

// ---- Email suppressions + logs + broadcasts ----
router.get(
  "/admin/email-logs",
  ...adminOnly,
  validate({ query: AdminEmailLogQuerySchema }),
  adminOps.getAdminEmailLogs,
);

router.get("/admin/email-suppressions", ...adminOnly, adminOps.getAdminEmailSuppressions);

router.post(
  "/admin/email-suppressions",
  ...adminOnly,
  validate({ body: AdminSuppressionBodySchema }),
  adminOps.postAdminEmailSuppression,
);

router.delete(
  "/admin/email-suppressions",
  ...adminOnly,
  validate({ body: AdminSuppressionDeleteBodySchema }),
  adminOps.deleteAdminEmailSuppression,
);

router.get(
  "/admin/broadcasts",
  ...adminOnly,
  validate({ query: AdminBroadcastListQuerySchema }),
  adminOps.getAdminBroadcasts,
);

router.post(
  "/admin/broadcasts",
  ...adminOnly,
  validate({ body: AdminBroadcastCreateBodySchema }),
  adminOps.postAdminBroadcast,
);

router.get(
  "/admin/broadcasts/:id",
  ...adminOnly,
  validate({ params: AdminIdParamSchema }),
  adminOps.getAdminBroadcastById,
);

router.patch(
  "/admin/broadcasts/:id",
  ...adminOnly,
  validate({ params: AdminIdParamSchema, body: AdminBroadcastUpdateBodySchema }),
  adminOps.patchAdminBroadcast,
);

router.get(
  "/admin/broadcasts/:id/preview",
  ...adminOnly,
  validate({ params: AdminIdParamSchema, query: AdminBroadcastPreviewQuerySchema }),
  adminOps.getAdminBroadcastPreview,
);

router.post(
  "/admin/broadcasts/:id/send-test",
  ...adminOnly,
  validate({ params: AdminIdParamSchema }),
  adminOps.postAdminBroadcastSendTest,
);

router.post(
  "/admin/broadcasts/:id/send",
  ...adminOnly,
  validate({ params: AdminIdParamSchema }),
  adminOps.postAdminBroadcastSend,
);

// ---- Coupons ----
router.get(
  "/admin/coupons",
  ...adminOnly,
  validate({ query: AdminCouponListQuerySchema }),
  adminOps.getAdminCoupons,
);

router.post(
  "/admin/coupons",
  ...adminOnly,
  validate({ body: AdminCouponCreateBodySchema }),
  adminOps.postAdminCoupon,
);

router.get(
  "/admin/coupons/:id/redemptions/export",
  ...adminOnly,
  validate({ params: AdminIdParamSchema }),
  adminOps.getAdminCouponRedemptionsExport,
);

router.get(
  "/admin/coupons/:id/analytics",
  ...adminOnly,
  validate({ params: AdminIdParamSchema }),
  adminOps.getAdminCouponAnalytics,
);

router.get(
  "/admin/coupons/:id",
  ...adminOnly,
  validate({ params: AdminIdParamSchema }),
  adminOps.getAdminCouponById,
);

router.patch(
  "/admin/coupons/:id",
  ...adminOnly,
  validate({ params: AdminIdParamSchema, body: AdminCouponUpdateBodySchema }),
  adminOps.patchAdminCoupon,
);

// ---- Products ----
router.post(
  "/admin/products/bulk-visibility",
  ...adminOnly,
  validate({ body: AdminBulkVisibilityBodySchema }),
  adminCatalog.postAdminProductsBulkVisibility,
);

router.delete(
  "/admin/products/media/:mediaId",
  ...adminOnly,
  validate({ params: AdminMediaIdParamSchema }),
  adminCatalog.deleteAdminProductMedia,
);

router.get(
  "/admin/products",
  ...adminOnly,
  validate({ query: AdminProductListQuerySchema }),
  adminCatalog.getAdminProducts,
);

router.post(
  "/admin/products",
  ...adminOnly,
  validate({ body: AdminProductCreateBodySchema }),
  adminCatalog.postAdminProduct,
);

router.get(
  "/admin/products/:id",
  ...adminOnly,
  validate({ params: AdminIdParamSchema }),
  adminCatalog.getAdminProductById,
);

router.patch(
  "/admin/products/:id",
  ...adminOnly,
  validate({ params: AdminIdParamSchema, body: AdminProductUpdateBodySchema }),
  adminCatalog.patchAdminProduct,
);

router.post(
  "/admin/products/:id/archive",
  ...adminOnly,
  validate({ params: AdminIdParamSchema }),
  adminCatalog.postAdminProductArchive,
);

router.post(
  "/admin/products/:id/variants",
  ...adminOnly,
  validate({ params: AdminIdParamSchema, body: AdminVariantUpsertBodySchema }),
  adminCatalog.postAdminProductVariant,
);

router.post(
  "/admin/products/:id/media",
  ...adminOnly,
  validate({ params: AdminIdParamSchema, body: AdminProductMediaBodySchema }),
  adminCatalog.postAdminProductMedia,
);

// ---- Users ----
router.get(
  "/admin/users/export",
  ...adminOnly,
  validate({ query: AdminUserListQuerySchema }),
  adminCatalog.getAdminUsersExport,
);

router.get(
  "/admin/users",
  ...adminOnly,
  validate({ query: AdminUserListQuerySchema }),
  adminCatalog.getAdminUsers,
);

router.get(
  "/admin/users/:id",
  ...adminOnly,
  validate({ params: AdminIdParamSchema }),
  adminCatalog.getAdminUserById,
);

router.patch(
  "/admin/users/:id",
  ...adminOnly,
  validate({ params: AdminIdParamSchema, body: AdminUserUpdateBodySchema }),
  adminCatalog.patchAdminUser,
);

router.post(
  "/admin/users/:id/force-logout",
  ...adminOnly,
  validate({ params: AdminIdParamSchema }),
  adminCatalog.postAdminUserForceLogout,
);

router.post(
  "/admin/users/:id/anonymize",
  ...adminOnly,
  validate({ params: AdminIdParamSchema }),
  adminCatalog.postAdminUserAnonymize,
);

// ---- Stock notifications ----
router.post(
  "/admin/variants/:id/notify-back-in-stock",
  ...adminOnly,
  validate({ params: AdminIdParamSchema }),
  adminFulfillment.postAdminBackInStockNotify,
);

router.get(
  "/admin/stock-notifications",
  ...adminOnly,
  validate({ query: AdminStockNotifyListQuerySchema }),
  adminFulfillment.getAdminStockNotifications,
);

// ---- Inventory ----
router.get(
  "/admin/inventory/export",
  ...adminOnly,
  adminFulfillment.getAdminInventoryExport,
);

router.post(
  "/admin/inventory/import",
  ...adminOnly,
  rawXlsx,
  adminFulfillment.postAdminInventoryImport,
);

router.get(
  "/admin/inventory",
  ...adminOnly,
  validate({ query: AdminInventoryListQuerySchema }),
  adminFulfillment.getAdminInventory,
);

router.post(
  "/admin/inventory/:id/adjust",
  ...adminOnly,
  validate({ params: AdminIdParamSchema, body: AdminInventoryAdjustBodySchema }),
  adminFulfillment.postAdminInventoryAdjust,
);

router.get(
  "/admin/inventory/:id/ledger",
  ...adminOnly,
  validate({ params: AdminIdParamSchema, query: AdminLedgerQuerySchema }),
  adminFulfillment.getAdminInventoryLedger,
);

// ---- Payments ----
router.get(
  "/admin/payments/reconciliation/summary",
  ...adminOnly,
  validate({ query: AdminReconcileQuerySchema }),
  adminFulfillment.getAdminPaymentReconciliation,
);

router.get(
  "/admin/payments/export",
  ...adminOnly,
  validate({ query: AdminPaymentExportQuerySchema }),
  adminFulfillment.getAdminPaymentsExport,
);

router.get(
  "/admin/payments",
  ...adminOnly,
  validate({ query: AdminPaymentListQuerySchema }),
  adminFulfillment.getAdminPayments,
);

router.get(
  "/admin/payments/:id",
  ...adminOnly,
  validate({ params: AdminIdParamSchema }),
  adminFulfillment.getAdminPaymentById,
);

router.post(
  "/admin/payments/:id/refund",
  ...adminOnly,
  validate({ params: AdminIdParamSchema, body: AdminPaymentRefundBodySchema }),
  adminFulfillment.postAdminPaymentRefund,
);

// ---- Orders ----
router.get(
  "/admin/orders/export",
  ...adminOnly,
  validate({ query: AdminOrderExportQuerySchema }),
  adminFulfillment.getAdminOrdersExport,
);

router.post(
  "/admin/orders/import",
  ...adminOnly,
  rawXlsx,
  adminFulfillment.postAdminOrdersImport,
);

router.post(
  "/admin/orders/bulk-status",
  ...adminOnly,
  validate({ body: AdminOrderBulkStatusBodySchema }),
  adminFulfillment.postAdminOrdersBulkStatus,
);

router.get(
  "/admin/orders",
  ...adminOnly,
  validate({ query: AdminOrderListQuerySchema }),
  adminFulfillment.getAdminOrders,
);

router.get(
  "/admin/orders/:id",
  ...adminOnly,
  validate({ params: AdminIdParamSchema }),
  adminFulfillment.getAdminOrderById,
);

router.patch(
  "/admin/orders/:id/status",
  ...adminOnly,
  validate({ params: AdminIdParamSchema, body: AdminOrderStatusBodySchema }),
  adminFulfillment.patchAdminOrderStatus,
);

router.post(
  "/admin/orders/:id/refund",
  ...adminOnly,
  validate({ params: AdminIdParamSchema, body: AdminOrderRefundBodySchema }),
  adminFulfillment.postAdminOrderRefund,
);

export default router;
