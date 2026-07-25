# Frontend Static / Mock Content Audit — Pre-Production

_Generated: 2026-07-25. Scope: entire `frontend/` — customer ecommerce site + admin panel._
_Goal: find everything hardcoded / mock / placeholder that should be real (backend/admin-driven) data, so it can be fixed before going live._

## TL;DR

| Area | Verdict |
|---|---|
| **Product reviews & ratings** | ❌ **Fake** — mock "Verified" reviews + invented 4.8★/500-review fallbacks shown to every customer. **#1 launch blocker.** |
| **Home testimonials / hero rating** | ❌ **Fake** — hardcoded quotes, `4.8/5 (1,248+ reviews)`, `128 reviews` fallback. |
| **Footer social links** | ❌ **Placeholder** — point to bare instagram/facebook/youtube homepages. |
| **Contact / FSSAI / support email** | ⚠️ **Inconsistent** — two support emails, FSSAI number shown as two different values. |
| **Cart / checkout / order money math** | ✅ **Real** — totals, shipping, discounts all backend-computed. |
| **Admin dashboard / reports KPIs** | ✅ **Real** — every number is a live `/v1/admin/*` call. No fake KPIs. |
| **Policy / FAQ copy** | ⚠️ **Hardcoded** — accurate but code-deploy to edit; some values can drift from backend. |
| **Placeholder images / TODO / lorem** | ✅ **Clean** — no external stock/placeholder images, no lorem, no stray TODO/FIXME. |

The good news: the **money path and all admin data are genuinely backend-driven** — no fake numbers where it would cost money or mislead an operator. The bad news: **customer-facing social proof (reviews, ratings, testimonials) is largely fabricated** and is the main thing that must be fixed before launch.

---

## 🔴 LAUNCH BLOCKERS (fake data shown to customers)

### 1. PDP fake "Verified" review carousel — ALWAYS on
- `components/product/ProductPdpReviewSlides.tsx:104,116` (data: `lib/pdp-mock-reviews.ts:10-59`)
- `ProductPdpReviews` renders this carousel **unconditionally** — it never touches the API. Every product page shows 8 invented reviews ("Ananya R.", "Karan V.", "Meera P."…) each stamped **"Verified"**.
- **Fix:** drive from the real `payload.reviews` (already fetched via `fetchProductReviewsBySlug`), or remove the carousel. Delete/guard `lib/pdp-mock-reviews.ts`.

### 2. PDP fabricated rating summary & distribution
- `components/product/ProductPdpReviews.tsx:6-8,74-76` — `FALLBACK_RATING = 4.8`, `FALLBACK_COUNT = 500`, `FALLBACK_DISTRIBUTION = {5:428,4:69,3:1,2:1,1:1}`.
- When a product has **0 real reviews (the launch state)**, the PDP shows "4.80 out of 5 — Based on 500 reviews" with a full green distribution graph + "Verified" check.
- **Fix:** show the empty state that already exists (`ProductPdpReviews.tsx:149-153`) instead of invented numbers.

### 3. PDP rating row under the product title
- `components/product/ProductPdpRatingsRow.tsx:4-5,44-46` — same fallback → shows `4.8` and `(500 Reviews)` (the first rating a customer sees) when no real reviews exist.
- **Fix:** render nothing / "No reviews yet" when `totalCount === 0`.

### 4. Home hero fake rating
- `components/home/hero-banner-overlay.tsx:270-277` — hardcoded `4.8/5` with `(1,248+ reviews)` and 5 filled stars over the hero for every visitor. Not from any API.
- **Fix:** wire to the real review summary, or remove until real data exists.

### 5. Home testimonials — fake "verified" reviewers + fake aggregate
- `components/home/TestimonialsSection.tsx:5-19` — hardcoded quotes (Aditi K., Rahul M., Neha S.) + `PDP_MOCK_REVIEW_CARDS` re-labeled `verified: true`, shown whenever the API returns nothing.
- `components/home/TestimonialsSection.tsx:30-31` — fallback `summaryCount = 128`, `avg = "4.8"` rendered as `★★★★★ (128 reviews)` under "LOVED BY THOUSANDS".
- `components/home/TestimonialsCarousel.tsx:69-71` — every card hardcodes `★★★★★` even when a real review has a lower rating.
- **Fix:** hide the band / show a true empty state when `reviewsPayload` is empty; render each review's real star count.

### 6. Footer social links are placeholders
- `components/layout/SiteFooter.tsx:7-11` — Instagram/Facebook/YouTube links point to bare `https://www.instagram.com/`, `.../facebook.com/`, `.../youtube.com/`. Live, clickable, and send customers to generic homepages.
- **Fix:** real DiteUp URLs (ideally admin-configurable).

---

## 🟠 HIGH-PRIORITY INCONSISTENCIES (data that disagrees with itself / the backend)

