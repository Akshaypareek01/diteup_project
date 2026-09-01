/**
 * Unit tests for the pure parts of the Shiprocket integration:
 * `buildAdhocOrderPayload` and `mapShiprocketStatus`.
 *
 * No network/DB — only pure-function behavior is exercised.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildAdhocOrderPayload,
  mapShiprocketStatus,
  type ShiprocketPushableOrder,
} from "./shiprocket.js";
import {
  baseOrderNumberFromChannelId,
  isCanceledShiprocketStatus,
  nextAttemptFromChannelId,
  nextShiprocketChannelOrderId,
} from "./shiprocketChannel.js";
import type { ShiprocketConfig } from "./settings.js";
import { AppError } from "../utils/errors.js";

// =====================================================
// FIXTURES
// =====================================================

function makeConfig(overrides: Partial<ShiprocketConfig> = {}): ShiprocketConfig {
  return {
    email: "ship@example.com",
    password: "secret",
    webhookToken: null,
    pickupLocation: "Primary",
    defaultWeightKg: 0.5,
    defaultDimensionsCm: { length: 15, breadth: 12, height: 10 },
    ...overrides,
  };
}

type TestItem = {
  productName: string;
  variantName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  variant: { weightGm: number | null };
};

function makeItem(overrides: Partial<TestItem> = {}): TestItem {
  return {
    productName: "Cold Press Juice",
    variantName: "500ml",
    sku: "CPJ-500",
    quantity: 2,
    unitPrice: 199,
    variant: { weightGm: 550 },
    ...overrides,
  };
}

/**
 * Builds a minimal order shaped like `ShiprocketPushableOrder`. Only the
 * fields `buildAdhocOrderPayload` reads are populated; Decimal fields are
 * plain numbers (the builder converts via `Number(...)`).
 */
function makeOrder(overrides: Record<string, unknown> = {}): ShiprocketPushableOrder {
  const base = {
    orderNumber: "DU-2026-0001",
    placedAt: new Date("2026-07-15T10:00:00.000Z"),
    paymentMethod: "COD",
    subtotal: 398,
    discountAmount: 50,
    shippingAmount: 40,
    codCharge: 25,
    guestEmail: null as string | null,
    user: { email: "buyer@example.com" } as unknown,
    shippingAddress: {
      name: "Akshay Pareek",
      phone: "9876543210",
      line1: "221B Baker Street",
      line2: "Near Park",
      city: "Jaipur",
      state: "Rajasthan",
      pincode: "302001",
      country: "India",
    } as unknown,
    items: [makeItem()] as unknown,
  };
  return { ...base, ...overrides } as unknown as ShiprocketPushableOrder;
}

/** Shallow-merges overrides into the default shipping address. */
function withAddress(addrOverrides: Record<string, unknown>): ShiprocketPushableOrder {
  const order = makeOrder();
  order.shippingAddress = {
    ...(order.shippingAddress as Record<string, unknown>),
    ...addrOverrides,
  } as ShiprocketPushableOrder["shippingAddress"];
  return order;
}

// =====================================================
// buildAdhocOrderPayload
// =====================================================

