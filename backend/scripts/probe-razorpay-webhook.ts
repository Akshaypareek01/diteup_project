/**
 * Probes POST /v1/webhooks/razorpay with HMAC-signed dummy payloads.
 * Does not confirm real orders (fake `order_id` / `pay_id` that do not exist in DB).
 *
 * Local:
 *   npm run razorpay:webhook-probe
 *
 * Production (use the **live** webhook secret, not test):
 *   npm run razorpay:webhook-probe -- --url https://diteup.com/v1/webhooks/razorpay --secret "$RAZORPAY_WEBHOOK_SECRET"
 *
 * Paid-but-cancelled audit (needs matching DB + Razorpay keys in `.env`):
 *   npm run razorpay:webhook-probe -- --audit --days 7
 */
import "dotenv/config";
import { createHmac } from "node:crypto";

const FAKE_ORDER_ID = "order_DU_WEBHOOK_PROBE";
const FAKE_PAYMENT_ID = "pay_DU_WEBHOOK_PROBE";
const PATH = "/v1/webhooks/razorpay";

type Args = {
  url: string;
  secret: string;
  audit: boolean;
  days: number;
};

type ProbeResult = {
  name: string;
  ok: boolean;
  detail: string;
};

type JsonObject = Record<string, unknown>;

/**
 * Parses `--url`, `--secret`, `--audit`, `--days` from argv / env.
 *
 * @param argv process.argv
 */
function parseArgs(argv: string[]): Args {
  const port = process.env.PORT?.trim() || "4000";
  let url = process.env.RAZORPAY_WEBHOOK_URL?.trim() || `http://127.0.0.1:${port}${PATH}`;
  let secret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim() || "";
  let audit = false;
  let days = 7;

  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--audit") {
      audit = true;
    } else if (a === "--url" || a === "--secret" || a === "--days") {
      const next = argv[++i];
      if (!next) throw new Error(`${a} requires a value`);
      if (a === "--url") url = next.trim();
      else if (a === "--secret") secret = next.trim();
      else days = Number.parseInt(next, 10);
    } else {
      throw new Error(`Unknown arg: ${a}`);
    }
  }

  if (!Number.isFinite(days) || days < 1 || days > 90) {
    throw new Error("--days must be 1–90");
  }
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    throw new Error(`--url must be http(s): ${url}`);
  }
  if (!url.includes("/webhooks/razorpay")) {
    url = url.replace(/\/$/, "") + PATH;
  }
  return { url, secret, audit, days };
}

/**
 * Builds a minimal Razorpay-shaped webhook JSON body.
 *
 * @param event Razorpay event name
 */
function webhookBody(event: string): string {
  return JSON.stringify({
    event,
    payload: {
      payment: {
        entity: {
          id: FAKE_PAYMENT_ID,
          order_id: FAKE_ORDER_ID,
          status: event === "payment.captured" ? "captured" : "authorized",
          amount: 49900,
          currency: "INR",
        },
      },
    },
  });
}

/**
 * Hex HMAC-SHA256 of the raw body (same as `verifyRazorpayWebhookSignature`).
 *
 * @param raw JSON body bytes
 * @param secret webhook secret
 */
function signBody(raw: Buffer, secret: string): string {
  return createHmac("sha256", secret).update(raw).digest("hex");
}

/**
 * POSTs one probe and returns status + parsed JSON (or a snippet of non-JSON).
 *
 * @param url webhook URL
 * @param raw raw JSON buffer
 * @param signature header value, or omit
 */
async function postWebhook(
  url: string,
  raw: Buffer,
  signature: string | undefined,
): Promise<{ status: number; json: JsonObject | null; text: string; contentType: string }> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (signature) headers["X-Razorpay-Signature"] = signature;

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: raw,
    signal: AbortSignal.timeout(15_000),
  });
  const text = await res.text();
  const contentType = res.headers.get("content-type") ?? "";
  let json: JsonObject | null = null;
  try {
    json = JSON.parse(text) as JsonObject;
  } catch {
    json = null;
  }
  return { status: res.status, json, text, contentType };
}

/**
 * Diagnoses a failed probe from status / body / content-type.
 *
 * @param got probe HTTP result
 */
function diagnose(got: Awaited<ReturnType<typeof postWebhook>>): string {
  const snippet = got.text.replace(/\s+/g, " ").slice(0, 180);
  if (got.contentType.includes("text/html") || got.text.trimStart().startsWith("<")) {
    return `HTML ${got.status} — URL is hitting Next/nginx, not the Express API`;
  }
  if (got.status === 422) {
    return `422 (raw body not a Buffer) — webhook must be mounted with express.raw before express.json`;
  }
  if (got.status === 400 && got.json?.error === "Invalid signature") {
    return `400 Invalid signature — RAZORPAY_WEBHOOK_SECRET on this server ≠ the secret you signed with`;
  }
  if (got.status === 402) {
    return `402 — dummy order_id collided with a real PLACED order (unexpected)`;
  }
  return `${got.status} ${snippet || "(empty)"}`;
}

/**
 * Runs the four HMAC / ignore-path checks against the live endpoint.
 *
 * @param url webhook URL
 * @param secret webhook secret
 */
