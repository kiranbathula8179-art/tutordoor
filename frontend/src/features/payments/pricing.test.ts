import { describe, expect, it } from "vitest";

import { couponDiscount, payableTotal } from "@/features/payments/pricing";

/**
 * Money math. These are the numbers a customer is actually charged, so the
 * edge cases (over-value coupons, string decimals from DRF) are asserted
 * explicitly rather than assumed.
 */

describe("couponDiscount", () => {
  it("is zero when no coupon is applied", () => {
    expect(couponDiscount(null)).toBe(0);
    expect(couponDiscount(undefined)).toBe(0);
  });

  it("parses the decimal strings DRF serializes", () => {
    expect(couponDiscount("50.00")).toBe(50);
    expect(couponDiscount("12.50")).toBe(12.5);
  });

  it("falls back to zero for unparseable values", () => {
    expect(couponDiscount("not-a-number")).toBe(0);
  });
});

describe("payableTotal", () => {
  it("subtracts the discount from the session price", () => {
    expect(payableTotal("500.00", 50)).toBe(450);
  });

  it("charges the full price when there is no discount", () => {
    expect(payableTotal("500.00", 0)).toBe(500);
  });

  it("never returns a negative total when a coupon exceeds the price", () => {
    expect(payableTotal("100.00", 250)).toBe(0);
  });

  it("settles exactly to zero for a fully covering coupon", () => {
    expect(payableTotal("500.00", 500)).toBe(0);
  });

  it("returns zero for a malformed price rather than NaN", () => {
    expect(payableTotal("", 0)).toBe(0);
    expect(payableTotal("abc", 10)).toBe(0);
  });
});
