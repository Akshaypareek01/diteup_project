/**
 * Admin user management (PRD §8.4).
 */
import { Prisma } from "@prisma/client";
import type { Role } from "@prisma/client";
import type { Request } from "express";
import * as XLSX from "xlsx";

import { recordAudit } from "../utils/adminAudit.js";
import { NotFound, ValidationError } from "../utils/errors.js";
import { prisma } from "../utils/prisma.js";

export type AdminUserListQuery = {
  page: number;
  pageSize: number;
  role?: Role;
  isActive?: boolean;
  q?: string;
};

/**
 * Paginated user list.
 */
export async function listUsersAdmin(input: AdminUserListQuery) {
  const take = input.pageSize;
  const skip = (input.page - 1) * take;
  const where: Prisma.UserWhereInput = {};

  if (input.role) where.role = input.role;
  if (input.isActive !== undefined) where.isActive = input.isActive;
  if (input.q?.trim()) {
    const q = input.q.trim();
    where.OR = [
      { email: { contains: q, mode: "insensitive" } },
      { name: { contains: q, mode: "insensitive" } },
      { id: { equals: q } },
      { phone: { contains: q } },
    ];
  }

  const [total, rows] = await prisma.$transaction([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        emailVerified: true,
        tags: true,
        createdAt: true,
        lastLoginAt: true,
      },
    }),
  ]);

  return { total, page: input.page, pageSize: take, users: rows };
}

/**
 * User detail for admin.
 */
export async function getUserAdmin(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      addresses: { take: 20, orderBy: { updatedAt: "desc" } },
      _count: { select: { orders: true, reviews: true } },
    },
  });
  if (!user) throw NotFound("User not found");

  const { passwordHash: _ph, ...rest } = user;
  return {
    user: {
      ...rest,
      passwordSet: Boolean(_ph),
    },
  };
}

/**
 * Updates restrictions JSON, tags, notes, or active flag.
 */
export async function updateUserAdmin(input: {
  userId: string;
  actorId: string;
  restrictions?: Prisma.InputJsonValue | null;
  tags?: string[];
  adminNotes?: string | null;
  isActive?: boolean;
  deactivationReason?: string | null;
  req?: Request;
}): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: input.userId } });
  if (!user) throw NotFound("User not found");

  const data: Prisma.UserUpdateInput = {};
  if (input.restrictions !== undefined) {
    data.restrictions =
      input.restrictions === null
        ? Prisma.JsonNull
        : (input.restrictions as Prisma.InputJsonValue);
  }
  if (input.tags !== undefined) data.tags = input.tags;
  if (input.adminNotes !== undefined) data.adminNotes = input.adminNotes;
  if (input.isActive !== undefined) {
    data.isActive = input.isActive;
    if (!input.isActive) {
      data.deactivationReason = input.deactivationReason?.trim() ?? "Disabled by admin";
    }
  }

  const before = {
    isActive: user.isActive,
    tags: user.tags,
    restrictions: user.restrictions,
  };

  await prisma.user.update({ where: { id: input.userId }, data });

  await recordAudit({
    actorId: input.actorId,
    action: "user.update",
    entity: "User",
    entityId: input.userId,
    diff: { before, after: data },
    req: input.req,
  });
}

/**
 * Invalidates all sessions by bumping JWT token version.
 */
export async function forceLogoutUserAdmin(input: {
  userId: string;
  actorId: string;
  req?: Request;
}): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: input.userId } });
  if (!user) throw NotFound("User not found");

  await prisma.user.update({
    where: { id: input.userId },
    data: { tokenVersion: { increment: 1 } },
  });

  await recordAudit({
    actorId: input.actorId,
    action: "user.force_logout",
    entity: "User",
    entityId: input.userId,
    req: input.req,
  });
}

/**
 * GDPR-style anonymize: scramble PII, disable account, bump token version.
 */
export async function anonymizeUserAdmin(input: {
  userId: string;
  actorId: string;
  req?: Request;
}): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: input.userId } });
  if (!user) throw NotFound("User not found");
  if (user.role === "ADMIN") {
    throw ValidationError("Cannot anonymize an admin account");
  }

  const stamp = `anon_${user.id.slice(-8)}_${Date.now()}`;

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: {
        email: `${stamp}@anonymized.invalid`,
        passwordHash: null,
        phone: null,
        name: "Anonymized user",
        profileImageUrl: null,
        isActive: false,
        deactivationReason: "Anonymized",
        marketingOptIn: false,
        tokenVersion: { increment: 1 },
        restrictions: {},
        tags: [],
        adminNotes: null,
      },
    }),
    prisma.address.deleteMany({ where: { userId: user.id } }),
  ]);

  await recordAudit({
    actorId: input.actorId,
    action: "user.anonymize",
    entity: "User",
    entityId: user.id,
    req: input.req,
  });
}

/**
 * Exports user rows (max 5000) for spreadsheets.
 */
export async function exportUsersXlsx(input: AdminUserListQuery): Promise<Buffer> {
  const where: Prisma.UserWhereInput = {};
  if (input.role) where.role = input.role;
  if (input.isActive !== undefined) where.isActive = input.isActive;
  if (input.q?.trim()) {
    const q = input.q.trim();
    where.OR = [
      { email: { contains: q, mode: "insensitive" } },
      { name: { contains: q, mode: "insensitive" } },
    ];
  }

  const rows = await prisma.user.findMany({
    where,
    take: 5000,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      isActive: true,
      emailVerified: true,
      createdAt: true,
    },
  });

  const sheet = rows.map((r) => ({
    id: r.id,
    email: r.email,
    name: r.name ?? "",
    phone: r.phone ?? "",
    role: r.role,
    isActive: r.isActive,
    emailVerified: r.emailVerified,
    createdAt: r.createdAt.toISOString(),
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(sheet);
  XLSX.utils.book_append_sheet(wb, ws, "Users");
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}
