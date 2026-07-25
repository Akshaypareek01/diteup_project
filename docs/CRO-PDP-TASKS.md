# CRO X Dietup — PDP Tasks

Client report: [CRO X Dietup (Google Doc)](https://docs.google.com/document/d/1d1oGQdClNJnD-XhGpfDK3pu5gNvgTs4dkW_oEQSAgzk/edit?tab=t.0)

Reference brand: BeastLife-style PDP patterns. Target: Energy Bite product page (`/product/[slug]`).

**Placeholder rule:** All graphics, reels, badges, and review photos use black-background `MediaPlaceholder` divs until final assets are supplied.

---

## Task 1 — USP / benefit highlight strip

- [x] **Status:** Implemented
- **Issue:** Reference PDP shows a key benefit callout (e.g. "24g Protein & 5.3g BCAA per scoop, 26 Servings!") directly under the product title to communicate value instantly.
- **Recommended change:** Add a highlighted USP strip under the product title and subtitle.
- **Files:**
  - `frontend/components/product/ProductPdpUspHighlight.tsx`
  - `frontend/components/product/ProductDetailClient.tsx`

---

## Task 2 — Star ratings + review count near title

- [x] **Status:** Implemented
- **Issue:** Reference displays review ratings and counts below the title to build trust. Current PDP hides ratings when no reviews exist.
- **Recommended change:** Always show star rating + review count near the title; use static fallback when live data is unavailable.
- **Files:**
  - `frontend/components/product/ProductPdpRatingsRow.tsx`
  - `frontend/components/product/ProductDetailClient.tsx`

---

## Task 3 — Price per kg on pack size variants

- [x] **Status:** Implemented
- **Issue:** Reference shows ₹/kg on each variant so shoppers compare value and pick larger packs.
- **Recommended change:** Display price-per-kg badge on each pack card; highlight best value with a flame tag.
- **Files:**
  - `frontend/lib/pdp-variant-pricing.ts`
  - `frontend/components/product/ProductDetailClient.tsx`

---

## Task 4 — CTA hierarchy (Buy Now primary)

- [x] **Status:** Implemented
- **Issue:** Both "Add to Cart" and "Buy Now" have equal visual weight, causing decision friction.
- **Recommended change:** Make Buy Now the bold primary CTA; demote Add to Cart to outline/secondary style.
- **Files:**
  - `frontend/components/product/ProductDetailClient.tsx`

---

## Task 5 — Shoppable reels / short videos

- [x] **Status:** Implemented
- **Issue:** Reference uses short video/reel content on PDP for faster product understanding.
- **Recommended change:** Add a horizontal reel strip with black-bg placeholders for future video assets.
- **Files:**
  - `frontend/components/product/ProductPdpReels.tsx`
  - `frontend/components/product/MediaPlaceholder.tsx`
  - `frontend/components/product/ProductDetailClient.tsx`

---

## Task 6 — Certifications, trust markers, delivery info

- [x] **Status:** Implemented
- **Issue:** Reference shows certification badges, delivery timelines, pincode check, return policy, and free shipping near purchase actions.
- **Recommended change:** Add certification badge row (placeholders), delivery promise, pincode checker (UI stub), return + shipping markers under CTAs.
- **Files:**
  - `frontend/components/product/ProductPdpCertifications.tsx`
  - `frontend/components/product/ProductPdpDeliveryCheck.tsx`
  - `frontend/components/product/MediaPlaceholder.tsx`
  - `frontend/components/product/ProductDetailClient.tsx`

---

## Task 7 — Visual-first A+ content

- [x] **Status:** Implemented
- **Issue:** Reference uses rich A+ graphics instead of long text blocks for features, ingredients, and benefits.
- **Recommended change:** Add stacked A+ content sections with black-bg placeholders for branded graphics.
- **Files:**
  - `frontend/components/product/ProductPdpAplusContent.tsx`
  - `frontend/components/product/MediaPlaceholder.tsx`
  - `frontend/components/product/ProductDetailClient.tsx`

---

## Task 8 — Dedicated FAQ section

- [x] **Status:** Implemented
- **Issue:** Reference answers purchase objections in a visible FAQ on the PDP. Current FAQ is buried inside accordions.
- **Recommended change:** Add a standalone expandable FAQ section using `product.faqs` with sensible fallbacks.
- **Files:**
  - `frontend/components/product/ProductPdpFaq.tsx`
  - `frontend/components/product/ProductDetailClient.tsx`

---

## Task 9 — Ratings & Reviews section

- [x] **Status:** Implemented
- **Issue:** Reference has a strong review section with distribution bars, verified badges, customer photos/videos, and write-review CTA. `ProductReviewsSection` existed but was never rendered on PDP.
- **Recommended change:** Add full reviews block with summary, star distribution, photo grid (placeholders), individual reviews, and write-review link.
- **Files:**
  - `frontend/components/product/ProductPdpReviews.tsx`
  - `frontend/components/product/MediaPlaceholder.tsx`
  - `frontend/components/product/ProductDetailClient.tsx`

---

## Shared infrastructure

| File | Purpose |
|------|---------|
| `frontend/components/product/MediaPlaceholder.tsx` | Reusable black-bg media slot |
| `frontend/lib/pdp-variant-pricing.ts` | Parse variant weight + compute ₹/kg |

## PDP section order (final)

Buy box: Title → Subtitle → USP → Ratings → Price → Pack sizes (₹/kg) → CTAs → Certifications → Delivery check

Below fold: Reels → A+ content → How to enjoy → Accordions → FAQ → Reviews
