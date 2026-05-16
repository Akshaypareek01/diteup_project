/**
 * Admin inventory — adjustments, ledger, Excel (PRD §8.6).
 */
import { Prisma } from "@prisma/client";
import type { StockReason } from "@prisma/client";
import type { Request } from "express";
import * as XLSX from "xlsx";

import { recordAudit } from "../utils/adminAudit.js";
import { NotFound, ValidationError } from "../utils/errors.js";
import { prisma } from "../utils/prisma.js";

export type AdminInventoryListQuery = {
  page: number;
  pageSize: number;
  lowStockOnly?: boolean;
  q?: string;
};

/**
 * Paginated inventory rows with variant + product names.
 */
export async function listInventoryAdmin(input: AdminInventoryListQuery) {
  const take = input.pageSize;
  const skip = (input.page - 1) * take;
  const q = input.q?.trim();

  if (input.lowStockOnly) {
    const search =
      q != null && q.length > 0 ? `%${q.replace(/%/g, "\\%")}%` : null;
    const rows = await prisma.$queryRaw<
      {
        id: string;
        variantId: string;
        sku: string;
        variantName: string;
        productId: string;
        productName: string;
        stockOnHand: number;
        stockReserved: number;
        lowStockThreshold: number;
      }[]
    >(Prisma.sql`
      SELECT i.id, i."variantId", v.sku, v.name AS "variantName", p.id AS "productId", p.name AS "productName",
             i."stockOnHand", i."stockReserved", i."lowStockThreshold"
      FROM "Inventory" i
      INNER JOIN "ProductVariant" v ON v.id = i."variantId"
      INNER JOIN "Product" p ON p.id = v."productId"
      WHERE i."stockOnHand" <= i."lowStockThreshold"
      AND (${
        search === null
          ? Prisma.sql`TRUE`
          : Prisma.sql`(v.sku ILIKE ${search} OR p.name ILIKE ${search})`
      })
      ORDER BY i."stockOnHand" ASC
      LIMIT ${take} OFFSET ${skip}
    `);
    const countRows = await prisma.$queryRaw<{ c: bigint }[]>(Prisma.sql`
      SELECT COUNT(*)::bigint AS c FROM "Inventory" i
      INNER JOIN "ProductVariant" v ON v.id = i."variantId"
      INNER JOIN "Product" p ON p.id = v."productId"
      WHERE i."stockOnHand" <= i."lowStockThreshold"
      AND (${
        search === null
          ? Prisma.sql`TRUE`
          : Prisma.sql`(v.sku ILIKE ${search} OR p.name ILIKE ${search})`
      })
    `);
    const total = Number(countRows[0]?.c ?? 0n);
    return {
      total,
      page: input.page,
      pageSize: take,
      rows,
    };
  }

  const where: Prisma.InventoryWhereInput = {};
  if (q) {
    where.OR = [
      { variant: { sku: { contains: q, mode: "insensitive" } } },
      { variant: { product: { name: { contains: q, mode: "insensitive" } } } },
    ];
  }

  const [total, rows] = await prisma.$transaction([
    prisma.inventory.count({ where }),
    prisma.inventory.findMany({
      where,
      skip,
      take,
      orderBy: { updatedAt: "desc" },
      include: {
        variant: {
          select: {
            id: true,
            sku: true,
            name: true,
            productId: true,
            product: { select: { id: true, name: true } },
          },
        },
      },
    }),
  ]);

  return {
    total,
    page: input.page,
    pageSize: take,
    rows: rows.map((r) => ({
      id: r.id,
      variantId: r.variantId,
      sku: r.variant.sku,
      variantName: r.variant.name,
      productId: r.variant.productId,
      productName: r.variant.product.name,
      stockOnHand: r.stockOnHand,
      stockReserved: r.stockReserved,
      lowStockThreshold: r.lowStockThreshold,
    })),
  };
}

/**
 * Applies a signed stock adjustment and writes ledger + audit.
 */
