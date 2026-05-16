/**
 * GST tax invoice PDF (PRD §9.4) + R2 persistence.
 */
import PDFDocument from "pdfkit";
import { Prisma } from "@prisma/client";

import { env } from "../config/env.js";
import { NotFound } from "../utils/errors.js";
import { roundMoney } from "../utils/money.js";
import { prisma } from "../utils/prisma.js";
import { uploadPublicBuffer } from "./storage.js";
import type { OrderTx } from "./orderInventory.js";
import {
  currentIndiaFiscalYearLabel,
  formatInvoiceNumber,
  nextInvoiceSequenceNo,
} from "./invoiceSequence.js";

type ShipAddr = {
  name?: string;
  line1?: string;
  line2?: string | null;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
};

const SELLER_DEFAULT = {
  name: "NVHO Tech Pvt. Ltd.",
  gstin: "08AAJCN8501H1ZC",
  state: "Rajasthan",
  address: "India",
};

/**
 * Builds PDF bytes for a confirmed order; does not persist.
 */
export async function generateOrderInvoicePdf(orderId: string): Promise<Buffer> {
  const row = await loadOrderForInvoice(orderId);
  if (!row.invoiceNumber) {
    throw new Error("Invoice number not assigned — run ensureOrderInvoice first");
  }
  return renderInvoicePdf(row, row.invoiceNumber);
}

/**
 * Idempotently assigns `invoiceNumber`, generates PDF, uploads to R2 when configured,
 * and stores `invoicePdfUrl`. Safe to call after order reaches CONFIRMED.
 */
export async function ensureOrderInvoice(orderId: string): Promise<{
  invoiceNumber: string;
  invoicePdfUrl: string | null;
}> {
  const existing = await prisma.order.findUnique({
    where: { id: orderId },
    select: { invoiceNumber: true, invoicePdfUrl: true, status: true },
  });
  if (!existing) throw NotFound("Order not found");
  if (existing.status !== "CONFIRMED" && existing.status !== "SHIPPED" && existing.status !== "DELIVERED") {
    throw new Error("Invoice only for confirmed or later fulfilment states");
  }
  if (existing.invoiceNumber && existing.invoicePdfUrl) {
    return { invoiceNumber: existing.invoiceNumber, invoicePdfUrl: existing.invoicePdfUrl };
  }

  const { invoiceNumber, needsUpload } = await prisma.$transaction(async (tx: OrderTx) => {
    const locked = await tx.$queryRaw<{ id: string }[]>(
      Prisma.sql`SELECT id FROM "Order" WHERE id = ${orderId} FOR UPDATE`,
    );
    if (!locked[0]) throw NotFound("Order not found");

    const cur = await tx.order.findUniqueOrThrow({
      where: { id: orderId },
      select: {
        invoiceNumber: true,
        invoicePdfUrl: true,
        confirmedAt: true,
        status: true,
      },
    });
    if (cur.invoiceNumber && cur.invoicePdfUrl) {
      return { invoiceNumber: cur.invoiceNumber, needsUpload: false as const };
    }
    if (
      cur.status !== "CONFIRMED" &&
      cur.status !== "SHIPPED" &&
      cur.status !== "DELIVERED"
    ) {
      throw new Error("Invoice only for confirmed or later fulfilment states");
    }

    let invNo = cur.invoiceNumber;
    if (!invNo) {
      const fy = currentIndiaFiscalYearLabel(cur.confirmedAt ?? new Date());
      const seq = await nextInvoiceSequenceNo(tx, fy);
      invNo = formatInvoiceNumber(fy, seq);
      await tx.order.update({
        where: { id: orderId },
        data: { invoiceNumber: invNo },
      });
    }

    const needsUpload = !cur.invoicePdfUrl;
    return { invoiceNumber: invNo, needsUpload };
  });

  if (!needsUpload) {
    const o = await prisma.order.findUniqueOrThrow({
      where: { id: orderId },
      select: { invoicePdfUrl: true },
    });
    return { invoiceNumber, invoicePdfUrl: o.invoicePdfUrl };
  }

  const full = await loadOrderForInvoice(orderId, invoiceNumber);
  const pdfBuf = await renderInvoicePdf(full, invoiceNumber);
  const keySafe = `invoices/${full.orderNumber}/${invoiceNumber.replace(/\//g, "-")}.pdf`;
  const publicUrl = await uploadPublicBuffer({
    key: keySafe,
    buffer: pdfBuf,
    contentType: "application/pdf",
  });

  await prisma.order.update({
    where: { id: orderId },
    data: { invoicePdfUrl: publicUrl },
  });

  return { invoiceNumber, invoicePdfUrl: publicUrl };
}

