import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { UserRestrictionsPanel } from "@/components/admin/UserRestrictionsPanel";
import { formatInr } from "@/lib/format-money";
import { adminGet } from "@/lib/admin-json";

type Address = {
  id: string;
  label?: string | null;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  pincode: string;
};

type UserOrder = {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  placedAt: string;
  paymentMethod: string;
};

type UserDetail = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: string;
  isActive: boolean;
  emailVerified: boolean;
  tags: string[];
  adminNotes: string | null;
  restrictions?: Record<string, unknown> | null;
  createdAt: string;
  lastLoginAt: string | null;
  passwordSet: boolean;
  lifetimeSpend: number;
  recentOrders: UserOrder[];
  addresses: Address[];
  _count: { orders: number; reviews: number };
};

type DetailResponse = { user: UserDetail };

type Props = { params: { userId: string } };

/**
 * User profile + admin actions — `GET /v1/admin/users/:id`.
 */
export default async function AdminUserDetailPage({ params }: Props) {
  const { userId } = params;
  const { data, ok } = await adminGet<DetailResponse>(`/v1/admin/users/${encodeURIComponent(userId)}`);
  if (!ok || !data?.user) notFound();

  const u = data.user;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-display-md font-semibold text-forest">
        {u.name || u.email}{" "}
        <span className="block font-mono text-body-sm font-normal text-ink-muted">{u.id}</span>
      </h1>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="font-semibold text-forest">Profile</h2>
          <dl className="mt-4 space-y-2 text-body-sm">
            <div>
              <dt className="font-mono text-eyebrow text-ink-muted">Email</dt>
              <dd>{u.email}</dd>
            </div>
            <div>
              <dt className="font-mono text-eyebrow text-ink-muted">Phone</dt>
              <dd>{u.phone ?? "—"}</dd>
            </div>
            <div>
              <dt className="font-mono text-eyebrow text-ink-muted">Lifetime spend</dt>
              <dd className="font-semibold text-forest">{formatInr(u.lifetimeSpend)}</dd>
            </div>
            <div>
              <dt className="font-mono text-eyebrow text-ink-muted">Role</dt>
              <dd className="font-mono">{u.role}</dd>
            </div>
            <div>
              <dt className="font-mono text-eyebrow text-ink-muted">Verified</dt>
              <dd>{u.emailVerified ? "Yes" : "No"}</dd>
            </div>
            <div>
              <dt className="font-mono text-eyebrow text-ink-muted">Orders / reviews</dt>
              <dd>
                {u._count.orders} orders · {u._count.reviews} reviews
              </dd>
            </div>
            <div>
              <dt className="font-mono text-eyebrow text-ink-muted">Last login</dt>
              <dd>{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : "—"}</dd>
            </div>
          </dl>
        </Card>
        <Card>
          <h2 className="font-semibold text-forest">Restrictions &amp; notes</h2>
          <p className="mt-2 text-body-sm text-ink-muted">Enable/disable account, tags, checkout blocks.</p>
          <div className="mt-4">
            <UserRestrictionsPanel
              userId={u.id}
              userRole={u.role}
              initialRestrictions={u.restrictions}
              initialTags={u.tags ?? []}
              initialAdminNotes={u.adminNotes}
              initialIsActive={u.isActive}
            />
          </div>
        </Card>
        <Card className="lg:col-span-2">
          <h2 className="font-semibold text-forest">Recent orders</h2>
          {u.recentOrders.length === 0 ? (
            <p className="mt-2 text-body-sm text-ink-muted">No orders yet.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-body-sm">
                <thead className="font-mono text-eyebrow text-ink-muted">
                  <tr>
                    <th className="px-2 py-2">Order</th>
                    <th className="px-2 py-2">Status</th>
                    <th className="px-2 py-2">Total</th>
                    <th className="px-2 py-2">Placed</th>
                  </tr>
                </thead>
                <tbody>
                  {u.recentOrders.map((o) => (
                    <tr key={o.id} className="border-t border-line">
                      <td className="px-2 py-2 font-mono">
                        <Link href={`/admin/orders/${o.id}`} className="text-gold-deep hover:underline">
                          {o.orderNumber}
                        </Link>
                      </td>
                      <td className="px-2 py-2">
                        <Badge variant="outline">{o.status}</Badge>
                      </td>
                      <td className="px-2 py-2">{formatInr(o.total)}</td>
                      <td className="px-2 py-2 text-ink-muted">{new Date(o.placedAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
        <Card className="lg:col-span-2">
          <h2 className="font-semibold text-forest">Addresses</h2>
          {u.addresses.length === 0 ? (
            <p className="mt-2 text-body-sm text-ink-muted">No saved addresses.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {u.addresses.map((a) => (
                <li key={a.id} className="rounded border border-line p-3 text-body-sm">
                  <span className="font-semibold text-forest">{a.label || "Address"}</span>
                  <p className="mt-1 text-ink-muted">
                    {a.line1}
                    {a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.state} {a.pincode}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
      <Link href="/admin/users" className="text-body-sm text-gold-deep hover:underline">
        ← Users
      </Link>
    </div>
  );
}