### 7. FSSAI licence number shown as TWO different values — compliance risk
- `components/legal/PoliciesHubContent.tsx:63` & `lib/energy-bite-faqs.ts:133` → `20526004000209`
- `components/home/RegulatoryTrustStripSection.tsx:8` → default `10112233400234` (a dummy; env-overridable via `NEXT_PUBLIC_FSSAI_LICENSE_NO`)
- **Fix:** single config source for the real licence number. (Note: the regulatory strip is currently commented out in `app/page.tsx:38` — do not enable it with the dummy value.)

### 8. Two different support emails
- `components/contact/ContactMailForm.tsx:7` → `support@diteup.com`
- Footer + metadata + all legal pages → `info@diteup.com` (`SiteFooter.tsx:162`, `app/contact/page.tsx:9`)
- The contact form only opens a `mailto:` — there is no backend contact endpoint.
- **Fix:** one admin-configurable support address; POST the contact form to a real endpoint.

### 9. Free-shipping threshold hardcoded in frontend
- `lib/storefront-policy-constants.ts:4` → `FREE_SHIPPING_THRESHOLD_INR = 499`. Drives the cart "₹X away from FREE shipping" progress bar + shipping/terms copy. The **actual** shipping fee comes from `/v1/cart/preview`.
- If the backend threshold differs from 499, the shopper sees a misleading progress bar and free-shipping promise vs. what's actually charged.
- **Fix:** fetch the threshold from backend config.

### 10. Contradictory shipping promise
- `components/legal/PoliciesHubContent.tsx:118` → "Free shipping on all orders" directly contradicts the ₹499 threshold used everywhere else. Also duplicated as an absolute claim in `TrustBarSection.tsx:84-103` and `AnnouncementBar.tsx:80-98`.
- **Fix:** pick one true statement.

### 11. Hardcoded product price in legal pages
- `components/legal/PoliciesHubContent.tsx:66,69` → `MRP ₹1099` / `Selling price ₹799` (+ 750g, pack size). Also `lib/energy-bite-faqs.ts:118-119`.
- The PDP buy box is correctly API-driven (`pdp-variant-pricing.ts` + `product.variants`), so if admin changes price, these pages state a stale, contradictory value.
- **Fix:** source from the catalog API or remove specific figures.

### 12. Return window hardcoded
- `lib/storefront-policy-constants.ts:7` → `RETURN_WINDOW_DAYS = 7` drives refund-policy eligibility text. Must match the backend's actual return rule.

---

## 🟡 CONTENT THAT SHOULD BE ADMIN/CMS-MANAGED (accurate today, but code-deploy to edit)

- **PDP product content is hardcoded Energy-Bite copy for _every_ product:**
  - `components/product/ProductPdpAplusContent.tsx:20-53` — A+ "why choose us / what's inside / how we compare / how to use" image carousel (static `.webp`).
  - `components/product/ProductPdpAccordions.tsx:60-71` — Nutrition / How to use / Who is this for accordions (hardcoded prose; product type has no nutrition/ingredients fields).
  - `components/product/ProductPdpAccordions.tsx:41,72-80` — visible FAQ uses static `getHomePreviewFaqItems()` and **ignores the API's real `product.faqs`** (which _is_ fetched at `page.tsx:46` but only fed to JSON-LD → on-screen FAQ and structured data can diverge).
  - `components/product/ProductPdpFeatureStrip.tsx:3-41` — benefit strip (High Protein / Rich in Fiber / …).
  - `components/product/ProductPdpUspHighlight.tsx:20` — hardcoded USP line.
  - `components/product/ProductDetailClient.tsx:29-51` — hero/cart image force-overridden to local assets when slug contains "energy-bite" (launch shim; overrides uploaded media).
- **Home marketing sections baked into images/arrays:**
  - `WhyChoosePressSection.tsx:14-43`, `PerfectForEveryYouSection.tsx:14-21`, `IngredientsSection.tsx:14-22` (whole sections are single marketing images), `FaqSection.tsx` + `lib/energy-bite-faqs.ts`.
- **Footer/brand copy:** `SiteFooter.tsx:101-105` tagline; `SiteFooter.tsx:162-169` contact email + vague "India" address.
- **All legal/policy pages hardcoded** — `components/legal/*` (Privacy, Refund, Shipping, Terms, Policies hub). No backend fetch anywhere; every edit is a deploy. Acceptable if legal text is stable — team decision.
- **All FAQ hardcoded** — `lib/energy-bite-faqs.ts` (20+ Q&A), consumed by `/faq` + JSON-LD. No API.

---

## 🟡 NON-FUNCTIONAL / STUBBED UI shown as working

