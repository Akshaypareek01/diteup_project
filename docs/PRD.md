# DiteUp.com — Product Requirements Document (PRD)

**Owner:** NVHO Tech Pvt. Ltd. (Akshay)
**Client:** DiteUp
**Version:** 1.0
**Date:** 16 May 2026
**Status:** Draft for client sign-off

---

## 1. Document Purpose

This PRD is the single source of truth for building DiteUp.com — a single-product e-commerce platform on Day 1, architected to grow into a multi-product catalog without a rewrite. It covers scope, architecture, data model, flows, edge cases, non-functional requirements, and acceptance criteria.

Anything not in this document is **out of scope** and handled via Change Request (per the signed proposal, Section 8).

---

## 2. Goals & Non-Goals

### 2.1 Primary goals
1. Sell one product profitably via Meta (Facebook/Instagram) paid ads with full conversion tracking.
2. Mobile-first, conversion-optimized funnel (target ≥2.5% CR on cold traffic, ≥6% on retargeting).
3. Owner runs the entire business — orders, inventory, customers, payouts, marketing emails — from one admin panel.
4. Architecture supports a flip to multi-product catalog later without schema migration pain.

### 2.2 Non-goals (v1)
- Multi-product catalog UI (data model supports it; UI does not expose it).
- Mobile apps (Android/iOS).
- Subscription / recurring billing.
- Multi-warehouse, multi-vendor, or wholesale flows.
- International shipping or multi-currency.
- Loyalty / referrals / affiliate program.
- Live chat / WhatsApp commerce integration.

### 2.3 Success metrics (90 days post-launch)
- Page Speed Insights mobile score ≥ 85, LCP ≤ 2.5s on 4G.
- Razorpay payment success rate ≥ 92%.
- Cart-to-purchase conversion ≥ 35%.
- Meta Pixel event match quality ≥ 7.0/10.
- Admin can fulfil an order end-to-end in under 60 seconds.

---

## 3. Stakeholders & Roles

| Role | Who | Responsibility |
|---|---|---|
| Product Owner / Client | DiteUp | Content, brand, Razorpay KYC, Meta Pixel ID, sign-off |
| Vendor / Dev | NVHO Tech (Akshay) | Build, deploy, 30-day bug-fix support |
| Admin user | DiteUp owner | Manages orders, stock, users via admin panel |
| Customer | End buyer | Buys via website (guest or registered) |

**System actors:** Razorpay, Meta Pixel, Email Provider (Resend recommended), Shipping (manual/AWB entry in v1).

---

## 4. Tech Stack & Architecture

### 4.1 Chosen stack

| Layer | Technology | Rationale |
|---|---|---|
| Customer Frontend | **Next.js 14 (App Router) + Tailwind CSS** | SSR/SSG for SEO and LCP on landing page (critical for Meta ad ROAS), built-in image optimization, metadata API for OG/Twitter cards, route-level caching |
| Admin Panel | **Next.js (same app, `/admin` route group)** | One codebase, shared types, faster shipping. Behind auth middleware + role check |
| Backend API | **Node.js + Express** (TypeScript) | Separate service; matches client's stack preference; easier to scale independently later |
| Database | **PostgreSQL 16** (managed: Neon/Supabase/Railway) | ACID for money + stock, relational integrity, native JSON for flexibility |
| ORM | **Prisma** | Type-safe, migrations, great DX with TS |
| Auth | **JWT (access + refresh)** + bcrypt | Stateless, works across Next.js and Express |
| Payments | **Razorpay** Orders + Webhooks | Standard Indian gateway; UPI/cards/netbanking/wallets |
| Email | **Resend** (recommended) | Best DX, React Email templates, cheap |
| File/Image storage | **Cloudflare R2** or **AWS S3** + Next.js Image | Cheap egress (R2 = free egress), CDN-ready |
| Ad tracking | **Meta Pixel** + (optional) Conversions API | Required for ad campaigns |
| Excel I/O | **SheetJS (xlsx)** | Import/export as per proposal |
| Hosting | **Vercel (frontend)** + **Railway/Render/DO (API + DB)** | Simple, cheap, SSL auto, easy CI/CD |
| Monitoring | **Sentry** (errors) + **Better Stack** or **Vercel Analytics** | Catch prod bugs early |

### 4.2 Next.js over Vite — why
- Landing page must rank organically and load fast on cold Meta clicks. SSR/SSG wins decisively.
- Built-in `<Image>` does AVIF/WebP + lazy load — product photos are the single biggest LCP killer.
- App Router gives us nested layouts, route handlers, middleware for admin auth — fewer dependencies.
- Future blog / SEO content lands trivially (`/blog/[slug]`).
- Vite SPA would force client-rendered landing page → bad LCP, bad SEO, bad ad quality score.

### 4.3 High-level architecture

```
┌─────────────────┐         ┌──────────────────┐
│  Next.js App    │ ──────► │  Express API     │
│  (Vercel)       │  HTTPS  │  (Railway)       │
│  - Public site  │         │  - REST endpoints│
│  - /admin       │         │  - Auth, orders, │
│  - Pixel events │         │    payments,     │
└────────┬────────┘         │    inventory     │
         │                  └────────┬─────────┘
         │                           │
         ▼                           ▼
   Meta Pixel                  PostgreSQL (Neon)
   (+ optional CAPI)           Prisma
                                     │
                  ┌──────────────────┼──────────────────┐
                  ▼                  ▼                  ▼
              Razorpay         Resend Email       R2 / S3 storage
              (Orders +        (transactional     (product media,
               Webhooks)        + broadcast)       invoices)
```

### 4.4 Environments
- **Local** — Docker Compose for Postgres; `.env.local`; Razorpay test keys; Meta Pixel test events.
- **Staging** — `staging.diteup.com`, separate DB, Razorpay test mode, separate Pixel ID.
- **Production** — `diteup.com`, live Razorpay, live Pixel, daily DB backups.

---

## 5. Data Model (Prisma — source of truth)

Single-product today, multi-product-ready by design. We use a real `Product` + `ProductVariant` model from Day 1; the UI just doesn't expose product selection in v1.

