/**
 * Persists admin actions to `AuditLog` (PRD §7 / compliance).
 */
import type { Request } from "express";

import { prisma } from "./prisma.js";
import { logger } from "./logger.js";

export type AuditPayload = {
  actorId: string;
  action: string;
  entity: string;
  entityId?: string | null;
  diff?: unknown;
  req?: Request;
};

/**
 * Writes an audit row; logs failures without throwing (audit must not block primary flow).
 */
export async function recordAudit(payload: AuditPayload): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: payload.actorId,
        action: payload.action,
        entity: payload.entity,
        entityId: payload.entityId ?? null,
        diff: payload.diff === undefined ? undefined : (payload.diff as object),
        ip: payload.req?.ip ?? payload.req?.socket.remoteAddress ?? null,
        userAgent: typeof payload.req?.get === "function" ? payload.req.get("user-agent") : null,
      },
    });
  } catch (err) {
    logger.error({ err, payload }, "recordAudit failed");
  }
}
