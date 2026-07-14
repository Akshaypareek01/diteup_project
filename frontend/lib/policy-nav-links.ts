/** Footer and policies hub links — URLs match DITEUP _ POLICIES.docx. */
export const POLICY_NAV_LINKS = [
  { href: "/policies", label: "Policies" },
  { href: "/shipping-policy", label: "Shipping Policy" },
  { href: "/return-refund-policy", label: "Return & Refund" },
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/terms-conditions", label: "Terms & Conditions" },
] as const;

/** Sub-policy links shown on the `/policies` hub (excludes the hub itself). */
export const POLICY_DETAIL_LINKS = POLICY_NAV_LINKS.filter((link) => link.href !== "/policies");
