# DiteUp — Build Tasks (Phase-by-Phase)

**Source of truth.** Tracks what's done and what's left across the whole project. Pairs with `PRD.md` and `DESIGN-SYSTEM.md`.

**Legend:** `[ ]` pending · `[~]` in progress · `[x]` done · `[!]` blocked · `(P2)` phase 2 / future

**Status (last updated 2026-05-16):** Phases 0–11 backend ✅ · Phase 12 storefront ✅/~ · **Phase 13 admin UI** scaffold in `frontend/app/admin` ✅/~ (wire `API_INTERNAL_URL` + proxy; connect tables to `/v1/admin/*`)

---

## PHASE 0 — Project Foundation

- [x] **0.1** Backend scaffold (Express 5 + TypeScript + tsx) — `backend/package.json`, `tsconfig.json`
- [x] **0.2** Frontend scaffold (Next.js 14 + Tailwind 3.4) — `frontend/`
- [x] **0.3** Prisma init (datasource + generator) — `backend/prisma/schema.prisma`
- [x] **0.4** `.env.example` with all required keys (JWT secrets, Razorpay, Resend, R2, Sentry)
- [x] **0.5** `.gitignore`
- [ ] **0.6** Project root README (architecture, dev setup, links to PRD/Design)
- [ ] **0.7** Docker Compose for local Postgres (`docker-compose.yml`)
- [x] **0.8** Folder structure: `src/{config,middleware,utils,routes,controllers,services,types,validators,jobs,emails}`
- [x] **0.9** Env validation via Zod (`config/env.ts`)
- [x] **0.10** Pino logger (`utils/logger.ts`) — pretty in dev, JSON in prod, secret redaction
- [x] **0.11** Error classes + global handler (`utils/errors.ts` + `middleware/errorHandler.ts`) — handles AppError, ZodError, Prisma P2002/P2025
- [x] **0.12** Zod request validation middleware (`middleware/validate.ts`)
- [x] **0.13** Prisma client singleton (`utils/prisma.ts`) — hot-reload safe
- [x] **0.14** In-memory rate limiter (`middleware/rateLimit.ts`) — swap to Redis pre-launch
- [x] **0.15** Request ID + access log middleware (`middleware/requestContext.ts`)
- [ ] **0.16** ESLint + Prettier config (P2 — not blocking)
- [ ] **0.17** Husky pre-commit (P2)

---

## PHASE 1 — Database Schema (Prisma)

Single migration to set the foundation. Every model from PRD §5.

- [x] **1.1** User + AuthOTP + Address + PasswordResetToken
- [x] **1.2** Product + ProductVariant + ProductMedia + ProductFAQ + ProductVisibility enum + ProductBadge enum
- [x] **1.3** Inventory + StockLedger + StockNotification + StockReason enum
- [x] **1.4** Order + OrderItem + OrderEvent + OrderStatus + PaymentMethod enums
- [x] **1.5** Payment + PaymentStatus enum
- [x] **1.6** Coupon + CouponRedemption + CouponType enum
- [x] **1.7** Review + ReviewHelpful (with images, helpfulCount, admin reply)
- [x] **1.8** BroadcastEmail + EmailLog + EmailSuppression + EmailStatus enum
- [x] **1.9** Setting + AuditLog
- [ ] **1.10** Initial migration — **run locally:** `cd backend && npx prisma migrate dev --name init` (blocked in sandbox; Prisma engine downloads required)
- [ ] **1.11** Seed script: 1 admin user + 1 product ("Energy Bite 750g") + initial stock + default settings

---

## PHASE 2 — Auth System ✅

