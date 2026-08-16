import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { formatIstDateTime, startOfIstDay } from "./ist.js";

describe("startOfIstDay", () => {
  it("maps UTC morning to that IST calendar day's midnight", () => {
    // 2026-08-16 00:00 UTC = 05:30 IST on 16 Aug
    const start = startOfIstDay(new Date("2026-08-16T00:00:00.000Z"));
    assert.equal(start.toISOString(), "2026-08-15T18:30:00.000Z");
  });

  it("rolls to the next IST day after 18:30 UTC", () => {
    // 2026-08-15 20:00 UTC = 01:30 IST on 16 Aug
    const start = startOfIstDay(new Date("2026-08-15T20:00:00.000Z"));
    assert.equal(start.toISOString(), "2026-08-15T18:30:00.000Z");
  });

  it("stays on the previous IST day before IST midnight", () => {
    // 2026-08-15 18:00 UTC = 23:30 IST on 15 Aug
    const start = startOfIstDay(new Date("2026-08-15T18:00:00.000Z"));
    assert.equal(start.toISOString(), "2026-08-14T18:30:00.000Z");
  });
});

describe("formatIstDateTime", () => {
  it("renders UTC instants in Asia/Kolkata", () => {
    const s = formatIstDateTime(new Date("2026-08-16T04:41:09.000Z"));
    assert.match(s, /16/);
    assert.match(s, /2026/);
    assert.match(s, /10:11/i);
  });
});
