/**
 * Email delivery service.
 *
 * Behaviour (first match wins):
 *  - If `SMTP_HOST` is set — send via SMTP (`nodemailer`).
 *  - Else if `RESEND_API_KEY` is set — send via Resend.
 *  - Else — stub: log body to console / `EmailLog` (OTP still visible locally).
 *
 * Honours EmailSuppression (bounced / complained / unsubscribed never re-sent).
 */
import nodemailer from "nodemailer";
import { Resend } from "resend";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";
import { prisma } from "../utils/prisma.js";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

const smtpSecure = env.SMTP_SECURE ?? env.SMTP_PORT === 465;

const smtpTransporter = env.SMTP_HOST
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: smtpSecure,
      auth:
        env.SMTP_USER !== undefined && env.SMTP_USER !== ""
          ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD ?? "" }
          : undefined,
      tls: env.SMTP_TLS_REJECT_UNAUTHORIZED ? undefined : { rejectUnauthorized: false },
    })
  : null;

export type SendEmailArgs = {
  to: string;
  subject: string;
  html: string;
  text: string;
  template: string; // identifier — "otp_verify", "password_reset", etc.
  refType?: string; // e.g. "USER", "ORDER"
  refId?: string;
  /** Provider attachments — binary as base64. */
  attachments?: { filename: string; contentBase64: string }[];
  headers?: Record<string, string>;
};

export type SendEmailResult = {
  ok: boolean;
  provider: "resend" | "smtp" | "stub";
  messageId?: string;
  error?: string;
  suppressed?: boolean;
};

/**
 * Persists a failed send to `EmailLog` and returns a structured error result.
 */
async function logEmailFailure(
  args: SendEmailArgs,
  to: string,
  provider: "resend" | "smtp",
  message: string,
): Promise<SendEmailResult> {
  logger.error({ to, template: args.template, provider }, "email send failed");
  await prisma.emailLog.create({
    data: {
      to,
      template: args.template,
      refType: args.refType,
      refId: args.refId,
      status: "FAILED",
      provider,
      error: message,
    },
  });
  return { ok: false, provider, error: message };
}

export async function sendEmail(args: SendEmailArgs): Promise<SendEmailResult> {
  const to = args.to.toLowerCase().trim();

  const suppressed = await prisma.emailSuppression.findUnique({ where: { email: to } });
  if (suppressed) {
    logger.warn({ to, template: args.template, reason: suppressed.reason }, "email suppressed");
    await prisma.emailLog.create({
      data: {
        to,
        template: args.template,
        refType: args.refType,
        refId: args.refId,
        status: "SUPPRESSED",
        error: `Suppressed: ${suppressed.reason}`,
      },
    });
    return { ok: false, provider: "stub", suppressed: true, error: "Recipient is on suppression list" };
  }

  if (smtpTransporter) {
    try {
      const info = await smtpTransporter.sendMail({
        from: env.EMAIL_FROM,
        to,
        subject: args.subject,
        text: args.text,
        html: args.html,
        headers: args.headers,
        attachments: args.attachments?.map((a) => ({
          filename: a.filename,
          content: Buffer.from(a.contentBase64, "base64"),
        })),
      });
      const messageId = info.messageId?.replace(/[<>]/g, "");
      await prisma.emailLog.create({
        data: {
          to,
          template: args.template,
          refType: args.refType,
          refId: args.refId,
          status: "SENT",
          provider: "smtp",
          providerMessageId: messageId,
        },
      });
      return { ok: true, provider: "smtp", messageId };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown SMTP error";
      return logEmailFailure(args, to, "smtp", msg);
    }
  }

  if (!resend) {
    logger.info(
      { to, subject: args.subject, template: args.template, body: args.text.slice(0, 200) },
      "✉️  [STUB] email send (no SMTP_HOST or RESEND_API_KEY)",
    );
    // eslint-disable-next-line no-console
    console.log(`\n──────── EMAIL STUB ────────\nTo: ${to}\nSubject: ${args.subject}\n\n${args.text}\n────────────────────────────\n`);
    await prisma.emailLog.create({
      data: {
        to,
        template: args.template,
        refType: args.refType,
        refId: args.refId,
        status: "STUB_SENT",
        provider: "stub",
      },
    });
    return { ok: true, provider: "stub" };
  }

  try {
    const result = await resend.emails.send({
      from: env.EMAIL_FROM,
      to,
      subject: args.subject,
      html: args.html,
      text: args.text,
      attachments: args.attachments?.map((a) => ({
        filename: a.filename,
        content: Buffer.from(a.contentBase64, "base64"),
      })),
      headers: args.headers,
    });
    if (result.error) {
      throw new Error(result.error.message);
    }
    const messageId = result.data?.id;
    await prisma.emailLog.create({
      data: {
        to,
        template: args.template,
        refType: args.refType,
        refId: args.refId,
        status: "SENT",
        provider: "resend",
        providerMessageId: messageId,
      },
    });
    return { ok: true, provider: "resend", messageId };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown email error";
    return logEmailFailure(args, to, "resend", msg);
  }
}
