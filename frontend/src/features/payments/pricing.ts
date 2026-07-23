/**
 * Payment pricing helpers.
 *
 * Extracted from BookingPaymentPage so the money math is unit-testable in
 * isolation (production-readiness audit, finding MEDIUM-2: no frontend tests
 * covered revenue paths). Behaviour is byte-identical to the previous inline
 * expressions — this is an extraction, not a change.
 */

/** Discount applied by a validated coupon; 0 when no coupon is applied. */
export function couponDiscount(discountAmount: string | number | null | undefined): number {
  if (discountAmount === null || discountAmount === undefined) return 0;
  const value = Number(discountAmount);
  return Number.isFinite(value) ? value : 0;
}

/**
 * Amount the customer actually pays. Never negative: a coupon worth more than
 * the session price settles the balance to zero rather than crediting money.
 */
export function payableTotal(price: string | number, discount: number): number {
  const base = Number(price);
  if (!Number.isFinite(base)) return 0;
  return Math.max(base - discount, 0);
}
