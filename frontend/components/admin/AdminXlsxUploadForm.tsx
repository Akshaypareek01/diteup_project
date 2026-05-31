"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { pickApiMessage } from "@/lib/client-api";

export type AdminXlsxUploadFormProps = {
  uploadPath: string;
  label: string;
  hint?: string;
};

/**
 * Uploads a raw XLSX file to an admin import endpoint (same-origin `/v1` proxy).
 */
export function AdminXlsxUploadForm({ uploadPath, label, hint }: AdminXlsxUploadFormProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const file = inputRef.current?.files?.[0];
    if (!file) {
      setErr("Choose an .xlsx file first.");
      return;
    }
    setErr(null);
    setResult(null);
    setBusy(true);
    try {
      const buf = await file.arrayBuffer();
      const url = uploadPath.startsWith("/v1/") ? uploadPath : `/v1${uploadPath.startsWith("/") ? uploadPath : `/${uploadPath}`}`;
      const res = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
        body: buf,
      });
      const text = await res.text();
      let parsed: unknown = null;
      try {
        parsed = JSON.parse(text) as unknown;
      } catch {
        parsed = { raw: text };
      }
      if (!res.ok) {
        setErr(pickApiMessage(parsed, `Upload failed (${res.status})`));
        return;
      }
      setResult(typeof text === "string" && text ? text : "Import completed.");
      if (inputRef.current) inputRef.current.value = "";
      router.refresh();
    } catch {
      setErr("Network error during upload.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="space-y-3">
      <label className="block text-body-sm font-semibold text-forest" htmlFor={`xlsx-${label}`}>
        {label}
      </label>
      {hint ? <p className="text-body-sm text-ink-muted">{hint}</p> : null}
      <input
        ref={inputRef}
        id={`xlsx-${label}`}
        type="file"
        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        className="block w-full text-body-sm"
        aria-label={label}
      />
      <Button variant="secondary" size="md" type="submit" disabled={busy}>
        {busy ? "Uploading…" : "Upload"}
      </Button>
      {result ? <pre className="max-h-32 overflow-auto rounded border border-line bg-cream p-2 text-xs">{result}</pre> : null}
      {err ? <p className="text-body-sm text-error">{err}</p> : null}
    </form>
  );
}
