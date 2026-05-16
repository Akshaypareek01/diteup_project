/**
 * PostgreSQL-backed job queue (PRD §10.1 fallback — no Redis/BullMQ required).
 */
import { Prisma } from "@prisma/client";
import type { BackgroundJob } from "@prisma/client";

import { prisma } from "../utils/prisma.js";
import { logger } from "../utils/logger.js";
import type { SendEmailArgs } from "./email.js";
import { sendEmail } from "./email.js";

export const JOB_TYPE_EMAIL_SEND = "email.send";

function backoffMs(attemptIndex: number): number {
  const base = 30_000;
  return Math.min(base * Math.pow(2, Math.max(0, attemptIndex - 1)), 24 * 60 * 60 * 1000);
}

export type EnqueueOptions = {
  runAfter?: Date;
  maxAttempts?: number;
};

/**
 * Inserts a new background job row.
 */
export async function enqueueBackgroundJob(
  type: string,
  payload: Prisma.InputJsonValue,
  options?: EnqueueOptions,
): Promise<string> {
  const row = await prisma.backgroundJob.create({
    data: {
      type,
      payload,
      runAt: options?.runAfter ?? new Date(),
      maxAttempts: options?.maxAttempts ?? 8,
    },
  });
  return row.id;
}

/**
 * Enqueues transactional email delivery with retries (PRD §10.4).
 */
export async function enqueueEmailSendJob(
  args: SendEmailArgs,
  options?: EnqueueOptions,
): Promise<string> {
  return enqueueBackgroundJob(JOB_TYPE_EMAIL_SEND, args as Prisma.InputJsonValue, options);
}

/**
 * Claims due jobs with `FOR UPDATE SKIP LOCKED` (Postgres).
 */
export async function claimBackgroundJobs(limit: number): Promise<BackgroundJob[]> {
  const now = new Date();
  return prisma.$queryRaw<BackgroundJob[]>(
    Prisma.sql`
      WITH cte AS (
        SELECT id FROM "BackgroundJob"
        WHERE status = 'PENDING' AND "runAt" <= ${now}
        ORDER BY "runAt" ASC
        LIMIT ${limit}
        FOR UPDATE SKIP LOCKED
      )
      UPDATE "BackgroundJob" AS j
      SET status = 'PROCESSING', "lockedAt" = ${now}, "updatedAt" = ${now}
      FROM cte
      WHERE j.id = cte.id
      RETURNING j.*
    `,
  );
}

/**
 * Marks a job successful.
 */
export async function completeBackgroundJob(id: string): Promise<void> {
  await prisma.backgroundJob.update({
    where: { id },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
      lockedAt: null,
      lastError: null,
    },
  });
}

/**
 * Records failure and either re-queues with backoff or marks DEAD.
 */
export async function failBackgroundJob(id: string, err: unknown): Promise<void> {
  const job = await prisma.backgroundJob.findUnique({ where: { id } });
  if (!job) return;
  const msg = err instanceof Error ? err.message : String(err);
  const nextAttempts = job.attempts + 1;
  const dead = nextAttempts >= job.maxAttempts;
  await prisma.backgroundJob.update({
    where: { id },
    data: {
      status: dead ? "DEAD" : "PENDING",
      attempts: nextAttempts,
      lastError: msg.slice(0, 2000),
      runAt: dead ? job.runAt : new Date(Date.now() + backoffMs(nextAttempts)),
      lockedAt: null,
    },
  });
  if (dead) {
    logger.error({ id, type: job.type, attempts: nextAttempts }, "background job dead after max retries");
  }
}

/**
 * Dispatches a claimed job to its handler.
 */
export async function dispatchBackgroundJob(job: BackgroundJob): Promise<void> {
  switch (job.type) {
    case JOB_TYPE_EMAIL_SEND:
      await runEmailSendPayload(job.payload);
      return;
    default:
      throw new Error(`Unknown job type: ${job.type}`);
  }
}

function isSendEmailPayload(raw: unknown): raw is SendEmailArgs {
  if (!raw || typeof raw !== "object") return false;
  const o = raw as Record<string, unknown>;
  if (
    typeof o.to !== "string" ||
    typeof o.subject !== "string" ||
    typeof o.html !== "string" ||
    typeof o.text !== "string" ||
    typeof o.template !== "string"
  ) {
    return false;
  }
  if (o.attachments !== undefined) {
    if (!Array.isArray(o.attachments)) return false;
    for (const a of o.attachments) {
      if (!a || typeof a !== "object") return false;
      const x = a as Record<string, unknown>;
      if (typeof x.filename !== "string" || typeof x.contentBase64 !== "string") return false;
    }
  }
  if (o.headers !== undefined && (typeof o.headers !== "object" || o.headers === null)) return false;
  return true;
}

/**
 * Runs Resend/stub send for queued payload.
 */
export async function runEmailSendPayload(payload: unknown): Promise<void> {
  if (!isSendEmailPayload(payload)) {
    throw new Error("Invalid email.send payload");
  }
  const r = await sendEmail(payload);
  if (!r.ok && !r.suppressed) {
    throw new Error(r.error ?? "Email send failed");
  }
}

/**
 * Re-queues jobs stuck in PROCESSING (e.g. worker crash).
 */
export async function recoverStaleProcessingJobs(olderThanMs = 30 * 60 * 1000): Promise<number> {
  const cutoff = new Date(Date.now() - olderThanMs);
  const res = await prisma.backgroundJob.updateMany({
    where: {
      status: "PROCESSING",
      lockedAt: { lt: cutoff },
    },
    data: {
      status: "PENDING",
      lockedAt: null,
    },
  });
  if (res.count > 0) {
    logger.warn({ count: res.count }, "reset stale PROCESSING background jobs");
  }
  return res.count;
}

/**
 * Single drain pass: claim, dispatch, complete/fail.
 */
export async function runEmailJobQueueOnce(batchSize = 15): Promise<number> {
  const claimed = await claimBackgroundJobs(batchSize);
  for (const job of claimed) {
    try {
      await dispatchBackgroundJob(job);
      await completeBackgroundJob(job.id);
    } catch (err) {
      logger.warn({ err, jobId: job.id, type: job.type }, "background job attempt failed");
      await failBackgroundJob(job.id, err);
    }
  }
  return claimed.length;
}
