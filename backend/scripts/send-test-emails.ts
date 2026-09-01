/**
 * Sends every transactional email template to a test inbox (OTP, invoice, order lifecycle).
 *
 * Usage (from backend/): `npx tsx scripts/send-test-emails.ts you@gmail.com`
 */
import PDFDocument from "pdfkit";

import * as templates from "../src/emails/templates.js";
import { env } from "../src/config/env.js";
import { sendEmail } from "../src/services/email.js";
import { generateOrderInvoicePdf } from "../src/services/invoice.js";
import { prisma } from "../src/utils/prisma.js";

const DEFAULT_TO = "akshay96102@gmail.com";

/**
 * Builds a one-page sample tax invoice when no confirmed order exists.
 */
async function sampleInvoicePdf(): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 48 });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.fontSize(18).text("Tax Invoice (TEST)", { align: "center" });
    doc.moveDown();
    doc.fontSize(11).text(env.INVOICE_SELLER_NAME ?? "DiteUp");
    doc.text(`GSTIN: ${env.INVOICE_SELLER_GSTIN ?? "—"}`);
    doc.text("Invoice No: DU/TEST/0001");
    doc.text("Order: TEST-EMAIL-SUITE");
    doc.moveDown();
    doc.text("Bill to: Akshay Pareek");
    doc.text("Test address — not a live sale.");
    doc.moveDown();
    doc.text("Energy Bite 750g  × 1    ₹499.00");
    doc.text("Grand total: ₹499.00");
    doc.end();
  });
}

/**
 * Runs all template sends and prints per-template SMTP/Resend results.
 */
