/**
 * Persisted checkout snapshot (`Order.shippingAddress` JSON from backend `shippingToJson`).
 */
export type StoredShippingSnapshot = {
  name?: string;
  phone?: string;
  line1?: string;
  line2?: string | null;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
};

/**
 * Turns stored shipping JSON into display lines for account / tracking UIs.
 */
export function shippingSnapshotLines(addr: unknown): string[] {
  if (!addr || typeof addr !== "object") return [];
  const s = addr as StoredShippingSnapshot;
  const out: string[] = [];
  if (s.name) out.push(s.name);
  if (s.phone) out.push(`Phone · ${s.phone}`);
  if (s.line1) out.push(s.line1);
  const l2 = s.line2?.trim();
  if (l2) out.push(l2);
  const loc = [s.city, s.state].filter(Boolean).join(", ");
  const pin = s.pincode?.trim();
  if (loc && pin) out.push(`${loc} ${pin}`);
  else if (loc) out.push(loc);
  else if (pin) out.push(pin);
  if (s.country && s.country !== "IN") out.push(s.country);
  return out;
}
