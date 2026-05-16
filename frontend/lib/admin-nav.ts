export type AdminNavItem = {
  href: string;
  label: string;
  description?: string;
};

export const adminPrimaryNav: AdminNavItem[] = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/inventory", label: "Inventory" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/coupons", label: "Coupons" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/emails", label: "Emails" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/audit", label: "Audit log" },
];

export const settingsSections: { slug: string; label: string; blurb: string }[] = [
  { slug: "general", label: "General", blurb: "Brand, support, cookie copy" },
  { slug: "gst", label: "GST & invoicing", blurb: "GSTIN, HSN, invoice prefix" },
  { slug: "shipping", label: "Shipping", blurb: "Rates, thresholds, pincodes" },
  { slug: "cod", label: "COD", blurb: "Charges, limits, pincode rules" },
  { slug: "refunds", label: "Refunds & returns", blurb: "Default policy windows" },
  { slug: "inventory", label: "Inventory defaults", blurb: "Low stock, backorder, reservation" },
  { slug: "orders", label: "Order rules", blurb: "Min/max qty, auto-cancel timeout" },
  { slug: "payments", label: "Payments", blurb: "Razorpay keys (masked)" },
  { slug: "meta", label: "Meta ads", blurb: "Pixel, CAPI, consent" },
  { slug: "email", label: "Email", blurb: "Resend, from/reply, DKIM" },
  { slug: "seo", label: "SEO", blurb: "Titles, OG, robots" },
  { slug: "site", label: "Site-wide mode", blurb: "Maintenance, banners" },
  { slug: "security", label: "Audit & security", blurb: "IP allowlist, backup hooks" },
];

export const productEditorTabs: { id: string; label: string }[] = [
  { id: "basics", label: "Basics" },
  { id: "visibility", label: "Visibility" },
  { id: "pricing", label: "Pricing & tax" },
  { id: "inventory", label: "Inventory" },
  { id: "shipping", label: "Payment & shipping" },
  { id: "ordering", label: "Ordering rules" },
  { id: "refund", label: "Refund / return" },
  { id: "media", label: "Media" },
  { id: "variants", label: "Variants" },
  { id: "faqs", label: "FAQs" },
  { id: "reviews", label: "Reviews" },
  { id: "seo", label: "SEO" },
];
