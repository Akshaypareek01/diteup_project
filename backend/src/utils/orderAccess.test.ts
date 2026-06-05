/**
 * Unit tests for guest order tracking URLs in transactional emails.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildOrderTrackingUrl,
  getPublicSiteBase,
  makeOrderGuestToken,
} from "./orderAccess.js";

describe("buildOrderTrackingUrl", () => {
  const orderNumber = "DU-TEST-1001";

  it("uses singular /order/ path (not /orders/)", () => {
    const url = buildOrderTrackingUrl(orderNumber);
    const parsed = new URL(url);
    assert.match(parsed.pathname, /^\/order\//);
    assert.doesNotMatch(parsed.pathname, /^\/orders\//);
    assert.ok(parsed.pathname.endsWith(encodeURIComponent(orderNumber)));
  });

  it("includes a token query param matching makeOrderGuestToken", () => {
    const url = buildOrderTrackingUrl(orderNumber);
    const parsed = new URL(url);
    const token = parsed.searchParams.get("token");
    assert.ok(token && token.length >= 32);
    assert.equal(token, makeOrderGuestToken(orderNumber));
  });

  it("uses PUBLIC_SITE_URL when configured", () => {
    const base = getPublicSiteBase();
    const url = buildOrderTrackingUrl(orderNumber);
    assert.ok(url.startsWith(`${base.replace(/\/$/, "")}/order/`));
  });
});
