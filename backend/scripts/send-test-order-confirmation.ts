/**
 * Creates a CONFIRMED guest test order (no inventory / Shiprocket) and sends the
 * production order-confirmation email with GST invoice PDF attached.
 *
 * Usage (from backend/):
 *   npx tsx scripts/send-test-order-confirmation.ts
 *   npx tsx scripts/send-test-order-confirmation.ts you@gmail.com
 */
import { Prisma } from "@prisma/client";

import { env } from "../src/config/env.js";
import * as templates from "../src/emails/templates.js";
import { sendEmail } from "../src/services/email.js";
import { ensureOrderInvoice, generateOrderInvoicePdf } from "../src/services/invoice.js";
import {
  currentOrderYearKolkata,
  formatOrderNumber,
  nextOrderSequenceNo,
} from "../src/services/orderNumber.js";
import { buildOrderTrackingUrl } from "../src/utils/orderAccess.js";
import { moneyNumber, roundMoney } from "../src/utils/money.js";
import { prisma } from "../src/utils/prisma.js";
import type { OrderTx } from "../src/services/orderInventory.js";

const DEFAULT_TO = "akshay96102@gmail.com";

const TEST_SHIP = {
  name: "Akshay Pareek",
  phone: "9876543210",
  line1: "QA test address — not a live shipment",
  line2: null as string | null,
  city: "Raipur",
  state: "Chhattisgarh",
  pincode: "492001",
  country: "IN",
};

/**
 * Picks any active published SKU to put on the test order.
 */
async function pickVariant() {
  const variant = await prisma.productVariant.findFirst({
    where: { isActive: true, product: { visibility: "PUBLISHED" } },
    include: { product: { select: { name: true } } },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });
  if (!variant) {
    throw new Error("No active published product variant — seed the catalog first.");
  }
  return variant;
}

/**
 * Inserts a CONFIRMED COD guest order without touching inventory.
 *
 * @param to guest email that receives the confirmation
 * @param variant catalog line used on the invoice
 */
async function createTestOrder(
  to: string,
  variant: Awaited<ReturnType<typeof pickVariant>>,
) {
  const qty = 1;
  const unit = roundMoney(moneyNumber(variant.priceSale));
  const lineTotal = roundMoney(unit * qty);
  const now = new Date();

  return prisma.$transaction(async (tx: OrderTx) => {
    const year = currentOrderYearKolkata();
    const seq = await nextOrderSequenceNo(tx, year);
    const orderNumber = formatOrderNumber(year, seq);
    const amount = new Prisma.Decimal(lineTotal.toFixed(2));

    return tx.order.create({
      data: {
        orderNumber,
        guestEmail: to,
        guestPhone: TEST_SHIP.phone,
        status: "CONFIRMED",
        paymentMethod: "COD",
        subtotal: amount,
        discountAmount: new Prisma.Decimal("0"),
        shippingAmount: new Prisma.Decimal("0"),
        codCharge: new Prisma.Decimal("0"),
        taxAmount: new Prisma.Decimal("0"),
        total: amount,
        currency: "INR",
        shippingAddress: TEST_SHIP,
        billingAddress: TEST_SHIP,
        notes: "TEST order — confirmation email QA. Do not fulfil / push to Shiprocket.",
        confirmedAt: now,
        items: {
          create: {
            variantId: variant.id,
            productName: variant.product.name,
            variantName: variant.name,
            sku: variant.sku,
            unitPrice: amount,
            quantity: qty,
            lineTotal: amount,
          },
        },
        payments: {
          create: {
            method: "COD",
            status: "CAPTURED",
            amount,
          },
        },
        events: {
          create: [
            { type: "ORDER_PLACED", payload: { source: "email_qa_script" } },
            { type: "ORDER_CONFIRMED", payload: { source: "email_qa_script" } },
          ],
        },
      },
    });
  });
}

/**
 * Generates the GST invoice and sends the same confirmation email production uses.
 *
 * @param orderId order row id
 * @param orderNumber public order number
 * @param to recipient inbox
 */
async function sendConfirmationWithInvoice(orderId: string, orderNumber: string, to: string) {
  const invoice = await ensureOrderInvoice(orderId);

  let attachments: { filename: string; contentBase64: string }[] | undefined;
  try {
    const pdfBuf = await generateOrderInvoicePdf(orderId);
    attachments = [{ filename: `invoice-${orderNumber}.pdf`, contentBase64: pdfBuf.toString("base64") }];
  } catch (err) {
    console.error("Invoice PDF attach failed — sending confirmation without PDF:", err);
    attachments = undefined;
  }

  const tpl = templates.orderConfirmedEmail({
    name: TEST_SHIP.name,
    orderNumber,
    invoiceNumber: invoice.invoiceNumber,
    invoiceUrl: invoice.invoicePdfUrl,
    siteUrl: buildOrderTrackingUrl(orderNumber),
  });

  const sent = await sendEmail({
    to,
    subject: tpl.subject,
    html: tpl.html,
    text: tpl.text,
    template: "order_confirmed",
    refType: "ORDER",
    refId: orderId,
    attachments,
  });

  return { invoice, sent, attachedPdf: Boolean(attachments) };
}

/**
 * Creates the test order and prints SMTP/Resend result.
 */
async function main(): Promise<void> {
  const to = (process.argv[2] ?? DEFAULT_TO).toLowerCase().trim();
  if (!to.includes("@")) {
    throw new Error("Pass a valid email: npx tsx scripts/send-test-order-confirmation.ts you@gmail.com");
  }

  const provider = env.SMTP_HOST ? "SMTP" : env.RESEND_API_KEY ? "Resend" : "stub (no SMTP/Resend — check API logs)";
  console.log(`Provider: ${provider}`);
  console.log(`EMAIL_FROM: ${env.EMAIL_FROM}`);
  console.log(`To: ${to}`);

  const variant = await pickVariant();
  const order = await createTestOrder(to, variant);
  console.log(`Order: ${order.orderNumber} (${order.id})`);
  console.log(`SKU: ${variant.sku}  ₹${moneyNumber(order.total).toFixed(2)}`);

  const { invoice, sent, attachedPdf } = await sendConfirmationWithInvoice(order.id, order.orderNumber, to);

  console.log(`Invoice: ${invoice.invoiceNumber}${invoice.invoicePdfUrl ? `  ${invoice.invoicePdfUrl}` : ""}`);
  console.log(`PDF attached: ${attachedPdf ? "yes" : "no"}`);
  console.log(
    sent.ok
      ? `SENT  provider=${sent.provider}  messageId=${sent.messageId ?? "—"}`
      : `FAIL  provider=${sent.provider}  ${sent.suppressed ? "suppressed" : sent.error ?? "unknown"}`,
  );

  if (!sent.ok) {
    process.exitCode = 1;
    if (!env.SMTP_HOST && !env.RESEND_API_KEY) {
      console.error("No SMTP_HOST or RESEND_API_KEY — email was stubbed, not delivered.");
    }
  } else {
    console.log(`\nCheck inbox + spam for ${to}. Subject: Order confirmed — ${order.orderNumber}`);
  }
}

void main()
  .catch(async (err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect().catch(() => undefined);
  });
