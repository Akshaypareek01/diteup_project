/** Indian states and union territories for address forms (full names). */
export const INDIAN_STATES = [
  "Andaman and Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
] as const;

export type IndianState = (typeof INDIAN_STATES)[number];

/** Checkout country options — PAN-India delivery only for now. */
export const CHECKOUT_COUNTRIES = [{ code: "IN", label: "India" }] as const;

/**
 * Returns true when `value` matches a known Indian state name (case-insensitive).
 */
export function isKnownIndianState(value: string): value is IndianState {
  const normalized = value.trim().toLowerCase();
  return INDIAN_STATES.some((s) => s.toLowerCase() === normalized);
}

/** GST / ISO-ish 2-letter codes browsers sometimes autofill into state. */
const STATE_CODE_TO_NAME: Record<string, IndianState> = {
  AN: "Andaman and Nicobar Islands",
  AP: "Andhra Pradesh",
  AR: "Arunachal Pradesh",
  AS: "Assam",
  BR: "Bihar",
  CH: "Chandigarh",
  CT: "Chhattisgarh",
  CG: "Chhattisgarh",
  DH: "Dadra and Nagar Haveli and Daman and Diu",
  DD: "Dadra and Nagar Haveli and Daman and Diu",
  DL: "Delhi",
  GA: "Goa",
  GJ: "Gujarat",
  HR: "Haryana",
  HP: "Himachal Pradesh",
  JK: "Jammu and Kashmir",
  JH: "Jharkhand",
  KA: "Karnataka",
  KL: "Kerala",
  LA: "Ladakh",
  LD: "Lakshadweep",
  MP: "Madhya Pradesh",
  MH: "Maharashtra",
  MN: "Manipur",
  ML: "Meghalaya",
  MZ: "Mizoram",
  NL: "Nagaland",
  OR: "Odisha",
  OD: "Odisha",
  PY: "Puducherry",
  PB: "Punjab",
  RJ: "Rajasthan",
  SK: "Sikkim",
  TN: "Tamil Nadu",
  TS: "Telangana",
  TG: "Telangana",
  TR: "Tripura",
  UP: "Uttar Pradesh",
  UK: "Uttarakhand",
  UT: "Uttarakhand",
  WB: "West Bengal",
};

/**
 * Maps autofill junk (`KA`, `karnataka`) onto the checkout `<select>` values.
 */
export function normalizeIndianState(raw: string): string {
  const t = raw.trim();
  if (!t) return "";
  const known = INDIAN_STATES.find((s) => s.toLowerCase() === t.toLowerCase());
  if (known) return known;
  return STATE_CODE_TO_NAME[t.toUpperCase()] ?? t;
}

/**
 * Maps autofill country (`India`, `IND`) onto `IN`.
 */
export function normalizeCheckoutCountry(raw: string): string {
  const t = raw.trim().toLowerCase();
  if (!t || t === "in" || t === "ind" || t === "india" || t === "inr") return "IN";
  return raw.trim() || "IN";
}

/**
 * Keeps Indian PIN as at most 6 digits.
 */
export function sanitizePincode(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 6);
}
