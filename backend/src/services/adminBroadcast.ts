/**
 * Admin marketing broadcasts + email log + suppression (PRD §8.9).
 */
import type { EmailStatus } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import type { Request } from "express";

import { broadcastEmail } from "../emails/templates.js";
import { applyBroadcastMergeTags, type BroadcastMergeContext } from "../emails/broadcastMerge.js";
import { recordAudit } from "../utils/adminAudit.js";
import { NotFound, ValidationError } from "../utils/errors.js";
import { normalizeEmail } from "../utils/format.js";
import { prisma } from "../utils/prisma.js";
import { sendEmail } from "./email.js";
import { env } from "../config/env.js";
import { signMarketingUnsubscribeToken } from "../utils/marketingToken.js";

export type BroadcastSegment =
  | { type: "MARKETING_OPT_IN" }
  | { type: "TAGS"; tags: string[] }
  | { type: "EMAILS"; emails: string[] }
  | { type: "PAST_30D_BUYERS" };

const MAX_SEND_PER_REQUEST = 500;

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Per-recipient merge context for broadcast personalization.
 */
async function loadMergeContextForEmail(email: string): Promise<BroadcastMergeContext> {
  const user = await prisma.user.findFirst({
    where: { email: normalizeEmail(email) },
    select: { id: true, name: true },
  });
  let lastOrderDate: string | null = null;
  if (user) {
    const o = await prisma.order.findFirst({
      where: {
        userId: user.id,
        status: { in: ["CONFIRMED", "SHIPPED", "DELIVERED", "REFUNDED"] },
      },
      orderBy: { confirmedAt: "desc" },
      select: { confirmedAt: true, placedAt: true },
    });
    const d = o?.confirmedAt ?? o?.placedAt;
    if (d) {
      lastOrderDate = d.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" });
    }
  }
  return {
    name: user?.name,
    firstName: user?.name?.split(/\s+/)[0],
    lastOrderDate,
  };
}

/**
 * Creates a draft broadcast row.
 */
export async function createBroadcastAdmin(input: {
  subject: string;
  bodyHtml: string;
  segment: BroadcastSegment;
  scheduledAt?: Date | null;
  actorId: string;
  req?: Request;
}) {
  const row = await prisma.broadcastEmail.create({
    data: {
      subject: input.subject.trim(),
      bodyHtml: input.bodyHtml,
      segment: input.segment as unknown as Prisma.InputJsonValue,
      scheduledAt: input.scheduledAt ?? null,
      status: "DRAFT",
      createdBy: input.actorId,
    },
  });

  await recordAudit({
    actorId: input.actorId,
    action: "broadcast.create",
    entity: "BroadcastEmail",
    entityId: row.id,
    req: input.req,
  });

  return row;
}

/**
 * Lists recent broadcasts.
 */
export async function listBroadcastsAdmin(input: { page: number; pageSize: number; status?: EmailStatus }) {
  const take = input.pageSize;
  const skip = (input.page - 1) * take;
  const where: Prisma.BroadcastEmailWhereInput = {};
  if (input.status) where.status = input.status;

  const [total, rows] = await prisma.$transaction([
    prisma.broadcastEmail.count({ where }),
    prisma.broadcastEmail.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
  ]);

  return { total, page: input.page, pageSize: take, broadcasts: rows };
}

/**
 * Fetches one broadcast.
 */
export async function getBroadcastAdmin(id: string) {
  const row = await prisma.broadcastEmail.findUnique({ where: { id } });
  if (!row) throw NotFound("Broadcast not found");
  return row;
}

/**
 * Updates draft / scheduled broadcast content.
 */
export async function updateBroadcastAdmin(input: {
  id: string;
  subject?: string;
  bodyHtml?: string;
  segment?: BroadcastSegment;
  scheduledAt?: Date | null;
  actorId: string;
  req?: Request;
}): Promise<void> {
  const row = await prisma.broadcastEmail.findUnique({ where: { id: input.id } });
  if (!row) throw NotFound("Broadcast not found");
  if (row.status !== "DRAFT" && row.status !== "SCHEDULED") {
    throw ValidationError("Only draft or scheduled broadcasts can be edited");
  }

  await prisma.broadcastEmail.update({
    where: { id: input.id },
    data: {
      ...(input.subject !== undefined ? { subject: input.subject.trim() } : {}),
      ...(input.bodyHtml !== undefined ? { bodyHtml: input.bodyHtml } : {}),
      ...(input.segment !== undefined
        ? { segment: input.segment as unknown as Prisma.InputJsonValue }
        : {}),
      ...(input.scheduledAt !== undefined ? { scheduledAt: input.scheduledAt } : {}),
    },
  });

  await recordAudit({
    actorId: input.actorId,
    action: "broadcast.update",
    entity: "BroadcastEmail",
    entityId: input.id,
    req: input.req,
  });
}

