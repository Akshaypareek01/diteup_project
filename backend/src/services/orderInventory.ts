/**
 * Stock reservation and confirmation for checkout (Inventory.stockReserved + StockLedger).
 */
import { Prisma } from "@prisma/client";

import { prisma } from "../utils/prisma.js";
import { StockUnavailable, ValidationError } from "../utils/errors.js";

/** Prisma interactive transaction client. */
export type OrderTx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];
type Tx = OrderTx;

export type ReserveLineInput = {
  inventoryId: string;
  quantity: number;
  allowBackorder: boolean;
  preorderEnabled: boolean;
};

/**
 * Locks each inventory row, increments `stockReserved`, and enforces availability unless backorder/preorder.
 */
export async function reserveInventoryLines(
  tx: Tx,
  lines: ReserveLineInput[],
  _orderId: string,
): Promise<void> {
  for (const line of lines) {
    const rows = await tx.$queryRaw<{ id: string; stockOnHand: number; stockReserved: number }[]>(
      Prisma.sql`
        SELECT id, "stockOnHand", "stockReserved"
        FROM "Inventory"
        WHERE id = ${line.inventoryId}
        FOR UPDATE
      `,
    );
    const inv = rows[0];
    if (!inv) {
      throw StockUnavailable("Inventory row not found for variant");
    }
    const available = inv.stockOnHand - inv.stockReserved;
    if (!line.allowBackorder && !line.preorderEnabled && available < line.quantity) {
      throw StockUnavailable();
    }
    await tx.inventory.update({
      where: { id: inv.id },
      data: { stockReserved: { increment: line.quantity } },
    });
  }
}

/**
 * On successful payment: moves stock from reserved to sold (`stockOnHand` −qty, `stockReserved` −qty) + ledger.
 */
export async function confirmInventoryForOrder(
  tx: Tx,
  items: { inventoryId: string; quantity: number }[],
  orderId: string,
  actorUserId?: string | null,
): Promise<void> {
  for (const item of items) {
    const rows = await tx.$queryRaw<{ id: string; stockOnHand: number; stockReserved: number }[]>(
      Prisma.sql`
        SELECT id, "stockOnHand", "stockReserved"
        FROM "Inventory"
        WHERE id = ${item.inventoryId}
        FOR UPDATE
      `,
    );
    const inv = rows[0];
    if (!inv) {
      throw StockUnavailable("Inventory row not found during confirm");
    }
    if (inv.stockReserved < item.quantity) {
      throw StockUnavailable("Reservation mismatch — cannot confirm order");
    }
    await tx.inventory.update({
      where: { id: inv.id },
      data: {
        stockOnHand: { decrement: item.quantity },
        stockReserved: { decrement: item.quantity },
      },
    });
    await tx.stockLedger.create({
      data: {
        inventoryId: inv.id,
        delta: -item.quantity,
        reason: "ORDER_CONFIRM",
        refOrderId: orderId,
        actorUserId: actorUserId ?? null,
        note: "Payment captured",
      },
    });
  }
}

/**
 * Reverses an unpaid reservation (order cancelled or expired while still PLACED).
 */
export async function releaseReservationForOrder(
  tx: Tx,
  items: { inventoryId: string; quantity: number }[],
): Promise<void> {
  for (const item of items) {
    const rows = await tx.$queryRaw<{ id: string; stockReserved: number }[]>(
      Prisma.sql`
        SELECT id, "stockReserved"
        FROM "Inventory"
        WHERE id = ${item.inventoryId}
        FOR UPDATE
      `,
    );
    const inv = rows[0];
    if (!inv) continue;
    const releaseQty = Math.min(item.quantity, inv.stockReserved);
    if (releaseQty <= 0) continue;
    await tx.inventory.update({
      where: { id: inv.id },
      data: { stockReserved: { decrement: releaseQty } },
    });
  }
}

/**
 * Restocks physical quantity when a CONFIRMED order is cancelled (e.g. COD before ship).
 */
export async function restockConfirmedOrder(
  tx: Tx,
  items: { inventoryId: string; quantity: number }[],
  orderId: string,
  actorUserId?: string | null,
): Promise<void> {
  for (const item of items) {
    const rows = await tx.$queryRaw<{ id: string }[]>(
      Prisma.sql`
        SELECT id FROM "Inventory" WHERE id = ${item.inventoryId} FOR UPDATE
      `,
    );
    const inv = rows[0];
    if (!inv) continue;
    await tx.inventory.update({
      where: { id: inv.id },
      data: { stockOnHand: { increment: item.quantity } },
    });
    await tx.stockLedger.create({
      data: {
        inventoryId: inv.id,
        delta: item.quantity,
        reason: "ORDER_CANCEL",
        refOrderId: orderId,
        actorUserId: actorUserId ?? null,
        note: "Order cancelled — restock",
      },
    });
  }
}

/**
 * Maps order line items to inventory rows for reservation / confirmation helpers.
 */
export async function loadInventoryIdsForOrder(
  tx: Tx,
  orderId: string,
): Promise<{ inventoryId: string; quantity: number }[]> {
  const items = await tx.orderItem.findMany({
    where: { orderId },
    include: { variant: { include: { inventory: true } } },
  });
  return items.map((it) => {
    const invId = it.variant.inventory?.id;
    if (!invId) throw ValidationError("Missing inventory on line item");
    return { inventoryId: invId, quantity: it.quantity };
  });
}
