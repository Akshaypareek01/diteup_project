/**
 * Email body templates for transactional emails.
 *
 * Simple HTML strings for v1. Phase 2 can swap in `react-email` components.
 * Every template returns { subject, html, text } so the email service can
 * deliver via Resend (HTML preferred) or downgrade to text-only if needed.
 */

const wrap = (innerHtml: string, preheader: string): string => `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>DiteUp</title></head>
<body style="margin:0;padding:0;background:#F5F0E6;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#0F1F18;">
<span style="display:none;font-size:0;line-height:0;color:#F5F0E6;">${preheader}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr><td align="center" style="padding:32px 16px;">
    <table role="presentation" width="560" style="max-width:560px;background:#FAF7EF;border:1px solid #D9CFB8;border-radius:16px;">
      <tr><td style="padding:32px 32px 16px;">
        <div style="font-family:Georgia,serif;font-size:24px;font-weight:700;color:#1F3D2E;">DiteUp</div>
        <div style="font-size:11px;letter-spacing:0.14em;color:#6B7B72;text-transform:uppercase;margin-top:4px;">Nourish · Elevate · Repeat</div>
      </td></tr>
      <tr><td style="padding:0 32px 32px;">${innerHtml}</td></tr>
      <tr><td style="padding:16px 32px 32px;border-top:1px solid #D9CFB8;">
        <p style="font-size:12px;color:#6B7B72;margin:0;">
          If you didn't request this, you can ignore this email.<br>
          NVHO Tech Pvt. Ltd. · GSTIN 08AAJCN8501H1ZC
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;

export type EmailTemplate = { subject: string; html: string; text: string };

export function otpVerifyEmail(args: { code: string; name?: string }): EmailTemplate {
  const greeting = args.name ? `Hi ${args.name},` : "Hi,";
  const subject = `Your DiteUp verification code: ${args.code}`;
  const text = `${greeting}\n\nYour DiteUp verification code is: ${args.code}\n\nThis code expires in 10 minutes. If you didn't request this, please ignore.\n\n— Team DiteUp`;
  const html = wrap(
    `
    <p style="font-size:16px;line-height:1.6;margin:0 0 16px;">${greeting}</p>
    <p style="font-size:16px;line-height:1.6;margin:0 0 24px;">Use the code below to verify your email and finish creating your DiteUp account.</p>
    <div style="background:#1F3D2E;color:#F5F0E6;font-size:32px;font-weight:600;letter-spacing:0.4em;text-align:center;padding:24px;border-radius:12px;margin:0 0 24px;">${args.code}</div>
    <p style="font-size:14px;color:#3A4A41;margin:0 0 8px;">This code expires in <strong>10 minutes</strong>.</p>
    <p style="font-size:14px;color:#3A4A41;margin:0;">Didn't sign up? You can safely ignore this email.</p>
    `,
    "Your DiteUp verification code",
  );
  return { subject, html, text };
}

export function passwordResetEmail(args: { code: string; name?: string }): EmailTemplate {
  const greeting = args.name ? `Hi ${args.name},` : "Hi,";
  const subject = `DiteUp password reset code: ${args.code}`;
  const text = `${greeting}\n\nYour DiteUp password reset code is: ${args.code}\n\nIt expires in 10 minutes. If you didn't request this, please ignore — your account is safe.\n\n— Team DiteUp`;
  const html = wrap(
    `
    <p style="font-size:16px;line-height:1.6;margin:0 0 16px;">${greeting}</p>
    <p style="font-size:16px;line-height:1.6;margin:0 0 24px;">Use the code below to reset your DiteUp password.</p>
    <div style="background:#1F3D2E;color:#F5F0E6;font-size:32px;font-weight:600;letter-spacing:0.4em;text-align:center;padding:24px;border-radius:12px;margin:0 0 24px;">${args.code}</div>
    <p style="font-size:14px;color:#3A4A41;margin:0 0 8px;">This code expires in <strong>10 minutes</strong>.</p>
    <p style="font-size:14px;color:#3A4A41;margin:0;">If you didn't request a reset, ignore this email — your password stays the same.</p>
    `,
    "Reset your DiteUp password",
  );
  return { subject, html, text };
}

/**
 * OTP for confirming a pending email change — sent to the new address first,
 * then to the current address (PRD §6.6.4 / §16 #75).
 */
