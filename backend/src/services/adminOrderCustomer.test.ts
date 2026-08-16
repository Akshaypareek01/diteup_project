import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { adminCustomerFields } from "./adminOrderCustomer.js";

describe("adminCustomerFields", () => {
  it("uses shipping name for guests and tags isGuest", () => {
    const out = adminCustomerFields({
      userId: null,
      guestEmail: "guest@example.com",
      shippingAddress: { name: "Priya Sharma" },
      user: null,
    });
    assert.deepEqual(out, {
      customerName: "Priya Sharma",
      customerEmail: "guest@example.com",
      isGuest: true,
    });
  });

  it("does not treat logged-in orders as blank when guestEmail is null", () => {
    const out = adminCustomerFields({
      userId: "user_1",
      guestEmail: null,
      shippingAddress: { name: "Amit" },
      user: { email: "amit@example.com", name: "Amit Kumar" },
    });
    assert.equal(out.customerName, "Amit");
    assert.equal(out.customerEmail, "amit@example.com");
    assert.equal(out.isGuest, false);
  });

  it("falls back to account name when shipping name is missing", () => {
    const out = adminCustomerFields({
      userId: "user_1",
      guestEmail: null,
      shippingAddress: { city: "Jaipur" },
      user: { email: "amit@example.com", name: "Amit Kumar" },
    });
    assert.equal(out.customerName, "Amit Kumar");
    assert.equal(out.customerEmail, "amit@example.com");
  });
});