async function loadOrderForInvoice(orderId: string, invoiceNumberOverride?: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          variant: {
            include: {
              product: { select: { name: true, hsnCode: true, gstRate: true } },
            },
          },
        },
      },
      user: { select: { email: true, name: true } },
    },
  });
  if (!order) throw NotFound("Order not found");
  if (invoiceNumberOverride) {
    return { ...order, invoiceNumber: invoiceNumberOverride };
  }
  return order;
}

async function renderInvoicePdf(
  order: Awaited<ReturnType<typeof loadOrderForInvoice>>,
  invoiceNumber: string,
): Promise<Buffer> {
  const sellerGstin = env.INVOICE_SELLER_GSTIN ?? SELLER_DEFAULT.gstin;
  const sellerState = env.INVOICE_SELLER_STATE ?? SELLER_DEFAULT.state;
  const sellerName = env.INVOICE_SELLER_NAME ?? SELLER_DEFAULT.name;
  const ship = order.shippingAddress as ShipAddr;
  const buyerState = String(ship.state ?? "").trim().toLowerCase();
  const sellerStateNorm = sellerState.trim().toLowerCase();
  const intraState = buyerState.length > 0 && buyerState === sellerStateNorm;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 48 });
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(18).text("Tax Invoice", { align: "center" });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor("#333");
    doc.text(`${sellerName}`);
    doc.text(`GSTIN: ${sellerGstin} · State: ${sellerState}`);
    doc.text(`Invoice No: ${invoiceNumber}`);
    doc.text(
      `Date: ${(order.confirmedAt ?? order.placedAt).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
      })}`,
    );
    doc.text(`Order: ${order.orderNumber}`);
    doc.moveDown();

    doc.fontSize(11).text("Bill to", { underline: true });
    doc.fontSize(10);
    doc.text(String(ship.name ?? ""));
    doc.text(String(ship.line1 ?? ""));
    if (ship.line2) doc.text(String(ship.line2));
    doc.text(`${ship.city ?? ""}, ${ship.state ?? ""} - ${ship.pincode ?? ""}`);
    if (ship.phone) doc.text(`Phone: ${ship.phone}`);
    doc.moveDown();

    let y = doc.y;
    const colDesc = 50;
    const colHsn = 230;
    const colQty = 310;
    const colRate = 350;
    const colAmt = 420;

    doc.fontSize(9).font("Helvetica-Bold");
    doc.text("Item", colDesc, y);
    doc.text("HSN", colHsn, y);
    doc.text("Qty", colQty, y);
    doc.text("Rate", colRate, y);
    doc.text("Amount", colAmt, y, { width: 100, align: "right" });
    y = doc.y + 4;
    doc.moveTo(48, y).lineTo(548, y).stroke();
    y += 6;
    doc.font("Helvetica");

    let taxableTotal = 0;
    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    for (const line of order.items) {
      const p = line.variant.product;
      const rate = roundMoney(Number(p.gstRate));
      const lineTotal = roundMoney(Number(line.lineTotal));
      const taxable = roundMoney(lineTotal / (1 + rate / 100));
      const tax = roundMoney(lineTotal - taxable);
      taxableTotal += taxable;
      if (intraState) {
        cgst += tax / 2;
        sgst += tax / 2;
      } else {
        igst += tax;
      }

      const hsn = p.hsnCode ?? "—";
      doc.text(`${p.name} / ${line.variantName}`.slice(0, 55), colDesc, y, { width: 170 });
      doc.text(hsn, colHsn, y);
      doc.text(String(line.quantity), colQty, y);
      doc.text(`₹${Number(line.unitPrice).toFixed(2)}`, colRate, y);
      doc.text(`₹${lineTotal.toFixed(2)}`, colAmt, y, { width: 100, align: "right" });
      y += 42;
      if (y > 700) {
        doc.addPage();
        y = 50;
      }
    }

    doc.moveTo(48, y).lineTo(548, y).stroke();
    y += 10;
    doc.font("Helvetica-Bold");
    doc.text(`Taxable value: ₹${taxableTotal.toFixed(2)}`, colDesc, y);
    y += 14;
    if (intraState) {
      doc.text(`CGST: ₹${cgst.toFixed(2)}`, colDesc, y);
      y += 14;
      doc.text(`SGST: ₹${sgst.toFixed(2)}`, colDesc, y);
    } else {
      doc.text(`IGST: ₹${igst.toFixed(2)}`, colDesc, y);
    }
    y += 20;
    doc.text(`Grand total: ₹${roundMoney(Number(order.total)).toFixed(2)}`, colDesc, y);
    doc.font("Helvetica");
    y += 28;
    doc.fontSize(8).fillColor("#666").text(
      "Amount includes GST as applicable. Electronic generated invoice — signature not required.",
      colDesc,
      y,
      { width: 500 },
    );

    doc.end();
  });
}