- `components/product/ProductPdpDeliveryCheck.tsx:20-34` — pincode checker is a **stub**: validates 6-digit format then returns a static "Estimated delivery: 2–3 business days" for ANY pincode. Never calls a serviceability API. Implies a real lookup. Also hardcodes "95% orders delivered within 3 days", "FREE Shipping above ₹399", "7 days return".
- `components/product/ProductDetailClient.tsx:180` — "Add to wishlist (coming soon)" button that does nothing. Enable or hide.
- **COD described but never offered:** `CheckoutClient.tsx:347` hardcodes `paymentMethod: "RAZORPAY"`, but shipping/terms policy text implies COD is available (`ShippingPolicyContent.tsx:186-192`). An unused `CartIconCod` icon exists (`cart-ui-icons.tsx:45`). Align content with the actual flow.

---

## 🧹 DEAD CODE to delete (not shown to users, but remove to avoid confusion)

- `components/admin/ProductEditor.tsx` — orphaned stub: "Placeholder fields", hardcoded `defaultValue="Energy Bite"`, no-op Save/Publish buttons. The live route uses `ProductEditorClient` (fully API-wired). **Delete it.**
- `components/placeholders/ImagePlaceholder.tsx` + `IconPlaceholder.tsx` and their only consumers — `components/home/BenefitsSection.tsx`, `GalleryStripSection.tsx`, `HowToSection.tsx` — are **not imported anywhere** (`app/page.tsx` doesn't use them). The only literal placeholder UI in the repo; all dead. Delete or wire real images.
- `components/product/ProductReviewsSection.tsx` — superseded by `ProductPdpReviews`, not imported.
- `components/product/ProductPdpTrustStrip.tsx` — defined, unused.
- Unused home components not imported by `app/page.tsx`: `FinalCtaSection`, `NutritionSection`, `StickyBuyBar`, `HeroBannerArtworkToggle`.

---

## ✅ VERIFIED REAL — no action needed

- **Cart / checkout / order totals, shipping fee, discounts** — all from `POST /v1/cart/preview` and `POST /v1/orders`. No hardcoded fees in the math.
- **Account / order pages** — `AddressesBookClient`, `ProfileEditForm`, `AccountOrdersOverview`, `OrderTrackingShell` all wired to `/v1/me/*` and `/v1/orders/*`.
- **Admin dashboard KPIs** — revenue, orders, customers, low-stock, reviews-pending all from `GET /v1/admin/dashboard/stats`; recent orders from `GET /v1/admin/orders`. **No fake KPIs, no chart libs with inline datasets.**
- **Admin actions** — order status, Shiprocket push, refunds, inventory, review moderation, user actions, broadcasts, product CRUD, settings, site-mode — every one calls a real API. No dead buttons on live routes.
- **PDP pricing / variants / stock / notify-me** — fully API-driven.
- **Featured product on home** (`fetchFeaturedProduct`) and the moderated review **list** items (when reviews exist) — real API data.
- **Legit static config (fine to ship):** `lib/india-locations.ts` (states/countries), `lib/pdp-variant-pricing.ts` (pure util), `lib/site-mode-labels.ts`, `lib/admin-nav.ts`, hardcoded admin enum dropdowns (mirror fixed backend enums).
- **No external placeholder images** (no unsplash/picsum/via.placeholder), **no lorem ipsum, no stray TODO/FIXME.**

---

## ⚠️ OPEN BACKEND ACTION (tracked here after code comment was removed)

- **`checkout.freeShippingThreshold` must be set to `0`** in Admin → Settings → **COD** (the `checkout` setting key). The frontend now promises "Free shipping on all orders" across the cart, PDP, policies, shipping policy, terms, and trust bars. The backend computes ₹0 shipping only when `subtotal >= freeShippingThreshold` (`backend/src/services/cart.ts:322`), and the default is still **499**. Until an admin sets it to `0` (or the Energy Bite product's `freeShipping` flag is turned on), carts under ₹499 are charged ₹49 shipping while every page promises free — a customer-facing money contradiction at checkout.

## Recommended fix order

1. **Kill fake reviews/ratings** (#1–#5) — remove mock carousel, replace all rating fallbacks with real empty states. _Highest customer-trust / legal risk._
2. **Fix footer social links** (#6) and **FSSAI number** (#7) — placeholder/inconsistent public+regulatory data.
3. **Unify contact email** (#8) and **move shipping threshold / return window / product price to backend config** (#9–#12) so display never contradicts what's charged.
4. **Wire real pincode serviceability** or make the checker honest; resolve COD content-vs-flow mismatch; hide the wishlist stub.
5. **Move product marketing content + FAQ to the product/admin record** (render `product.faqs`, add nutrition/ingredients fields).
6. **Delete dead code** (admin `ProductEditor`, `components/placeholders/*`, orphan sections).
7. **Decide** whether legal/policy + FAQ copy should become CMS/admin-editable (currently code-deploy to change).