export function emailChangeOtpEmail(args: {
  code: string;
  name?: string;
  /** Which inbox received this message — copy differs slightly. */
  sentTo: "new" | "current";
}): EmailTemplate {
  const greeting = args.name ? `Hi ${args.name},` : "Hi,";
  const isNew = args.sentTo === "new";
  const subject = isNew
    ? `Confirm your new DiteUp email`
    : `Approve email change on your DiteUp account`;
  const text = isNew
    ? `${greeting}\n\nUse this code to confirm you can receive mail at your new DiteUp email address: ${args.code}\n\nNext we will send a code to your current email to complete the change.\n\n— Team DiteUp`
    : `${greeting}\n\nSomeone requested to change your DiteUp login email. Use this code to approve the change: ${args.code}\n\nIf this wasn't you, contact support immediately.\n\n— Team DiteUp`;
  const html = wrap(
    isNew
      ? `
    <p style="font-size:16px;line-height:1.6;margin:0 0 16px;">${greeting}</p>
    <p style="font-size:16px;line-height:1.6;margin:0 0 24px;">Confirm your new email for DiteUp with this code:</p>
    <div style="background:#1F3D2E;color:#F5F0E6;font-size:32px;font-weight:600;letter-spacing:0.4em;text-align:center;padding:24px;border-radius:12px;margin:0 0 24px;">${args.code}</div>
    <p style="font-size:14px;color:#3A4A41;margin:0;">After this step, we will email a second code to your <strong>current</strong> address to finish the update.</p>
    `
      : `
    <p style="font-size:16px;line-height:1.6;margin:0 0 16px;">${greeting}</p>
    <p style="font-size:16px;line-height:1.6;margin:0 0 24px;">An email change was requested. Approve it with this code:</p>
    <div style="background:#1F3D2E;color:#F5F0E6;font-size:32px;font-weight:600;letter-spacing:0.4em;text-align:center;padding:24px;border-radius:12px;margin:0 0 24px;">${args.code}</div>
    <p style="font-size:14px;color:#3A4A41;margin:0;">If you did not request this, please secure your account and contact support.</p>
    `,
    isNew ? "Confirm your new DiteUp email" : "Approve your DiteUp email change",
  );
  return { subject, html, text };
}

export function welcomeEmail(args: { name?: string }): EmailTemplate {
  const greeting = args.name ? `Welcome to DiteUp, ${args.name}!` : "Welcome to DiteUp!";
  const subject = greeting;
  const text = `${greeting}\n\nYou're all set. Real ingredients, real nutrition — one pouch at a time.\n\nVisit https://diteup.com to start your journey.\n\n— Team DiteUp`;
  const html = wrap(
    `
    <h2 style="font-family:Georgia,serif;font-size:28px;color:#1F3D2E;margin:0 0 16px;">${greeting}</h2>
    <p style="font-size:16px;line-height:1.6;margin:0 0 24px;">You're all set. Real ingredients, real nutrition — one pouch at a time.</p>
    <p style="margin:0 0 24px;"><a href="https://diteup.com" style="background:#C8A24A;color:#1F3D2E;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;display:inline-block;">Start your journey</a></p>
    `,
    "Welcome to DiteUp",
  );
  return { subject, html, text };
}

/**
 * Customer notification when a submitted review is approved (PRD §6.7.3).
 */
export function reviewLiveEmail(args: { name?: string; productName?: string | null }): EmailTemplate {
  const greeting = args.name ? `Hi ${args.name},` : "Hi,";
  const subject = "Your DiteUp review is live";
  const text = `${greeting}\n\nThanks — your review${
    args.productName ? ` for “${args.productName}”` : ""
  } is now published on our site.\n\n— Team DiteUp`;
  const html = wrap(
    `
    <p style="font-size:16px;line-height:1.6;margin:0 0 16px;">${greeting}</p>
    <p style="font-size:16px;line-height:1.6;margin:0 0 24px;">Thanks — your review${
      args.productName
        ? ` for <strong>${args.productName}</strong>`
        : ""
    } is now <strong>published</strong> on our storefront.</p>
    `,
    "Your review is live",
  );
  return { subject, html, text };
}

/**
 * Marketing / broadcast — arbitrary HTML subject+body (admin-composed).
 */
export function broadcastEmail(args: { subject: string; bodyHtml: string }): EmailTemplate {
  const subject = args.subject.trim();
  const html = wrap(args.bodyHtml, subject.slice(0, 120));
  const text = args.bodyHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return { subject, html, text };
}