describe("buildAdhocOrderPayload", () => {
  it("builds a correct COD payload (happy path)", () => {
    const payload = buildAdhocOrderPayload(makeOrder(), makeConfig());

    assert.equal(payload.order_id, "DU-2026-0001");
    assert.equal(payload.payment_method, "COD");
    assert.equal(payload.billing_phone, "9876543210");
    assert.equal(payload.billing_email, "buyer@example.com");
    assert.equal(payload.billing_customer_name, "Akshay");
    assert.equal(payload.billing_last_name, "Pareek");
    assert.equal(payload.billing_pincode, "302001");
    assert.equal(payload.pickup_location, "Primary");

    assert.equal(payload.sub_total, 398);
    assert.equal(payload.total_discount, 50);
    // COD fee is folded into shipping: 40 + 25.
    assert.equal(payload.shipping_charges, 65);

    // 550 g x 2 units = 1100 g = 1.1 kg.
    assert.equal(payload.weight, 1.1);

    assert.equal(payload.length, 15);
    assert.equal(payload.breadth, 12);
    assert.equal(payload.height, 10);
    assert.equal(payload.shipping_is_billing, true);

    const items = payload.order_items as Array<Record<string, unknown>>;
    assert.equal(items.length, 1);
    assert.equal(items[0].name, "Cold Press Juice — 500ml");
    assert.equal(items[0].sku, "CPJ-500");
    assert.equal(items[0].units, 2);
    assert.equal(items[0].selling_price, 199);
  });

  it("maps non-COD payment methods to Prepaid", () => {
    const payload = buildAdhocOrderPayload(makeOrder({ paymentMethod: "RAZORPAY" }), makeConfig());
    assert.equal(payload.payment_method, "Prepaid");
  });

  describe("phone normalization", () => {
    it('normalizes "+91 98765 43210" to 10 digits', () => {
      const payload = buildAdhocOrderPayload(withAddress({ phone: "+91 98765 43210" }), makeConfig());
      assert.equal(payload.billing_phone, "9876543210");
    });

    it('strips a leading 0 from "09876543210"', () => {
      const payload = buildAdhocOrderPayload(withAddress({ phone: "09876543210" }), makeConfig());
      assert.equal(payload.billing_phone, "9876543210");
    });

    it("throws ValidationError for a too-short phone", () => {
      assert.throws(
        () => buildAdhocOrderPayload(withAddress({ phone: "12345" }), makeConfig()),
        (err: unknown) => err instanceof AppError && /phone/i.test(err.message),
      );
    });

    it("throws for a 10-digit number not starting with 6-9", () => {
      assert.throws(
        () => buildAdhocOrderPayload(withAddress({ phone: "5876543210" }), makeConfig()),
        (err: unknown) => err instanceof AppError && /phone/i.test(err.message),
      );
    });
  });

  describe("pincode validation", () => {
    for (const bad of ["1100 1", "ABC123", "30200"]) {
      it(`rejects invalid pincode "${bad}"`, () => {
        assert.throws(
          () => buildAdhocOrderPayload(withAddress({ pincode: bad }), makeConfig()),
          (err: unknown) => err instanceof AppError && /pincode/i.test(err.message),
        );
      });
    }
  });

  it("throws when neither account email nor guest email exists", () => {
    assert.throws(
      () => buildAdhocOrderPayload(makeOrder({ user: null, guestEmail: null }), makeConfig()),
      (err: unknown) => err instanceof AppError && /email/i.test(err.message),
    );
  });

  it("falls back to guestEmail when there is no user", () => {
    const payload = buildAdhocOrderPayload(
      makeOrder({ user: null, guestEmail: "guest@example.com" }),
      makeConfig(),
    );
    assert.equal(payload.billing_email, "guest@example.com");
  });

  it("uses config.defaultWeightKg per unit when variant weight is null", () => {
    const order = makeOrder({
      items: [makeItem({ quantity: 3, variant: { weightGm: null } })] as unknown,
    });
    const payload = buildAdhocOrderPayload(order, makeConfig({ defaultWeightKg: 0.5 }));
    // 0.5 kg default x 3 units = 1.5 kg.
    assert.equal(payload.weight, 1.5);
  });

  it("puts a single-word name entirely in billing_customer_name", () => {
    const payload = buildAdhocOrderPayload(withAddress({ name: "Akshay" }), makeConfig());
    assert.equal(payload.billing_customer_name, "Akshay");
    assert.equal(payload.billing_last_name, "");
  });

  it("throws when the order has no items", () => {
    assert.throws(
      () => buildAdhocOrderPayload(makeOrder({ items: [] as unknown }), makeConfig()),
      (err: unknown) => err instanceof AppError && /items/i.test(err.message),
    );
  });
});

// =====================================================
// mapShiprocketStatus
// =====================================================

describe("mapShiprocketStatus", () => {
  it('maps "Delivered" case-insensitively to DELIVERED', () => {
    assert.equal(mapShiprocketStatus("Delivered"), "DELIVERED");
  });

  it('trims and maps " in transit " to SHIPPED', () => {
    assert.equal(mapShiprocketStatus(" in transit "), "SHIPPED");
  });

  it('maps "RTO INITIATED" to RETURNED', () => {
    assert.equal(mapShiprocketStatus("RTO INITIATED"), "RETURNED");
  });

  it('returns null for "PICKUP SCHEDULED"', () => {
    assert.equal(mapShiprocketStatus("PICKUP SCHEDULED"), null);
  });

  it("returns null for an empty string", () => {
    assert.equal(mapShiprocketStatus(""), null);
  });
});

describe("shiprocketChannel", () => {
  it("keeps the base order number on attempt 0", () => {
    assert.equal(nextShiprocketChannelOrderId("DU-2026-00009", 0), "DU-2026-00009");
  });

  it("suffixes -R1 / -R2 on later attempts", () => {
    assert.equal(nextShiprocketChannelOrderId("DU-2026-00009", 1), "DU-2026-00009-R1");
    assert.equal(nextShiprocketChannelOrderId("DU-2026-00009", 2), "DU-2026-00009-R2");
  });

  it("strips the retry suffix for webhook matching", () => {
    assert.equal(baseOrderNumberFromChannelId("DU-2026-00009-R1"), "DU-2026-00009");
    assert.equal(baseOrderNumberFromChannelId("DU-2026-00009"), "DU-2026-00009");
  });

  it("treats status_code 5 and CANCELED text as canceled", () => {
    assert.equal(isCanceledShiprocketStatus("NEW", 1), false);
    assert.equal(isCanceledShiprocketStatus("CANCELED", 1), true);
    assert.equal(isCanceledShiprocketStatus("NEW", 5), true);
  });

  it("starts at -R1 when the stored channel id is the base order number", () => {
    assert.equal(nextAttemptFromChannelId("DU-2026-00009"), 1);
    assert.equal(nextAttemptFromChannelId(null), 1);
    assert.equal(nextAttemptFromChannelId(""), 1);
  });

  it("increments the retry suffix for the next create attempt", () => {
    assert.equal(nextAttemptFromChannelId("DU-2026-00009-R1"), 2);
    assert.equal(nextAttemptFromChannelId("DU-2026-00009-R2"), 3);
    assert.equal(nextAttemptFromChannelId("DU-2026-00009-R3"), 4);
  });
});
