/**
 * Admin HTTP handlers — dashboard + review moderation (PRD Phase 8).
 */
import type { Request, Response, NextFunction } from "express";

import { Unauthorized } from "../utils/errors.js";
import * as adminDashboard from "../services/adminDashboard.js";
import * as adminReviewModeration from "../services/adminReviewModeration.js";
import type { ListReviewsModerationQuery } from "../validators/admin.js";

/**
 * GET /v1/admin/dashboard/stats
 */
export async function getDashboardStats(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth) throw Unauthorized();
    const stats = await adminDashboard.getAdminDashboardStats();
    res.status(200).json(stats);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /v1/admin/reviews — moderation queue
 */
export async function getReviewsModeration(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth) throw Unauthorized();
    const q = req.query as unknown as ListReviewsModerationQuery;
    const result = await adminReviewModeration.listReviewsForModeration({
      filter: q.filter,
      page: q.page,
      pageSize: q.pageSize,
    });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /v1/admin/reviews/:id — approve / reject / feature / unfeature
 */
export async function patchModerateReview(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth) throw Unauthorized();
    const updated = await adminReviewModeration.moderateReview({
      reviewId: String(req.params.id),
      actorId: req.auth.userId,
      action: req.body.action,
      rejectReason: req.body.rejectReason,
      adminReply: req.body.adminReply,
      req,
    });
    res.status(200).json({ review: updated });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /v1/admin/reviews/:id/reply — admin public reply only
 */
export async function putReviewAdminReply(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth) throw Unauthorized();
    const updated = await adminReviewModeration.setReviewAdminReply({
      reviewId: String(req.params.id),
      actorId: req.auth.userId,
      body: req.body.body,
      req,
    });
    res.status(200).json({ review: updated });
  } catch (err) {
    next(err);
  }
}