/**
 * Back-in-stock alert for waitlist signups.
 */
export function backInStockEmail(args: { productName: string; variantName?: string }): EmailTemplate {
  const piece = args.variantName
    ? `${args.productName} — ${args.variantName}`
    : args.productName;
  const subject = `${piece} is back in stock`;
  const text = `Good news — "${piece}" is available again on DiteUp.\n\nShop now: https://diteup.com\n\n— Team DiteUp`;
  const html = wrap(
    `
    <p style="font-size:16px;line-height:1.6;margin:0 0 16px;">Good news — <strong>${piece}</strong> is available again.</p>
    <p style="margin:0 0 24px;"><a href="https://diteup.com" style="background:#C8A24A;color:#1F3D2E;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;display:inline-block;">Shop now</a></p>
    `,
    subject,
  );
  return { subject, html, text };
}

// ---- Order lifecycle (PRD §10.1) ----

export function orderPlacedPendingPayEmail(args: {
  name?: string | null;
  orderNumber: string;
  total: string;
  siteUrl: string;
}): EmailTemplate {
  const greeting = args.name ? `Hi ${args.name},` : "Hi,";
  const subject = `We received your order #${args.orderNumber}`;
  const text = `${greeting}\n\nWe received order ${args.orderNumber} (total ${args.total}). Complete payment to confirm.\n\nView order: ${args.siteUrl}\n\n— Team DiteUp`;
  const html = wrap(
    `
    <p style="font-size:16px;line-height:1.6;margin:0 0 16px;">${greeting}</p>
    <p style="font-size:16px;line-height:1.6;margin:0 0 16px;">We received your order <strong>#${args.orderNumber}</strong> — total <strong>${args.total}</strong>. Please complete payment to confirm.</p>
    <p style="margin:0 0 24px;"><a href="${args.siteUrl}" style="background:#C8A24A;color:#1F3D2E;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;display:inline-block;">View order</a></p>
    `,
    subject,
  );
  return { subject, html, text };
}

export function orderConfirmedEmail(args: {
  name?: string | null;
  orderNumber: string;
  invoiceNumber?: string | null;
  invoiceUrl?: string | null;
  siteUrl: string;
}): EmailTemplate {
  const greeting = args.name ? `Hi ${args.name},` : "Hi,";
  const subject = `Order confirmed — ${args.orderNumber}`;
  const invLine = args.invoiceUrl
    ? `Invoice: ${args.invoiceUrl}\n`
    : args.invoiceNumber
      ? `Invoice no.: ${args.invoiceNumber}\n`
      : "";
  const text = `${greeting}\n\nYour order ${args.orderNumber} is confirmed.\n${invLine}\nTrack: ${args.siteUrl}\n\n— Team DiteUp`;
  const invHtml = args.invoiceUrl
    ? `<p style="font-size:16px;line-height:1.6;margin:0 0 16px;">Your tax invoice is <a href="${args.invoiceUrl}">available here</a>.</p>`
    : args.invoiceNumber
      ? `<p style="font-size:16px;line-height:1.6;margin:0 0 16px;">Invoice no. <strong>${args.invoiceNumber}</strong> (PDF will follow in a separate email if storage is configured).</p>`
      : "";
  const html = wrap(
    `
    <p style="font-size:16px;line-height:1.6;margin:0 0 16px;">${greeting}</p>
    <p style="font-size:16px;line-height:1.6;margin:0 0 16px;">Your order <strong>#${args.orderNumber}</strong> is <strong>confirmed</strong>. Thank you for shopping with DiteUp.</p>
    ${invHtml}
    <p style="margin:0 0 24px;"><a href="${args.siteUrl}" style="background:#C8A24A;color:#1F3D2E;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;display:inline-block;">Track order</a></p>
    `,
    subject,
  );
  return { subject, html, text };
}

