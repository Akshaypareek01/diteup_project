/**
 * Field normalizers + format validators used across services.
 * Always normalize at the API boundary so the DB only stores one canonical form.
 */

/**
 * Normalize an Indian phone number to E.164 (`+91XXXXXXXXXX`).
 * Accepts: 10-digit `9876543210`, `09876543210`, `919876543210`, `+919876543210`, with spaces/dashes.
 * Throws if the cleaned digits don't form a valid Indian mobile (must start with 6-9).
 */
export function normalizeIndianPhone(input: string): string {
  const cleaned = input.replace(/[\s\-()]/g, "");
  let digits = cleaned.startsWith("+") ? cleaned.slice(1) : cleaned;
  // Strip leading 0
  if (digits.startsWith("0")) digits = digits.slice(1);
  // Strip country code if present
  if (digits.startsWith("91") && digits.length === 12) digits = digits.slice(2);
  if (digits.length !== 10) {
    throw new Error("Phone must be a 10-digit Indian mobile number");
  }
  if (!/^[6-9]\d{9}$/.test(digits)) {
    throw new Error("Phone must start with 6, 7, 8 or 9");
  }
  return `+91${digits}`;
}

/** Validate Indian PIN code: exactly 6 digits, first digit 1-9. */
export function isValidIndianPincode(pin: string): boolean {
  return /^[1-9]\d{5}$/.test(pin.trim());
}

/** Normalize email — trim + lowercase. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