- [x] **2.1** Password hashing utility (`utils/password.ts`) — bcrypt cost 12 + strength check
- [x] **2.2** JWT utility — access (15m) + refresh (30d), `utils/jwt.ts`
- [x] **2.3** Auth middleware (`middleware/auth.ts`) — `authRequired`, `optionalAuth`, `roleRequired('ADMIN')`, `emailVerifiedRequired`; verifies tokenVersion + isActive on every request
- [x] **2.4** OTP utility — 6-digit, bcrypt-hashed, 10-min expiry, 5-attempt cap
- [x] **2.5** `POST /v1/auth/signup` — anti-enumeration; reuses unverified user; fires OTP
- [x] **2.6** `POST /v1/auth/verify-email` — consumes OTP, sets verified, issues tokens, fires welcome email
- [x] **2.7** `POST /v1/auth/resend-otp` — EMAIL_VERIFY/PASSWORD_RESET; 60s cooldown; anti-enumeration
- [x] **2.8** `POST /v1/auth/login` — 5 failures → 30-min lock; rememberMe extends refresh to 60d
- [x] **2.9** `POST /v1/auth/logout` — bumps `tokenVersion`, clears cookies
- [x] **2.10** `POST /v1/auth/refresh` — verifies refresh token + tokenVersion, mints new access
- [x] **2.11** `POST /v1/auth/forgot-password` — sends OTP; anti-enumeration
- [x] **2.12** `POST /v1/auth/reset-password` — OTP + new password; bumps tokenVersion (kills all sessions); issues fresh tokens
- [x] **2.13** `GET /v1/auth/me` — returns full profile
- [x] **2.14** Rate limiting wired per endpoint: 10/h signup, 5/15m login, 3/h OTP-by-email, 5/h forgot, 60/min refresh
- [x] **2.15** Email service (`services/email.ts`) — Resend client + stub mode for local dev; suppression list aware
- [x] **2.16** Transactional templates (`emails/templates.ts`) — otpVerify, passwordReset, welcome (branded HTML + text)

---

## PHASE 3 — User Profile + Addresses

