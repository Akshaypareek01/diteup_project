-- Phase 11: GST invoice fields + per-FY invoice sequence
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "invoiceNumber" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "invoicePdfUrl" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Order_invoiceNumber_key" ON "Order"("invoiceNumber");

CREATE TABLE IF NOT EXISTS "InvoiceSequence" (
    "fiscalYearLabel" TEXT NOT NULL,
    "lastNo" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "InvoiceSequence_pkey" PRIMARY KEY ("fiscalYearLabel")
);
