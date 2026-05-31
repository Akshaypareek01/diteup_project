# DiteUp — Client Proposal vs Codebase Audit

**Proposal source:** `req.md`  
**Audit date:** 2026-05-31  
**Purpose:** Pre-handover checklist — what matches the client proposal, what is partially done, and what still needs work.

---

## Executive summary

| Area | Backend API | Storefront | Admin UI | Ready for handover? |
|------|-------------|------------|----------|---------------------|
| Auth, profile, addresses | ✅ | ✅ | — | ✅ Yes |
| Cart, checkout, Razorpay, COD | ✅ | ✅ | — | ✅ Yes (needs live Razorpay keys + E2E test) |
| Order tracking + emails | ✅ | ✅ | — | ✅ Yes |
| Landing page (core sections) | ✅ | ✅ mostly | — | ⚠️ Missing carousel + product video |
| Meta Pixel (browser) | — | ⚠️ Partial | ⚠️ Partial | ❌ Pixel ID not fully admin-driven on storefront |
| Meta CAPI (server) | ✅ | — | ✅ (JSON settings) | ✅ Yes (optional add-on in proposal — already built) |
| Admin — read-only lists | ✅ | — | ✅ | ✅ Yes |
| Admin — operational actions | ✅ | — | ⚠️ Gaps | ❌ Several proposal items have API but no UI |
| Inventory Excel I/O | ✅ | — | ⚠️ Export only | ⚠️ Import UI missing |
| Broadcast emails | ✅ | — | ⚠️ Draft only | ❌ Send / preview / test UI missing |
| Deployment & go-live | — | — | — | ❌ Not done (ops) |

**Bottom line:** Core e-commerce flow (browse → cart → pay → track) is implemented end-to-end. The **admin panel can view data** but is **missing several action UIs promised in the proposal** (order status updates, filters, broadcast send, inventory import, stock history). **Landing page** is missing **image carousel** and **embedded product video**. **Go-live deployment** is still outstanding.

---

## 2.1 Public website (customer-facing)

### Landing page

| Proposal item | Status | Notes |
|---------------|--------|-------|
| Hero + CTA + trust indicators | ✅ Done | `HeroSection` + banner overlay; trust bar, regulatory strip |
| Image carousel / slides | ❌ Missing | Static hero banners only (`/assets/Images/*_banner*.png`). No swipe/carousel. `GalleryStripSection` exists but is **not used** on the home page |
| Embedded product video(s) | ❌ Missing | `GalleryStripSection.tsx` has a **placeholder** (“Video embed placeholder”) and is not mounted on `/` |
| Features, benefits, ingredients, FAQ | ✅ Done | Home: ingredients, FAQ, testimonials, why-choose, etc. `BenefitsSection` component exists but is **not** on the home page (content covered elsewhere) |
| Testimonials / reviews | ✅ Done | `TestimonialsSection` + live review data from API |
| Fully responsive | ✅ Done | Tailwind breakpoints across layout |

### User account

| Proposal item | Status | Notes |
|---------------|--------|-------|
| Signup + login (email/password) | ✅ Done | `/signup`, `/login` wired to `/v1/auth/*` |
| Password reset via email | ✅ Done | `/forgot-password`, `/reset-password` |
| Profile + shipping addresses | ✅ Done | `/account/profile`, `/account/addresses` |
| Order history | ✅ Done | `/account/orders` → `GET /v1/me/orders` |

### Cart & checkout

| Proposal item | Status | Notes |
|---------------|--------|-------|
| Add to cart + quantity | ✅ Done | PDP, cart drawer, cart page; `CartStateProvider` + localStorage |
| Cart totals, tax, shipping | ✅ Done | `POST /v1/cart/preview` |
| Checkout + shipping address | ✅ Done | `CheckoutClient` — guest + saved addresses |
| Razorpay (test + live) | ✅ Done | Script loader + verify flow; keys via env / admin settings |
| Order confirmation page + email | ✅ Done | `/order/[orderNumber]` + backend transactional emails |
| Stock check at checkout | ✅ Done | Reservation on order create; OOS blocked |

### Order tracking

| Proposal item | Status | Notes |
|---------------|--------|-------|
| Status flow Placed → Confirmed → Shipped → Delivered | ✅ Done | Timeline UI + polling in `OrderTrackingShell` |
| Real-time updates in dashboard | ✅ Done | Polls `GET /v1/orders/:orderNumber` |
| Automated status emails | ✅ Done | Backend `orderNotify.ts` + templates |

---

## 2.2 Meta (Facebook) Pixel

