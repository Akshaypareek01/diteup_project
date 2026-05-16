import Link from "next/link";
import { adminGet } from "@/lib/admin-json";

type AuditEntry = {
  id: string;
  actorId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  createdAt: string;
};

type ListResponse = { total: number; page: number; pageSize: number; entries: AuditEntry[] };

/**
 * Audit trail — `GET /v1/admin/audit-log`.
 */
export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const pageRaw = searchParams.page;
  const page = Math.max(1, Number(typeof pageRaw === "string" ? pageRaw : "1") || 1);
  const qs = new URLSearchParams({ page: String(page), pageSize: "40" });

  const { data, ok } = await adminGet<ListResponse>(`/v1/admin/audit-log?${qs.toString()}`);
  const rows = data?.entries ?? [];
  const total = data?.total ?? 0;
  const pageSize = data?.pageSize ?? 40;
  const hasNext = page * pageSize < total;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-display-md font-semibold text-forest">Audit log</h1>
      {!ok ? (
        <p className="text-error">Could not load audit log.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-line bg-paper">
          <table className="min-w-full text-left text-body-sm">
            <thead className="bg-beige/80 font-mono text-eyebrow text-ink-muted">
              <tr>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Entity</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr className="border-t border-line">
                  <td colSpan={4} className="px-4 py-8 text-center text-ink-muted">
                    No entries yet.
                  </td>
                </tr>
              ) : (
                rows.map((e) => (
                  <tr key={e.id} className="border-t border-line">
                    <td className="px-4 py-3 whitespace-nowrap text-ink-muted">
                      {new Date(e.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{e.actorId ?? "—"}</td>
                    <td className="px-4 py-3 font-mono text-xs">{e.action}</td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs">{e.entity}</span>
                      {e.entityId ? (
                        <span className="ml-1 text-ink-muted">
                          ·{" "}
                          <span className="break-all" title={e.entityId}>
                            {e.entityId.slice(0, 12)}…
                          </span>
                        </span>
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      <div className="flex flex-wrap gap-3 text-body-sm">
        {page > 1 ? (
          <Link href={`/admin/audit?page=${page - 1}`} className="text-gold-deep underline">
            ← Previous
          </Link>
        ) : null}
        {hasNext ? (
          <Link href={`/admin/audit?page=${page + 1}`} className="text-gold-deep underline">
            Next →
          </Link>
        ) : null}
        <span className="text-ink-muted">
          Page {page}
          {ok ? ` · ${total} total` : ""}
        </span>
      </div>
    </div>
  );
}
