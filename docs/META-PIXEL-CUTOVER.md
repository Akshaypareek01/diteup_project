# Meta Pixel + Conversions API — production cutover

Pixel ID: `1408377107972075`

Covers switching Meta tracking on for the live site. Assumes the app is already deployed
per [EC2-PRODUCTION-SECURITY.md](EC2-PRODUCTION-SECURITY.md).

---

## 0. Know how the ID resolves before you touch anything

`MetaPixelGate` (server component in the root layout) picks the first value that exists:

1. Admin → Settings → **Meta ads**, `Setting` key `metaAds`, field `pixelId` — runtime, no redeploy
2. API `.env` → `META_PIXEL_ID` — runtime, needs API restart
3. Frontend `.env` → `NEXT_PUBLIC_META_PIXEL_ID` — **build-time**, see the warning in step 2
4. `DEFAULT_META_PIXEL_ID` in `frontend/lib/meta-pixel-config.ts` — always present

Because of (4), **the browser pixel fires in production even if you configure nothing.**
The Conversions API does not — it needs a pixel ID *and* an access token together, and
returns silently when either is missing:

```25:28:backend/src/services/settings.ts
  const pixelId = String(fromDb.pixelId || env.META_PIXEL_ID || "").trim();
  const accessToken = String(fromDb.capiAccessToken || env.META_CAPI_ACCESS_TOKEN || "").trim();
  if (!pixelId || !accessToken) return null;
```

---

## 1. Generate the CAPI access token

- [ ] Events Manager → Data Sources → pixel `1408377107972075`
- [ ] Settings tab → Conversions API → **Generate access token**
- [ ] Copy it once — Meta will not show it again

This token is a real secret. Do not commit it, do not put it in `frontend/` (anything
under `NEXT_PUBLIC_` ships to the browser), and do not paste it into a support ticket.

---

## 2. Configure production

**Recommended: use the admin panel.** It is runtime, needs no redeploy or restart, and
sets both required values at once.

- [ ] Log in to `/admin/settings/meta` ("Meta ads")
- [ ] Save:

```json
{
  "pixelId": "1408377107972075",
  "capiAccessToken": "EAAG..."
}
```

- [ ] Confirm `SETTINGS_ENCRYPTION_KEY` is set on the API so the value is encrypted at rest

**Alternative: server env.** Requires an API restart.

```bash
# API .env
META_PIXEL_ID=1408377107972075
META_CAPI_ACCESS_TOKEN=EAAG...
```

> **Build-time warning.** `NEXT_PUBLIC_META_PIXEL_ID` is inlined by Next.js when the
> frontend is built, so editing it on the server after `next build` has no effect. Set it
> before building, or skip it entirely and rely on the admin setting — that is the whole
> reason the runtime `/v1/site/integrations` lookup exists.

---

## 3. Deploy and wait out the caches

- [ ] Deploy the frontend and API
- [ ] Restart the API if you used env vars rather than the admin panel

Two caches sit between an admin change and the storefront, both 300s:

```23:23:backend/src/controllers/site.ts
    res.set("Cache-Control", "public, max-age=300, stale-while-revalidate=600");
```

The frontend fetch uses `revalidate: 300` as well. Allow **up to ~10 minutes** after
changing the pixel ID, or restart the frontend to clear it immediately.

---

## 4. Verify the browser pixel

Install the **Meta Pixel Helper** Chrome extension first.

- [ ] Open the live site in a fresh incognito window
- [ ] **Click "Accept analytics" in the cookie banner.** Nothing will be tracked until you
      do — the pixel boots in `fbq('consent','revoke')` mode. This is the single most
      common reason people think the pixel is broken
- [ ] Pixel Helper shows pixel `1408377107972075` and a `PageView`
- [ ] Navigate home → product page **by clicking a link, not by reloading**. A second
      `PageView` plus a `ViewContent` must appear. Reloading would not test the App Router
      route-change tracking
