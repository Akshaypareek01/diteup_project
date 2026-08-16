/**
 * Resolves the name/email shown in admin order tables.
 * Logged-in checkouts store `guestEmail = null`, so the list must not use that field alone.
 */

export type AdminCustomerFields = {
  customerName: string | null;
  customerEmail: string | null;
  isGuest: boolean;
};

/**
 * Reads `shippingAddress.name` from the checkout snapshot JSON.
 */
export function shippingNameFromJson(addr: unknown): string | null {
  if (!addr || typeof addr !== "object" || Array.isArray(addr)) return null;
  const name = (addr as { name?: unknown }).name;
  if (typeof name !== "string") return null;
  const trimmed = name.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Prefers checkout shipping name, then account name; email from user then guest.
 */
export function adminCustomerFields(order: {
  userId: string | null;
  guestEmail: string | null;
  shippingAddress?: unknown;
  user?: { email: string; name: string | null } | null;
}): AdminCustomerFields {
  const shipName = shippingNameFromJson(order.shippingAddress);
  const accountName = order.user?.name?.trim() || null;
  const customerEmail = order.user?.email ?? order.guestEmail ?? null;
  return {
    customerName: shipName ?? accountName,
    customerEmail,
    isGuest: !order.userId,
  };
}