async function main(): Promise<void> {
  const to = (process.argv[2] ?? DEFAULT_TO).toLowerCase().trim();
  if (!to.includes("@")) {
    throw new Error("Pass a valid email: npx tsx scripts/send-test-emails.ts you@gmail.com");
  }

  const siteUrl = env.PUBLIC_SITE_URL ?? "http://localhost:3000";
  const orderNumber = "TEST-EMAIL-SUITE";
  let invoicePdf = await sampleInvoicePdf();
  let invoiceNumber: string | null = "DU/TEST/0001";
  let invoiceUrl: string | null = null;

  const live = await prisma.order.findFirst({
    where: { status: { in: ["CONFIRMED", "SHIPPED", "DELIVERED"] }, invoiceNumber: { not: null } },
    orderBy: { placedAt: "desc" },
    select: { id: true, orderNumber: true, invoiceNumber: true, invoicePdfUrl: true },
  });
  if (live?.invoiceNumber) {
    try {
      invoicePdf = await generateOrderInvoicePdf(live.id);
      invoiceNumber = live.invoiceNumber;
      invoiceUrl = live.invoicePdfUrl;
    } catch (err) {
      console.error("Live invoice PDF failed, using sample:", err instanceof Error ? err.message : err);
    }
  }

  const jobs: { template: string; run: () => ReturnType<typeof sendEmail> }[] = [
    {
      template: "otp_verify",
      run: () =>
        sendEmail({
          to,
          ...templates.otpVerifyEmail({ code: "482913", name: "Akshay" }),
          template: "otp_verify",
        }),
    },
    {
      template: "password_reset",
      run: () =>
        sendEmail({
          to,
          ...templates.passwordResetEmail({ code: "719204", name: "Akshay" }),
          template: "password_reset",
        }),
    },
    {
      template: "email_change_new",
      run: () =>
        sendEmail({
          to,
          ...templates.emailChangeOtpEmail({ code: "330155", name: "Akshay", sentTo: "new" }),
          template: "email_change_new",
        }),
    },
    {
      template: "email_change_old",
      run: () =>
        sendEmail({
          to,
          ...templates.emailChangeOtpEmail({ code: "881042", name: "Akshay", sentTo: "current" }),
          template: "email_change_old",
        }),
    },
    {
      template: "welcome",
      run: () => sendEmail({ to, ...templates.welcomeEmail({ name: "Akshay" }), template: "welcome" }),
    },
    {
      template: "review_live",
      run: () =>
        sendEmail({
          to,
          ...templates.reviewLiveEmail({ name: "Akshay", productName: "Energy Bite" }),
          template: "review_live",
        }),
    },
    {
      template: "broadcast",
      run: () =>
        sendEmail({
          to,
          ...templates.broadcastEmail({
            subject: "[TEST] DiteUp broadcast",
            bodyHtml: "<p>This is a test marketing broadcast.</p>",
          }),
          template: "broadcast",
        }),
    },
    {
      template: "back_in_stock",
      run: () =>
        sendEmail({
          to,
          ...templates.backInStockEmail({ productName: "Energy Bite", variantName: "750g" }),
          template: "back_in_stock",
        }),
    },
    {
      template: "order_placed_pending",
      run: () =>
        sendEmail({
          to,
          ...templates.orderPlacedPendingPayEmail({
            name: "Akshay",
            orderNumber,
            total: "₹499.00",
            siteUrl,
          }),
          template: "order_placed_pending",
        }),
    },
    {
      template: "order_confirmed",
      run: () =>
        sendEmail({
          to,
          ...templates.orderConfirmedEmail({
            name: "Akshay",
            orderNumber: live?.orderNumber ?? orderNumber,
            invoiceNumber,
            invoiceUrl,
            siteUrl,
          }),
          template: "order_confirmed",
          attachments: [
            { filename: `invoice-${live?.orderNumber ?? orderNumber}.pdf`, contentBase64: invoicePdf.toString("base64") },
          ],
        }),
    },
    {
      template: "order_shipped",
      run: () =>
        sendEmail({
          to,
          ...templates.orderShippedEmail({
            name: "Akshay",
            orderNumber,
            carrier: "Delhivery",
            awb: "TESTAWB123",
            siteUrl,
          }),
          template: "order_shipped",
        }),
    },
    {
      template: "order_delivered",
      run: () =>
        sendEmail({
          to,
          ...templates.orderDeliveredEmail({ name: "Akshay", orderNumber, siteUrl }),
          template: "order_delivered",
        }),
    },
    {
      template: "order_cancelled",
      run: () =>
        sendEmail({
          to,
          ...templates.orderCancelledEmail({ name: "Akshay", orderNumber, reason: "Test cancellation" }),
          template: "order_cancelled",
        }),
    },
    {
      template: "refund_processed",
      run: () =>
        sendEmail({
          to,
          ...templates.refundProcessedEmail({ name: "Akshay", orderNumber, amount: "₹499.00" }),
          template: "refund_processed",
        }),
    },
    {
      template: "admin_new_order",
      run: () =>
        sendEmail({
          to,
          ...templates.adminNewOrderEmail({
            orderNumber,
            total: "₹499.00",
            paymentMethod: "RAZORPAY",
          }),
          template: "admin_new_order",
        }),
    },
    {
      template: "low_stock_digest",
      run: () =>
        sendEmail({
          to,
          subject: "[TEST] Low stock alert: ENERGY-BITE-750 (1 SKU)",
          html: "<pre>ENERGY-BITE-750\t3\tthreshold 10</pre>",
          text: "ENERGY-BITE-750\t3\tthreshold 10",
          template: "low_stock_digest",
        }),
    },
  ];

  console.log(`Sending ${jobs.length} templates to ${to} via ${env.SMTP_HOST ? "SMTP" : "Resend/stub"}`);
  console.log(`EMAIL_FROM=${env.EMAIL_FROM}`);

  let failed = 0;
  for (const job of jobs) {
    const r = await job.run();
    const flag = r.ok ? "OK" : "FAIL";
    if (!r.ok) failed += 1;
    console.log(`${flag}  ${job.template}  provider=${r.provider}${r.error ? `  ${r.error}` : ""}`);
  }

  await prisma.$disconnect();
  if (failed > 0) {
    process.exitCode = 1;
    console.error(`\n${failed}/${jobs.length} failed. Gmail 535 = App Password is wrong/revoked. Create one at https://myaccount.google.com/apppasswords for ${env.SMTP_USER ?? "SMTP_USER"} and put it in SMTP_PASSWORD (no spaces).`);
  } else {
    console.log(`\nAll ${jobs.length} sent. Check inbox + spam for ${to}.`);
  }
}

void main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect().catch(() => undefined);
  process.exit(1);
});