export async function adjustInventoryAdmin(input: {
  inventoryId: string;
  delta: number;
  reason: StockReason;
  note?: string | null;
  actorId: string;
  req?: Request;
}): Promise<void> {
  if (input.delta === 0) throw ValidationError("delta cannot be 0");
  const inv = await prisma.inventory.findUnique({ where: { id: input.inventoryId } });
  if (!inv) throw NotFound("Inventory not found");

  await prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<{ stockOnHand: number }[]>(
      Prisma.sql`
        SELECT "stockOnHand" FROM "Inventory" WHERE id = ${input.inventoryId} FOR UPDATE
      `,
    );
    const onHand = rows[0]?.stockOnHand;
    if (onHand === undefined) throw NotFound("Inventory not found");
    const next = onHand + input.delta;
    if (next < 0) {
      throw ValidationError("Adjustment would make stock negative");
    }
    await tx.inventory.update({
      where: { id: input.inventoryId },
      data: { stockOnHand: next },
    });
    await tx.stockLedger.create({
      data: {
        inventoryId: input.inventoryId,
        delta: input.delta,
        reason: input.reason,
        note: input.note?.slice(0, 500) ?? null,
        actorUserId: input.actorId,
      },
    });
  });

  await recordAudit({
    actorId: input.actorId,
    action: "inventory.adjust",
    entity: "Inventory",
    entityId: input.inventoryId,
    diff: { delta: input.delta, reason: input.reason },
    req: input.req,
  });
}

/**
 * Ledger history for one inventory row.
 */
export async function listStockLedgerAdmin(inventoryId: string, limit = 100) {
  const inv = await prisma.inventory.findUnique({ where: { id: inventoryId } });
  if (!inv) throw NotFound("Inventory not found");
  const entries = await prisma.stockLedger.findMany({
    where: { inventoryId },
    orderBy: { createdAt: "desc" },
    take: Math.min(limit, 500),
  });
  return { entries };
}

/**
 * Export SKU + on-hand + threshold (max 8000 rows).
 */
export async function exportInventoryXlsx(): Promise<Buffer> {
  const rows = await prisma.inventory.findMany({
    take: 8000,
    include: {
      variant: { select: { sku: true, name: true, product: { select: { name: true } } } },
    },
  });
  const sheet = rows.map((r) => ({
    sku: r.variant.sku,
    productName: r.variant.product.name,
    variantName: r.variant.name,
    stockOnHand: r.stockOnHand,
    lowStockThreshold: r.lowStockThreshold,
  }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sheet), "Inventory");
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}

/**
 * Import adjustments from XLSX columns `sku`, `delta` (optional `note`).
 */
export async function importInventoryAdjustmentsXlsx(input: {
  buffer: Buffer;
  actorId: string;
  req?: Request;
}): Promise<{ applied: number; errors: { row: number; message: string }[] }> {
  const wb = XLSX.read(input.buffer, { type: "buffer" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
  let applied = 0;
  const errors: { row: number; message: string }[] = [];

  for (let i = 0; i < json.length; i++) {
    const row = json[i];
    const sku = String(row.sku ?? row.SKU ?? "").trim();
    const deltaRaw = row.delta ?? row.Delta ?? row.adjustment;
    const note = String(row.note ?? row.Note ?? "").trim() || null;
    const delta = typeof deltaRaw === "number" ? deltaRaw : Number(deltaRaw);
    if (!sku) {
      errors.push({ row: i + 2, message: "missing sku" });
      continue;
    }
    if (!Number.isFinite(delta) || delta === 0) {
      errors.push({ row: i + 2, message: "invalid delta" });
      continue;
    }
    const variant = await prisma.productVariant.findUnique({
      where: { sku },
      include: { inventory: true },
    });
    if (!variant?.inventory) {
      errors.push({ row: i + 2, message: "variant or inventory not found" });
      continue;
    }
    try {
      await adjustInventoryAdmin({
        inventoryId: variant.inventory.id,
        delta: Math.trunc(delta),
        reason: "IMPORT",
        note,
        actorId: input.actorId,
        req: input.req,
      });
      applied += 1;
    } catch (err) {
      errors.push({
        row: i + 2,
        message: err instanceof Error ? err.message : "failed",
      });
    }
  }

  await recordAudit({
    actorId: input.actorId,
    action: "inventory.import",
    entity: "Inventory",
    diff: { applied, errors: errors.length },
    req: input.req,
  });

  return { applied, errors };
}