| Proposal item | Status | Notes |
|---------------|--------|-------|
| PageView | ⚠️ Partial | Fires on initial load only (`MetaPixel.tsx`). **No** PageView on Next.js client route changes |
| ViewContent | ✅ Done | Home hero + PDP |
| AddToCart | ✅ Done | PDP add / buy now |
| InitiateCheckout | ✅ Done | Checkout mount |
| AddPaymentInfo | ✅ Done | Payment method change |
| Purchase | ✅ Done | Order tracking page (once confirmed) |
| Lead / CompleteRegistration | ⚠️ Partial | Uses `CompleteRegistration` on signup verify — not separate `Lead` event |
| Pixel ID configurable from admin (no code change) | ⚠️ Partial | **Backend CAPI:** `Setting` key `metaAds` in Admin → Settings → Meta ads. **Browser Pixel:** still reads `NEXT_PUBLIC_META_PIXEL_ID` env — **not** synced from admin DB at runtime. Changing pixel in admin alone does **not** update storefront tracking without redeploy/env update |
| Server-side CAPI (optional add-on) | ✅ Done | `sendPurchaseEventForOrder` — exceeds proposal minimum |

---

## 2.3 Admin panel

### Dashboard

| Proposal item | Status | Notes |
|---------------|--------|-------|
| Total revenue, orders, new users, pending orders, stock | ⚠️ Partial | Live KPIs: orders 7d/30d, GMV 30d, customers, low-stock count, pending reviews. **Missing:** explicit “pending orders” tile; **no daily / weekly** revenue breakdown (only 30-day GMV) |
| Recent orders + quick links | ✅ Done | `/admin` wired to API |
| Meta Pixel ID setting | ⚠️ Partial | JSON editor at `/admin/settings/meta` — works for CAPI; storefront env gap noted above |

### Order management

| Proposal item | Status | Notes |
|---------------|--------|-------|
| List + search + filter + pagination | ⚠️ Partial | **Backend:** full filters. **UI:** list + pagination only — **no search/filter controls** on `/admin/orders` |
| Detailed order view | ✅ Done | `/admin/orders/[id]` — customer, items, timeline |
| Update status (Confirmed / Shipped / Delivered / Cancelled) | ❌ UI missing | **Backend:** `PATCH /v1/admin/orders/:id`. **UI:** read-only detail page — **no status dropdown or actions** |
| Export orders Excel/CSV | ⚠️ Partial | Download via Reports hub / direct API URL — **no filter UI** on export |
| Import orders Excel (bulk status) | ❌ UI missing | **Backend:** `POST /v1/admin/orders/import`. **UI:** none |

### Payment & transactions

| Proposal item | Status | Notes |
|---------------|--------|-------|
| Payment history + Razorpay IDs | ✅ Done | `/admin/payments` + detail |
| Filter paid / failed / refunded / pending | ⚠️ Partial | **Backend** supports `status` query. **UI:** no filter dropdown |
| Daily / weekly / monthly revenue on dashboard | ❌ Missing | Only 30-day GMV aggregate |
| Export transactions Excel/CSV | ❌ Missing | No `/v1/admin/payments/export` route or UI (orders/users/inventory export exist) |
| Manual refund | ✅ Done | `PaymentRefundPanel` on payment detail |

### User management

| Proposal item | Status | Notes |
|---------------|--------|-------|
| List + search + filter | ✅ Done | Search + pagination on `/admin/users` |
| Profile, orders, lifetime value | ⚠️ Partial | Profile + order **count** shown. **No** LTV calculation, **no** order list on user detail page |
| Enable / disable accounts | ✅ Done | `UserRestrictionsPanel` → `isActive` |
| Export users Excel/CSV | ✅ Done | Export button on users page |

### Inventory (basic)

| Proposal item | Status | Notes |
|---------------|--------|-------|
| View stock per SKU | ✅ Done | `/admin/inventory` |
| Manual adjust + reason notes | ✅ Done | `InventoryAdjustCell` → API |
| Auto deduct on order | ✅ Done | Backend order/inventory services |
| Low-stock alert on dashboard | ✅ Done | Count + list in dashboard stats |
| Stock history log | ❌ UI missing | **Backend:** `GET /v1/admin/inventory/:id/ledger`. **UI:** none |
| Excel import (bulk stock) | ❌ UI missing | **Backend:** `POST /v1/admin/inventory/import`. **UI:** none |
| Excel export | ✅ Done | Export link on inventory page |

### Email communication