/**
 * Resolves segment to unique email addresses (capped).
 */
async function resolveBroadcastRecipients(segment: BroadcastSegment): Promise<string[]> {
  if (segment.type === "MARKETING_OPT_IN") {
    const users = await prisma.user.findMany({
      where: {
        role: "CUSTOMER",
        isActive: true,
        marketingOptIn: true,
        emailVerified: true,
      },
      select: { email: true },
      take: MAX_SEND_PER_REQUEST + 1,
    });
    if (users.length > MAX_SEND_PER_REQUEST) {
      throw ValidationError(
        `Audience exceeds ${MAX_SEND_PER_REQUEST} — narrow segment or use batches`,
      );
    }
    return [...new Set(users.map((u) => normalizeEmail(u.email)))];
  }

  if (segment.type === "TAGS") {
    if (!segment.tags.length) throw ValidationError("tags required");
    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        tags: { hasSome: segment.tags },
      },
      select: { email: true },
      take: MAX_SEND_PER_REQUEST + 1,
    });
    if (users.length > MAX_SEND_PER_REQUEST) {
      throw ValidationError(`Audience exceeds ${MAX_SEND_PER_REQUEST}`);
    }
    return [...new Set(users.map((u) => normalizeEmail(u.email)))];
  }

  if (segment.type === "PAST_30D_BUYERS") {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const rows = await prisma.order.findMany({
      where: {
        status: { in: ["CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED", "REFUNDED"] },
        confirmedAt: { gte: since },
      },
      select: { guestEmail: true, user: { select: { email: true } } },
      take: 5000,
    });
    const set = new Set<string>();
    for (const r of rows) {
      const e = r.user?.email ?? r.guestEmail;
      if (e) set.add(normalizeEmail(e));
    }
    const list = [...set];
    if (list.length > MAX_SEND_PER_REQUEST) {
      throw ValidationError(
        `Audience exceeds ${MAX_SEND_PER_REQUEST} — narrow segment or send in batches`,
      );
    }
    return list;
  }

  const emails = segment.emails.map((e) => normalizeEmail(e)).filter(Boolean);
  const unique = [...new Set(emails)];
  if (unique.length > MAX_SEND_PER_REQUEST) {
    throw ValidationError(`At most ${MAX_SEND_PER_REQUEST} explicit emails`);
  }
  return unique;
}

/**
 * Sends a broadcast immediately (synchronous best-effort; Phase 10 can queue).
 */