```prisma
model User {
  id              String   @id @default(cuid())
  email           String   @unique             // stored lowercase
  passwordHash    String?                       // null = guest-converted, password not set
  phone           String?                       // E.164 format, e.g. +91XXXXXXXXXX
  name            String?
  gender          Gender?
  dateOfBirth     DateTime?
  profileImageUrl String?
  role            Role     @default(CUSTOMER)

  // ===== Verification =====
  emailVerified    Boolean   @default(false)
  emailVerifiedAt  DateTime?
  phoneVerified    Boolean   @default(false)
  phoneVerifiedAt  DateTime?

  // ===== Account state =====
  isActive            Boolean  @default(true)   // admin can flip to false; user cannot log in or checkout
  deactivationReason  String?
  lockedUntil         DateTime?                 // brute-force protection
  failedLoginAttempts Int      @default(0)

  // ===== Admin-managed restrictions (json blob for flexibility) =====
  restrictions    Json?    // {codBlocked: bool, checkoutBlocked: bool, reviewsBlocked: bool, reason: string}
  tags            String[] @default([])         // ["VIP", "FRAUD_WATCH", "WHOLESALE", "INFLUENCER", ...]
  adminNotes      String?                       // internal-only notes by admin

  // ===== Preferences =====
  marketingOptIn  Boolean  @default(false)
  marketingOptInAt DateTime?

  // ===== Audit =====
  lastLoginAt     DateTime?
  lastLoginIp     String?
  signupSource    String?  // utm or referrer at signup
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  addresses           Address[]
  orders              Order[]
  reviews             Review[]
  passwordResetTokens PasswordResetToken[]
  otps                AuthOTP[]
  @@index([isActive])
  @@index([emailVerified])
}

enum Role { CUSTOMER ADMIN }
enum Gender { MALE FEMALE OTHER PREFER_NOT_TO_SAY }

model AuthOTP {
  id           String   @id @default(cuid())
  userId       String?                          // null = pre-signup OTP keyed by email
  user         User?    @relation(fields: [userId], references: [id])
  email        String                            // always store, even if userId present
  codeHash     String                            // bcrypt of 6-digit OTP
  purpose      OTPPurpose
  expiresAt    DateTime                          // typically now + 10 min
  attemptCount Int      @default(0)              // increment on failed verify, lock at 5
  usedAt       DateTime?
  ip           String?
  createdAt    DateTime @default(now())
  @@index([email, purpose])
}
enum OTPPurpose { EMAIL_VERIFY PASSWORD_RESET LOGIN_2FA EMAIL_CHANGE }

model Address {
  id         String  @id @default(cuid())
  userId     String
  user       User    @relation(fields: [userId], references: [id])
  name       String
  phone      String
  line1      String
  line2      String?
  city       String
  state      String
  pincode    String
  country    String  @default("IN")
  isDefault  Boolean @default(false)
  createdAt  DateTime @default(now())
}

model Product {
  id              String  @id @default(cuid())
  slug            String  @unique
  name            String
  description     String  // markdown
  shortDesc       String?
  isFeatured      Boolean @default(true)        // v1: the single featured product

  // ===== Visibility & lifecycle =====
  visibility      ProductVisibility @default(DRAFT)
  // DRAFT           — admin work-in-progress, not crawlable, not buyable
  // PUBLISHED       — fully live, buyable
  // HIDDEN          — exists but not listed/searchable; direct URL returns 404
  // COMING_SOON     — listed but not buyable; "Notify me" CTA instead of "Buy"
  // OUT_OF_STOCK    — listed but buy button disabled (manual override; stock engine also auto-flips this)
  // UNDER_MAINTENANCE — listed with banner; buy disabled; admin editing in flight
  // ARCHIVED        — removed from sitemap; old URLs 301 to home; orders preserved
  visibilityNote  String?                        // optional message shown to customer (e.g. "Restocking 1 May")
  availableFrom   DateTime?                      // scheduled publish (server flips visibility automatically)
  availableUntil  DateTime?                      // scheduled unpublish

  // ===== Refund policy =====
  isRefundable        Boolean @default(true)
  refundWindowDays    Int?    @default(7)        // null if isRefundable=false
  refundPolicyText    String?                    // per-product override; falls back to site-wide setting
  isReturnable        Boolean @default(true)     // return ≠ refund (e.g. exchange only)
  isExchangeable      Boolean @default(true)

  // ===== Payment & shipping overrides (per product, override site defaults) =====
  codEnabled          Boolean @default(true)     // false = COD blocked for this product
  onlinePaymentEnabled Boolean @default(true)    // false = COD-only (rare)
  freeShipping        Boolean @default(false)
  shippingOverride    Decimal? @db.Decimal(10,2) // null = use site flat rate
  codChargeOverride   Decimal? @db.Decimal(10,2) // null = use site COD charge
  restrictedPincodes  Json?                      // array of pincodes/regex; blocks these from buying

  // ===== Ordering rules =====
  minQtyPerOrder      Int     @default(1)
  maxQtyPerOrder      Int     @default(10)
  allowBackorder      Boolean @default(false)    // accept orders even when stock = 0
  preorderEnabled     Boolean @default(false)
  preorderShipDate    DateTime?                  // shown to customer

  // ===== Display flags =====
  showStockCount      Boolean @default(false)    // "Only 3 left!" badge to customers
  reviewsEnabled      Boolean @default(true)
  displayBadge        ProductBadge?              // NEW / BESTSELLER / LIMITED / SALE / null
  ctaLabelOverride    String?                    // default "Buy Now"; can be "Pre-order", "Notify Me", etc.

  // ===== Compliance =====
  requiresAgeVerification Boolean @default(false) // 18+ confirmation modal before add-to-cart
  hsnCode             String?                     // for GST invoicing
  gstRate             Decimal @default(0) @db.Decimal(5,2)

  media           ProductMedia[]
  variants        ProductVariant[]
  faqs            ProductFAQ[]
  reviews         Review[]
  seo             Json?                          // {title, description, ogImage}
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  @@index([visibility, isFeatured])
}

enum ProductVisibility {
  DRAFT
  PUBLISHED
  HIDDEN
  COMING_SOON
  OUT_OF_STOCK
  UNDER_MAINTENANCE
  ARCHIVED
}

enum ProductBadge { NEW BESTSELLER LIMITED SALE BACK_IN_STOCK }

model ProductMedia {
  id        String @id @default(cuid())
  productId String
  product   Product @relation(fields: [productId], references: [id])
  type      MediaType
  url       String
  altText   String?
  order     Int    @default(0)
}
enum MediaType { IMAGE VIDEO }

model ProductVariant {
  id         String @id @default(cuid())
  productId  String
  product    Product @relation(fields: [productId], references: [id])
  sku        String @unique
  name       String  // e.g. "Single", "Pack of 3"
  priceMrp   Decimal @db.Decimal(10,2)
  priceSale  Decimal @db.Decimal(10,2)
  weightGm   Int?
  isDefault  Boolean @default(false)
  isActive   Boolean @default(true)
  inventory  Inventory?
  orderItems OrderItem[]
  notifications StockNotification[]
}

model Inventory {
  id           String @id @default(cuid())
  variantId    String @unique
  variant      ProductVariant @relation(fields: [variantId], references: [id])
  stockOnHand  Int    @default(0)
  stockReserved Int   @default(0)  // held during pending payment
  lowStockThreshold Int @default(10)
  updatedAt    DateTime @updatedAt
  history      StockLedger[]
}

model StockLedger {
  id          String @id @default(cuid())
  inventoryId String
  inventory   Inventory @relation(fields: [inventoryId], references: [id])
  delta       Int
  reason      StockReason
  note        String?
  refOrderId  String?
  actorUserId String?
  createdAt   DateTime @default(now())
}
enum StockReason { MANUAL_ADD MANUAL_DEDUCT ORDER_RESERVE ORDER_CONFIRM ORDER_CANCEL ORDER_REFUND IMPORT INITIAL }

model Order {
  id              String   @id @default(cuid())
  orderNumber     String   @unique // e.g. DU-2026-00001
  userId          String?  // null = guest
  user            User?    @relation(fields: [userId], references: [id])
  guestEmail      String?
  guestPhone      String?
  status          OrderStatus @default(PLACED)
  paymentMethod   PaymentMethod
  subtotal        Decimal  @db.Decimal(10,2)
  discountAmount  Decimal  @default(0) @db.Decimal(10,2)
  shippingAmount  Decimal  @default(0) @db.Decimal(10,2)
  taxAmount       Decimal  @default(0) @db.Decimal(10,2)
  total           Decimal  @db.Decimal(10,2)
  currency        String   @default("INR")
  couponCode      String?
  shippingAddress Json     // snapshot, immutable
  billingAddress  Json?
  refundPolicySnapshot Json? // {isRefundable, refundWindowDays, isReturnable, isExchangeable, policyText} per item at order time
  notes           String?
  cancelReason    String?
  awbNumber       String?
  shippingCarrier String?
  placedAt        DateTime @default(now())
  confirmedAt     DateTime?
  shippedAt       DateTime?
  deliveredAt     DateTime?
  cancelledAt     DateTime?
  items           OrderItem[]
  payments        Payment[]
  events          OrderEvent[]
  metaPixelEventId String? // dedupe key for CAPI
}

enum OrderStatus { PLACED CONFIRMED SHIPPED DELIVERED CANCELLED RETURNED REFUNDED }
enum PaymentMethod { RAZORPAY COD }

model OrderItem {
  id          String @id @default(cuid())
  orderId     String
  order       Order  @relation(fields: [orderId], references: [id])
  variantId   String
  variant     ProductVariant @relation(fields: [variantId], references: [id])
  productName String  // snapshot
  variantName String  // snapshot
  sku         String  // snapshot
  unitPrice   Decimal @db.Decimal(10,2) // snapshot
  quantity    Int
  lineTotal   Decimal @db.Decimal(10,2)
}

model Payment {
  id                String @id @default(cuid())
  orderId           String
  order             Order  @relation(fields: [orderId], references: [id])
  method            PaymentMethod
  status            PaymentStatus
  amount            Decimal @db.Decimal(10,2)
  razorpayOrderId   String? @unique
  razorpayPaymentId String? @unique
  razorpaySignature String?
  failureReason     String?
  refundedAmount    Decimal @default(0) @db.Decimal(10,2)
  rawPayload        Json?   // full webhook for audit
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}
enum PaymentStatus { PENDING AUTHORIZED CAPTURED FAILED REFUNDED PARTIALLY_REFUNDED }

model OrderEvent {
  id        String @id @default(cuid())
  orderId   String
  order     Order  @relation(fields: [orderId], references: [id])
  type      String // STATUS_CHANGE, PAYMENT, EMAIL_SENT, NOTE, etc.
  payload   Json
  actorId   String? // admin user id, or null = system
  createdAt DateTime @default(now())
}

model Coupon {
  id              String @id @default(cuid())
  code            String @unique               // stored UPPERCASE, validated case-insensitively
  description     String?                       // admin-only label e.g. "Diwali 2026 Meta campaign"
  type            CouponType
  value           Decimal @db.Decimal(10,2)     // ₹ for FLAT, % for PERCENT, 0 for FREE_SHIPPING
  minOrder        Decimal? @db.Decimal(10,2)    // min cart subtotal to qualify
  maxDiscount     Decimal? @db.Decimal(10,2)    // cap for PERCENT type (e.g. 20% off max ₹500)
  usageLimit      Int?                          // global total uses; null = unlimited
  usedCount       Int     @default(0)           // denormalized counter; source of truth = CouponRedemption rows
  perUserLimit    Int?    @default(1)           // null = unlimited per user
  firstOrderOnly  Boolean @default(false)       // only customer's first ever order
  appliesToCOD    Boolean @default(true)        // disable on COD if needed
  startsAt        DateTime?
  endsAt          DateTime?
  isActive        Boolean @default(true)
  source          String?                       // free-text tag: "META_ADS", "INFLUENCER_X", "EMAIL_BLAST"
  createdBy       String                        // admin user id
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  redemptions     CouponRedemption[]
  @@index([code])
  @@index([isActive, startsAt, endsAt])
}
enum CouponType { FLAT PERCENT FREE_SHIPPING }

model CouponRedemption {
  id              String   @id @default(cuid())
  couponId        String
  coupon          Coupon   @relation(fields: [couponId], references: [id])
  orderId         String   @unique             // 1 coupon per order, enforced
  order           Order    @relation(fields: [orderId], references: [id])
  userId          String?                       // null for guest
  guestEmail      String?                       // for guest, to enforce perUserLimit by email
  guestPhone      String?                       // optional secondary key
  discountAmount  Decimal  @db.Decimal(10,2)    // actual ₹ discount applied
  cartSubtotal    Decimal  @db.Decimal(10,2)    // snapshot at redemption time
  redeemedAt      DateTime @default(now())
  // refund-aware: if order is refunded/cancelled, we flip this flag and refund the "use"
  isReversed      Boolean  @default(false)
  reversedAt      DateTime?
  reversalReason  String?
  @@index([couponId, userId])
  @@index([couponId, guestEmail])
  @@index([couponId, redeemedAt])
}

model Review {
  id            String   @id @default(cuid())
  productId     String
  product       Product  @relation(fields: [productId], references: [id])
  userId        String?                          // null for legacy / admin-imported reviews
  user          User?    @relation(fields: [userId], references: [id])
  orderId       String?                          // link to delivered order (verified buyer)
  authorName    String                            // snapshot (in case user renames later)
  rating        Int                               // 1-5
  title         String?
  body          String
  images        Json?                             // ["url1", "url2", ...] — max 5
  isApproved    Boolean  @default(false)          // requires admin approval before public
  isVerified    Boolean  @default(false)          // verified buyer (auto-set if orderId present + delivered)
  isFeatured    Boolean  @default(false)          // admin can pin to top
  isFlagged     Boolean  @default(false)          // reported by users
  flagReason    String?
  adminReply    String?                            // admin's public reply to the review
  adminReplyAt  DateTime?
  helpfulCount  Int      @default(0)
  editedAt      DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  @@unique([userId, productId, orderId])          // one review per user per product per order
  @@index([productId, isApproved, rating])
}

model ProductFAQ {
  id        String @id @default(cuid())
  productId String
  product   Product @relation(fields: [productId], references: [id])
  question  String
  answer    String
  order     Int @default(0)
}

model BroadcastEmail {
  id          String @id @default(cuid())
  subject     String
  bodyHtml    String
  segment     Json   // {all|active|recentBuyers|optedIn|customSql}
  sentAt      DateTime?
  scheduledAt DateTime?
  sentCount   Int @default(0)
  failedCount Int @default(0)
  status      EmailStatus @default(DRAFT)
  createdBy   String
  createdAt   DateTime @default(now())
}
enum EmailStatus { DRAFT SCHEDULED SENDING SENT FAILED }

model EmailLog {
  id        String @id @default(cuid())
  to        String
  template  String
  refType   String? // ORDER, BROADCAST, AUTH
  refId     String?
  status    String  // QUEUED, SENT, BOUNCED, FAILED
  provider  String  @default("resend")
  providerMessageId String?
  error     String?
  sentAt    DateTime @default(now())
}

model Setting {
  key   String @id
  value Json
}
// Settings: pixelId, capiAccessToken, gstNumber, brandName, supportEmail,
// shippingFlatRate, freeShippingThreshold, codCharge, codEnabled, lowStockThreshold,
// codPincodes (whitelist), maintenanceMode

model StockNotification {
  id         String   @id @default(cuid())
  variantId  String
  variant    ProductVariant @relation(fields: [variantId], references: [id])
  email      String
  phone      String?
  userId     String?
  notifiedAt DateTime?                 // set when back-in-stock email/SMS sent
  createdAt  DateTime @default(now())
  @@unique([variantId, email])
  @@index([variantId, notifiedAt])
}

model PasswordResetToken {
  id        String @id @default(cuid())
  userId    String
  user      User   @relation(fields: [userId], references: [id])
  tokenHash String @unique
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime @default(now())
}

model AuditLog {
  id        String @id @default(cuid())
  actorId   String?
  action    String
  entity    String
  entityId  String?
  diff      Json?
  ip        String?
  userAgent String?
  createdAt DateTime @default(now())
}
```

**Why this matters for multi-product readiness:** every `OrderItem` already references a `ProductVariant`. The cart, checkout, payment, and inventory engines are agnostic to product count. To go multi-product, we only build new UI (catalog page, product list, filters) — no schema migration.

---

## 5.5 Product Visibility & State Matrix (binding behavior table)

How each `ProductVisibility` state renders to customers vs. admin, and what actions are allowed:

