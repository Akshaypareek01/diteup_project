/**
 * Customer cell for admin order tables — name from shipping, email, Guest vs account.
 */
export type AdminCustomerCellProps = {
  customerName: string | null;
  customerEmail: string | null;
  isGuest: boolean;
};

/**
 * Renders checkout name + email; tags guest checkouts so they are not confused with accounts.
 */
export function AdminCustomerCell({ customerName, customerEmail, isGuest }: AdminCustomerCellProps) {
  const title = customerName ?? customerEmail ?? "—";
  const showEmail = Boolean(customerEmail && customerEmail !== title);
  return (
    <td className="px-4 py-3">
      <p className="text-forest">{title}</p>
      {showEmail ? <p className="text-body-sm text-ink-muted">{customerEmail}</p> : null}
      {isGuest ? (
        <p className="mt-0.5 font-mono text-eyebrow uppercase tracking-wide text-ink-muted">Guest</p>
      ) : null}
    </td>
  );
}
