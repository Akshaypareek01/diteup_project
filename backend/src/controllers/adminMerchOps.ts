/**
 * Admin HTTP — coupons, broadcasts, email, settings, audit, reports hub (Phase 8.7–8.12).
 */
import type { Request, Response, NextFunction } from "express";

import * as adminAuditLog from "../services/adminAuditLog.js";
import * as adminBroadcast from "../services/adminBroadcast.js";
import * as adminCoupons from "../services/adminCoupons.js";
import * as adminSettings from "../services/adminSettings.js";
import { Unauthorized } from "../utils/errors.js";
import type {
  AdminAuditListQueryInput,
  AdminBroadcastListQueryInput,
  AdminCouponListQueryInput,
  AdminEmailLogQueryInput,
} from "../validators/adminExpanded.js";

/**
 * GET /v1/admin/coupons
 */
export async function getAdminCoupons(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth) throw Unauthorized();
    const q = req.query as unknown as AdminCouponListQueryInput;
    const data = await adminCoupons.listCouponsAdmin({
      page: q.page,
      pageSize: q.pageSize,
      active: q.active,
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /v1/admin/coupons
 */
export async function postAdminCoupon(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth) throw Unauthorized();
    const row = await adminCoupons.createCouponAdmin({
      ...req.body,
      actorId: req.auth.userId,
      req,
    });
    res.status(201).json({ coupon: row });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /v1/admin/coupons/:id
 */
export async function getAdminCouponById(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth) throw Unauthorized();
    const data = await adminCoupons.getCouponAdmin(String(req.params.id));
    res.json(data);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /v1/admin/coupons/:id
 */
export async function patchAdminCoupon(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth) throw Unauthorized();
    await adminCoupons.updateCouponAdmin({
      couponId: String(req.params.id),
      actorId: req.auth.userId,
      data: req.body,
      req,
    });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

/**
 * GET /v1/admin/coupons/:id/analytics
 */
export async function getAdminCouponAnalytics(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth) throw Unauthorized();
    const data = await adminCoupons.couponAnalyticsAdmin(String(req.params.id));
    res.json(data);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /v1/admin/coupons/:id/redemptions/export
 */
export async function getAdminCouponRedemptionsExport(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth) throw Unauthorized();
    const buf = await adminCoupons.exportCouponRedemptionsXlsx(String(req.params.id));
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", 'attachment; filename="coupon-redemptions.xlsx"');
    res.send(buf);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /v1/admin/broadcasts
 */
export async function getAdminBroadcasts(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth) throw Unauthorized();
    const q = req.query as unknown as AdminBroadcastListQueryInput;
    const data = await adminBroadcast.listBroadcastsAdmin({
      page: q.page,
      pageSize: q.pageSize,
      status: q.status,
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /v1/admin/broadcasts
 */
export async function postAdminBroadcast(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth) throw Unauthorized();
    const row = await adminBroadcast.createBroadcastAdmin({
      subject: req.body.subject,
      bodyHtml: req.body.bodyHtml,
      segment: req.body.segment,
      scheduledAt: req.body.scheduledAt,
      actorId: req.auth.userId,
      req,
    });
    res.status(201).json({ broadcast: row });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /v1/admin/broadcasts/:id
 */
export async function getAdminBroadcastById(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth) throw Unauthorized();
    const row = await adminBroadcast.getBroadcastAdmin(String(req.params.id));
    res.json({ broadcast: row });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /v1/admin/broadcasts/:id
 */
export async function patchAdminBroadcast(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth) throw Unauthorized();
    await adminBroadcast.updateBroadcastAdmin({
      id: String(req.params.id),
      subject: req.body.subject,
      bodyHtml: req.body.bodyHtml,
      segment: req.body.segment,
      scheduledAt: req.body.scheduledAt,
      actorId: req.auth.userId,
      req,
    });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

/**
 * POST /v1/admin/broadcasts/:id/send
 */
export async function postAdminBroadcastSend(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth) throw Unauthorized();
    const result = await adminBroadcast.sendBroadcastNowAdmin({
      id: String(req.params.id),
      actorId: req.auth.userId,
      req,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /v1/admin/broadcasts/:id/preview
 */
export async function getAdminBroadcastPreview(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth) throw Unauthorized();
    const q = req.query as { sampleEmail?: string };
    const data = await adminBroadcast.previewBroadcastMergedAdmin({
      id: String(req.params.id),
      sampleEmail: q.sampleEmail,
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /v1/admin/broadcasts/:id/send-test
 */
export async function postAdminBroadcastSendTest(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth) throw Unauthorized();
    await adminBroadcast.sendBroadcastTestToAdmin({
      id: String(req.params.id),
      actorId: req.auth.userId,
      req,
    });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

/**
 * GET /v1/admin/email-logs
 */
export async function getAdminEmailLogs(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth) throw Unauthorized();
    const q = req.query as unknown as AdminEmailLogQueryInput;
    const data = await adminBroadcast.listEmailLogsAdmin({
      page: q.page,
      pageSize: q.pageSize,
      status: q.status,
      to: q.to,
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /v1/admin/email-suppressions
 */
export async function getAdminEmailSuppressions(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth) throw Unauthorized();
    const page = Math.max(1, Number(req.query.page ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize ?? 20)));
    const data = await adminBroadcast.listEmailSuppressionsAdmin({ page, pageSize });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /v1/admin/email-suppressions
 */
export async function postAdminEmailSuppression(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth) throw Unauthorized();
    await adminBroadcast.addEmailSuppressionAdmin({
      email: req.body.email,
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
 * DELETE /v1/admin/email-suppressions — body: { email }
 */
export async function deleteAdminEmailSuppression(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth) throw Unauthorized();
    await adminBroadcast.removeEmailSuppressionAdmin({
      email: req.body.email,
      actorId: req.auth.userId,
      req,
    });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

/**
 * GET /v1/admin/settings
 */
export async function getAdminSettings(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth) throw Unauthorized();
    const rows = await adminSettings.listSettingsAdmin();
    res.json({ settings: rows });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /v1/admin/settings/:key
 */
export async function getAdminSettingByKey(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth) throw Unauthorized();
    const data = await adminSettings.getSettingAdmin(decodeURIComponent(String(req.params.key)));
    res.json(data);
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /v1/admin/settings
 */
export async function putAdminSetting(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth) throw Unauthorized();
    await adminSettings.upsertSettingAdmin({
      key: req.body.key,
      value: req.body.value,
      actorId: req.auth.userId,
      req,
    });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

/**
 * GET /v1/admin/audit-log
 */
export async function getAdminAuditLog(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth) throw Unauthorized();
    const q = req.query as unknown as AdminAuditListQueryInput;
    const data = await adminAuditLog.listAuditLogsAdmin({
      page: q.page,
      pageSize: q.pageSize,
      actorId: q.actorId,
      entity: q.entity,
      entityId: q.entityId,
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /v1/admin/reports — hub metadata for exports implemented elsewhere.
 */
export async function getAdminReportsHub(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json({
      exports: [
        { id: "orders", method: "GET", path: "/v1/admin/orders/export" },
        { id: "payments", method: "GET", path: "/v1/admin/payments/export" },
        { id: "users", method: "GET", path: "/v1/admin/users/export" },
        { id: "inventory", method: "GET", path: "/v1/admin/inventory/export" },
        {
          id: "coupon_redemptions",
          method: "GET",
          path: "/v1/admin/coupons/:couponId/redemptions/export",
        },
      ],
    });
  } catch (err) {
    next(err);
  }
}
