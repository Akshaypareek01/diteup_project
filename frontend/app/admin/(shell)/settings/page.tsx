import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { adminGet } from "@/lib/admin-json";
import { settingsSections } from "@/lib/admin-nav";

type SettingsListResponse = {
  settings: Array<{ key: string; value: unknown; updatedAt: string }>;
};

/**
 * Lists every `Setting` key from the API + quick links to section groupings.
 */
export default async function AdminSettingsIndexPage() {
  const { data, ok } = await adminGet<SettingsListResponse>("/v1/admin/settings");
  const rows = data?.settings ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-display-md font-semibold text-forest">Settings</h1>
        <p className="mt-1 text-body text-ink-soft">All keys from `GET /v1/admin/settings` (secrets redacted in list).</p>
      </div>

      <div>
        <h2 className="font-mono text-eyebrow text-ink-muted">By section</h2>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
          {settingsSections.map((s) => (
            <li key={s.slug}>
              <Link href={`/admin/settings/${s.slug}`}>
                <Card className="transition hover:shadow-md">
                  <h3 className="font-semibold text-forest">{s.label}</h3>
                  <p className="mt-2 text-body-sm text-ink-muted">{s.blurb}</p>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {!ok ? (
        <p className="text-body-sm text-error" role="alert">
          Could not load settings.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-line bg-paper">
          <table className="min-w-full text-left text-body-sm">
            <thead className="bg-beige/80 font-mono text-eyebrow text-ink-muted">
              <tr>
                <th className="px-4 py-3">Key</th>
                <th className="px-4 py-3">Value (preview)</th>
                <th className="px-4 py-3">Updated</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.key} className="border-t border-line">
                  <td className="px-4 py-3 font-mono text-xs">
                    <Link
                      href={`/admin/settings/key/${encodeURIComponent(r.key)}`}
                      className="text-gold-deep hover:underline"
                    >
                      {r.key}
                    </Link>
                  </td>
                  <td className="max-w-md truncate px-4 py-3 text-ink-muted">
                    {typeof r.value === "object" ? JSON.stringify(r.value) : String(r.value)}
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{new Date(r.updatedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