| State | Listed on home / search | Direct URL | Add to cart | Checkout | Sitemap | Cart restore (if already added) | Customer CTA |
|---|---|---|---|---|---|---|---|
| DRAFT | No | 404 | No | No | No | Removed silently | — |
| PUBLISHED | Yes | 200 | Yes | Yes | Yes | Allowed | "Buy Now" (or override) |
| HIDDEN | No | 404 | No | No | No | Removed silently | — |
| COMING_SOON | Yes | 200 | No | No | Yes | Replaced with "Notify me" | "Notify me when available" |
| OUT_OF_STOCK | Yes | 200 | No | No | Yes | Replaced with "Notify me" | "Notify when back in stock" |
| UNDER_MAINTENANCE | Yes (with banner) | 200 (with banner) | No | No | Yes | Blocked at checkout | "Temporarily unavailable" |
| ARCHIVED | No | 301 → home | No | No | No | Removed silently | — |

**Rules:**
- Visibility is enforced at **API layer** (not just UI). Direct `POST /orders` with a non-PUBLISHED variant returns 422 with reason.
- Stock-driven auto-flip: if `stockOnHand <= 0` AND `allowBackorder = false` AND `preorderEnabled = false` → effective visibility = `OUT_OF_STOCK` (regardless of admin-set `PUBLISHED`). Admin's intent is preserved; the override is computed at request time. Restocking flips back automatically.
- Visibility change is logged in `AuditLog` with actor + before/after.
- Scheduled publish/unpublish is processed by a cron job every 5 minutes.

---

## 6. Customer Site — Functional Requirements

### 6.1 Sitemap
- `/` — Landing / Product page (single product = home)
- `/cart` — Cart
- `/checkout` — Checkout (single page, multi-step UI)
- `/order/[orderNumber]` — Order confirmation + tracking (token-link for guests)
- `/account` — Dashboard (requires login)
- `/account/orders` — Order history
- `/account/addresses` — Address book
- `/account/profile` — Profile
- `/login` `/signup` `/forgot-password` `/reset-password`
- `/terms` `/privacy` `/refund-policy` `/shipping-policy` `/contact` — legal/static
- `/sitemap.xml` `/robots.txt`

### 6.2 Landing page (the single most important page)

