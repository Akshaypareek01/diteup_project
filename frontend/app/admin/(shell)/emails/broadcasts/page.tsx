import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { AdminBroadcastCreateForm } from "@/components/admin/AdminBroadcastCreateForm";
import { AdminBroadcastRowActions } from "@/components/admin/AdminBroadcastRowActions";
import { adminGet } from "@/lib/admin-json";

type BroadcastRow = {
  id: string;
  subject: string;
  status: string;
  createdAt: string;
};

type ListResponse = { total: number; page: number; pageSize: number; broadcasts: BroadcastRow[] };

/**
 * Broadcast drafts — create, preview, test, and send.
 */
export default async function AdminBroadcastsPage() {
  const { data, ok } = await adminGet<ListResponse>("/v1/admin/broadcasts?page=1&pageSize=30");
  const rows = data?.broadcasts ?? [];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-display-md font-semibold text-forest">Broadcasts</h1>
      <Card>
        <h2 className="font-semibold text-forest">New draft</h2>
        <div className="mt-4">
          <AdminBroadcastCreateForm />
        </div>
      </Card>
      <Card>
        <h2 className="font-semibold text-forest">Recent</h2>
        {!ok ? (
          <p className="mt-4 text-error">Could not load broadcasts.</p>
        ) : rows.length === 0 ? (
          <p className="mt-4 text-body-sm text-ink-muted">No broadcasts yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-line">
            {rows.map((b) => (
              <li key={b.id} className="py-4">
                <p className="font-medium text-forest">{b.subject}</p>
                <p className="font-mono text-xs text-ink-muted">
                  {b.status} · {b.id} · {new Date(b.createdAt).toLocaleString()}
                </p>
                <AdminBroadcastRowActions broadcastId={b.id} status={b.status} />
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Link href="/admin/emails" className="text-body-sm text-gold-deep hover:underline">
        ← Emails hub
      </Link>
    </div>
  );
}
