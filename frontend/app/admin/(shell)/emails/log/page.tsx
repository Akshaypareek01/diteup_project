import Link from "next/link";
import { adminGet } from "@/lib/admin-json";

type LogRow = {
  id: string;
  to: string;
  template: string;
  status: string;
  sentAt: string;
  error: string | null;
};

type ListResponse = { total: number; page: number; pageSize: number; logs: LogRow[] };

/**
 * Delivery log — `GET /v1/admin/email-logs`.
 */
export default async function AdminEmailLogPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const toRaw = typeof searchParams.to === "string" ? searchParams.to : "";
  const pageRaw = searchParams.page;
  const page = Math.max(1, Number(typeof pageRaw === "string" ? pageRaw : "1") || 1);

  const qs = new URLSearchParams({ page: String(page), pageSize: "40" });
  if (toRaw.trim()) qs.set("to", toRaw.trim());

  const { data, ok } = await adminGet<ListResponse>(`/v1/admin/email-logs?${qs.toString()}`);
  const rows = data?.logs ?? [];
  const total = data?.total ?? 0;
  const pageSize = data?.pageSize ?? 40;
  const hasNext = page * pageSize < total;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-display-md font-semibold text-forest">Email log</h1>
      <form method="get" className="flex flex-wrap items-end gap-2" role="search" aria-label="Filter email log">
        <input type="hidden" name="page" value="1" />
        <label className="sr-only" htmlFor="email-to">
          Recipient contains
        </label>
        <input
          id="email-to"
          name="to"
          defaultValue={toRaw}
          placeholder="Recipient contains…"
          className="h-11 min-w-[240px] rounded-lg border border-line bg-paper px-3 text-body-sm"
        />
        <button
          type="submit"
          className="h-11 rounded-lg bg-forest px-4 font-sans text-button font-semibold uppercase tracking-wide text-cream"
        >
          Filter
        </button>
      </form>
      {!ok ? (
        <p className="text-error">Could not load email log.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-line bg-paper">
          <table className="min-w-full text-left text-body-sm">
            <thead className="bg-beige/80 font-mono text-eyebrow text-ink-muted">
              <tr>
                <th className="px-4 py-3">Sent</th>
                <th className="px-4 py-3">To</th>
                <th className="px-4 py-3">Template</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Error</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr className="border-t border-line">
                  <td colSpan={5} className="px-4 py-8 text-center text-ink-muted">
                    No log rows.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="border-t border-line">
                    <td className="px-4 py-3 whitespace-nowrap text-ink-muted">
                      {new Date(r.sentAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">{r.to}</td>
                    <td className="px-4 py-3 font-mono text-xs">{r.template}</td>
                    <td className="px-4 py-3 font-mono text-xs">{r.status}</td>
                    <td className="max-w-xs px-4 py-3 text-xs text-error">{r.error ?? "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      <div className="flex flex-wrap gap-3 text-body-sm">
        {page > 1 ? (
          <Link
            href={`/admin/emails/log?${new URLSearchParams({ page: String(page - 1), pageSize: String(pageSize), ...(toRaw.trim() ? { to: toRaw.trim() } : {}) }).toString()}`}
            className="text-gold-deep underline"
          >
            ← Previous
          </Link>
        ) : null}
        {hasNext ? (
          <Link
            href={`/admin/emails/log?${new URLSearchParams({ page: String(page + 1), pageSize: String(pageSize), ...(toRaw.trim() ? { to: toRaw.trim() } : {}) }).toString()}`}
            className="text-gold-deep underline"
          >
            Next →
          </Link>
        ) : null}
        <span className="text-ink-muted">
          Page {page}
          {ok ? ` · ${total} total` : ""}
        </span>
      </div>
      <Link href="/admin/emails" className="text-body-sm text-gold-deep hover:underline">
        ← Emails hub
      </Link>
    </div>
  );
}
