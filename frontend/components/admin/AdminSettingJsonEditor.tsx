"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ApiError, clientApiJson } from "@/lib/client-api";

export type AdminSettingJsonEditorProps = {
  settingKey: string;
  initialValue: unknown;
};

/**
 * JSON textarea editor for one `Setting` key — `PUT /v1/admin/settings` upsert.
 */
export function AdminSettingJsonEditor({ settingKey, initialValue }: AdminSettingJsonEditorProps) {
  const router = useRouter();
  const [text, setText] = useState(() => JSON.stringify(initialValue ?? {}, null, 2));
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    setErr(null);
    let parsed: unknown;
    try {
      parsed = JSON.parse(text) as unknown;
    } catch {
      setErr("Invalid JSON.");
      return;
    }
    setSaving(true);
    try {
      await clientApiJson("/v1/admin/settings", {
        method: "PUT",
        json: { key: settingKey, value: parsed },
      });
      router.refresh();
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Save failed.";
      setErr(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-lg border border-line bg-paper p-4">
      <h3 className="font-mono text-sm font-semibold text-forest">{settingKey}</h3>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="mt-3 min-h-[180px] w-full rounded-sm border border-line bg-cream p-3 font-mono text-xs text-forest"
        spellCheck={false}
        aria-label={`JSON value for ${settingKey}`}
      />
      {err ? (
        <p className="mt-2 text-body-sm text-error" role="alert">
          {err}
        </p>
      ) : null}
      <Button type="button" variant="primaryForest" size="sm" className="mt-3" disabled={saving} onClick={() => void save()}>
        {saving ? "Saving…" : "Save"}
      </Button>
    </div>
  );
}
