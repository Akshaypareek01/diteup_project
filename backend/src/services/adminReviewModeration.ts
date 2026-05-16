/**
 * Admin review moderation — PRD §6.7.3, §7.9.5.
 */
import type { Prisma } from "@prisma/client";
import { prisma } from "../utils/prisma.js";
import { NotFound, ValidationError } from "../utils/errors.js";
import { recordAudit } from "../utils/adminAudit.js";
import { sendEmail } from "./email.js";
import { reviewLiveEmail } from "../emails/templates.js";
import type { Request } from "express";

export type ReviewModerationFilter = "pending" | "approved" | "flagged" | "all";

/**
 * Paginated moderation queue with filter preset.
 */
export async function listReviewsForModeration(input: {
  filter: ReviewModerationFilter;
  page: number;
  pageSize: number;
}) {
  const where =
    input.filter === "pending"
      ? { isApproved: false, deletedAt: null, isFlagged: false }
      : input.filter === "approved"
        ? { isApproved: true, deletedAt: null }
        : input.filter === "flagged"
          ? { isFlagged: true, deletedAt: null }
          : { deletedAt: null };

  const [total, rows] = await prisma.$transaction([
    prisma.review.count({ where }),
    prisma.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize,
      include: {
        product: { select: { id: true, name: true, slug: true } },
        user: { select: { id: true, email: true, name: true } },
        order: { select: { id: true, orderNumber: true, status: true } },
      },
    }),
  ]);

  return { total, reviews: rows, page: input.page, pageSize: input.pageSize };
}

export type ModerateReviewAction = "approve" | "reject" | "feature" | "unfeature";

/**
 * Applies moderation action + optional public reply; sends “review live” email on approve.
 */
export async function moderateReview(input: {
  reviewId: string;
  actorId: string;
  action: ModerateReviewAction;
  rejectReason?: string | null;
  adminReply?: string | null;
  req?: Request;
}) {
  const review = await prisma.review.findUnique({
    where: { id: input.reviewId },
    include: { user: { select: { email: true, name: true } } },
  });
  if (!review || review.deletedAt) throw NotFound("Review not found");

  const before = {
    isApproved: review.isApproved,
    isFlagged: review.isFlagged,
    isFeatured: review.isFeatured,
  };

  let data: Prisma.ReviewUpdateInput;

  switch (input.action) {
    case "approve":
      data = {
        isApproved: true,
        isFlagged: false,
        flagReason: null,
        ...(input.adminReply?.trim()
          ? { adminReply: input.adminReply.trim(), adminReplyAt: new Date() }
          : {}),
      };
      break;
    case "reject": {
      const reason = input.rejectReason?.trim() || "Rejected by moderator";
      data = {
        isApproved: false,
        isFlagged: true,
        flagReason: reason.slice(0, 2000),
      };
      break;
    }
    case "feature":
      if (!review.isApproved) {
        throw ValidationError("Only approved reviews can be featured");
      }
      data = { isFeatured: true };
      break;
    case "unfeature":
      data = { isFeatured: false };
      break;
    default:
      throw ValidationError("Unknown action");
  }

  const updated = await prisma.review.update({
    where: { id: input.reviewId },
    data,
  });

  if (input.action === "approve" && review.hasImages) {
    const { scheduleReviewImageProcessing } = await import("../jobs/reviewImageProcessor.js");
    scheduleReviewImageProcessing({ reviewId: review.id, imageKey: "" });
  }

  if (input.action === "approve" && review.user?.email) {
    const tpl = reviewLiveEmail({
      name: review.user.name ?? undefined,
      productName: (await prisma.product.findUnique({
        where: { id: review.productId },
        select: { name: true },
      }))?.name,
    });
    await sendEmail({
      to: review.user.email,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
      template: "review_live",
      refType: "REVIEW",
      refId: review.id,
    });
  }

  await recordAudit({
    actorId: input.actorId,
    action: `review.${input.action}`,
    entity: "Review",
    entityId: review.id,
    diff: { before, after: data },
    req: input.req,
  });

  return updated;
}

/**
 * Sets or updates public admin reply only (no status change).
 */
export async function setReviewAdminReply(input: {
  reviewId: string;
  actorId: string;
  body: string;
  req?: Request;
}) {
  const review = await prisma.review.findUnique({ where: { id: input.reviewId } });
  if (!review || review.deletedAt) throw NotFound("Review not found");

  const updated = await prisma.review.update({
    where: { id: input.reviewId },
    data: { adminReply: input.body.trim().slice(0, 4000), adminReplyAt: new Date() },
  });

  await recordAudit({
    actorId: input.actorId,
    action: "review.reply",
    entity: "Review",
    entityId: review.id,
    diff: { adminReply: updated.adminReply },
    req: input.req,
  });

  return updated;
}
