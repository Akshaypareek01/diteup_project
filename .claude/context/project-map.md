# DiteUp Project Map
Updated: 2026-07-16 (built during Shiprocket integration brief)

## STACK
- Backend: Node/Express 5 + TypeScript (CommonJS, tsx dev), Prisma 6 + PostgreSQL, Zod 4 validation, pino logging, Sentry optional. `backend/`
- Frontend: Next.js App Router + TypeScript + Tailwind. `frontend/` (storefront AND admin panel in one app)
- Payments: Razorpay. Email: Resend or SMTP (nodemailer). Storage: Cloudflare R2 (S3 SDK). Meta CAPI.

## STRUCTURE
- backend/src/{config,controllers,routes,services,validators,middleware,jobs,utils,emails,types}
- backend/prisma/schema.prisma + migrations + seed.ts
- frontend/app — storefront pages + app/admin/(shell)/* admin panel + app/order/[orderNumber] tracking
- frontend/components/{admin,order,checkout,cart,home,layout,product,ui}
- frontend/lib — server-api.ts (SSR fetch w/ cookies), client-api.ts (browser), admin-session.ts, settings-section-keys.ts

## ENTRY POINTS
- API: backend/src/index.ts — mounts routes under /v1; raw-body webhooks registered BEFORE express.json (razorpay, resend); startBackgroundSchedulers()
- Env: backend/src/config/env.ts — Zod-validated, fail-fast; .env.example in both apps
- Admin panel: frontend/app/admin/(shell)/layout.tsx; login at app/admin/login

## FEATURES
- Checkout: routes/checkout.ts → controllers/orders.ts → services/order.ts placeOrder() (single tx: inventory reserve, coupon, COD→CONFIRMED / RAZORPAY→PLACED) → services/orderPayment.ts confirmOrderFromRazorpayPayment (verify or webhook)
- Admin orders: routes/admin.ts → controllers/adminFulfillment.ts → services/adminOrders.ts (list/detail/status/bulk/export). updateOrderStatusAdmin enforces transition matrix, writes OrderEvent + audit, fires emails, accepts awbNumber/shippingCarrier
- Order tracking: app/order/[orderNumber]/page.tsx SSR GET /v1/orders/:orderNumber (+?token= guest) → OrderTrackingShell client polls via clientApiJson
- Settings: Setting table (key/Json) — services/settings.ts typed readers; services/adminSettings.ts CRUD w/ AES envelope encryption (utils/settingsCrypto.ts, keys matching secret regex); admin UI app/admin/(shell)/settings/[section] + AdminSettingJsonEditor; frontend/lib/settings-section-keys.ts maps sections→keys
- Jobs: jobs/scheduler.ts setInterval timers; DB-backed BackgroundJob queue (services/jobQueue.ts, dispatchBackgroundJob switch by job type)

## DATA MODEL (prisma/schema.prisma)
- Order (~L356): orderNumber DU-YYYY-NNNNN, status OrderStatus(PLACED/CONFIRMED/SHIPPED/DELIVERED/CANCELLED/RETURNED/REFUNDED), paymentMethod(RAZORPAY/COD), totals Decimal, shippingAddress Json {name,phone,line1,line2,city,state,pincode,country}, awbNumber, shippingCarrier, guestEmail/Phone, invoiceNumber, timestamps
- OrderItem: sku, productName, variantName, unitPrice, quantity. ProductVariant.weightGm Int?
- OrderEvent: type + Json payload timeline. Payment: razorpay ids, status. Setting: key + Json. BackgroundJob queue.

## CONVENTIONS
- Controllers: try/next(err); throw factories from utils/errors.ts (AppError w/ codes). Validation via middleware/validate.ts + Zod schemas in validators/.
- Admin routes: `...adminOnly` = [authRequired, roleRequired("ADMIN")] (JWT cookies). Audit via utils/adminAudit.ts recordAudit.
- Logging: utils/logger.ts pino, logger.error({err}, "msg"). Money: Decimal in DB.
- Integration pattern: service module wrapping SDK (services/razorpay.ts lazy client, isXConfigured() guard); creds from env, optionally overridden by Setting row (see getMetaAdsIntegration in services/settings.ts).

## INTEGRATIONS
- Razorpay: services/razorpay.ts, orderPayment.ts (HMAC verify), controllers/webhooks.ts (raw body), jobs/razorpayReconcile.ts
- Email: services/email.ts (SMTP/Resend), controllers/resendWebhook.ts (Svix verify utils/resendWebhookVerify.ts)
- Meta CAPI: services/metaPixel.ts. R2: services/storage.ts.

## GOTCHAS
- Webhooks MUST be registered in index.ts before express.json with express.raw.
- COD orders are CONFIRMED at placement; Razorpay orders sit PLACED until capture (webhook or /payments/verify); stale PLACED swept by cancelStaleOrders job.
- Status transitions strictly enforced in adminOrders.assertStatusTransition — no direct SHIPPED→SHIPPED etc.; from===to is a no-op pass.
- Setting values ending in secret-ish keys auto-encrypted only if SETTINGS_ENCRYPTION_KEY set (v1: envelope).
- requireBrowserOriginForCookieAuth middleware: cookie-auth requests must match CORS origins — server-to-server webhooks bypass (registered earlier / no cookies).