| Proposal item | Status | Notes |
|---------------|--------|-------|
| Broadcast / targeted emails from admin | ⚠️ Partial | Create **draft** only (`AdminBroadcastCreateForm`). **No UI** for send, preview, send-test, or segment picker (backend supports all) |
| Pre-built transactional templates | ✅ Done | Backend templates; admin page is **view-only** (acceptable per proposal — templates are pre-built, not editable) |
| Resend / transactional provider | ✅ Done | Resend integration + webhooks |

---

## 2.4 Deployment & go-live

| Proposal item | Status | Notes |
|---------------|--------|-------|
| Production deployment | ❌ Not done | No Vercel/Railway config committed; `docs/TASKS.md` Phase 15 all open |
| DNS → Diteup.com | ❌ Not done | Ops / client hosting |
| SSL (HTTPS) | ❌ Not done | Depends on hosting |
| Razorpay live mode post-KYC | ❌ Not done | Needs client KYC + live keys in settings |
| Meta Pixel Helper verification | ❌ Not done | Needs live site + pixel ID |
| End-to-end test on live domain | ❌ Not done | |
| SPF / DKIM / DMARC for email | ❌ Not verified | Required before broadcast volume |

---

## Built beyond the proposal (bonus — not in `req.md`)

These are in the codebase but were **not** in the client proposal. Safe to mention as extras, not as gaps:

- Full **coupon** system (admin + checkout)
- **Review** submission + moderation queue
- **GST invoice PDF** generation + email attach
- **COD** payment option
- **Site-wide mode** (maintenance / banner / countdown) — `AdminSiteModePanel`
- **Audit log** viewer
- **Product editor** (12 tabs) — far beyond “single product” minimum
- Cookie consent banner + Pixel consent mode
- Pincode serviceability check
- Guest checkout + order guest token
- Account deletion (DPDP-style anonymize)

---

## Foundation / engineering (not in proposal but blocks smooth handover)

| Item | Status |
|------|--------|
| Root README (setup, architecture) | ❌ Root `README.md` is one line |
| Docker Compose for local Postgres | ⚠️ `docker-compose.yml` exists; not verified in audit |
| DB seed (admin user + product + stock) | ⚠️ `backend/prisma/seed.ts` exists — confirm run on prod/staging |
| Prisma migrations applied | ⚠️ Only 2 migrations in repo — confirm DB matches schema on deploy |
| Automated tests (unit / E2E) | ❌ Phase 15 open |
| Lighthouse / security audit | ❌ Not done |

---

## Recommended fix order before client handover

### P0 — Proposal gaps the client will notice

1. ~~**Admin order status update UI**~~ ✅ Done — order detail panel.
2. ~~**Broadcast send UI**~~ ✅ Done — preview / test / send on broadcasts page.
3. ~~**Image carousel**~~ — **Out of scope** (client decision).
4. ~~**Embedded product video**~~ — **Out of scope** (client decision).
5. ~~**Meta Pixel admin → storefront sync**~~ ✅ Done — `GET /v1/site/integrations` + `MetaPixelGate`.

### P1 — Proposal admin completeness

6. ~~Order list **search + status filters** + export~~ ✅ Done.
7. ~~Payment list **status filter** + **transaction export**~~ ✅ Done.
8. ~~Inventory **import UI** + **stock ledger/history**~~ ✅ Done.
9. ~~Dashboard **pending orders** + **daily/weekly revenue**~~ ✅ Done.
10. ~~User detail: **order list** + **lifetime spend**~~ ✅ Done.

### P2 — Go-live (ops, coordinated with client)

11. Deploy frontend + API + DB; DNS + SSL on diteup.com.
12. Razorpay live keys; Resend domain verification; Meta Pixel Helper pass.
13. Seed production product/stock; one full checkout on live domain.
14. Root README + short admin user guide for client.

---

## Quick reference — file locations

| Feature | Primary files |
|---------|----------------|
| Storefront home | `frontend/app/page.tsx`, `frontend/components/home/*` |
| Checkout / Razorpay | `frontend/components/checkout/CheckoutClient.tsx` |
| Meta Pixel events | `frontend/lib/meta-pixel-events.ts`, `frontend/components/analytics/MetaPixel.tsx` |
| Admin dashboard | `frontend/app/admin/(shell)/page.tsx` |
| Admin orders (read-only) | `frontend/app/admin/(shell)/orders/*` |
| Admin settings / Meta | `frontend/app/admin/(shell)/settings/[section]/page.tsx` |
| Order status API | `backend/src/services/adminOrders.ts` |
| Broadcast send API | `backend/src/services/adminBroadcast.ts` |
| Inventory ledger API | `backend/src/services/adminInventory.ts` |

---

*Generated from codebase review against `req.md`. Update this doc when gaps are closed.*
