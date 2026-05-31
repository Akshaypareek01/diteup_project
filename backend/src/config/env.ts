/**
 * Centralized environment configuration with Zod validation.
 * Fails fast at boot if any required env is missing or malformed.
 */
import "dotenv/config";
import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),

  DATABASE_URL: z.string().url(),

  CORS_ORIGIN: z.string().default("http://localhost:3000"),

  // JWT
  JWT_ACCESS_SECRET: z.string().min(32, "JWT_ACCESS_SECRET must be ≥ 32 chars"),
  JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET must be ≥ 32 chars"),
  JWT_ACCESS_TTL: z.string().default("15m"),
  JWT_REFRESH_TTL: z.string().default("30d"),

  // External services (optional during early dev, required pre-launch)
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),

  RESEND_API_KEY: z.string().optional(),

  /** `From` header (RFC 5322 address or `Display Name <addr@domain>`). */
  EMAIL_FROM: z.string().min(3).default("DiteUp <no-reply@diteup.com>"),

  /** When set, transactional email uses SMTP (`nodemailer`). Takes priority over Resend. */
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().max(65535).default(587),
  /** Implicit TLS (e.g. port 465). If unset, true when `SMTP_PORT === 465`. */
  SMTP_SECURE: z.coerce.boolean().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  /** Set `false` only for dev (self-signed MITM-risk). Production should stay `true`. */
  SMTP_TLS_REJECT_UNAUTHORIZED: z.coerce.boolean().default(true),

  R2_ENDPOINT: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET: z.string().optional(),

  SENTRY_DSN: z.string().optional(),

  /** Meta Conversions API (optional, PRD §9.5) — overridden by `Setting` key `metaAds` when set. */
  META_PIXEL_ID: z.string().optional(),
  META_CAPI_ACCESS_TOKEN: z.string().optional(),

  /** Public site URL (marketing unsubscribe links, order tracking in emails). */
  PUBLIC_SITE_URL: z.string().url().optional(),

  /** GST invoice header overrides (PRD §9.4). */
  INVOICE_SELLER_NAME: z.string().optional(),
  INVOICE_SELLER_GSTIN: z.string().optional(),
  INVOICE_SELLER_STATE: z.string().optional(),

  /** When set, distributed rate limiter uses Redis (`redis` package). */
  REDIS_URL: z.string().optional(),

  /** When set, `/health/db` requires `X-Health-Secret` header in production. */
  HEALTHCHECK_SECRET: z.string().min(16).optional(),

  /** Resend webhook signing secret (optional; verifies `Resend`/`Svix` posts). */
  RESEND_WEBHOOK_SECRET: z.string().optional(),

  /** Max marketing broadcast emails per minute (PRD §10.2). */
  BROADCAST_EMAILS_PER_MINUTE: z.coerce.number().int().positive().default(100),

  /** Optional — when set (≥16 chars), admin settings API encrypts values for keys ending in `_SECRET` or `Secret`. */
  SETTINGS_ENCRYPTION_KEY: z.string().min(16).optional(),

  /** Enable in-process timers (Phase 10). Set false for some tests / workers. */
  ENABLE_BACKGROUND_JOBS: z.coerce.boolean().default(true),
  /** Unpaid Razorpay `PLACED` order sweep interval (PRD §10.2, default 15 min). */
  STALE_ORDER_JOB_INTERVAL_MS: z.coerce.number().int().positive().default(900_000),
  /** How often to drain `BackgroundJob` email rows (PRD §10.4). */
  JOB_EMAIL_QUEUE_POLL_MS: z.coerce.number().int().positive().default(15_000),

  /** Comma-separated — receives low-stock digest (PRD §10.6). */
  ADMIN_ALERT_EMAILS: z.string().optional(),
  /** Optional HTTP URL ping for backup verification (PRD §10.8). */
  BACKUP_VERIFY_URL: z.string().optional(),

  // Feature toggles
  ENABLE_DEBUG_LOGS: z.coerce.boolean().default(false),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error("❌ Invalid environment variables:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export type Env = z.infer<typeof EnvSchema>;
