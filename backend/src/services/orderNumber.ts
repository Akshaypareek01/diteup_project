/**
 * Monotonic order numbers `DU-YYYY-NNNNN` in Asia/Kolkata calendar year.
 */
import { Prisma } from "@prisma/client";

import type { OrderTx } from "./orderInventory.js";

/**
 * Returns the calendar year in `Asia/Kolkata` for order-number rollover.
 */
export function currentOrderYearKolkata(d = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
  }).formatToParts(d);
  const y = parts.find((p) => p.type === "year")?.value;
  return y ? parseInt(y, 10) : d.getUTCFullYear();
}

/**
 * Atomically increments the per-year sequence and returns the next suffix (1-based).
 */
export async function nextOrderSequenceNo(tx: OrderTx, year: number): Promise<number> {
  const rows = await tx.$queryRaw<{ lastNo: number }[]>(
    Prisma.sql`
      INSERT INTO "OrderSequence" ("year", "lastNo")
      VALUES (${year}, 1)
      ON CONFLICT ("year") DO UPDATE SET "lastNo" = "OrderSequence"."lastNo" + 1
      RETURNING "lastNo"
    `,
  );
  const lastNo = rows[0]?.lastNo;
  if (lastNo == null) {
    throw new Error("Failed to allocate order sequence");
  }
  return lastNo;
}

/**
 * Formats public-facing order number.
 */
export function formatOrderNumber(year: number, seq: number): string {
  return `DU-${year}-${String(seq).padStart(5, "0")}`;
}