**Sections, mobile-first order:**
1. **Sticky header** — logo, cart icon with badge, hamburger (mobile) / nav (desktop).
2. **Hero** — H1 product name, sub-headline (problem→solution), primary CTA "Buy Now ₹X" (sticky on scroll), 1 hero image (LCP-critical).
3. **Social proof strip** — "★ 4.8 from 1,200+ buyers" + 3 logos / press mentions (if any).
4. **Image carousel / gallery** — swipeable on mobile, max 5 images, lazy-loaded after fold.
5. **Product video** — embedded YouTube/self-hosted with lazy-load (don't block LCP).
6. **Benefits** — 3-6 icon-led cards (not features — benefits).
7. **How it works / Ingredients / Specs** — collapsible accordion on mobile.
8. **Comparison table** (us vs others) — optional, very high CR impact.
9. **Reviews** — 6 reviews + "See all" → modal.
10. **FAQ** — accordion.
11. **Sticky "Buy Now" bar** at bottom on mobile (always visible after fold).
12. **Footer** — links, contact, GST/company info, payment icons.

**Mobile-first rules:**
- Single-column always under 768px.
- Tap targets ≥ 44×44px.
- Hero image 16:9 mobile, 4:3 desktop; AVIF + WebP with fallback.
- Above-the-fold weight ≤ 150KB transferred.
- Sticky CTA never covers more than 12% of viewport height.
- No popups in first 30 seconds (kills CR + violates Meta ad policy).

### 6.3 Cart
- Add to cart fires Meta `AddToCart` event with value/currency/content_ids.
- Quantity stepper (min 1, max 10 by default — configurable in Settings).
- Live total with shipping estimate (post-pincode entry).
- Coupon input field.
- "Continue Shopping" → back to `/`.
- Cart persists for guests via `localStorage`; for logged-in users via DB-backed cart (future) — v1 uses localStorage for both, server validates at checkout.

### 6.4 Checkout (the conversion engine)

**One-page checkout, mobile-first, 3 visual steps but all on one screen:**

```
[1] Contact          → email, phone (logged-in user: prefilled, optional change)
[2] Shipping address → name, line1, line2, pincode (validates serviceability), city/state auto-fill, landmark
[3] Payment          → radio: Pay Online (Razorpay) | Cash on Delivery (₹X extra)
                       → coupon, order summary always visible
[Place Order →]
```

Behaviour:
- Pincode entered → API call validates serviceability + auto-fills city/state.
- COD radio disabled if pincode not in COD-allowed list (configurable).
- COD adds ₹40 (configurable) handling fee, shown clearly.
- "Place Order" button is sticky on mobile.
- Fires Meta `InitiateCheckout` on page load, `AddPaymentInfo` when payment method selected.
- Guest checkout: no login required. Post-purchase, show "Save your details — set a password" CTA → creates account silently (email already on file).

**Server-side at place-order:**
1. Re-validate all prices against DB (never trust client).
2. Re-validate coupon (active, within limits, per-user limit).
3. Re-check stock (`stockOnHand - stockReserved >= qty`).
4. Re-validate pincode serviceability + COD eligibility.
5. Create `Order` (status=PLACED) + `OrderItem`s + reserve stock (`stockReserved += qty`).
6. **If Razorpay:** create Razorpay Order, return `razorpayOrderId` + key to client. Client opens Razorpay Checkout. On success → client posts payment_id + signature → server verifies HMAC → marks Payment CAPTURED → Order CONFIRMED → decrement `stockOnHand`, release `stockReserved` → fire emails + Meta Purchase event.
7. **If COD:** Order CONFIRMED immediately. Stock decrement happens at CONFIRMED. No payment record (or Payment with status=PENDING method=COD).

### 6.5 Order confirmation & tracking
- Confirmation page: `/order/[orderNumber]?token=...` (token = HMAC of orderNumber for guest access).
- Shows: order summary, estimated delivery, "Track Order" link, share button.
- Logged-in users see in `/account/orders` too.
- Real-time status (poll every 30s or SSE). v1 = polling.
- Status transitions trigger emails (see §10).

### 6.6 User account

#### 6.6.1 Registration
- **Minimum to create account**: email + password. Nothing else. Lowest possible signup friction.
- Password rules: ≥8 chars, ≥1 letter, ≥1 number. Bcrypt cost 12.
- Immediately on submit: account created with `emailVerified = false`, 6-digit OTP sent to email via SMTP (Resend transactional API).
- OTP screen appears: 6 input boxes, auto-advance, 60-second resend cooldown, max 5 attempts before 30-min lock.
- On correct OTP: `emailVerified = true`, `emailVerifiedAt = now`, JWT issued, user lands on dashboard.
- Unverified users can browse + add to cart but **cannot place an order**.
- OTP expires in 10 minutes; expired/used OTPs error out cleanly.
- Fires Meta `CompleteRegistration` after OTP success.

#### 6.6.2 Login
- Email + password.
- 5 failed attempts → account `lockedUntil = now + 30 min`. Locked users see clear message + option to reset password.
- Cross-device: each login issues a new refresh token; admin can force-logout all sessions of a user (Phase 2 = full session table; v1 = bump a `tokenVersion` field to invalidate).
- "Remember me" extends refresh token to 60 days; default 30.

#### 6.6.3 Password reset
- User enters email → 6-digit OTP sent.
- OTP screen → on correct, shows "new password" form → new password set, all existing sessions invalidated.
- Token in `AuthOTP` table with `purpose = PASSWORD_RESET`.
- Single-use, 10-min expiry.

#### 6.6.4 Profile
- Profile page sections:
  - **Basic**: name, email (verified badge; change requires OTP to new email + old password), phone (format-validated; SMS OTP verification = Phase 2), gender (dropdown, optional), date of birth (optional).
  - **Profile image**: upload (with client-side compression — see §6.7). Default avatar = initials on colored background.
  - **Marketing preferences**: opt-in toggle for promotional emails (separate from transactional).
- All fields except email + password are optional at signup. Required only at checkout (see §6.6.5).
- Account deletion request → soft-delete (PII redacted, orders preserved with anonymized customer name).

#### 6.6.5 Profile completion gate (checkout enforcement)
A logged-in customer can **only place an order** when:
1. Email is verified (`emailVerified = true`).
2. Name is filled.
3. Phone is filled (10-digit Indian mobile, format-validated). **OTP verification of phone is not required in v1** (no SMS provider in scope). Phone OTP via MSG91/Twilio is a Phase 2 add-on.
4. At least one address exists in their address book.
5. A shipping address is selected on checkout.
6. User is not `isActive = false` and not under any blocking restriction (`restrictions.checkoutBlocked !== true`).

If any are missing on the checkout page, customer is routed inline through completion steps — UI never throws them to a separate screen; checkout stays one continuous flow with sub-modals.

For **guest checkout** (no signup), the same data is collected inline; account is auto-created post-purchase with email already verified via order confirmation flow (we treat successful payment to that email as implicit verification — flag is set).

#### 6.6.6 Address book
- CRUD addresses. Mark default. Tag (Home / Office / Other).
- Pincode validation + serviceability check on save.
- Mandatory fields: name, phone, line1, city, state, pincode, country.
- Phone on address can differ from account phone (e.g. shipping to relative).

#### 6.6.7 Order history & reviews
- Order history with status pill, view detail, download invoice (PDF), reorder CTA, "Write a review" CTA (only on DELIVERED orders, only for refundable/non-refundable both — review is independent of refund).
- Re-order = adds same items to cart (validates current price + stock).

---

### 6.7 Customer reviews

#### 6.7.1 Who can review
- Only logged-in users who have a **DELIVERED order** containing that product variant.
- One review per user per (product, order) — enforced by DB unique constraint.
- Users blocked via `restrictions.reviewsBlocked = true` cannot submit (UI hides CTA, server rejects).

#### 6.7.2 Submission form
- Star rating (1–5), required.
- Title (optional, ≤120 chars).
- Body (required, 20–2000 chars; profanity filter via simple wordlist, server-side).
- Image upload: up to **5 images**, max 10MB each raw, JPEG/PNG/WebP/HEIC. Compressed before upload (see §6.7.4).
- Display name override (default = user's first name + last initial; user can change).
- Anonymous toggle (review still tied to userId server-side; public display = "Anonymous").

#### 6.7.3 Moderation
- Default `isApproved = false`. Admin reviews queue.
- Admin actions: approve, reject (with internal note), feature, unfeature, hide, delete, reply publicly.
- Verified-buyer badge auto-set when `orderId` is present + order DELIVERED.
- Once approved: review goes public; user gets email "Your review is live".
- Edits by user: allowed within 7 days of submission; resets to `isApproved = false` for re-moderation.
- Flagging by other users: clicking "Report" sets `isFlagged = true` + reason; admin notification.

#### 6.7.4 Image upload + compression pipeline

**Client-side (browser, before upload):**
1. Validate type (whitelist: jpeg, png, webp, heic) by MIME + magic bytes.
2. Validate size: reject if >10MB raw.
3. Strip EXIF (privacy: removes GPS/device data).
4. Resize using canvas: max dimension 1600px (long side); maintain aspect ratio.
5. Convert to WebP at quality 0.82 (fallback to JPEG quality 0.85 for browsers without WebP encode support).
6. Upload via signed URL to R2/S3.
7. Typical result: 1.5–5MB phone photo → 80–200KB upload.

**Server-side (post-upload processing — runs async in a queue):**
1. Re-validate magic bytes (defense vs. tampered MIME).
2. Run through `sharp`:
   - Generate `thumb` (300px wide).
   - Generate `medium` (800px wide).
   - Generate `full` (1600px wide).
   - Output AVIF + WebP for each; keep JPEG as fallback.
3. Strip residual EXIF/ICC profile.
4. Run NSFW/abuse detection (Phase 2 — `nsfwjs` or third-party API).
5. Store URLs in `Review.images` as `[{thumb, medium, full}]`.

**Storage layout:**
```
r2://diteup-media/reviews/{reviewId}/{imageId}-thumb.webp
r2://diteup-media/reviews/{reviewId}/{imageId}-medium.webp
r2://diteup-media/reviews/{reviewId}/{imageId}-full.webp
```

**Display:**
- Thumbnail grid on review card. Click → lightbox with full image + swipe.
- `<Image>` component handles AVIF → WebP → JPEG fallback.

#### 6.7.5 Display on product page
- Reviews section: summary block (avg rating, total count, distribution bars 1–5), filter (with-images, by-rating, most-helpful, most-recent), pagination (10 per page).
- Verified badge, image thumbnails, helpful count, admin reply (if any), date.
- JSON-LD `AggregateRating` and individual `Review` schema for SEO.

#### 6.7.6 Anti-abuse
- Rate limit: 3 reviews/day per user.
- One review per (user, product, order).
- Profanity filter (server-side wordlist).
- Image NSFW filter (Phase 2).
- Admin can mass-delete reviews from a tagged user.

---

## 7. Admin Panel — Functional Requirements

### 7.1 Access & roles
- Route group `/admin/*` behind middleware: requires `Role = ADMIN`.
- First admin seeded via env-driven script during deploy.
- Admin can create additional admins (out of v1 scope unless requested — single admin in v1).
- 2FA optional (TOTP) — recommended add-on.

### 7.2 Dashboard (`/admin`)
KPI tiles (today / 7d / 30d toggles):
- Revenue (gross + net of refunds)
- Orders count (by status)
- New users
- Conversion rate (sessions vs orders — requires analytics integration; v1 shows orders/visits if available)
- Current stock + low-stock alert badge
- Pending action items: orders to confirm, orders to ship, COD orders to verify

Recent orders table (last 10) with quick-action buttons.

### 7.3 Orders (`/admin/orders`)
- Table: orderNumber, customer, total, payment method, status, placedAt.
- Filters: status, date range, payment method, COD/online, customer (search by email/phone), search by orderNumber.
- Bulk actions: mark shipped (with AWB upload), export CSV.
- Pagination: server-side, 25/50/100 per page.
- **Order detail page:**
  - Customer info + shipping address.
  - Line items.
  - Payment timeline (every webhook event).
  - Status timeline (every status change with timestamp + actor).
  - **Actions:** Confirm, Mark Shipped (requires AWB + carrier), Mark Delivered, Cancel (with reason), Refund (full/partial via Razorpay API), Add internal note, Resend invoice/confirmation email.
  - Print invoice (PDF, GST-compliant).
- Export Orders → Excel (date-range filtered).
- Import Orders from Excel — **only for status bulk-update** (e.g., bulk-mark-shipped with AWBs from courier file). Never for creating orders.

### 7.4 Payments & Transactions (`/admin/payments`)
- Table: paymentId, orderNumber, method, status, amount, razorpayPaymentId, createdAt.
- Filters: status, method, date range.
- Drill-down: full Razorpay webhook payload (for support tickets).
- Manual refund trigger (calls Razorpay refund API, logs response).
- Revenue summary widget (daily/weekly/monthly bars).
- Reconciliation export: matches Razorpay settlement reports.

### 7.5 Users (`/admin/users`)

**List view:**
- Table: name, email (verified ✓ badge), phone (verified ✓ badge), orders count, LTV (₹), lastOrderAt, signup date, status pill, tags.
- Search: name, email, phone, order number.
- Filters: active/disabled, email verified, phone verified, has placed order, marketing opt-in, tag (multi-select), restriction (COD blocked / checkout blocked / reviews blocked), signup source, date range.
- Sorting: by LTV, orders count, signup date, last order date.
- Pagination: server-side, 25/50/100.
- Bulk actions: tag, untag, send email, export to Excel, enable, disable.

**User detail page (`/admin/users/:id`):**
- **Header**: avatar, name, email + verified badge, phone + verified badge, status, tags (chip-style, removable).
- **Profile tab**: all fields editable except email (email change requires user OTP); admin can manually set `emailVerified = true` (audit-logged) for support cases.
- **Orders tab**: full order history with quick-jump to order detail.
- **Addresses tab**: read-only view of address book.
- **Reviews tab**: all reviews by user with admin moderation controls inline.
- **Activity tab**: last 20 events (login, password reset, profile edits, address adds, review submissions). Sourced from `AuditLog`.
- **Email history tab**: every transactional + broadcast email sent to this user with delivery status (from `EmailLog`).
- **Admin notes**: internal-only free-text field.
- **Restrictions panel** (toggles, all audit-logged on change):
  - Disable account (cannot log in or checkout).
  - Block checkout (can log in, can browse, cannot place orders).
  - Block COD (only online payment allowed).
  - Block reviews (cannot submit reviews).
  - Block marketing (excluded from broadcasts even if opted in — for hard suppressions).
  - Each toggle requires a reason note (mandatory).
- **Admin actions**:
  - Force email verification (manual).
  - Force password reset (sends email with reset link).
  - Force logout all sessions (bumps tokenVersion).
  - Resend welcome email.
  - Manually verify phone.
  - Anonymize PII (DPDP "right to be forgotten" request).
  - Impersonate user (Phase 2 — read-only support view).

**Hard-delete is never allowed.** Anonymization replaces PII with deterministic hashes; orders + audit trail preserved.

**User tags (admin-defined, free-form):** Common ones — `VIP`, `WHOLESALE`, `FRAUD_WATCH`, `INFLUENCER`, `RTO_RISK`, `EARLY_ACCESS`. Tags drive segmentation in broadcasts and analytics. Tags are also visible on the order detail page next to customer name.

**Exports** (Excel/CSV):
- Selected users only.
- Current filter set.
- Full export (all users) — rate-limited to once per hour.
- Columns: configurable; default = name, email, phone, orders count, LTV, lastOrderAt, marketingOptIn, tags, status, signup date.

### 7.6 Inventory (`/admin/inventory`)
- Stock view per variant: on-hand, reserved, available (on-hand − reserved), low-stock threshold.
- Manual adjust: `+/-` quantity with mandatory reason note → writes to `StockLedger`.
- Stock history table (filter by variant, date).
- Excel import: columns `sku, new_stock, reason` → validates, dry-run preview, then commit.
- Excel export: current stock snapshot.
- Low-stock alert on dashboard + email to admin when threshold hit.

### 7.7 Products (`/admin/products`)
Even though v1 sells one product, admin manages it via a full product editor (makes multi-product trivial later). The editor is organized into tabs:

**Tab 1 — Basics**
- Name, slug (auto + manual override), short description, long description (markdown editor), display badge (None / New / Bestseller / Limited / Sale / Back in stock), CTA label override (e.g. "Pre-order Now").

**Tab 2 — Visibility & Lifecycle**
- **Visibility status** (radio with descriptions):
  - `Draft` — invisible everywhere, admin-only.
  - `Published` — fully live and buyable.
  - `Hidden` — exists for direct buyers via URL but excluded from listing/search/sitemap. Direct URL returns 404 to public.
  - `Coming Soon` — listed with "Notify me" CTA; not buyable.
  - `Out of Stock` — listed; "Out of stock" badge; buy disabled; "Notify when back" CTA.
  - `Under Maintenance` — listed with banner; buy disabled (used while admin edits content/price).
  - `Archived` — removed from sitemap; old URL 301s to home; order history preserved.
- **Visibility note** — free-text shown to customer under state badge (e.g. "Restocking from 25 May").
- **Scheduled publish**: `Available from` datetime — server auto-flips DRAFT → PUBLISHED at this time.
- **Scheduled unpublish**: `Available until` datetime — server auto-flips to HIDDEN at this time.
- Visibility change is one click; current state shown as colored pill in product list.

**Tab 3 — Pricing & Tax**
- Per-variant MRP, sale price (strike-through MRP shown to customers if sale < MRP).
- HSN code, GST rate.
- "Show stock count to customer" toggle (renders "Only N left" if `< lowStockThreshold`).

**Tab 4 — Inventory**
- Per-variant stock view (read-only here — actual edits in /admin/inventory).
- Low-stock threshold override (per variant).
- **Allow backorder** — accept orders when stock = 0.
- **Preorder mode** — accepts orders, marks them with `isPreorder = true` (Phase 2 field on Order if needed), shows expected ship date to customer.

**Tab 5 — Payment & Shipping** (per-product overrides)
- **COD enabled for this product** (default: site setting). If off, COD radio disabled at checkout when only this product in cart.
- **Online payment enabled** (default: on). Rare off-case for cash-only products.
- **Free shipping** (overrides site flat rate).
- **Custom shipping rate** ₹ (overrides site rate).
- **Custom COD charge** ₹ (overrides site default).
- **Restricted pincodes** — paste or upload list; orders to these pincodes are blocked with friendly error.

**Tab 6 — Ordering Rules**
- **Min quantity per order** (default 1).
- **Max quantity per order** (default 10).
- **Requires age verification (18+)** — shows confirmation modal before add-to-cart.

**Tab 7 — Refund / Return Policy** (per-product override)
- **Is refundable** (Yes / No). If No: order confirmation, product page, and invoice all display "Non-refundable" prominently. Refund button in admin order detail is disabled (with tooltip explaining why) — admin can still override with a forced refund + reason, audit-logged.
- **Refund window (days)** — default 7. Used to gate the "Request return" CTA on customer order page.
- **Is returnable** (Yes / No) — separate from refund (some products: returnable for exchange only).
- **Is exchangeable** (Yes / No).
- **Custom refund policy text** — overrides site-wide default; shown on product page in collapsible section and in confirmation email.

**Tab 8 — Media**
- Drag-reorder, add/replace images & videos. Alt text required on every image.

**Tab 9 — Variants**
- Add SKU, set MRP, sale price, weight. Set default variant. Active toggle.

**Tab 10 — FAQs** — CRUD with drag-reorder.

**Tab 11 — Reviews** — approve/reject, mark verified, delete, reply.

**Tab 12 — SEO** — title, meta description, OG image, canonical override.

**Product list view (`/admin/products`):**
- Table with: name, status pill (color-coded by visibility), stock, price, last updated.
- Quick-action: change visibility from a dropdown without entering editor.
- Bulk: change visibility, archive, export.
- Filters: visibility status, has-stock, refundable, COD-enabled.

**Stock notifications view (per-product, accessible from inventory):**
- List of `StockNotification` rows for each variant (email + signup date).
- "Notify all" button — triggers back-in-stock email batch (uses Resend, throttled).
- Auto-trigger: when admin manually restocks a variant from 0 → >0, system queues notification batch (admin gets a confirmation prompt).

### 7.8 Coupons (`/admin/coupons`)

**Create / edit coupon — fields:**
- Code (auto-uppercased; uniqueness checked).
- Description (internal label).
- Type: Flat ₹ / Percent % / Free shipping.
- Value.
- Min cart subtotal (optional).
- Max discount cap (for % type).
- Usage limit (global, total uses).
- Per-user limit (default 1; null = unlimited).
- First-order-only toggle.
- Applies to COD (toggle).
- Start / end date.
- Source tag (free text — used to track which campaign drove redemptions, e.g. `META_NOV_RETARGET`).
- Active toggle.

**Coupon list view:**
- Table: code, type, value, used / limit, ₹ discount given total, ₹ revenue from coupon orders, status (active/expired/exhausted), end date.
- Filters: active, expired, exhausted, source.
- Bulk actions: deactivate, export usage CSV.

**Per-coupon analytics page (`/admin/coupons/:id`):**
- Headline stats: total redemptions, unique users redeemed, total discount given (₹), total revenue from redeemed orders (₹), avg order value with coupon, conversion impact (avg AOV vs. site avg).
- Redemption timeline chart (daily / weekly bars).
- Redemption table: orderNumber, customer (email + name), discount applied, cart subtotal, redeemedAt, order status, isReversed.
- Export redemptions to Excel/CSV.
- "Top redeemers" — users with most uses of this coupon.

**Site-wide coupon analytics on main dashboard:**
- Top 5 coupons by usage (last 30d).
- Total discount given (last 7d / 30d).
- Coupon revenue contribution % (orders with coupon ÷ all orders).

### 7.9 Emails (`/admin/emails`)

**Transactional templates** (auto-fired by system):
- Predefined list: welcome, email OTP verification, password reset OTP, order placed (payment pending), order confirmed (with invoice attached), order shipped (with AWB), order delivered, order cancelled, refund processed, review live, low-stock (to admin), new order (to admin), back-in-stock (to subscribers).
- Each editable: subject, body (rich text + merge tags), enabled toggle.
- Live preview with sample data + "Send test to my email" button.
- Reset to default button (rolls back to system defaults).

**Broadcasts** (admin-initiated bulk):
- **Composer**: subject, body (rich text with image embed), pre-header text, merge tags (`{{name}}`, `{{firstName}}`, `{{lastOrderDate}}`, `{{couponCode}}` if inserted).
- **Segment builder** (combine with AND):
  - All registered users
  - Marketing opted-in only (required by default for promotional sends)
  - Has placed ≥ N orders
  - Last order in last X / not in last X days
  - LTV ≥ ₹X
  - Signed up in last X days
  - Has tag(s) — multi-select
  - Excludes users with `restrictions.marketingBlocked = true` (always)
  - Excludes bounced/suppressed emails (always)
  - Custom SQL (admin-only, with audit log) — for advanced segments
- **Segment preview**: shows count + first 10 sample recipients before sending.
- **Send options**: send now / schedule for later.
- **Throttling**: 100 emails/min via Resend to protect domain reputation.
- **Send report** (live): queued, sent, delivered, opened (if tracking enabled), clicked, bounced, complained, unsubscribed. Refreshes every 30s.
- **Save as draft / template** for reuse.
- **A/B test** (Phase 2): two subject lines, 20% test split, winner sends to rest.

**Email log** (`/admin/emails/log`):
- Every email sent: recipient, template, status, provider message ID, sentAt, opened, clicked, bounce reason if failed.
- Filters: status, template type, date range, recipient search.
- Drill-down: full payload + provider response.
- Export to Excel.

**Suppression list** (bounced / complained / unsubscribed):
- Auto-maintained from Resend webhooks.
- Admin can manually add/remove (with reason).
- All sends respect suppression list automatically.

**DPDP / CAN-SPAM compliance**:
- Unsubscribe link mandatory on every broadcast (one-click).
- Physical business address in footer.
- Promotional sends only to opted-in users.

---

### 7.11 Reports & Exports (`/admin/reports`)

Centralized hub for all Excel/CSV reports. Every export shows a preview before download. Large exports (>10K rows) are emailed as downloadable links instead of synchronous download.

**Orders reports**
- All orders (filter by date range, status, payment method, COD/online, customer tag).
- Daily sales summary (date, orders, gross revenue, discounts, shipping, tax, net revenue).
- Weekly / Monthly summaries.
- Order items detail (one row per item, useful for fulfillment).
- Pending fulfillment (CONFIRMED but not SHIPPED).
- Shipped not delivered (>X days).
- Cancelled orders with reasons.
- COD orders awaiting delivery / pending RTO.

**Payments reports**
- All transactions (date, orderNumber, customer, method, status, amount, Razorpay payment ID).
- Settled vs unsettled (matches Razorpay payout cycle).
- Refunds report (with reasons).
- Failed payments report (for retargeting / abandoned-recovery).
- GST report (CGST, SGST, IGST split by month for filing).

**Users reports**
- All users (configurable columns).
- New signups by date.
- Top customers by LTV / orders count.
- Inactive users (no order in X days).
- Marketing opted-in list.
- Tagged users (by tag).

**Inventory reports**
- Current stock snapshot (SKU, name, on-hand, reserved, available, last updated).
- Stock movement (ledger) by date range — every increment/decrement with reason + actor.
- Low-stock report (below threshold).
- Out-of-stock SKUs.
- Stock valuation (qty × cost — Phase 2, requires cost-price field).

**Coupon reports**
- All coupons with usage stats.
- Per-coupon redemption detail.
- Discount given by date range.
- Revenue contribution from coupons.

**Reviews reports**
- All reviews with rating + status.
- Avg rating per product over time.
- Reviews pending moderation.

**Email reports**
- Per-broadcast performance.
- Suppression list export.
- Bounce report.

**Format options**: Excel (.xlsx via SheetJS) is default; CSV available. Date range picker on every report. Saved-filter presets per admin user.

**Scheduled reports** (Phase 2): admin can schedule "Email me the daily sales report at 9am every morning". v1 = manual.

### 7.9.5 Reviews moderation (`/admin/reviews`)
Even though §7.7 has reviews under the product editor, there's also a global moderation queue:
- List: all reviews, filterable by status (pending / approved / rejected / flagged), product, rating, date, has-images.
- Quick actions: approve, reject, feature, hide, delete, reply.
- Bulk: approve selected, delete selected.
- Drill-down: full review, images (with lightbox), reviewer profile link, order link (verifies purchase).
- "Suspected fake review" indicator (Phase 2 — heuristics: same IP, similar text, no purchase).
- Auto-rules (Phase 2): auto-approve 5-star verified-buyer reviews with no images.

---

### 7.10 Settings (`/admin/settings`)
Settings are organized into sub-pages. **Any setting marked "(default)" can be overridden at the product level** — product-level always wins.

**General**
- Brand name, support email, contact phone, business address, business hours.
- Default currency (INR — locked v1).
- Cookie banner copy + consent expiry days.

**GST & Invoicing**
- GSTIN, default HSN code, default tax rate (default), invoice number prefix, fiscal year start month.
- Tax display: inclusive vs. exclusive of GST on product pages.

**Shipping**
- Flat rate ₹ (default).
- Free-shipping threshold ₹ (cart subtotal ≥ X).
- Default estimated delivery days (shown on PDP + checkout).
- Restricted pincodes site-wide (CSV upload).
- Serviceable pincode list (CSV upload) — orders to non-serviceable pincodes are blocked.

**COD**
- COD enabled globally (master switch — turning off disables COD even for products that have it enabled).
- COD charge ₹ (default).
- COD-allowed pincode list (CSV / regex ranges).
- COD max order value (block COD on high-AOV orders to limit RTO risk).
- COD min order value.
- First-order COD allowed (yes/no) — block COD for first-time buyers from new pincodes if needed.

**Refund / Return Policy (site-wide defaults)**
- Default `isRefundable` for new products.
- Default refund window days.
- Default refund policy text (markdown).
- Default return policy text.
- Auto-approve refund requests under ₹X (admin saves time on small refunds).

**Inventory**
- Default low-stock threshold.
- Allow backorder globally (default for new products).
- Out-of-stock behavior site-wide: `Hide product` / `Show as out-of-stock` / `Allow backorder`.
- Show stock count to customer (default).
- Stock reservation timeout (minutes) — default 30 min for pending Razorpay orders.

**Order Rules**
- Default min/max qty per order.
- Min cart subtotal to checkout (₹).
- Order auto-cancel timeout for unpaid orders (default 30 min).

**Payments**
- Razorpay key id, key secret, webhook secret (encrypted at rest, masked in UI).
- Razorpay test mode toggle.
- Payment methods to allow on Razorpay (cards / UPI / netbanking / wallets — checkboxes).

**Meta**
- Pixel ID.
- CAPI access token (optional, encrypted).
- Test event code (for QA).
- Consent-mode toggle (don't fire until cookie consent given).

**Email**
- Resend API key, from name, from email, reply-to, BCC for admin notifications.
- DKIM / SPF status check (live).
- Unsubscribe footer text.

**SEO**
- Site title, default meta description, default OG image, Twitter handle, organization JSON-LD.
- robots.txt overrides.
- Sitemap auto-rebuild interval.

**Site-Wide Mode**
- **Maintenance mode** — toggles site into holding page (admin can still log in via direct `/admin` URL; allowlisted IPs can bypass).
- **Checkout-only maintenance** — site browsable but checkout disabled (use during inventory audits).
- **Banner mode** — site-wide announcement bar (e.g. "Diwali sale — free shipping all week").

**Audit & Security**
- Admin allowlist IPs (optional).
- Session timeout minutes.
- 2FA enforcement toggle (Phase 2).
- View audit log (last 100 admin actions).

**Backup**
- Trigger manual backup.
- View last backup status + timestamp.
- Download DB dump (admin only, audit-logged).

---

## 8. Order Lifecycle (State Machine)

```
                 ┌──────────────────────────┐
                 │       PLACED             │ ◄── created, stock reserved
                 └────────────┬─────────────┘
                  payment OK / COD selected
                              ▼
                 ┌──────────────────────────┐
        ┌────────│      CONFIRMED           │ ◄── stock decremented
        │        └────────────┬─────────────┘
        │                     │ admin marks shipped + AWB
   admin cancel               ▼
        │        ┌──────────────────────────┐
        │        │       SHIPPED            │
        │        └────────────┬─────────────┘
        │                     │ admin marks delivered (or auto after X days)
        │                     ▼
        │        ┌──────────────────────────┐
        │        │       DELIVERED          │
        │        └────────────┬─────────────┘
        │                     │ within return window
        ▼                     ▼
 ┌─────────────┐     ┌──────────────────────┐
 │  CANCELLED  │────►│      REFUNDED        │
 └─────────────┘     └──────────────────────┘
```

**Rules:**
- PLACED → CONFIRMED: automatic for Razorpay (on webhook capture), automatic for COD (on order creation).
- PLACED → CANCELLED: customer can self-cancel within 1 hour if not yet CONFIRMED (Razorpay only). Always admin-cancellable.
- CONFIRMED → SHIPPED: admin only, must provide AWB + carrier.
- SHIPPED → DELIVERED: admin only (v1). Auto via courier webhook = Phase 2.
- Any → CANCELLED: admin only after CONFIRMED. Triggers stock restock (`stockOnHand += qty`) + refund flow if Razorpay.
- DELIVERED → RETURNED → REFUNDED: admin only.
- Every transition writes an `OrderEvent` row with actor + timestamp.

---

## 8.5 Coupon Redemption Logic (server-side, authoritative)

Every coupon validation runs the **same pipeline** in two places: (a) when user clicks "Apply" on cart/checkout (preview), and (b) inside the order-creation transaction (commit). Client never decides eligibility.

### 8.5.1 Validation pipeline (in order)
1. **Exists & active**: `coupon.isActive = true`, found by `code` (case-insensitive).
2. **Date window**: `now >= startsAt` and `now <= endsAt` (nulls allowed).
3. **Global usage**: `coupon.usedCount < coupon.usageLimit` (skip if `usageLimit` null).
4. **Per-user usage**: count `CouponRedemption` rows where `couponId = X AND isReversed = false AND (userId = currentUserId OR guestEmail = currentEmail)` — must be `< perUserLimit`.
5. **First-order-only**: if flag set, customer must have zero prior CONFIRMED orders (by userId or guestEmail).
6. **Min order**: `cart.subtotal >= coupon.minOrder` (after item-level discounts, before shipping & COD fee).
7. **COD restriction**: if `coupon.appliesToCOD = false` and `paymentMethod = COD`, reject.
8. **Compute discount**:
   - `FLAT` → `min(value, cart.subtotal)`
   - `PERCENT` → `min(cart.subtotal * value/100, maxDiscount ?? Infinity)`
   - `FREE_SHIPPING` → set `shippingAmount = 0`, discount = original shipping
9. Return preview `{eligible, discountAmount, message}` or reject with specific reason.

### 8.5.2 Atomic commit (inside order-creation TX)
Same pipeline re-runs inside the Postgres transaction, with `SELECT ... FOR UPDATE` on the `Coupon` row to prevent race conditions on `usedCount`. On success:
1. Insert `CouponRedemption` row.
2. `Coupon.usedCount += 1`.
3. Order stores `couponCode` (snapshot — preserves history even if coupon deleted/changed later).

Both ops are in the same TX as `Order` + `OrderItem` + stock reservation. Any failure = full rollback. No partial state possible.

### 8.5.3 Reversal on cancel / refund / RTO
- Order CANCELLED before SHIPPED → `CouponRedemption.isReversed = true`, `Coupon.usedCount -= 1`. Free the slot for that user.
- Order REFUNDED / RETURNED → same reversal.
- Order partially refunded → redemption stays (we don't pro-rate). Document this in admin tooltip.

### 8.5.4 Guest vs logged-in tracking
- **Logged-in**: tracked by `userId`. `perUserLimit` enforced reliably.
- **Guest**: tracked by lowercased `guestEmail` (primary) + `guestPhone` (secondary check). User can game this by using a new email — accepted risk. Mitigation: `firstOrderOnly` coupons + future phone OTP verification (Phase 2) closes the loophole.
- If guest converts to account post-purchase (via "set password" flow), prior guest redemptions are linked to the new `userId` so future enforcement is correct.

### 8.5.5 Snapshot vs. live data
- `Order.couponCode` is a snapshot string. If admin later edits the coupon's value or deletes it, historical orders are unaffected.
- Reports built from `CouponRedemption` (not from current `Coupon` value).

---

## 9. Payments (Razorpay) — Detailed Flow & Edge Cases

### 9.1 Happy path (online)
1. Client → `POST /api/orders` → server creates Order (PLACED) + Razorpay Order.
2. Client receives `razorpayOrderId` → opens Razorpay Checkout JS.
3. User pays → Razorpay returns `payment_id, order_id, signature` to client.
4. Client → `POST /api/payments/verify` with those fields.
5. Server verifies HMAC-SHA256 signature against secret. If valid → Payment.status = CAPTURED, Order.status = CONFIRMED, stock decrements, emails + Meta Purchase event fired.
6. **Parallel safety net:** Razorpay webhook `payment.captured` hits `POST /api/webhooks/razorpay` → same handler is idempotent. Whichever arrives first wins, the second is a no-op (idempotency key = `razorpay_payment_id`).

### 9.2 Edge cases & failure modes

| Scenario | Handling |
|---|---|
| User closes Razorpay modal | Order stays PLACED with reserved stock. Auto-cancel job runs every 15 min, releases stock after 30 min if no payment received. |
| Payment fails (insufficient funds) | Razorpay returns failure → client shows retry CTA. Order remains PLACED. Stock stays reserved (released by auto-cancel). |
| Webhook fires but client `/verify` never called | Webhook handler is the authoritative source. Updates Order to CONFIRMED. Client gets reconciled on next poll. |
| Duplicate webhook | Idempotency: check if Payment with `razorpayPaymentId` already exists → no-op. |
| Webhook arrives before client verify | Same — webhook commits, client verify sees already-CONFIRMED order, returns success. |
| Signature verification fails | Reject. Log to AuditLog. Alert admin via Sentry. Do not confirm order. |
| Partial capture / authorize-only | Not used in v1. Razorpay default = auto-capture. |
| Refund initiated by admin | Calls `POST /payments/{id}/refund`. On webhook `refund.processed` → Payment.refundedAmount, Order.status = REFUNDED, stock restocked if applicable. |
| Refund webhook fails to arrive | Daily reconciliation job pulls Razorpay refund list, syncs DB. |
| Customer pays but Order never created (extreme race) | Razorpay receipt = orderId in our DB. If no match → log, admin alert. Should never happen in practice. |
| User pays twice (double-clicks before idempotency) | Razorpay enforces single capture per order id. Second attempt errors out client-side. |

### 9.3 COD-specific
- COD order goes straight to CONFIRMED, decrements stock.
- COD fraud guard:
  - First-time customer + order value > ₹2,000 → flag for manual verification (status held at PLACED + admin task).
  - Pincode must be in COD-allowed list.
  - Phone number must pass simple regex + OTP verification (Phase 2 — for v1, we accept the risk and document).
- COD cancellation: customer can self-cancel anytime before SHIPPED.
- RTO (return to origin): admin manually marks RETURNED if courier returns undelivered. Stock restocked.

### 9.4 Invoicing
- GST invoice generated as PDF on order CONFIRMED.
- Stored in R2/S3; link in confirmation email.
- Invoice number sequential: `DU/YY-YY/0001`. Resets each fiscal year.
- Contains: GSTIN, HSN, CGST/SGST split (intra-state) or IGST (inter-state), buyer name + address.

---

## 10. Email System

### 10.1 Transactional emails (auto-triggered)
| Trigger | Recipient | Subject (default) |
|---|---|---|
| Signup | Customer | Welcome to DiteUp |
| Password reset request | Customer | Reset your DiteUp password |
| Order placed (Razorpay pending) | Customer | We received your order #DU-... |
| Order confirmed | Customer | Order confirmed — invoice attached |
| Order shipped | Customer | Your order is on the way — Track here |
| Order delivered | Customer | Delivered — how was it? |
| Order cancelled | Customer | Your order has been cancelled |
| Refund processed | Customer | Refund processed for #DU-... |
| Low stock | Admin | ⚠️ Low stock alert: {SKU} |
| New order | Admin | 🛒 New order #DU-... |

### 10.2 Broadcasts
- Composer with merge tags: `{{name}}`, `{{firstName}}`, `{{lastOrderDate}}`.
- Preview + send-test-to-myself.
- Segment selectors: All / Opted-in / Past 30d buyers / Cart abandoners (Phase 2).
- Throttled send (100/min via Resend) to avoid bouncing.
- Unsubscribe link mandatory; one-click unsubscribe sets `marketingOptIn = false`.

### 10.3 Email delivery
- Resend.com (recommended). Fallback envelope: SendGrid/Brevo if Resend down.
- SPF, DKIM, DMARC must be set up on `diteup.com` before launch.
- Bounce/complaint webhook updates `EmailLog`.

---

## 11. Meta (Facebook) Pixel Integration

### 11.1 Events fired (browser-side)
| Event | When | Parameters |
|---|---|---|
| PageView | Every route change | — |
| ViewContent | Landing page loaded | content_ids, content_type, value, currency |
| AddToCart | Add-to-cart clicked | content_ids, value, currency, num_items |
| InitiateCheckout | Checkout page loaded | content_ids, value, currency, num_items |
| AddPaymentInfo | Payment method selected | value, currency |
| Purchase | Order CONFIRMED page loaded | content_ids, value, currency, transaction_id (orderNumber) |
| Lead / CompleteRegistration | Signup success | — |

### 11.2 Server-side (optional, recommended add-on)
- Conversions API (CAPI) fires `Purchase` server-side on order confirmation webhook.
- Both events share `event_id = orderNumber` for dedupe.
- CAPI access token stored encrypted in Settings.

### 11.3 Privacy / consent
- Cookie banner on first visit (required for India's DPDP compliance + EU traffic safety).
- Pixel doesn't fire until consent granted (or implicit on first interaction — configurable in Settings).
- Hash PII (email, phone) with SHA-256 before sending via CAPI.

---

## 12. Inventory Engine — Concurrency & Edge Cases

### 12.1 Reservation pattern
- `stockOnHand` = real stock physically present.
- `stockReserved` = stock held for pending orders.
- `available = stockOnHand - stockReserved`.
- Add-to-cart does NOT reserve. Reservation happens at order creation (PLACED).
- All stock mutations happen inside a Postgres transaction with `SELECT ... FOR UPDATE` on the `Inventory` row to prevent oversell races.

### 12.2 Race scenarios
| Scenario | Behaviour |
|---|---|
| 2 users place order for last unit simultaneously | First TX locks Inventory row, reserves; second TX waits, then fails with "out of stock". Returns clear error to user. |
| Order placed but payment never completes | Auto-cancel job (every 15 min) cancels PLACED orders older than 30 min, releases reservation. |
| Admin manually changes stock mid-checkout | Reservation logic re-validates at TX time. Customer sees "stock changed" error if conflict. |
| Refund issued | Restock = `stockOnHand += qty`, logged in StockLedger with `ORDER_REFUND`. |
| Cancelled order before CONFIRMED | Release reservation: `stockReserved -= qty`. |
| Cancelled order after CONFIRMED | `stockOnHand += qty` (restock). |

### 12.3 Excel import edge cases
- Validate every row before any commit (dry-run preview).
- Unknown SKU → error row.
- Negative stock → reject.
- Concurrent admin edits → last-write-wins with audit log.

---

## 13. Non-Functional Requirements

### 13.1 Performance
- Landing page LCP ≤ 2.5s on mid-tier mobile 4G (Moto G Power class).
- TTFB ≤ 200ms (cached SSG) for landing.
- API p95 latency ≤ 300ms for checkout endpoints.
- Image sizes: hero ≤ 80KB AVIF, gallery ≤ 120KB AVIF each.
- JS bundle on landing: ≤ 150KB gzipped.

### 13.2 Security
- HTTPS everywhere; HSTS enabled.
- Passwords: bcrypt (cost 12).
- JWT signed with HS256, secret in env, rotated quarterly.
- Refresh tokens: httpOnly, secure, sameSite=lax cookie.
- CSRF protection on state-changing endpoints (double-submit cookie or origin header check).
- Rate limiting: 5 login attempts / 15 min / IP; 100 req / min / IP on public APIs.
- Razorpay webhook signature verified on every request.
- All admin actions write to `AuditLog`.
- Input validation: Zod schemas on every endpoint.
- SQL injection: not possible via Prisma parameterized queries.
- XSS: React escapes by default; CSP header with strict directives; no `dangerouslySetInnerHTML` on user content.
- File upload: validate MIME + magic bytes; store in R2 with random keys; serve via CDN, not Express.
- Secrets: never in repo. Env vars only. Rotate Razorpay keys + JWT secrets if compromised.
- Admin endpoints behind role check + optional IP allowlist via Settings (Phase 2).
- DPDP (Digital Personal Data Protection Act 2023) compliance: privacy policy, consent flow, data export + deletion on request, breach notification process documented.

### 13.3 SEO
- Server-rendered HTML on landing + product pages.
- `<title>`, `<meta description>`, OG tags from `Product.seo`.
- JSON-LD structured data: `Product`, `Offer`, `AggregateRating`, `Organization`, `BreadcrumbList`.
- `sitemap.xml` auto-generated, includes products + static pages.
- `robots.txt` allowing all but `/admin`, `/api`, `/account`.
- Canonical URLs on all public pages.
- 301 redirects for slug changes (track old slugs).

### 13.4 Accessibility (WCAG 2.1 AA)
- Semantic HTML.
- Color contrast ≥ 4.5:1 body / 3:1 large text.
- Keyboard navigable; focus rings visible.
- Form fields with labels + aria-describedby for errors.
- Images have alt text (required field in product editor).
- Screen-reader tested on checkout flow.

### 13.5 Browser & device support
- Chrome, Safari, Firefox, Edge — last 2 versions.
- iOS Safari 14+, Chrome Android 90+.
- Min screen: 320px wide.

### 13.6 Observability
- Sentry for FE + BE errors.
- Structured JSON logs (pino) on backend.
- Health endpoint `/api/health` for uptime monitoring.
- DB query slow log > 500ms → Sentry breadcrumb.
- Razorpay webhook receipt + processing logs retained 90 days.

### 13.7 Backup & DR
- Postgres daily auto-backup (Neon/Supabase provides this) + manual snapshot before major deploys.
- 30-day retention.
- R2/S3 versioning enabled on media bucket.
- Source code in private GitHub repo; client gets repo access after final payment.

---

## 14. Mobile-First Design Principles (binding)

1. **Design at 375px first**, expand outward. Every screen must be functional and beautiful on a small Android.
2. **Thumb zone**: primary CTAs in the bottom 33% of the screen on mobile.
3. **No hover-only interactions** — everything works on tap.
4. **Sticky CTA** on landing + checkout (bottom bar).
5. **Form inputs**: `inputmode="numeric"` for pincode/phone; autocomplete attributes everywhere; large tap targets.
6. **No modals over critical content** — use bottom sheets on mobile.
7. **One column** below 768px.
8. **System fonts** or self-hosted via `next/font` — never block render on Google Fonts CDN.
9. **Skeleton loaders** for any > 200ms wait.
10. **Offline fallback** page for PWA-like resilience (Phase 2 PWA support).
11. **Image dimensions always set** (avoid CLS).
12. **Tailwind breakpoints**: `sm:640 md:768 lg:1024 xl:1280`. Design custom at base (mobile) first.

Reference UX: Boat, MyMuse, Mokobara, The Whole Truth (Indian D2C single-product benchmark).

---

## 15. API Contract (high-level)

All under `/api/v1/*`. JSON in/out. Auth via `Authorization: Bearer <jwt>` for protected routes.

### Public
- `GET /products/featured` — current product (v1: always single)
- `GET /products/:slug`
- `POST /pincode/check` `{pincode}` → `{serviceable, codAvailable, etaDays}`
- `POST /coupons/validate` `{code, cartTotal}` → discount preview

### Auth
- `POST /auth/signup`
- `POST /auth/login`
- `POST /auth/logout`
- `POST /auth/refresh`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `GET /auth/me`

### Customer
- `GET /me/addresses` `POST /me/addresses` `PATCH /me/addresses/:id` `DELETE /me/addresses/:id`
- `GET /me/orders`
- `GET /orders/:orderNumber?token=...` — guest-accessible with token
- `POST /orders/:orderNumber/cancel`
- `POST /reviews` (verified buyer)

### Checkout & payments
- `POST /orders` — create order (idempotency-key header required)
- `POST /payments/verify` — verify Razorpay signature
- `POST /webhooks/razorpay` — webhook handler (signature-verified)

### Admin (all `/admin/*` require ADMIN role)
- Standard REST: `/admin/orders`, `/admin/orders/:id`, `/admin/orders/:id/status`, `/admin/orders/:id/refund`
- `/admin/payments`, `/admin/payments/:id/refund`
- `/admin/users`, `/admin/users/:id`, `/admin/users/:id/disable`
- `/admin/products`, `/admin/products/:id`, `/admin/variants/:id`
- `/admin/inventory`, `/admin/inventory/:variantId/adjust`, `/admin/inventory/import`, `/admin/inventory/export`
- `/admin/coupons` CRUD
- `/admin/broadcasts` CRUD + `/send`
- `/admin/settings`
- `/admin/dashboard/stats`

Full OpenAPI spec to be delivered alongside code.

---

## 16. Cross-Cutting Edge Cases & Loopholes (the "every loophole" list)

| # | Edge case | Mitigation |
|---|---|---|
| 1 | Customer manipulates client-side price | Server recomputes total from DB on order creation. |
| 2 | Customer reuses an expired/used coupon | Server re-validates coupon (active flag, dates, usage count, per-user count) inside the order transaction. |
| 3 | Race: two users buy last unit | `SELECT ... FOR UPDATE` lock on Inventory row inside TX. |
| 4 | User refreshes after payment but before redirect | Order is identified by Razorpay payment_id (idempotent); webhook is source of truth. |
| 5 | User pays, network drops before /verify | Webhook handles confirmation independently. |
| 6 | Duplicate Razorpay webhook | Idempotent by `razorpayPaymentId`. |
| 7 | Webhook from non-Razorpay source | HMAC signature verification. |
| 8 | Admin accidentally cancels CONFIRMED order | Soft-cancel with reason; can be reverted within 1 hour via admin "Undo" action. |
| 9 | Admin disables themselves | Cannot disable own account (enforced server-side). |
| 10 | Customer enters wrong shipping address | Pincode validation + city/state auto-fill. Admin can edit address only before SHIPPED. |
| 11 | Stock import file has 10K rows | Stream-parse + chunked transaction (1000/batch); show progress. |
| 12 | User signs up with existing email (different case) | Email stored + queried lowercase. |
| 13 | Password reset link used twice | Token single-use (`usedAt` field). |
| 14 | XSS in product description (admin types it) | Sanitize HTML on input (DOMPurify), allow whitelist of tags. |
| 15 | SQL injection in search | Prisma parameterized queries. |
| 16 | CSRF on admin actions | Origin header check + sameSite cookie. |
| 17 | Brute-force login | Rate limit + exponential backoff + Cloudflare bot protection. |
| 18 | Pixel events lost when adblocker active | Server-side CAPI as fallback (add-on). |
| 19 | Razorpay refund partial | Track `refundedAmount` per Payment; Order status = PARTIALLY_REFUNDED if `< total`. |
| 20 | Customer claims they didn't receive product | Admin can see AWB, courier status, delivery proof; raise dispute on Razorpay if chargeback. |
| 21 | Customer enters phone with country code variations | Normalize to E.164 (`+91XXXXXXXXXX`) at input. |
| 22 | Email bounces | Bounce webhook marks user; future broadcasts skip bounced addresses. |
| 23 | Cookie banner not consented + Pixel needed | Pixel waits for consent; lose some events but stay compliant. |
| 24 | Mobile network flaky during checkout | Optimistic UI + retry queue for non-critical events; payment uses Razorpay's own retry. |
| 25 | Admin deletes a product that has orders | Soft-delete (isActive=false) only. Hard delete blocked at DB level (FK). |
| 26 | Coupon stacking | One coupon per order; enforced server-side. |
| 27 | Negative quantity from manipulated frontend | Zod validation: `qty >= 1`. |
| 28 | Address with 7-digit pincode | Regex `^\d{6}$` server-side. |
| 29 | GST rate change mid-year | `gstRate` is field on Product; admin updates, applies to new orders only. |
| 30 | Order placed during maintenance mode | Maintenance toggle in Settings disables checkout API; shows holding page. |
| 31 | Customer cancels order after admin marked it Shipped | Cancellation blocked post-Shipped; customer must initiate return. |
| 32 | Two concurrent admin updates to same order | Optimistic locking via `updatedAt` mismatch → 409 Conflict. |
| 33 | Razorpay key leaked in repo by mistake | Pre-commit hook (gitleaks); rotate immediately if exposed. |
| 34 | Database fills up with junk users from bot signups | hCaptcha on signup + email verification before checkout. |
| 35 | DoS on /api/orders | Rate limit + Cloudflare in front of API. |
| 36 | Order placed for variant that admin deactivated mid-flow | Variant `isActive=false` blocks at TX → user sees friendly error. |
| 37 | Customer's saved address has changed pincode serviceability | Re-validated at checkout. |
| 38 | Free-shipping threshold changes after cart loaded | Server recomputes shipping at order placement; clear messaging on cart. |
| 39 | Time zone bugs in reports | All timestamps stored UTC; rendered in IST in admin UI. |
| 40 | Backup never tested | Quarterly restore drill into staging. |
| 41 | Two users redeem the last slot of a limited coupon simultaneously | `SELECT ... FOR UPDATE` on `Coupon` row in TX. Second user gets "coupon exhausted" error. |
| 42 | Same user redeems coupon, refunds, redeems again forever | Reversal frees the slot but `perUserLimit` is still checked. Set `perUserLimit = 1` and abuse is bounded to 1 active redemption per user. |
| 43 | Guest abuses by changing email | `firstOrderOnly` + cart-level fraud signals (same IP + same address + new email = flag). Phone OTP closes it in Phase 2. |
| 44 | Coupon code shared publicly on social media beyond intent | Set `usageLimit` always. Use `source` tag to track virality. Admin can deactivate instantly. |
| 45 | Admin deletes a coupon that has historical redemptions | Block hard delete via FK. Soft-deactivate only. Historical orders keep snapshot via `Order.couponCode`. |
| 46 | Coupon discount makes order total negative | Floor at ₹0; if discount ≥ subtotal+shipping, total = ₹0 (Razorpay needs ≥ ₹1 — special-case: convert to manual confirmation, no payment row, audit log entry). |
| 47 | Coupon applies to FREE_SHIPPING but cart already free-shipped | Discount = 0, but redemption still counted (admin tooltip clarifies). Or: validation rejects with "shipping already free". Recommend rejection. |
| 48 | Stacking via fast double-submit | Idempotency-key header on order create + DB unique constraint `CouponRedemption.orderId` blocks dup. |
| 49 | Customer tries an inactive/expired coupon | Server returns specific reason (`EXPIRED`, `INACTIVE`, `EXHAUSTED`, `MIN_ORDER`, `LIMIT_REACHED`, `FIRST_ORDER_ONLY`, `COD_NOT_ALLOWED`) — UI shows clear message. |
| 50 | Reports show inflated revenue from coupons | Coupon analytics use `CouponRedemption` joined to `Order.status` — exclude CANCELLED / REFUNDED unless explicitly requested. |
| 51 | Coupon code case sensitivity | Stored UPPERCASE, looked up via `code = INPUT.toUpperCase()`. Display preserves user input casing in UI confirmation. |
| 52 | Admin needs to gift a free order | Create `100%` coupon with `usageLimit=1` + `perUserLimit=1` + share with that user. Or add admin action "mark order paid manually" (Phase 2). |
| 53 | Customer adds product to cart, admin then sets it `HIDDEN` / `OUT_OF_STOCK` / `UNDER_MAINTENANCE` | At cart load + at checkout, server re-validates each line's product visibility. Non-buyable items are removed with a clear message ("X is no longer available"). Cart total recomputed. |
| 54 | Customer tries to refund a non-refundable product | "Request return" CTA hidden on customer order page. If they email support, admin sees the `isRefundable=false` badge and the refund button in admin is disabled with tooltip. Admin can force-refund (e.g. legal/customer-service exception) — captured in AuditLog with mandatory reason. Invoice + product page already disclosed non-refundability, protecting the business. |
| 55 | Product is COD-disabled but customer adds it to cart with other COD-allowed items | Mixed-cart rule: COD radio is disabled at checkout if **any** item in cart has `codEnabled=false`. UI shows: "Cash on Delivery not available because: {product} is online-payment only." (v1 has single product so trivial; written for multi-product future.) |
| 56 | Product has restricted pincodes; customer enters one | Pincode-check API returns `serviceable: false` with `reason: "PRODUCT_RESTRICTED"`. Checkout blocked at the pincode step. |
| 57 | Product `OUT_OF_STOCK` auto-flip while customer is on checkout page | Stock check at order TX fails → friendly error + cart line marked out-of-stock + auto-subscribe email to back-in-stock list (with consent). |
| 58 | Admin sets `availableFrom` to a future date but forgets to set visibility to DRAFT | System enforces: scheduled-publish only meaningful when current visibility is DRAFT. UI shows warning if mismatch. Cron job only acts on DRAFT → PUBLISHED. |
| 59 | Preorder product oversold beyond a sane limit | Set `maxQtyPerOrder` + `usageLimit`-style cap via global stock "virtual stock" entry. Document: preorder uses normal stock = "max preorders accepted". Increase stock manually before ship date. |
| 60 | Backorder allowed; customer places order while stock = -5 | Allowed. Order CONFIRMED; admin dashboard shows "Backorder count: 5" widget so they know to restock. ETA shown to customer is computed from preorderShipDate or a configurable buffer. |
| 61 | Admin archives a product with active orders | Archive blocked if any orders are in CONFIRMED/SHIPPED states. Admin must wait or override (with confirmation). Order data preserved regardless. |
| 62 | Customer requests stock notification with malicious email injection | Email field validated (RFC 5322 regex + max length). Rate-limited per IP (5/hour). DB unique constraint `(variantId, email)` prevents flood. |
| 63 | Back-in-stock email floods customer when admin toggles stock back and forth | After sending a notification, the row's `notifiedAt` is set; same email won't receive again for that variant unless they re-subscribe. 6-hour cooldown between batch sends per variant. |
| 64 | Product `UNDER_MAINTENANCE` but customer has a checkout URL bookmarked | Server enforces; checkout blocked with explanatory page + "Notify me" CTA. Cart preserved. |
| 65 | Visibility "Hidden" used for a B2B / private-link product | Direct URL works only with a signed token query param (Phase 2 if needed). v1: HIDDEN = full 404 to everyone except admin preview mode. |
| 66 | Settings change for `default refund window` — does it affect existing products? | No. Settings are defaults applied only on new product creation. Existing products keep their values. Bulk-apply tool ("apply default to N selected products") available in product list. |
| 67 | Conflicting overrides (e.g. product says COD off but global COD is off) | Effective = AND of both. Global off always wins. UI in product editor shows "Site-wide COD is off — your product setting has no effect" warning. |
| 68 | Refundable flag changed after orders exist | Existing orders use snapshot of policy at time of order (store `Order.refundPolicySnapshot` JSON at creation). New policy only applies to new orders. |
| 69 | Admin accidentally archives the only product | Block: cannot archive the last `PUBLISHED` product if site is "live" (i.e. not in maintenance mode). Force admin to enable maintenance mode first. |
| 70 | Customer on COMING_SOON product clicks "Notify me" but never gets email | Resend webhook tracks delivery; admin sees deliverability per variant in stock-notifications view. Bounced emails flagged. |
| 71 | User signs up but never verifies email | Account exists but cannot checkout. After 30 days of unverified, optional cleanup job (soft-archive). User can request new OTP anytime. |
| 72 | OTP brute-force | 5 attempts max per `AuthOTP` row → row locked. 6-digit code = 1-in-million per attempt. Rate limit: 3 OTP requests per email per hour. |
| 73 | User enters OTP after expiry | Server returns `EXPIRED` reason; UI offers resend. Resend creates new OTP row; old one cannot be reused. |
| 74 | User requests OTP, then changes email before entering it | Old OTP keyed by old email; new request invalidates old (mark `usedAt = now` with reason). |
| 75 | Email change attack (attacker changes user's email) | Email change requires: current password + OTP to new email + OTP to old email (double confirmation). |
| 76 | Spam reviews from one user across many products | One review per (user, product, order) enforced by unique constraint. Rate limit 3 reviews/day. Admin can mass-delete by tagging user. |
| 77 | Fake review with no purchase | Server blocks: review requires `orderId` of a DELIVERED order containing that product. Direct API call without orderId rejected. |
| 78 | Review image upload exceeds quota / costs | Pre-upload size validation (10MB raw). Server limits 5 images per review. Compression brings typical to <200KB. Daily upload cap per user (50MB). |
| 79 | NSFW / abusive image uploaded as review | v1: admin moderation queue catches it. Phase 2: automated NSFW detection. Reported images flagged immediately + hidden from public until reviewed. |
| 80 | EXIF leaks customer GPS location | Stripped both client-side (canvas re-encode) and server-side (sharp `.withMetadata({})`). Double protection. |
| 81 | User uploads HEIC from iPhone | Server-side sharp converts HEIC → WebP/JPEG. Client tries canvas; HEIC may not decode in all browsers — fallback is server-side conversion of raw upload. |
| 82 | Customer is logged in but hasn't completed profile (no phone/address) → tries to checkout | Profile-completion gate (§6.6.5) intercepts inline within checkout flow — adds phone OTP step + address form step before "Place Order" enables. |
| 83 | User submits profile with phone in multiple formats (+91XXX, 0XXX, 91XXX, XXX) | Server normalizes to E.164 (`+91XXXXXXXXXX`). Validates 10-digit Indian mobile (starts with 6-9). |
| 84 | Admin disables a user mid-session | User's existing JWT works until expiry (max 15 min). Long-running sessions invalidated via tokenVersion bump on disable. Force-logout option for immediate effect. |
| 85 | Admin applies `restrictions.codBlocked = true` but user's pending order is COD | Restriction applies to **new** orders only. Pending order honored. Documented in restriction tooltip. |
| 86 | Admin sends broadcast to "all opted-in" but user has hard-bounce history | Bounced/complained emails are in suppression list and always excluded — never re-sent to, even if opted in. |
| 87 | Bulk email send crashes mid-batch | Queue-based send (BullMQ or DB-backed queue). Each recipient is its own job with retry on failure. Crash resumes from last unsent. |
| 88 | Admin exports 100K users to Excel and the request times out | Reports >10K rows are processed async; downloadable link emailed to admin when ready (Phase 2 = realtime progress). |
| 89 | User's review images break (R2 outage) | Lightbox shows fallback "image unavailable". Sharp regenerates from original if original kept (we keep originals for 30 days then drop). |
| 90 | User reviews a product, then product is archived | Existing reviews remain visible if product is accessed via direct link (Phase 2 multi-product), but ARCHIVED + 301 to home removes the surface. Data preserved. |
| 91 | Admin replies to a review with sensitive content by mistake | Reply has 5-min edit window. After that, admin must delete + re-create (audit-logged). |
| 92 | Reviewer changes display name to something offensive | Display name passes through same profanity filter as review body on save. |
| 93 | User opts out of marketing but admin sends a transactional email | Transactional emails (order updates, OTPs) are always sent — they are not promotional. Only broadcasts respect marketing opt-in. Clear distinction documented in email composer UI. |
| 94 | User signs up with same email as an existing guest order | Existing guest orders auto-link to new userId on signup (matched by email). Order history populates immediately. |
| 95 | Brute-force account enumeration via signup endpoint | Signup returns same response shape whether email exists or not. Real OTP only sent if email is new or unverified. Existing verified users see no leak. |
| 96 | Excel import of users (Phase 2) creates duplicates by email casing differences | Email always normalized lowercase before unique check. Unicode normalize NFC. |
| 97 | Phone OTP verification | Not in v1 (no SMS provider). v1 collects + format-validates phone only. SMS OTP via MSG91/Twilio is a Phase 2 add-on. |

---

## 17. Future Roadmap (post v1, separately quoted)

| Phase | Feature |
|---|---|
| 1.5 | OTP verification for COD, abandoned cart recovery emails |
| 2 | Multi-product catalog UI (data model already supports it) |
| 2 | WhatsApp order updates (Gallabox / Interakt) |
| 2 | Meta Conversions API (server-side) |
| 2 | Courier auto-tracking webhook (Shiprocket / Delhivery) |
| 3 | Loyalty / referral program |
| 3 | Native mobile app (React Native) |
| 3 | Multi-warehouse & multi-vendor support |
| 3 | Subscription billing (Razorpay subscriptions) |

---

## 18. Open Decisions / Inputs Needed from Client Before Kick-Off

1. **Product details**: name, SKU, MRP, sale price, weight (for shipping).
2. **Product content**: text copy, images (≥5 high-res), 1–2 videos, FAQ list.
3. **Brand assets**: logo, colors, fonts (or approval to choose).
4. **Legal pages**: terms, privacy, shipping, refund — provide drafts or approve our templates.
5. **Razorpay**: KYC done? Key Id + Secret + Webhook secret.
6. **Meta**: Business Manager access or Pixel ID.
7. **Email domain**: confirm `diteup.com` DNS access for SPF/DKIM/DMARC.
8. **GST**: GSTIN, HSN code for the product, applicable tax rate.
9. **Shipping**: flat rate / free-shipping threshold / COD allowed pincodes (PAN-India or list).
10. **Initial stock count**.
11. **Admin email** for owner login.

---

## 19. Acceptance Criteria (Definition of Done for v1)

A release is shippable when:
- [ ] All flows in §6 and §7 are functional end-to-end on production.
- [ ] All Meta Pixel events fire correctly (verified via Meta Pixel Helper).
- [ ] Razorpay test + live mode both verified with a ₹1 live transaction.
- [ ] COD order can be placed, confirmed, shipped, delivered.
- [ ] Inventory decrement + restock correct under simulated concurrent orders.
- [ ] Lighthouse mobile score ≥ 85 on landing page.
- [ ] All transactional emails deliver to Gmail + Outlook + a Yahoo address without going to spam.
- [ ] Admin can complete every documented action without dev intervention.
- [ ] All Section 16 edge cases have a passing test or documented manual verification.
- [ ] Backup restore drill executed successfully on staging.
- [ ] DPDP-compliant privacy policy + cookie banner live.
- [ ] Source code repo handed over with README, env sample, migration scripts, deployment guide.

---

## 20. Timeline (Aligned with Proposal — 4 Weeks)

| Week | Deliverable |
|---|---|
| 1 | Project setup, Prisma schema migrated, auth, landing page UI complete on mobile + desktop |
| 2 | Cart, checkout, Razorpay (test mode), COD, Meta Pixel, order tracking, transactional emails |
| 3 | Admin: orders, payments, users, inventory, products, coupons, broadcasts, settings, Excel I/O |
| 4 | Deployment, DNS, SSL, Razorpay live, Pixel verify, edge-case QA, handover |

Scope changes mid-flight = Change Request per §8 of the proposal.

---

## 21. Out of Scope (explicit — to prevent disputes)

Per the signed proposal, the following are explicitly **not included** in v1 and require separate quoting:
- Multi-product catalog UI
- Native mobile apps
- Meta CAPI server-side events (data model supports, no UI/wiring in v1)
- Logo, branding, product photography, video shoots, copywriting
- SEO content / blog posts / campaign management
- Meta Ads spend or creative production
- Multi-warehouse, multi-vendor, subscription billing
- Domain + hosting costs (client-paid)
- Razorpay transaction fees (client-paid)

---

**End of PRD v1.0** — awaiting client sign-off on §18 inputs to kick off.