export function orderShippedEmail(args: {
  name?: string | null;
  orderNumber: string;
  carrier?: string | null;
  awb?: string | null;
  siteUrl: string;
}): EmailTemplate {
  const greeting = args.name ? `Hi ${args.name},` : "Hi,";
  const subject = `Your order #${args.orderNumber} is on the way`;
  const track = [args.carrier, args.awb].filter(Boolean).join(" · ");
  const text = `${greeting}\n\nOrder ${args.orderNumber} has shipped.${track ? ` ${track}` : ""}\n\n${args.siteUrl}\n\n— Team DiteUp`;
  const html = wrap(
    `
    <p style="font-size:16px;line-height:1.6;margin:0 0 16px;">${greeting}</p>
    <p style="font-size:16px;line-height:1.6;margin:0 0 16px;">Great news — order <strong>#${args.orderNumber}</strong> is on the way.</p>
    ${track ? `<p style="font-size:14px;color:#3A4A41;margin:0 0 16px;">Carrier / AWB: <strong>${track}</strong></p>` : ""}
    <p style="margin:0 0 24px;"><a href="${args.siteUrl}" style="background:#C8A24A;color:#1F3D2E;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;display:inline-block;">Track delivery</a></p>
    `,
    subject,
  );
  return { subject, html, text };
}

export function orderDeliveredEmail(args: {
  name?: string | null;
  orderNumber: string;
  siteUrl: string;
}): EmailTemplate {
  const greeting = args.name ? `Hi ${args.name},` : "Hi,";
  const subject = `Delivered — how was order #${args.orderNumber}?`;
  const text = `${greeting}\n\nOrder ${args.orderNumber} shows as delivered. We would love your feedback.\n\n${args.siteUrl}\n\n— Team DiteUp`;
  const html = wrap(
    `
    <p style="font-size:16px;line-height:1.6;margin:0 0 16px;">${greeting}</p>
    <p style="font-size:16px;line-height:1.6;margin:0 0 16px;">Order <strong>#${args.orderNumber}</strong> is marked <strong>delivered</strong>. We hope you enjoy it — leave a review when you can.</p>
    <p style="margin:0 0 24px;"><a href="${args.siteUrl}" style="background:#C8A24A;color:#1F3D2E;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;display:inline-block;">View order</a></p>
    `,
    subject,
  );
  return { subject, html, text };
}

export function orderCancelledEmail(args: {
  name?: string | null;
  orderNumber: string;
  reason?: string | null;
}): EmailTemplate {
  const greeting = args.name ? `Hi ${args.name},` : "Hi,";
  const subject = `Your order #${args.orderNumber} has been cancelled`;
  const text = `${greeting}\n\nOrder ${args.orderNumber} was cancelled.${args.reason ? ` Reason: ${args.reason}` : ""}\n\n— Team DiteUp`;
  const html = wrap(
    `
    <p style="font-size:16px;line-height:1.6;margin:0 0 16px;">${greeting}</p>
    <p style="font-size:16px;line-height:1.6;margin:0 0 16px;">Order <strong>#${args.orderNumber}</strong> has been <strong>cancelled</strong>.</p>
    ${args.reason ? `<p style="font-size:14px;color:#3A4A41;margin:0;">Reason: ${args.reason}</p>` : ""}
    `,
    subject,
  );
  return { subject, html, text };
}

export function refundProcessedEmail(args: {
  name?: string | null;
  orderNumber: string;
  amount: string;
}): EmailTemplate {
  const greeting = args.name ? `Hi ${args.name},` : "Hi,";
  const subject = `Refund processed for #${args.orderNumber}`;
  const text = `${greeting}\n\nWe processed a refund of ${args.amount} for order ${args.orderNumber}. It may take 5–7 bank days to reflect.\n\n— Team DiteUp`;
  const html = wrap(
    `
    <p style="font-size:16px;line-height:1.6;margin:0 0 16px;">${greeting}</p>
    <p style="font-size:16px;line-height:1.6;margin:0;">We processed a <strong>refund of ${args.amount}</strong> for order <strong>#${args.orderNumber}</strong>. Please allow a few bank days for it to appear.</p>
    `,
    subject,
  );
  return { subject, html, text };
}

export function adminNewOrderEmail(args: { orderNumber: string; total: string; paymentMethod: string }): EmailTemplate {
  const subject = `🛒 New order #${args.orderNumber}`;
  const text = `New order ${args.orderNumber}\nTotal: ${args.total}\nPayment: ${args.paymentMethod}\n\n— DiteUp`;
  const html = wrap(
    `
    <p style="font-size:16px;line-height:1.6;margin:0 0 8px;"><strong>New order</strong> <strong>#${args.orderNumber}</strong></p>
    <p style="font-size:14px;color:#3A4A41;margin:0;">Total: <strong>${args.total}</strong> · Payment: ${args.paymentMethod}</p>
    `,
    subject,
  );
  return { subject, html, text };
}
