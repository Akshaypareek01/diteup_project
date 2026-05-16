/**
 * Zod schemas for `/v1/admin/*` routes (Phase 8).
 */
import { z } from "zod";

export const AdminPaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const ReviewModerationFilterSchema = z.enum(["pending", "approved", "flagged", "all"]);

export const ListReviewsModerationQuerySchema = AdminPaginationQuerySchema.extend({
  filter: ReviewModerationFilterSchema.default("pending"),
});
export type ListReviewsModerationQuery = z.infer<typeof ListReviewsModerationQuerySchema>;

export const AdminReviewIdParamSchema = z.object({
  id: z.string().min(10),
});

export const ModerateReviewBodySchema = z.object({
  action: z.enum(["approve", "reject", "feature", "unfeature"]),
  rejectReason: z.string().max(2000).optional().nullable(),
  adminReply: z.string().max(4000).optional().nullable(),
});

export const SetReviewAdminReplyBodySchema = z.object({
  body: z.string().trim().min(1).max(4000),
});