- [ ] Confirm `ViewContent` carries `content_type: product`
- [ ] Add to cart → `AddToCart`
- [ ] Reach checkout → `InitiateCheckout` and `AddPaymentInfo` (once each, not repeating
      when you apply a coupon or change PIN)

| Event | Fires from |
|-------|-----------|
| PageView | `MetaPixel.tsx` on load, `MetaPixelRouteEvents.tsx` on route change |
| ViewContent | Home hero, PDP (once per product) |
| AddToCart | PDP add / buy now |
| InitiateCheckout | Checkout mount |
| AddPaymentInfo | Checkout, once |
| Purchase | Order tracking page once status is `CONFIRMED` |
| CompleteRegistration | Signup email verification |

---

## 5. Verify the Conversions API

Place one real low-value order on the live site (COD is easiest).

- [ ] Events Manager → your pixel → Overview shows a `Purchase` with connection method
      **"Server"** alongside the browser one
- [ ] The two collapse into **one** conversion, not two. Check Events Manager →
      Purchase → "Deduplication" — it should report the browser/server pair as deduplicated

Dedup works because both sides send the order number as the event id: the browser passes
`{ eventID: orderNumber }` as `fbq`'s fourth argument, and the server sends the same value
as `event_id`. If you ever see doubled conversion counts, that pairing is what broke.

Database checks if something looks wrong:

```sql
-- Did CAPI fire? A row here means Meta accepted the event.
SELECT type, payload, "createdAt" FROM "OrderEvent"
WHERE "orderId" = '<order id>' AND type = 'META_CAPI_PURCHASE';

-- Were the ad-attribution signals captured at checkout?
SELECT payload FROM "OrderEvent"
WHERE "orderId" = '<order id>' AND type = 'META_ATTRIBUTION';
```

`META_ATTRIBUTION` should contain `fbp`, `fbc`, `ip` and `ua`. `fbp`/`fbc` are only present
if the shopper accepted analytics cookies or arrived on an `fbclid` link — their absence on
one order is normal, on every order is a bug.

**To re-test CAPI on the same order**, delete its `META_CAPI_PURCHASE` row. That marker is
what stops duplicate sends, so the event will not fire twice while it exists.

### Known limitation: Test Events

Meta's **Test Events** tool cannot see server events from this codebase. It matches on a
`test_event_code` field that `sendPurchaseEvent` does not currently send. Browser events
show up in Test Events normally. Verify CAPI through the Overview/Deduplication views
above, or ask for `test_event_code` support to be added (small change, env-gated).

---

## 6. Post-launch, first week

- [ ] Event Match Quality for Purchase — target ≥ 7.0/10 per PRD §3. Email, phone, IP,
      user-agent, `fbp` and `fbc` are all being sent, which is what drives this score
- [ ] Purchase count in Events Manager matches real order count (not double)
- [ ] `Additional conversions reported` from CAPI is above zero — that is the iOS and
      ad-blocker recovery the server events exist for
- [ ] Tick task 15.4 in [TASKS.md](TASKS.md)

---

## 7. Rollback

To stop all Meta tracking quickly:

- [ ] Clear `pixelId` in Admin → Settings → Meta ads, **and** unset `META_PIXEL_ID` on the
      API, **and** unset `NEXT_PUBLIC_META_PIXEL_ID`

That still leaves `DEFAULT_META_PIXEL_ID` in the code, so a full stop needs a redeploy with
that constant blanked in `frontend/lib/meta-pixel-config.ts`. This is the trade-off of the
hardcoded fallback: the pixel can never accidentally go missing, but it also cannot be
switched off from the admin panel alone.

To disable **only** the server side, clear `capiAccessToken` — CAPI then no-ops and the
browser pixel keeps working.

---

## Privacy note

The `<noscript>` fallback beacon in `MetaPixel.tsx` fires for visitors with JavaScript
disabled, and consent mode cannot gate it because the banner itself needs JavaScript. This
matches Meta's official snippet and affects a very small share of traffic, but it is worth
knowing if DPDP compliance is ever reviewed — removing that `<noscript>` block is the fix.
