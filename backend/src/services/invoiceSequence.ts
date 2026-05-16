/**
 * India fiscal-year invoice numbering `DU/YY-YY/NNNN` (PRD §9.4), Asia/Kolkata.
 */
import { Prisma } from "@prisma/client";

import type { OrderTx } from "./orderInventory.js";

/**
 * Returns fiscal year label e.g. `25-26` for Apr 2025–Mar 2026.
 */
export function currentIndiaFiscalYearLabel(d = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    month: "numeric",
    year: "numeric",
  }).formatToParts(d);
  const month = Number(parts.find((p) => p.type === "month")?.value ?? "1");
  const year = Number(parts.find((p) => p.type === "year")?.value ?? d.getFullYear());
  const fyStart = month >= 4 ? year : year - 1;
  const fyEnd = fyStart + 1;
  return `${String(fyStart).slice(-2)}-${String(fyEnd).slice(-2)}`;
}

/**
 * Public GST invoice number string.
 */
export function formatInvoiceNumber(fyLabel: string, seq: number): string {
  return `DU/${fyLabel}/${String(seq).padStart(4, "0")}`;
}

/**
 * Atomically allocates the next sequence for the given India FY label.
 */
export async function nextInvoiceSequenceNo(tx: OrderTx, fyLabel: string): Promise<number> {
  const rows = await tx.$queryRaw<{ lastNo: number }[]>(
    Prisma.sql`
      INSERT INTO "InvoiceSequence" ("fiscalYearLabel", "lastNo")
      VALUES (${fyLabel}, 1)
      ON CONFLICT ("fiscalYearLabel") DO UPDATE SET "lastNo" = "InvoiceSequence"."lastNo" + 1
      RETURNING "lastNo"
    `,
  );
  const lastNo = rows[0]?.lastNo;
  if (lastNo == null) {
    throw new Error("Failed to allocate invoice sequence");
  }
  return lastNo;
}
