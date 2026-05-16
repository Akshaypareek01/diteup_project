import { notFound } from "next/navigation";
import { AdminSettingJsonEditor } from "@/components/admin/AdminSettingJsonEditor";
import Link from "next/link";
import { serverApiFetch } from "@/lib/server-api";
import { adminReadJson } from "@/lib/admin-json";

type Props = { params: { settingKey: string } };

/**
 * Edit a single settings row by key (`GET` + JSON editor + `PUT` upsert).
 */
export default async function AdminSettingKeyPage({ params }: Props) {
  const key = decodeURIComponent(params.settingKey);
  if (!key) notFound();

  const res = await serverApiFetch(`/v1/admin/settings/${encodeURIComponent(key)}`);
  if (res.status === 404) {
    return (
      <div className="space-y-4">
        <p className="text-body text-forest">
          No row for key <span className="font-mono">{key}</span>. You can create it by saving JSON below.
        </p>
        <AdminSettingJsonEditor settingKey={key} initialValue={{}} />
        <Link href="/admin/settings" className="text-body-sm text-gold-deep hover:underline">
          ← All settings
        </Link>
      </div>
    );
  }

  if (!res.ok) {
    return <p className="text-error">Could not load setting ({res.status}).</p>;
  }

  const data = await adminReadJson<{ key: string; value: unknown }>(res);
  if (!data) {
    return <p className="text-error">Invalid response.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-display-md font-semibold text-forest">Setting: {data.key}</h1>
        <p className="mt-1 text-body-sm text-ink-muted">Secrets may only decrypt when the API has encryption configured.</p>
      </div>
      <AdminSettingJsonEditor settingKey={data.key} initialValue={data.value} />
      <Link href="/admin/settings" className="text-body-sm text-gold-deep hover:underline">
        ← All settings
      </Link>
    </div>
  );
}
