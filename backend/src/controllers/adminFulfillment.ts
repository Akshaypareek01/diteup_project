/**
 * Admin HTTP — orders, payments, inventory, stock notifications (Phase 8.2–8.6, 8.13).
 */
import type { Request, Response, NextFunction } from "express";

import * as adminInventory from "../services/adminInventory.js";
import * as adminOrders from "../services/adminOrders.js";
import * as adminPayments from "../services/adminPayments.js";
import * as adminStockNotifications from "../services/adminStockNotifications.js";
import { Unauthorized } from "../utils/errors.js";
import type {
  AdminInventoryListQueryInput,
  AdminOrderListQueryInput,
  AdminPaymentListQueryInput,
  AdminStockNotifyListQueryInput,
} from "../validators/adminExpanded.js";

/**
 * GET /v1/admin/orders
 */
export async function getAdminOrders(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth) throw Unauthorized();
    const q = req.query as unknown as AdminOrderListQueryInput;
    const data = await adminOrders.listOrdersAdmin({
      page: q.page,
      pageSize: q.pageSize,
      status: q.status,
      q: q.q,
      placedFrom: q.placedFrom,
      placedTo: q.placedTo,
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /v1/admin/orders/export — XLSX download
 */
export async function getAdminOrdersExport(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth) throw Unauthorized();
    const q = req.query as unknown as Omit<AdminOrderListQueryInput, "page" | "pageSize">;
    const buf = await adminOrders.exportOrdersXlsx({
      status: q.status,
      q: q.q,
      placedFrom: q.placedFrom,
      placedTo: q.placedTo,
    });
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", 'attachment; filename="orders.xlsx"');
    res.send(buf);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /v1/admin/orders/:id
 */
export async function getAdminOrderById(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth) throw Unauthorized();
    const data = await adminOrders.getOrderAdminById(String(req.params.id));
    res.json(data);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /v1/admin/orders/:id/status
 */
export async function patchAdminOrderStatus(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth) throw Unauthorized();
    await adminOrders.updateOrderStatusAdmin({
      orderId: String(req.params.id),
      status: req.body.status,
      actorId: req.auth.userId,
      awbNumber: req.body.awbNumber,
      shippingCarrier: req.body.shippingCarrier,
      notes: req.body.notes,
      req,
    });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

/**
 * POST /v1/admin/orders/bulk-status
 */
export async function postAdminOrdersBulkStatus(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth) throw Unauthorized();
    const result = await adminOrders.bulkUpdateOrderStatusAdmin({
      orderIds: req.body.orderIds,
      status: req.body.status,
      actorId: req.auth.userId,
      req,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /v1/admin/orders/:id/refund
 */
export async function postAdminOrderRefund(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth) throw Unauthorized();
    await adminOrders.refundOrderAdmin({
      orderId: String(req.params.id),
      actorId: req.auth.userId,
      reason: req.body.reason,
      req,
    });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

/**
 * POST /v1/admin/orders/import — raw XLSX body
 */
export async function postAdminOrdersImport(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth) throw Unauthorized();
    const buf = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body ?? "");
    const result = await adminOrders.importOrdersStatusXlsx({
      buffer: buf,
      actorId: req.auth.userId,
      req,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /v1/admin/payments
 */
export async function getAdminPayments(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth) throw Unauthorized();
    const q = req.query as unknown as AdminPaymentListQueryInput;
    const data = await adminPayments.listPaymentsAdmin({
      page: q.page,
      pageSize: q.pageSize,
      status: q.status,
      orderId: q.orderId,
      q: q.q,
      createdFrom: q.createdFrom,
      createdTo: q.createdTo,
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /v1/admin/payments/:id
 */
export async function getAdminPaymentById(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth) throw Unauthorized();
    const data = await adminPayments.getPaymentAdmin(String(req.params.id));
    res.json(data);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /v1/admin/payments/:id/refund
 */
export async function postAdminPaymentRefund(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth) throw Unauthorized();
    await adminPayments.manualRefundPaymentAdmin({
      paymentId: String(req.params.id),
      amountInr: req.body.amountInr,
      reason: req.body.reason,
      actorId: req.auth.userId,
      req,
    });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

/**
 * GET /v1/admin/payments/reconciliation/summary
 */
export async function getAdminPaymentReconciliation(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth) throw Unauthorized();
    const days = Number(req.query.days ?? 14);
    const data = await adminPayments.paymentReconciliationSummary(Number.isFinite(days) ? days : 14);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /v1/admin/inventory
 */
export async function getAdminInventory(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth) throw Unauthorized();
    const q = req.query as unknown as AdminInventoryListQueryInput;
    const data = await adminInventory.listInventoryAdmin({
      page: q.page,
      pageSize: q.pageSize,
      lowStockOnly: q.lowStockOnly,
      q: q.q,
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /v1/admin/inventory/:id/adjust
 */
export async function postAdminInventoryAdjust(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth) throw Unauthorized();
    await adminInventory.adjustInventoryAdmin({
      inventoryId: String(req.params.id),
      delta: req.body.delta,
      reason: req.body.reason,
      note: req.body.note,
      actorId: req.auth.userId,
      req,
    });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

/**
 * GET /v1/admin/inventory/:id/ledger
 */
export async function getAdminInventoryLedger(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth) throw Unauthorized();
    const limit = req.query.limit != null ? Number(req.query.limit) : 100;
    const data = await adminInventory.listStockLedgerAdmin(
      String(req.params.id),
      Number.isFinite(limit) ? limit : 100,
    );
    res.json(data);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /v1/admin/inventory/export
 */
export async function getAdminInventoryExport(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth) throw Unauthorized();
    const buf = await adminInventory.exportInventoryXlsx();
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", 'attachment; filename="inventory.xlsx"');
    res.send(buf);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /v1/admin/inventory/import
 */
export async function postAdminInventoryImport(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth) throw Unauthorized();
    const buf = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body ?? "");
    const result = await adminInventory.importInventoryAdjustmentsXlsx({
      buffer: buf,
      actorId: req.auth.userId,
      req,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /v1/admin/stock-notifications
 */
export async function getAdminStockNotifications(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth) throw Unauthorized();
    const q = req.query as unknown as AdminStockNotifyListQueryInput;
    const data = await adminStockNotifications.listStockNotificationsAdmin({
      page: q.page,
      pageSize: q.pageSize,
      variantId: q.variantId,
      pendingOnly: q.pendingOnly,
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /v1/admin/variants/:id/notify-back-in-stock
 */
export async function postAdminBackInStockNotify(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth) throw Unauthorized();
    const result = await adminStockNotifications.triggerBackInStockNotifyAdmin({
      variantId: String(req.params.id),
      actorId: req.auth.userId,
      req,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}