export async function sendBroadcastNowAdmin(input: {
  id: string;
  actorId: string;
  req?: Request;
}): Promise<{ sent: number; failed: number }> {
  const row = await prisma.broadcastEmail.findUnique({ where: { id: input.id } });
  if (!row) throw NotFound("Broadcast not found");
  if (row.status === "SENT") {
    return { sent: row.sentCount, failed: row.failedCount };
  }

  const segment = row.segment as unknown as BroadcastSegment;
  const recipients = await resolveBroadcastRecipients(segment);
  const throttleMs = Math.max(1, Math.ceil(60_000 / env.BROADCAST_EMAILS_PER_MINUTE));
  const site = env.PUBLIC_SITE_URL ?? "https://diteup.com";

  let sent = 0;
  let failed = 0;

  await prisma.broadcastEmail.update({
    where: { id: row.id },
    data: { status: "SENDING" },
  });

  for (const to of recipients) {
    const ctx = await loadMergeContextForEmail(to);
    const mergedSubject = applyBroadcastMergeTags(row.subject, ctx);
    const mergedBody = applyBroadcastMergeTags(row.bodyHtml, ctx);
    const tplMerged = broadcastEmail({ subject: mergedSubject, bodyHtml: mergedBody });
    const unsub = `${site}/v1/marketing/unsubscribe?t=${encodeURIComponent(signMarketingUnsubscribeToken(to))}`;
    const r = await sendEmail({
      to,
      subject: tplMerged.subject,
      html: tplMerged.html,
      text: tplMerged.text,
      template: "broadcast",
      refType: "BROADCAST",
      refId: row.id,
      headers: {
        "List-Unsubscribe": `<${unsub}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    });
    if (r.ok && !r.suppressed) sent += 1;
    else failed += 1;
    await sleep(throttleMs);
  }

  await prisma.broadcastEmail.update({
    where: { id: row.id },
    data: {
      status: failed === recipients.length && recipients.length > 0 ? "FAILED" : "SENT",
      sentAt: new Date(),
      sentCount: sent,
      failedCount: failed,
    },
  });

  await recordAudit({
    actorId: input.actorId,
    action: "broadcast.send",
    entity: "BroadcastEmail",
    entityId: row.id,
    diff: { sent, failed },
    req: input.req,
  });

  return { sent, failed };
}

/**
 * HTML preview with merge tags resolved using a sample inbox (falls back to merge “there”).
 */
export async function previewBroadcastMergedAdmin(input: {
  id: string;
  sampleEmail?: string | null;
}): Promise<{ mergedSubject: string; mergedHtml: string }> {
  const row = await getBroadcastAdmin(input.id);
  const sample = input.sampleEmail?.trim() || "preview@diteup.com";
  const ctx = await loadMergeContextForEmail(sample);
  const mergedSubject = applyBroadcastMergeTags(row.subject, ctx);
  const mergedBody = applyBroadcastMergeTags(row.bodyHtml, ctx);
  const tpl = broadcastEmail({ subject: mergedSubject, bodyHtml: mergedBody });
  return { mergedSubject: tpl.subject, mergedHtml: tpl.html };
}

/**
 * Sends merged broadcast only to the acting admin (PRD §10.2 send-test).
 */
export async function sendBroadcastTestToAdmin(input: {
  id: string;
  actorId: string;
  req?: Request;
}): Promise<void> {
  const row = await getBroadcastAdmin(input.id);
  const admin = await prisma.user.findUnique({
    where: { id: input.actorId },
    select: { email: true },
  });
  if (!admin?.email) throw ValidationError("Admin user has no email on file");

  const ctx = await loadMergeContextForEmail(admin.email);
  const mergedSubject = `[TEST] ${applyBroadcastMergeTags(row.subject, ctx)}`;
  const mergedBody = applyBroadcastMergeTags(row.bodyHtml, ctx);
  const tpl = broadcastEmail({ subject: mergedSubject, bodyHtml: mergedBody });
  const site = env.PUBLIC_SITE_URL ?? "https://diteup.com";
  const unsub = `${site}/v1/marketing/unsubscribe?t=${encodeURIComponent(signMarketingUnsubscribeToken(admin.email))}`;
  await sendEmail({
    to: normalizeEmail(admin.email),
    subject: tpl.subject,
    html: tpl.html,
    text: tpl.text,
    template: "broadcast_test",
    refType: "BROADCAST",
    refId: row.id,
    headers: {
      "List-Unsubscribe": `<${unsub}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  });

  await recordAudit({
    actorId: input.actorId,
    action: "broadcast.send_test",
    entity: "BroadcastEmail",
    entityId: row.id,
    req: input.req,
  });
}

/**
 * Paginated transactional + broadcast email log.
 */
export async function listEmailLogsAdmin(input: {
  page: number;
  pageSize: number;
  status?: string;
  to?: string;
}) {
  const take = input.pageSize;
  const skip = (input.page - 1) * take;
  const where: Prisma.EmailLogWhereInput = {};
  if (input.status) where.status = input.status;
  if (input.to?.trim()) where.to = { contains: input.to.trim().toLowerCase(), mode: "insensitive" };

  const [total, rows] = await prisma.$transaction([
    prisma.emailLog.count({ where }),
    prisma.emailLog.findMany({ where, orderBy: { sentAt: "desc" }, skip, take }),
  ]);

  return { total, page: input.page, pageSize: take, logs: rows };
}

/**
 * Adds suppression row (bounce / complaint / unsubscribe).
 */
export async function addEmailSuppressionAdmin(input: {
  email: string;
  reason: string;
  actorId: string;
  req?: Request;
}): Promise<void> {
  const email = normalizeEmail(input.email);
  await prisma.emailSuppression.upsert({
    where: { email },
    create: { email, reason: input.reason.slice(0, 500) },
    update: { reason: input.reason.slice(0, 500) },
  });
  await recordAudit({
    actorId: input.actorId,
    action: "email.suppress",
    entity: "EmailSuppression",
    entityId: email,
    req: input.req,
  });
}

/**
 * Lists suppressions (paginated).
 */
export async function listEmailSuppressionsAdmin(input: { page: number; pageSize: number }) {
  const take = input.pageSize;
  const skip = (input.page - 1) * take;
  const [total, rows] = await prisma.$transaction([
    prisma.emailSuppression.count(),
    prisma.emailSuppression.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
  ]);
  return { total, page: input.page, pageSize: take, suppressions: rows };
}

/**
 * Removes an address from the suppression list.
 */
export async function removeEmailSuppressionAdmin(input: {
  email: string;
  actorId: string;
  req?: Request;
}): Promise<void> {
  const email = normalizeEmail(input.email);
  await prisma.emailSuppression.deleteMany({ where: { email } });
  await recordAudit({
    actorId: input.actorId,
    action: "email.unsuppress",
    entity: "EmailSuppression",
    entityId: email,
    req: input.req,
  });
}
