import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { adminGet } from "@/lib/admin-json";

type UserRow = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  role: string;
  isActive: boolean;
  emailVerified: boolean;
  tags: string[];
  createdAt: string;
};

type ListResponse = { total: number; page: number; pageSize: number; users: UserRow[] };

/**
 * Paginated directory — `GET /v1/admin/users`.
 */
export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const qRaw = searchParams.q;
  const q = typeof qRaw === "string" ? qRaw : undefined;
  const pageRaw = searchParams.page;
  const page = Math.max(1, Number(typeof pageRaw === "string" ? pageRaw : "1") || 1);

  const qs = new URLSearchParams({ page: String(page), pageSize: "25" });
  if (q?.trim()) qs.set("q", q.trim());

  const { data, ok } = await adminGet<ListResponse>(`/v1/admin/users?${qs.toString()}`);
  const total = data?.total ?? 0;
  const pageSize = data?.pageSize ?? 25;
  const users = data?.users ?? [];
  const hasNext = page * pageSize < total;
  const hasPrev = page > 1;

  const navQs = (p: number) => {
    const n = new URLSearchParams(qs);
    n.set("page", String(p));
    return `/admin/users?${n.toString()}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-display-md font-semibold text-forest">Users</h1>
          <p className="mt-1 text-body text-ink-soft">Search and manage accounts — PRD §7.5.</p>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <form method="get" className="flex flex-wrap items-end gap-2" role="search" aria-label="Search users">
            <input type="hidden" name="page" value="1" />
            <label className="sr-only" htmlFor="user-q">
              Search
            </label>
            <input
              id="user-q"
              name="q"
              defaultValue={q ?? ""}
              placeholder="Email, name, id…"
              className="h-11 min-w-[220px] rounded-lg border border-line bg-paper px-3 text-body-sm"
            />
            <button
              type="submit"
              className="h-11 rounded-lg bg-forest px-4 font-sans text-button font-semibold uppercase tracking-wide text-cream"
            >
              Search
            </button>
          </form>
          <a
            href={q?.trim() ? `/v1/admin/users/export?q=${encodeURIComponent(q.trim())}` : "/v1/admin/users/export"}
            className="inline-flex h-11 items-center justify-center rounded-lg border border-forest bg-transparent px-4 font-sans text-button font-semibold uppercase tracking-wide text-forest"
            target="_blank"
            rel="noreferrer"
          >
            Export XLSX
          </a>
        </div>
      </div>
      {!ok ? (
        <p className="text-error">Could not load users.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-line bg-paper">
          <table className="min-w-full text-left text-body-sm">
            <thead className="bg-beige/80 font-mono text-eyebrow text-ink-muted">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Tags</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr className="border-t border-line">
                  <td colSpan={6} className="px-4 py-8 text-center text-ink-muted">
                    No users match this query.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="border-t border-line">
                    <td className="px-4 py-3">
                      <Link href={`/admin/users/${u.id}`} className="font-semibold text-gold-deep hover:underline">
                        {u.name || "—"}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{u.email}</td>
                    <td className="px-4 py-3 font-mono text-xs">{u.role}</td>
                    <td className="px-4 py-3 text-ink-muted">{u.tags?.length ? u.tags.join(", ") : "—"}</td>
                    <td className="px-4 py-3">
                      {u.isActive ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="warning">Inactive</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-ink-muted">{new Date(u.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      <div className="flex flex-wrap gap-3 text-body-sm">
        {hasPrev ? (
          <Link href={navQs(page - 1)} className="text-gold-deep underline">
            ← Previous
          </Link>
        ) : null}
        {hasNext ? (
          <Link href={navQs(page + 1)} className="text-gold-deep underline">
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