- [x] **3.1** `GET /v1/me/profile`
- [x] **3.2** `PATCH /v1/me/profile` (name, gender, DOB, marketing opt-in)
- [x] **3.3** `POST /v1/me/email/change` — password + OTP to **new** email, then OTP to **current** email (single route, `phase`: `request` → `verify_new` → `verify_old`; PRD §16 #75)
- [x] **3.4** `POST /v1/me/avatar` — presigned PUT URL; `POST /v1/me/avatar/confirm` saves `profileImageUrl` after upload
- [x] **3.5** `GET /v1/me/addresses`
- [x] **3.6** `POST /v1/me/addresses`
- [x] **3.7** `PATCH /v1/me/addresses/:id`
- [x] **3.8** `DELETE /v1/me/addresses/:id`
- [x] **3.9** `POST /v1/me/addresses/:id/default`
- [x] **3.10** `DELETE /v1/me` — soft-delete + PII anonymize (DPDP); clears cookies; ADMIN blocked

---

## PHASE 4 — Products & Catalog (Public)

- [x] **4.1** `GET /v1/products/featured` — returns single featured product (+ `effectiveVisibility`, `buyable`)
- [x] **4.2** `GET /v1/products/:slug`
- [x] **4.3** Visibility resolver — effective state (DB visibility + stock auto-flip on `PUBLISHED`, scheduled `availableUntil` → `HIDDEN`)
- [x] **4.4** `POST /v1/pincode/check` — serviceability + COD eligibility (`Setting` key `pincodePolicy` JSON; defaults = PAN-India serviceable)
- [x] **4.5** `POST /v1/notify-me` — back-in-stock subscription (`optionalAuth` to link `userId`)

---

## PHASE 5 — Cart & Coupons (Public)

- [x] **5.1** `POST /v1/coupons/validate` — server-side preview (`optionalAuth` + optional `guestEmail` for per-user / first-order rules)
- [x] **5.2** Coupon validation pipeline — PRD §8.5.1 in `services/coupon.ts` (`IDENTITY_REQUIRED` when limits need email/user; `FREE_SHIPPING_REDUNDANT` when `shippingBeforeDiscount` is 0)
- [x] **5.3** Cart pricing helper — `computeCartTotals` + `mergeCartLines` + `previewCart` in `services/cart.ts`; **POST /v1/cart/preview** returns full breakdown. Site defaults: `Setting` key `checkout` JSON (`shippingFlatRate`, `freeShippingThreshold`, `codChargeDefault`, `taxInclusive`) with v1 fallbacks in `services/settings.ts`

---

## PHASE 6 — Orders, Checkout, Payments

- [x] **6.1** `POST /v1/orders` — create order (TX: validate, reserve stock, redeem coupon, create Razorpay order)
- [x] **6.2** `POST /v1/payments/verify` — verify Razorpay signature, confirm order
- [x] **6.3** `POST /v1/webhooks/razorpay` — idempotent webhook (raw body + HMAC)
- [x] **6.4** `GET /v1/orders/:orderNumber` — guest `?token=` HMAC supported
- [x] **6.5** `GET /v1/me/orders` — offset pagination
- [x] **6.6** `POST /v1/orders/:orderNumber/cancel` — self-cancel (unpaid online / COD pre-ship)
- [x] **6.7** Order number `DU-YYYY-NNNNN` (`OrderSequence`, Asia/Kolkata year)
- [x] **6.8** Auto-cancel job — `PLACED` Razorpay past `checkout.orderCancelAfterMinutes`
- [x] **6.9** Invoice PDF — stub upgraded in **Phase 11.2** (`services/invoice.ts` + `InvoiceSequence`)
- [x] **6.10** `OrderEvent` audit on place / pay / cancel (central transition helper deferred)
- [x] **6.11** COD — pincode + product COD flags, min/max order total, returning-customer rule

---

## PHASE 7 — Reviews

- [x] **7.1** `POST /v1/reviews` — verified buyer (`DELIVERED` order contains product), `restrictions.reviewsBlocked`, profanity gate, 3/day rate limit (PRD §6.7)
- [x] **7.2** `GET /v1/products/:slug/reviews` — sort `recent`/`helpful`, `rating`, `withImages`, pagination (default 10)
- [x] **7.3** `PUT /v1/reviews/:id` — edit within 7 days; resets `isApproved` / clears `isFeatured`
- [x] **7.4** `DELETE /v1/reviews/:id` — author soft-delete (`deletedAt`)
- [x] **7.5** `POST /v1/reviews/:id/helpful` — toggle; cannot self-helpful; public reviews only
- [x] **7.6** `POST /v1/reviews/:id/flag` — sets `isFlagged` (hides from public list)
- [x] **7.7** `POST /v1/reviews/images/upload-url` — R2 presign (`services/storage.ts`); HEIC/HEIF MIME allowed
- [x] **7.8** Image processor — Sharp in `services/imageProcessor.ts`; approve triggers `jobs/reviewImageProcessor.ts`
- [x] **7.9** Summary block — `averageRating`, `totalCount`, star distribution computed per request (materialized cache deferred)

---

## PHASE 8 — Admin APIs

All under `/v1/admin/*` with `roleRequired('ADMIN')`.

- [x] **8.1** Admin dashboard stats (`GET /v1/admin/dashboard/stats`)
- [x] **8.2** Orders: list + detail + status update + refund + bulk + Excel I/O (`/v1/admin/orders*`)
- [x] **8.3** Payments: list + detail + manual refund + reconciliation (`/v1/admin/payments*`)
- [x] **8.4** Users: list + detail + restrictions + tags + force-logout + anonymize + Excel (`/v1/admin/users*`)
- [x] **8.5** Products: CRUD + variants + media + visibility scheduling + bulk operations (`/v1/admin/products*`)
- [x] **8.6** Inventory: per-variant adjust + ledger + Excel import/export (`/v1/admin/inventory*`)
- [x] **8.7** Coupons: CRUD + per-coupon analytics + redemption export (`/v1/admin/coupons*`)
- [x] **8.8** Reviews moderation: queue + approve/reject + reply + featured (`GET/PATCH /v1/admin/reviews`, `PUT /v1/admin/reviews/:id/reply`)
- [x] **8.9** Broadcast emails: composer + segment builder + send + log + suppression list (`/v1/admin/broadcasts*`, `email-logs`, `email-suppressions`)
- [x] **8.10** Settings: CRUD with encrypted secrets (`SETTINGS_ENCRYPTION_KEY`, `/v1/admin/settings*`)
- [x] **8.11** Reports & exports hub (`GET /v1/admin/reports` + resource exports)
- [x] **8.12** Audit log viewer (`GET /v1/admin/audit-log`)
- [x] **8.13** Stock notifications view + manual back-in-stock trigger (`/v1/admin/stock-notifications`, `POST /v1/admin/variants/:id/notify-back-in-stock`)

---

## PHASE 9 — Integrations (Backend)

- [x] **9.1** Razorpay client wrapper (`services/razorpay.ts` — create order + refunds)
- [x] **9.2** Resend client + transactional templates (`services/email.ts`, `emails/templates.ts`; react-email deferred)
- [x] **9.3** R2/S3 client + signed URL generation (`services/storage.ts`)
- [x] **9.4** Sharp image processor (`services/imageProcessor.ts`)
- [x] **9.5** Meta Pixel CAPI client — wired via `services/metaPixel.ts` + `Setting` `metaAds` (**Phase 11.6**)
- [x] **9.6** Sentry error monitoring (`@sentry/node` init in `index.ts`, capture on 500s in `errorHandler`)
- [x] **9.7** GST invoice PDF in `services/invoice.ts` (**Phase 11.2**)

---

## PHASE 10 — Background Jobs

- [x] **10.1** Queue setup — Postgres `BackgroundJob` + `services/jobQueue.ts` (BullMQ/Redis optional later)
- [x] **10.2** Auto-cancel unpaid orders — `cancelStaleOrders` + scheduler (default 15 min)
- [x] **10.3** Scheduled product publish/unpublish — `jobs/productVisibility.ts` (5 min)
- [x] **10.4** Email send queue — `email.send` jobs + retries/backoff + worker poll `JOB_EMAIL_QUEUE_POLL_MS`
- [x] **10.5** Back-in-stock notification batch — `jobs/backInStockBatch.ts` (15 min; uses `stockWaitlist.ts`)
- [x] **10.6** Low-stock alerts — `jobs/lowStockAlert.ts` + `ADMIN_ALERT_EMAILS` (24h digest, 6h check interval)
- [x] **10.7** Razorpay reconciliation daily snapshot — `jobs/razorpayReconcile.ts` (hourly gate, ≥22h between runs)
- [x] **10.8** DB backup hook — `jobs/backupVerify.ts` + optional `BACKUP_VERIFY_URL` (weekly gate)

---

## PHASE 11 — PRD Backend Parity

Closes gaps between the API/workers and `PRD.md` §6–§13 (backend-owned). **Start here after Phase 10** — completes transactional comms, invoicing, and security items called out in the PRD before building customer UI (Phase 12).

- [x] **11.1** Transactional emails — PRD §10.1 matrix wired: pending pay, confirmed (+ PDF attach when generated), shipped, delivered, cancelled (customer/system/admin), refund processed, admin new order (`services/orderNotify.ts`, `emails/templates.ts`); low stock remains digest to `ADMIN_ALERT_EMAILS` with PRD-style subject (first SKU)
- [x] **11.2** GST invoice PDF — `DU/YY-YY/0001` FY sequence (`InvoiceSequence` + `services/invoiceSequence.ts`), PDF via pdfkit, R2 upload (`invoicePdfUrl`); confirmation email links + attaches PDF when generation succeeds
- [x] **11.3** Broadcast — merge tags, `GET /v1/admin/broadcasts/:id/preview`, `POST .../send-test`, `PAST_30D_BUYERS` segment, `BROADCAST_EMAILS_PER_MINUTE` throttle, `List-Unsubscribe` + `GET /v1/marketing/unsubscribe` → `marketingOptIn=false` + suppression
- [x] **11.4** `POST /v1/webhooks/resend` — bounce/complaint/failed → `EmailSuppression` + `EmailLog` update by `providerMessageId` when present
- [x] **11.5** Sharp pipeline — `services/imageProcessor.ts` + `processReviewImagesForReview` on admin approve when `hasImages`
- [x] **11.6** Meta CAPI — `sendPurchaseEventForOrder` + `Setting` key `metaAds` / env; hashed PII; dedupe via `OrderEvent` `META_CAPI_PURCHASE`
- [~] **11.7** Order lifecycle — `ORDER_CONFIRMED` events added (COD/Razorpay); customer Razorpay self-cancel **1h** window (PRD); email dedupe via `OrderEvent`; full single `transitionOrder()` helper + `RETURNED` flows still incremental
- [~] **11.8** Origin guard for cookie auth (`requireBrowserOriginForCookieAuth` on mutating requests with `dt_access`). **Redis rate limit:** env `REDIS_URL` reserved — middleware still in-memory; wire Redis when running multiple API replicas
- [ ] **11.9** Foundation gates — **0.6** README, **0.7** Docker, **1.10** migrate, **1.11** seed (unchanged; run locally)

---

## PHASE 12 — Frontend Customer Site

- [x] **12.1** Tailwind config from `DESIGN-SYSTEM.md` §12 — `frontend/tailwind.config.ts`
- [x] **12.2** Framer Motion presets — `frontend/lib/motion.ts` + `framer-motion` + `MotionConfig reducedMotion="user"` in `app/providers.tsx`
- [x] **12.3** Font loading (Playfair Display + Montserrat via `next/font`) — `app/layout.tsx`
- [x] **12.4** UI primitives: Button, Input, Select, Checkbox, Toggle, Card, Badge, Tag — `components/ui/*`
- [x] **12.5** Layout: Header, Footer, `MobileNavDrawer`, `CartDrawerPanel` + provider — `components/layout/*`, `components/cart/*`
- [x] **12.6** Toast + Modal + Bottom sheet primitives — `ToastProvider`, `Modal`, `BottomSheet`
- [~] **12.7** Landing hero — motion + badge + mockup bands; **Three.js pouch** deferred → Phase 14
- [x] **12.8** Landing — social proof, promise grid, story, ingredients (forest), benefits + strip, how-to (cream), nutrition, reviews (forest), FAQ, final CTA
- [~] **12.9** Cart page + drawer — UI + empty state; **localStorage / server cart** not wired
- [~] **12.10** Checkout — single-page steps + `Input`/`Checkbox` + Razorpay script loader; **place order + payment** not wired
- [~] **12.11** Order confirmation + tracking — tracking UI stub; **live poll + token guest flow** not wired
- [~] **12.12** Auth pages — forms stub; **dedicated OTP screen** not built
- [~] **12.13** Account — nav shell + stubs; **API-backed data** not wired
- [~] **12.14** Review submission UI — image placeholders; **upload pipeline** not wired
- [x] **12.15** Legal pages (terms, privacy, refund, shipping, contact)
- [x] **12.16** Cookie consent banner — dismissible session stub (`components/legal/CookieBanner.tsx`)
- [x] **12.17** 404 + maintenance page
- [~] **12.18** Razorpay — `RazorpayCheckoutScript` + env `NEXT_PUBLIC_RAZORPAY_KEY_ID`; **Checkout open + verify** not wired
- [~] **12.19** Meta Pixel — `MetaPixel` + `NEXT_PUBLIC_META_PIXEL_ID`; **event helpers** (AddToCart, etc.) not wired

---

## PHASE 13 — Frontend Admin Panel

- [x] **13.1** Admin shell + sidebar + topbar — `components/admin/AdminShell.tsx`, `AdminSidebar.tsx`, `AdminTopbar.tsx`; nav `lib/admin-nav.ts`
- [x] **13.2** Admin auth + protected layout — `/admin/login` (proxy `/v1/auth/login`), `(shell)/layout.tsx` + `getAdminUser()` + role `ADMIN` gate (`lib/admin-session.ts`); `next.config.mjs` rewrites `/v1` → API
- [~] **13.3** Dashboard — KPI + recent orders **UI stub**; wire `GET /v1/admin/dashboard/stats`
- [~] **13.4** Orders table + detail + actions — stubs; wire list/detail/update APIs
- [~] **13.5** Payments table + refund modal — stubs; wire admin payments APIs
- [~] **13.6** Users table + detail + restrictions — stubs + `UserRestrictionsPanel`; wire admin users APIs
- [~] **13.7** Products editor — **12 tabs** in `ProductEditor.tsx` (PRD §7.7); wire CRUD/media/variants
- [~] **13.8** Inventory editor + Excel I/O — list stub; wire ledger + import/export
- [~] **13.9** Coupons CRUD + analytics — list + `/admin/coupons/[couponId]` stub; wire APIs
- [~] **13.10** Reviews moderation queue — table stub; wire `GET/PATCH /v1/admin/reviews`
- [~] **13.11** Broadcast composer + email hub — `/admin/emails/*` (templates, broadcasts, log); wire broadcasts APIs
- [x] **13.12** Settings — **13 sub-pages** via `/admin/settings/[section]` (+ index); PRD §7.10 coverage in `settingsSections`
- [~] **13.13** Reports hub — card index stub; wire `/v1/admin/reports` exports
- [~] **13.14** Audit log viewer — empty table stub; wire `GET /v1/admin/audit-log`

---

## PHASE 14 — Three.js Scenes (selective; can defer to v1.5)

- [ ] **14.1** Hero pouch 3D model (.glb, ≤600KB Draco)
- [ ] **14.2** `<Hero3D>` component with mobile fallback
- [ ] **14.3** Scroll-tied rotation
- [ ] **14.4** Ingredient orbit scene (P2)
- [ ] **14.5** Night→Morning transition scene (P2)

---

## PHASE 15 — Quality & Deployment

- [ ] **15.1** Unit tests: coupon validator, stock reservation, order state machine
- [ ] **15.2** E2E test: full checkout flow (Playwright)
- [ ] **15.3** Razorpay test-mode end-to-end
- [ ] **15.4** Meta Pixel verification with Pixel Helper
- [ ] **15.5** Lighthouse audit (mobile ≥90 perf, 100 SEO)
- [x] **15.5a** SEO production infrastructure — metadata, robots, sitemap, JSON-LD, admin `siteSeo` (`docs/SEO-PRODUCTION-HANDOVER.md`)
- [ ] **15.5b** Marketing GSC verification + sitemap submit + final meta copy (see SEO handover doc §3–6)
- [ ] **15.6** Security audit checklist
- [ ] **15.7** DB backup restore drill
- [ ] **15.8** Production deployment — Vercel (frontend) + Railway (API + DB)
- [ ] **15.9** DNS + SSL on diteup.com
- [ ] **15.10** Sentry + uptime monitoring live
- [ ] **15.11** Source code repo + README handover
- [ ] **15.12** Acceptance criteria walkthrough with client

---

## Update protocol

When a task is completed: change `[ ]` → `[x]` here and add a one-line note under "Notes" below if it changes architecture. Mark the date in the status line at the top.

## Notes

- 2026-05-16: TASKS.md created from PRD v1.0. Phase 0 partially complete (scaffolds existed).
- 2026-05-16: Phase 0 complete (env, logger, errors, validate, prisma client, rate limiter, request context). `tsc --noEmit` passes clean. `pino` + `pino-pretty` added to deps.
- 2026-05-16: Phase 1 schema written — all 24 models, 12 enums. **Action required from akshay:** run `cd backend && npx prisma migrate dev --name init` locally (sandbox blocks Prisma engine binary downloads, so migration must run on your machine).
- 2026-05-16: Phase 2 partial — password, JWT, OTP utilities done. Next: auth middleware + 9 auth endpoints + rate limits.
- 2026-05-16: **Phase 5** — `services/coupon.ts` (9-step pipeline), `services/cart.ts` + `computeCartTotals`, `POST /v1/coupons/validate`, `POST /v1/cart/preview`, `utils/money.ts`, `Setting` key `checkout` via `getCheckoutDefaults()`.
- 2026-05-16: **Phase 7** — `services/review.ts`, `utils/profanity.ts`, `validators/reviews.ts`, `routes/reviews.ts`, `GET /v1/products/:slug/reviews`, `Review.deletedAt` + `Review.hasImages`. **DB:** `npx prisma migrate dev` for new review columns.
- 2026-05-16: **Phase 11 shipped** — transactional emails, GST PDF + `InvoiceSequence`, broadcast merge/preview/test/`PAST_30D_BUYERS`, Resend webhook, Sharp review pipeline, Meta CAPI from `metaAds` setting, cookie+Origin guard, marketing unsubscribe. New npm deps: `pdfkit`, `sharp`, `redis` (redis unused until rate-limit swap). **DB:** apply migration `20260516140000_phase11_invoice_and_sequence`.
- 2026-05-16: **Phase 12 storefront** — customer site (tokens, motion, drawers, mockup-aligned landing); remaining ~: API wiring, cart, checkout, Pixel helpers.
- 2026-05-16: **Phase 13 admin panel scaffold** — `/admin/(shell)/*` with cream-dominant shell; server auth via `getAdminUser` + `ADMIN` role; `/v1` rewrite in `next.config.mjs` (`API_PROXY_TARGET`); login/logout against proxied API; settings **13 sections** (`settingsSections`); product editor **12 tabs**; emails hub (templates/broadcasts/log). Remaining: data tables + mutations + modals per PRD §7.

## Next session — start here

1. **Phase 11.9** — README, Docker, `prisma migrate`, seed script (if not done)  
2. **Phase 11.8** (optional) — Redis-backed `rateLimit` when scaling API horizontally  
3. **Phase 11.7** (optional) — single `transitionOrder()` helper + richer `RETURNED` flows  
4. **Phase 13** — connect admin UI to live `GET/PATCH` admin APIs (orders, users, products, settings JSON)
