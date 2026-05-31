# DiteUp — SEO Production Handover

**Audience:** Marketing, growth, and ops teams taking over search visibility after engineering go-live.  
**Site:** [https://diteup.com](https://diteup.com)  
**Last updated:** 2026-05-31  
**Related:** [`PRD.md`](PRD.md) §13.3 · [`HANDOVER-AUDIT.md`](HANDOVER-AUDIT.md) · [`TASKS.md`](TASKS.md) Phase 15

---

## 1. Executive summary

### What engineering shipped

| Area | Status | Where |
|------|--------|-------|
| Root metadata (title template, OG, Twitter, canonical base) | Done | `frontend/app/layout.tsx`, `frontend/lib/seo/` |
| Home + contact + PDP metadata | Done | `frontend/app/page.tsx`, `contact/page.tsx`, `product/[slug]/page.tsx` |
| `robots.txt` (disallow private routes) | Done | `frontend/app/robots.ts` |
| `sitemap.xml` (static + live products) | Done | `frontend/app/sitemap.ts`, `GET /v1/products/sitemap` |
| `noindex` on cart, checkout, auth, account, admin, orders | Done | Private route pages + layouts |
| JSON-LD (Organization, WebSite, Product, Breadcrumb, FAQ) | Done | `frontend/components/seo/` |
| Admin site SEO settings | Done | Admin → Settings → SEO (`siteSeo` key) |
| Product SEO JSON (Tab 12) | Done | Admin product editor → SEO tab |
| Favicon + web manifest | Done | `layout.tsx` icons + `frontend/app/manifest.ts` |
| Meta Pixel + cookie consent | Already live | `MetaPixelGate`, `CookieBanner` |

### What marketing owns (cannot be fully automated)

- Google Search Console property verification + sitemap submission
- Final keyword copy for titles and meta descriptions
- Branded OG images (1200×630) uploaded to CDN/R2 and referenced in admin
- Real social profile URLs in footer
- Google Business Profile / local NAP if applicable
- Backlinks, PR, influencer, paid search alignment
- Weekly GSC monitoring and Lighthouse SEO sign-off

---

## 2. Pre-launch engineering checklist

Complete before handing to marketing:

- [ ] Set production env: `NEXT_PUBLIC_SITE_URL=https://diteup.com` on Vercel/hosting
- [ ] Deploy latest backend (includes `GET /v1/site/seo`, `GET /v1/products/sitemap`)
- [ ] Deploy latest frontend (metadata, robots, sitemap, JSON-LD)
- [ ] In Admin → Settings → SEO, paste `siteSeo` JSON (see §5)
- [ ] In Admin → Products → SEO tab, fill product JSON for each live SKU (see §6)
- [ ] Run smoke tests (§10)
- [ ] Lighthouse mobile SEO score = 100 (TASKS §15.5)

---

## 3. Google Search Console setup

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Add property: **URL prefix** `https://diteup.com` (or Domain property if DNS TXT verified)
3. **Verify ownership** — preferred: add verification token in Admin → Settings → SEO:
   ```json
   {
     "googleSiteVerification": "YOUR_GSC_META_TOKEN"
   }
   ```
   Redeploy not required — Next.js reads this via `GET /v1/site/seo` on each SSR request.
4. Submit sitemap: **`https://diteup.com/sitemap.xml`**
5. Use **URL Inspection** → **Request indexing** for:
   - `https://diteup.com/`
   - `https://diteup.com/product/energy-bite-750g` (or your live featured slug)
6. Monitor **Pages → Indexing** weekly for errors, excluded pages, crawl stats

---

## 4. Bing Webmaster Tools

1. [Bing Webmaster Tools](https://www.bing.com/webmasters) → Add site `https://diteup.com`
2. Import from GSC if available, or verify separately
3. Submit sitemap: `https://diteup.com/sitemap.xml`

---

## 5. Site-wide SEO settings (Admin)

**Path:** Admin → Settings → SEO → key `siteSeo`

```json
{
  "siteTitle": "DiteUp — Clean Nutrition, Zero Hassle",
  "defaultDescription": "Pre-portioned soaked breakfast packs with 10 powerful ingredients. High protein, no added sugar — just soak overnight and start your day the smart way. Ships across India.",
  "defaultOgImage": "https://diteup.com/assets/Images/desktop_banner_light.png",
  "twitterHandle": "diteup",
  "googleSiteVerification": "paste-from-search-console",
  "organizationName": "DiteUp",
  "organizationLogo": "https://diteup.com/assets/logos/diteup-logo.svg",
  "contactEmail": "info@diteup.com"
}
```

**Public API (read-only):** `GET https://diteup.com/v1/site/seo`

---

## 6. Product SEO (Admin Tab 12)

**Path:** Admin → Products → [product] → SEO tab

```json
{
  "title": "Energy Bite 750g — High Protein Soaked Breakfast Pack | DiteUp",
  "description": "Buy Energy Bite 750g — pre-portioned soaked breakfast with 10 clean ingredients. High protein, no added sugar. Ships across India.",
  "ogImage": "https://diteup.com/assets/Images/desktop_banner_light.png",
  "canonical": "https://diteup.com/product/energy-bite-750g"
}
```

**Copy guidelines:**

| Field | Limit | Tips |
|-------|-------|------|
| `title` | ~60 chars visible in SERP | Primary keyword first; brand at end |
| `description` | ~155 chars | Benefit + CTA; no keyword stuffing |
| `ogImage` | 1200×630 px | Branded share card; absolute HTTPS URL |
| `canonical` | Full URL | Only if URL differs from default `/product/{slug}` |

---

## 7. On-page content playbook

### Primary keyword themes

| Page | Target intent | Example keywords |
|------|---------------|------------------|
| Home | Brand + category | soaked breakfast, high protein breakfast India, clean nutrition |
| PDP | Product + buy | energy bite, soaked breakfast pack, protein breakfast no sugar |

### Title templates

- **Home:** `Soaked Breakfast Packs — High Protein, No Added Sugar | DiteUp`
- **PDP:** `{Product Name} — {Key benefit} | DiteUp` (via product SEO JSON)
- **Legal:** `{Policy name} · DiteUp` (already set)

### OG image spec

- Size: **1200 × 630 px**
- Format: JPG or PNG (< 300 KB)
- Include product pack + logo + one benefit line
- Host on production domain or R2 CDN with HTTPS

---

## 8. Structured data reference

| Schema | Page | Validates at |
|--------|------|--------------|
| Organization | All pages (layout) | Rich Results Test |
| WebSite + SearchAction | All pages | Rich Results Test |
| Product + Offer | PDP | Rich Results Test |
| AggregateRating | PDP (when reviews exist) | Rich Results Test |
| BreadcrumbList | PDP | Rich Results Test |
| FAQPage | Home + PDP (when FAQs exist) | Rich Results Test |

**Validator:** [Google Rich Results Test](https://search.google.com/test/rich-results)

**Share preview:** [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)

---

## 9. Analytics stack

| Tool | Status | Action for marketing |
|------|--------|----------------------|
| Meta Pixel | Live (consent-gated) | Verify with Pixel Helper; ID in Admin → Meta ads |
| Meta CAPI | Live (server) | Paired with Pixel ID in `metaAds` setting |
| GA4 / GTM | Not wired by default | Add container ID to `siteSeo` or env in a future sprint if approved |
| Google Search Console | Marketing setup | §3 |

**Pixel events already firing:** PageView, ViewContent, AddToCart, InitiateCheckout, AddPaymentInfo, Purchase, CompleteRegistration

---

## 10. Smoke tests (run after deploy)

```bash
# robots.txt — must disallow private paths
curl -s https://diteup.com/robots.txt

# sitemap — must NOT list /cart, /checkout, /login, /account
curl -s https://diteup.com/sitemap.xml

# Public SEO API
curl -s https://diteup.com/v1/site/seo
curl -s https://diteup.com/v1/products/sitemap

# View-source checks (browser)
# / — unique title, og:title, canonical, Organization JSON-LD
# /product/{slug} — Product JSON-LD, unique title/description
# /cart — meta robots noindex,nofollow
# /login — meta robots noindex,nofollow
```

---

## 11. Off-site SEO checklist

- [ ] Replace generic footer social links in `SiteFooter.tsx` with real profile URLs
- [ ] Create/claim Google Business Profile (if physical business address applies)
- [ ] Add full postal address to footer if required for local SEO
- [ ] Submit brand to relevant Indian food/health directories
- [ ] PR / influencer / affiliate link building
- [ ] Align Meta ad landing URLs with indexed canonical URLs (no UTM on canonical)
- [ ] Plan content hub / blog (`/blog/[slug]`) — deferred to Phase 2 per PRD

---

## 12. Post-launch monitoring (weekly)

| Check | Tool | Action if failing |
|-------|------|-------------------|
| Indexed pages | GSC → Pages | Fix coverage errors; resubmit sitemap |
| Crawl errors | GSC → Crawl stats | Fix 404s; check nginx/Next routes |
| Core Web Vitals | GSC → Experience | Escalate to dev if LCP/CLS regress |
| Rich results | Rich Results Test | Fix JSON-LD if product snippets drop |
| Share cards | FB Debugger | Refresh OG cache after image/copy changes |
| Lighthouse SEO | Chrome DevTools | Target score 100 |

---

## 13. Known deferrals (not in v1)

| Item | Reason | Owner |
|------|--------|-------|
| Slug 301 redirects | Needs `ProductSlugHistory` + middleware | Engineering Phase 2 |
| Blog / content SEO | PRD Phase 2 | Marketing + Engineering |
| Home FAQ from CMS | Currently static in `FaqSection.tsx` | Engineering |
| GA4/GTM | Awaiting marketing tool choice | Marketing decides |
| Product video + carousel | HANDOVER-AUDIT gaps | Engineering v1.5 |

---

## 14. Indexing policy summary

### Indexed (in sitemap)

`/`, `/contact`, `/terms`, `/privacy`, `/refund-policy`, `/shipping-policy`, `/product/{slug}` (published products only)

### Blocked (robots.txt + noindex)

`/admin`, `/api`, `/account`, `/cart`, `/checkout`, `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/order/*`

---

## 15. Support contacts

- **Technical / deploy issues:** Engineering (see `docs/SERVER-AGENT-DEPLOY-PROMPT.md`)
- **Product copy / SEO JSON:** Marketing via Admin panel
- **Customer-facing email:** info@diteup.com

---

*Hand this document to marketing at go-live. Engineering maintains `frontend/lib/seo/` and `frontend/components/seo/` for technical SEO infrastructure.*
