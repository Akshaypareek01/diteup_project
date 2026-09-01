/**
 * GST-inclusive invoice reverse-split: taxable + tax === what the customer paid.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { roundMoney } from "../utils/money.js";
import {
  buildInvoiceGst,
  extrasGstRate,
  splitInclusive,
} from "./invoiceGst.js";

describe("splitInclusive", () => {
  it("reverse-splits ₹799 @ 5% without adding GST on top", () => {
    const { taxable, tax } = splitInclusive(799, 5);
    assert.equal(taxable, 760.95);
    assert.equal(tax, 38.05);
    assert.equal(roundMoney(taxable + tax), 799);
  });

  it("treats 0% as fully taxable", () => {
    assert.deepEqual(splitInclusive(40, 0), { taxable: 40, tax: 0 });
  });
});

describe("buildInvoiceGst", () => {
  it("prepaid item-only order: taxable + IGST = grand total", () => {
    const gst = buildInvoiceGst({
      itemLines: [{ inclusiveAmount: 799, gstRate: 5 }],
      grandTotal: 799,
      intraState: false,
    });
    assert.equal(gst.taxableTotal, 760.95);
    assert.equal(gst.igst, 38.05);
    assert.equal(gst.cgst, 0);
    assert.equal(roundMoney(gst.taxableTotal + gst.igst), 799);
  });

  it("includes COD in the GST split so footer equals paid total", () => {
    const gst = buildInvoiceGst({
      itemLines: [{ inclusiveAmount: 1799, gstRate: 5 }],
      grandTotal: 1839,
      intraState: false,
    });
    assert.equal(gst.taxableTotal, 1751.43);
    assert.equal(gst.igst, 87.57);
    assert.equal(roundMoney(gst.taxableTotal + gst.igst), 1839);
  });

  it("splits intra-state tax into CGST + SGST", () => {
    const gst = buildInvoiceGst({
      itemLines: [{ inclusiveAmount: 799, gstRate: 5 }],
      grandTotal: 799,
      intraState: true,
    });
    assert.equal(gst.igst, 0);
    assert.equal(roundMoney(gst.cgst + gst.sgst), 38.05);
    assert.equal(roundMoney(gst.taxableTotal + gst.cgst + gst.sgst), 799);
  });

  it("weights extras GST when product slabs differ", () => {
    assert.equal(
      extrasGstRate([
        { inclusiveAmount: 100, gstRate: 5 },
        { inclusiveAmount: 100, gstRate: 18 },
      ]),
      11.5,
    );
  });
});
