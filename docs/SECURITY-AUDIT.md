# DiteUp — Security Audit (Routes & Auth)

**Audit date:** 2026-05-31  
**Scope:** API route protection, authZ, webhooks, cookies, CSRF, known gaps before production.

---

## Verdict

**Admin and customer auth routes are correctly gated on the backend.** The frontend admin redirect is UI-only; real enforcement is `authRequired` + `roleRequired('ADMIN')` on every `/v1/admin/*` handler.

**Safe to hand over from a route-protection perspective** once production env is locked (CORS, secrets, webhook secrets) and the items in [Remaining before production](#remaining-before-production) are addressed.

---

## Route protection matrix

### Public by design (no login required)

| Route | Protection |
|-------|------------|
| `GET /health`, `GET /health/db` | None — ops probes (minor info disclosure) |
| `GET /v1/site/mode`, `GET /v1/site/integrations` | Public — no secrets (pixel ID only) |
| `GET /v1/products/*`, `POST /v1/pincode/check`, `POST /v1/notify-me` | Rate limits on mutating routes |
| `POST /v1/cart/preview`, `POST /v1/coupons/validate` | Rate limit + optional auth |
| `POST /v1/orders`, `GET /v1/orders/:orderNumber`, `POST .../cancel` | Owner **or** signed guest token; rate limits |
| `POST /v1/payments/verify` | Razorpay HMAC + payment bound to order row |
| `POST /v1/webhooks/razorpay` | `X-Razorpay-Signature` HMAC (requires `RAZORPAY_WEBHOOK_SECRET`) |
| `POST /v1/webhooks/resend` | Svix signature when `RESEND_WEBHOOK_SECRET` set; dev skips if unset |
| `GET /v1/marketing/unsubscribe` | Signed token (`verifyMarketingUnsubscribeToken`) |
| `POST /v1/auth/signup`, login, OTP, forgot/reset | Per-endpoint rate limits |
| `POST /v1/auth/refresh` | Rate limit; validates refresh JWT + `tokenVersion` |

### Authenticated customer (`authRequired` on router or handler)

| Mount | Notes |
|-------|-------|
| `/v1/me/*` | `router.use(authRequired)` — profile, addresses, orders, delete account |
| `/v1/reviews/*` (mutations) | `authRequired` + author `userId` checks on update/delete |
| `/v1/auth/logout`, `GET /v1/auth/me` | `authRequired` |

### Admin only (`authRequired` + `roleRequired('ADMIN')`)

All **52** handlers in `backend/src/routes/admin.ts` use `...adminOnly`. Verified includes:

- Dashboard, orders, payments, users, inventory, products, coupons, broadcasts, settings, audit, exports/imports

**Customer JWT cannot call admin APIs** — returns 403 Forbidden.

---

## What is working well

| Control | Implementation |
|---------|----------------|
| Password hashing | bcrypt cost 12 |
| JWT access (15m) + refresh (httpOnly cookie, path `/v1/auth`) | `services/auth.ts` |
| Refresh invalidation | `tokenVersion` bump on logout, password reset, force-logout, account delete |
| Disabled / locked users | Checked on every authenticated request |
| Order IDOR | `getOrderForViewer` — owner match or HMAC guest token |
| Payment fraud | Signature verify + `razorpayOrderId` must match payment on that order |
| Address / review IDOR | Queries scoped by `userId` |
| Admin secrets at rest | Encrypted when `SETTINGS_ENCRYPTION_KEY` set; list view redacted |
| No role escalation via API | `AdminUserUpdateBodySchema` excludes `role` |
| Cannot anonymize admin | Guard in `anonymizeUserAdmin` |
| HTTP hardening | Helmet, CORS allowlist, `trust proxy`, cookies `httpOnly` + `secure` in prod |
| CSRF (partial) | `SameSite=Lax` cookies + Origin check on cookie-auth mutating requests |
| Input validation | Zod on most routes |

---

## Remaining before production

### High

| Issue | Risk | Action |
|-------|------|--------|
| **`RESEND_WEBHOOK_SECRET` must be set in prod** | Without it, webhooks are rejected in production (fixed 2026-05-31). With wrong/missing config, bounces won't sync. | Set `whsec_…` from Resend dashboard; test bounce event |
| **`RAZORPAY_WEBHOOK_SECRET` unset** | Webhook signature check fails → payments only confirm via client `/payments/verify` | Set in prod; keep webhook as backup |
| **`SETTINGS_ENCRYPTION_KEY` unset** | Razorpay/Meta/Resend keys in DB stored plaintext | Set ≥16 char key before storing payment settings in admin |
| **`CORS_ORIGIN` too broad** | Credential theft if misconfigured | Production: exact frontend origin only (no `*`) |

### Medium

| Issue | Risk | Status |
|-------|------|--------|
| Access JWT not tied to `tokenVersion` | Stale session after logout | **Fixed** — `tv` claim checked in `authRequired` |
| Origin check allows missing `Origin` | CSRF edge case | **Fixed in prod** — requires Origin or Referer on cookie mutating requests |
| In-memory rate limits | Weak multi-replica | **Ops** — use nginx limits on EC2 (see `EC2-PRODUCTION-SECURITY.md`); Redis optional later |
| Guest order `?token=` in URL | Referer leak | **Mitigated** — `Referrer-Policy` + order page `no-referrer` |
| **`/health/db` public** | DB probe exposed | **Fixed** — `HEALTHCHECK_SECRET` + nginx block recommended |

### Low / ops

| Issue | Notes |
|-------|-------|
| Frontend `/admin` layout redirect | Not a security boundary — API enforces ADMIN |
| Next.js `/v1` rewrite | Proxies full API; auth still required server-side |
| `optionalAuth` ignores bad tokens | By design for public cart/checkout |
| Signup always creates `CUSTOMER` | Admin users must be seeded — no self-serve admin |

---

## Frontend admin

| Layer | Status |
|-------|--------|
| `app/admin/(shell)/layout.tsx` | Redirects non-ADMIN to `/admin/login` |
| Direct API calls to `/v1/admin/*` | Blocked without ADMIN role (403) |
| Export links (`/v1/admin/.../export`) | Same cookie session; backend `adminOnly` |

---

## Pre-launch security checklist

- [ ] `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` — unique, ≥32 chars, not in git
- [ ] `CORS_ORIGIN=https://diteup.com` (and staging if needed)
- [ ] `RAZORPAY_WEBHOOK_SECRET` + live keys
- [ ] `RESEND_WEBHOOK_SECRET` (`whsec_…`) on Resend webhook pointing to `https://…/v1/webhooks/resend`
- [ ] `SETTINGS_ENCRYPTION_KEY` set before saving secrets in admin UI
- [ ] `NODE_ENV=production` (enables `secure` cookies)
- [ ] Hide or firewall `/health/db`
- [ ] Confirm admin user exists only via seed — no public admin signup
- [ ] SPF/DKIM/DMARC on email domain
- [ ] Smoke test: customer cannot `GET /v1/admin/dashboard/stats` (expect 401/403)

---

## Files reference

| Area | Path |
|------|------|
| Auth middleware | `backend/src/middleware/auth.ts` |
| Origin / CSRF guard | `backend/src/middleware/originCheck.ts` |
| Admin routes | `backend/src/routes/admin.ts` |
| Order access | `backend/src/services/orderReadCancel.ts`, `utils/orderAccess.ts` |
| Razorpay verify | `backend/src/services/orderPayment.ts` |
| Resend verify | `backend/src/utils/resendWebhookVerify.ts` |
| Admin session (Next) | `frontend/lib/admin-session.ts` |

---

*Re-run this audit after major route or auth changes.*
