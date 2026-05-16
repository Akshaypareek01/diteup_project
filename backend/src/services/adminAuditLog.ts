/**
 * Admin audit log viewer (PRD §8.12).
 */
import type { Prisma } from "@prisma/client";

import { prisma } from "../utils/prisma.js";

export type AdminAuditListQuery = {
  page: number;
  pageSize: number;
  actorId?: string;
  entity?: string;
  entityId?: string;
};

/**
 * Paginated audit entries (newest first).
 */
export async function listAuditLogsAdmin(input: AdminAuditListQuery) {
  const take = input.pageSize;
  const skip = (input.page - 1) * take;
  const where: Prisma.AuditLogWhereInput = {};
  if (input.actorId) where.actorId = input.actorId;
  if (input.entity) where.entity = input.entity;
  if (input.entityId) where.entityId = input.entityId;

  const [total, rows] = await prisma.$transaction([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
  ]);

  return { total, page: input.page, pageSize: take, entries: rows };
}
