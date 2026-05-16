"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ApiError, clientApiJson } from "@/lib/client-api";

type PresignResponse = {
  uploadUrl: string;
  publicUrl: string;
  key: string;
};

type AvatarUploaderProps = {
  currentUrl?: string | null;
};

/**
 * Client-side JPEG/PNG/WebP picker → presigned PUT → `POST /v1/me/avatar/confirm`.
 */
export function AvatarUploader({ currentUrl }: AvatarUploaderProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const ct = file.type as "image/jpeg" | "image/png" | "image/webp";
    if (!["image/jpeg", "image/png", "image/webp"].includes(ct)) {
      setErr("Use JPEG, PNG, or WebP.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErr("Max upload size is 10MB.");
      return;
    }
    setErr(null);
    setOk(false);
    setBusy(true);
    try {
      const presigned = await clientApiJson<PresignResponse>(`/v1/me/avatar`, {
        method: "POST",
        json: { contentType: ct, sizeBytes: file.size },
      });

      const put = await fetch(presigned.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": ct },
        body: file,
      });
      if (!put.ok) {
        throw new Error("Upload failed — check storage credentials.");
      }

      await clientApiJson(`/v1/me/avatar/confirm`, {
        method: "POST",
        json: {
          publicUrl: presigned.publicUrl,
          key: presigned.key,
        },
      });
      setOk(true);
      router.refresh();
    } catch (error) {
      if (error instanceof ApiError && error.status === 503) {
        setErr("Avatar uploads are not configured on the API (enable R2 / storage).");
      } else {
        setErr(error instanceof Error ? error.message : "Upload failed.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-8 rounded-lg border border-line bg-paper p-6">
      <h2 className="font-semibold text-forest">Profile photo</h2>
      <div className="mt-4 flex flex-wrap items-center gap-6">
        {currentUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={currentUrl} alt="" width={96} height={96} className="size-24 rounded-full border border-line object-cover" />
        ) : (
          <div className="flex size-24 items-center justify-center rounded-full bg-beige font-display text-xl text-forest">
            —
          </div>
        )}
        <div>
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" aria-hidden onChange={(ev) => void onPick(ev)} />
          <Button type="button" variant="secondary" size="sm" disabled={busy} onClick={() => inputRef.current?.click()}>
            {busy ? "Uploading…" : "Upload new photo"}
          </Button>
          {err ? (
            <p className="mt-2 max-w-xs text-body-sm text-error" role="alert">
              {err}
            </p>
          ) : null}
          {ok ? (
            <p className="mt-2 text-body-sm text-success" role="status">
              Photo updated.
            </p>
          ) : (
            <p className="mt-2 max-w-xs text-body-sm text-ink-muted">Square photos look best · max 10MB · WebP/JPEG/PNG.</p>
          )}
        </div>
      </div>
    </div>
  );
}
