import { notFound } from "next/navigation";
import Link from "next/link";
import { AdminSettingJsonEditor } from "@/components/admin/AdminSettingJsonEditor";
import { settingsSections } from "@/lib/admin-nav";
import { adminReadJson } from "@/lib/admin-json";
import { SETTINGS_SECTION_KEYS } from "@/lib/settings-section-keys";
import { serverApiFetch } from "@/lib/server-api";
import { Card } from "@/components/ui/Card";

type Props = { params: { section: string } };

/**
 * Grouped settings editor — loads known keys per section; empty sections link to the index.
 */
export default async function AdminSettingsSectionPage({ params }: Props) {
  const meta = settingsSections.find((s) => s.slug === params.section);
  if (!meta) notFound();

  const keys = SETTINGS_SECTION_KEYS[params.section] ?? [];

  if (keys.length === 0) {
    return (
      <Card>
        <h2 className="font-display text-xl font-semibold text-forest">{meta.label}</h2>
        <p className="mt-1 text-body-sm text-ink-muted">{meta.blurb}</p>
        <p className="mt-4 text-body text-ink-soft">
          No mapped API keys for this section yet. Use the{" "}
          <Link href="/admin/settings" className="text-gold-deep underline">
            settings index
          </Link>{" "}
          to edit keys directly.
        </p>
      </Card>
    );
  }

  const entries = await Promise.all(
    keys.map(async (key) => {
      const res = await serverApiFetch(`/v1/admin/settings/${encodeURIComponent(key)}`);
      if (res.status === 404) {
        return { key, value: {} as unknown };
      }
      const data = await adminReadJson<{ key: string; value: unknown }>(res);
      return { key, value: data?.value ?? {} };
    }),
  );

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="font-display text-xl font-semibold text-forest">{meta.label}</h2>
        <p className="mt-1 text-body-sm text-ink-muted">{meta.blurb}</p>
      </Card>

      <div className="space-y-6">
        {entries.map((e) => (
          <AdminSettingJsonEditor key={e.key} settingKey={e.key} initialValue={e.value} />
        ))}
      </div>

      <Link href="/admin/settings" className="text-body-sm text-gold-deep hover:underline">
        ← Settings index
      </Link>
    </div>
  );
}
