"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ApiError, clientApiJson } from "@/lib/client-api";

export type AdminProductDeleteButtonProps = {
  productId: string;
  productName: string;
  /** When already archived, the action is hidden. */
  visibility: string;
};

/**
 * Archives a product from the admin list — `POST /v1/admin/products/:id/archive`.
 */
export function AdminProductDeleteButton({
  productId,
  productName,
  visibility,
}: AdminProductDeleteButtonProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (visibility === "ARCHIVED") {
    return <span className="text-body-sm text-ink-muted">Archived</span>;
  }

  async function handleDelete() {
    const ok = window.confirm(
      `Delete "${productName}"?\n\nThe product will be archived and removed from the storefront. Order history is kept.`,
    );
    if (!ok) return;

    setErr(null);
    setBusy(true);
    try {
      await clientApiJson(`/v1/admin/products/${encodeURIComponent(productId)}/archive`, {
        method: "POST",
      });
      router.refresh();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Could not delete product.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="secondary"
        size="sm"
        type="button"
        disabled={busy}
        className="border-error/40 text-error hover:bg-error/5"
        aria-label={`Delete ${productName}`}
        onClick={() => void handleDelete()}
      >
        {busy ? "Deleting…" : "Delete"}
      </Button>
      {err ? (
        <p className="max-w-[12rem] text-right text-xs text-error" role="alert">
          {err}
        </p>
      ) : null}
    </div>
  );
}