async function runProbes(url: string, secret: string): Promise<ProbeResult[]> {
  const captured = Buffer.from(webhookBody("payment.captured"), "utf8");
  const authorized = Buffer.from(webhookBody("payment.authorized"), "utf8");
  const goodSig = signBody(captured, secret);
  const authSig = signBody(authorized, secret);

  const cases: {
    name: string;
    raw: Buffer;
    sig: string | undefined;
    expectStatus: number;
    expectIgnored?: string;
  }[] = [
    { name: "unsigned body rejected", raw: captured, sig: undefined, expectStatus: 400 },
    {
      name: "bad HMAC rejected",
      raw: captured,
      sig: "0".repeat(64),
      expectStatus: 400,
    },
    {
      name: "captured + unknown order accepted",
      raw: captured,
      sig: goodSig,
      expectStatus: 200,
      expectIgnored: "unknown order",
    },
    {
      name: "non-captured event ignored",
      raw: authorized,
      sig: authSig,
      expectStatus: 200,
      expectIgnored: "payment.authorized",
    },
  ];

  const results: ProbeResult[] = [];
  for (const c of cases) {
    try {
      const got = await postWebhook(url, c.raw, c.sig);
      const ignored = typeof got.json?.ignored === "string" ? got.json.ignored : "";
      const statusOk = got.status === c.expectStatus;
      const ignoredOk = c.expectIgnored ? ignored === c.expectIgnored : true;
      const sigRejectOk =
        c.expectStatus !== 400 || got.json?.error === "Invalid signature" || got.json?.ok === false;
      const ok = statusOk && ignoredOk && (c.expectStatus !== 400 || sigRejectOk);
      results.push({
        name: c.name,
        ok,
        detail: ok
          ? `${got.status}${ignored ? ` ignored="${ignored}"` : ""}`
          : diagnose(got),
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      results.push({
        name: c.name,
        ok: false,
        detail: msg.includes("ECONNREFUSED") ? `connection refused — API not listening at ${url}` : msg,
      });
    }
  }
  return results;
}

type RzpListedPayment = {
  id?: string;
  status?: string;
  order_id?: string;
  amount?: number;
  created_at?: number;
};

/**
 * Compares recent captured Razorpay payments against our Order/Payment rows.
 *
 * @param days lookback window
 */
async function runPaidCancelledAudit(days: number): Promise<number> {
  const { prisma } = await import("../src/utils/prisma.js");
  const { isRazorpayConfigured, getRazorpayClient } = await import("../src/services/razorpay.js");

  if (!isRazorpayConfigured()) {
    console.log("AUDIT SKIP: RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET missing");
    return 0;
  }

  const rzp = getRazorpayClient();
  const fromSec = Math.floor((Date.now() - days * 24 * 60 * 60 * 1000) / 1000);
  const mismatches: string[] = [];
  let scanned = 0;
  let skip = 0;

  while (skip < 500) {
    const page = (await rzp.payments.all({
      from: fromSec,
      count: 100,
      skip,
    })) as { items?: RzpListedPayment[]; count?: number };
    const items = Array.isArray(page.items) ? page.items : [];
    if (items.length === 0) break;

    for (const p of items) {
      if (p.status !== "captured" || !p.id || !p.order_id) continue;
      scanned += 1;
      const row = await prisma.payment.findFirst({
        where: {
          OR: [{ razorpayPaymentId: p.id }, { razorpayOrderId: p.order_id }],
        },
        include: { order: { select: { orderNumber: true, status: true, cancelReason: true } } },
      });
      if (!row) {
        mismatches.push(`${p.id}  captured on Razorpay, no Payment row (order ${p.order_id})`);
        continue;
      }
      const st = row.order.status;
      if (st === "CANCELLED" || st === "PLACED") {
        mismatches.push(
          `${row.order.orderNumber}  Razorpay captured ${p.id} but site status=${st}` +
            (row.order.cancelReason ? ` (${row.order.cancelReason})` : ""),
        );
      }
    }

    skip += items.length;
    if (items.length < 100) break;
  }

  console.log(`\n== Paid-vs-site audit (last ${days}d, scanned ${scanned} captured) ==`);
  if (mismatches.length === 0) {
    console.log("PASS  no captured Razorpay payments stuck as PLACED/CANCELLED/missing");
  } else {
    console.log(`FAIL  ${mismatches.length} mismatch(es):`);
    for (const line of mismatches) console.log(`  - ${line}`);
  }

  await prisma.$disconnect();
  return mismatches.length;
}

/**
 * CLI entry — probe webhook HMAC, optionally audit Razorpay vs DB.
 */
async function main(): Promise<void> {
  const args = parseArgs(process.argv);
  if (!args.secret) {
    throw new Error(
      "Set RAZORPAY_WEBHOOK_SECRET in .env or pass --secret. Must match the Razorpay dashboard secret for this environment.",
    );
  }

  const hostHint = args.url.includes("diteup.com") ? "PRODUCTION" : "LOCAL";
  console.log(`== Razorpay webhook probe (${hostHint}) ==`);
  console.log(`URL:     ${args.url}`);
  console.log(`Secret:  set (${args.secret.length} chars)`);
  console.log(`Dummy:   ${FAKE_ORDER_ID} / ${FAKE_PAYMENT_ID} (will not confirm a real order)\n`);

  const results = await runProbes(args.url, args.secret);
  let failed = 0;
  for (const r of results) {
    console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name}  —  ${r.detail}`);
    if (!r.ok) failed += 1;
  }

  if (failed === 0) {
    console.log("\nWebhook HMAC path is working. Razorpay can confirm orders without the browser callback.");
  } else {
    console.log("\nWebhook is NOT healthy. Fix URL / secret / nginx before relying on it in prod.");
  }

  if (args.audit) {
    const bad = await runPaidCancelledAudit(args.days);
    failed += bad;
  }

  if (failed > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
