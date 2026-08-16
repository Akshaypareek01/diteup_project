"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ApiError, clientApiJson } from "@/lib/client-api";
import {
  MAX_PRODUCT_IMAGES,
  presignAndUploadProductImage,
  validateProductImageFiles,
} from "@/lib/product-image-upload";

type MediaRecord = Record<string, unknown>;

export type ProductMediaManagerProps = {
  productId: string;
  media: MediaRecord[];
};

/**
 * Reads a displayable string from an admin product JSON field.
 */
function str(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return String(v);
}

/**
 * Counts IMAGE rows already stored for this product.
 */
function imageCount(media: MediaRecord[]): number {
  return media.filter((m) => str(m.type).toUpperCase() !== "VIDEO").length;
}

/**
 * Next `order` value so newly added rows sort after existing media.
 */
function nextMediaOrder(media: MediaRecord[]): number {
  return media.reduce((max, m) => Math.max(max, Number(m.order) || 0), -1) + 1;
}

/**
 * Admin product media tab — R2 file upload, preview/delete, URL paste fallback.
 */
export function ProductMediaManager({ productId, media }: ProductMediaManagerProps) {
  const remaining = Math.max(0, MAX_PRODUCT_IMAGES - imageCount(media));

  return (
    <div className="mt-6 space-y-6">
      <p className="text-body-sm text-ink-muted">
        Gallery images (max {MAX_PRODUCT_IMAGES}). First image is the PDP hero and cart thumbnail.
        {remaining === 0 ? " Limit reached." : ` ${remaining} slot${remaining === 1 ? "" : "s"} left.`}
      </p>
      <MediaPreviewList media={media} />
      <MediaFileUpload productId={productId} media={media} remaining={remaining} />
      <MediaUrlAddForm productId={productId} remaining={remaining} />
    </div>
  );
}

type MediaPreviewListProps = {
  media: MediaRecord[];
};

/**
 * Thumbnail grid with delete for each ProductMedia row.
 */
function MediaPreviewList({ media }: MediaPreviewListProps) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  if (media.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-line bg-cream px-4 py-8 text-center text-body-sm text-ink-muted">
        No images yet. Upload PNGs below or paste a URL.
      </p>
    );
  }

  async function remove(mediaId: string) {
    setMsg(null);
    setBusyId(mediaId);
    try {
      await clientApiJson(`/v1/admin/products/media/${encodeURIComponent(mediaId)}`, {
        method: "DELETE",
      });
      router.refresh();
    } catch (e) {
      setMsg(e instanceof ApiError ? e.message : "Delete failed.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {media.map((m, index) => {
          const id = str(m.id);
          const url = str(m.url);
          const type = str(m.type) || "IMAGE";
          const isVideo = type.toUpperCase() === "VIDEO";
          const alt = str(m.altText) || `Media ${index + 1}`;
          return (
            <li key={id || url} className="overflow-hidden rounded-lg border border-line bg-cream">
              <div className="relative aspect-square bg-paper">
                {isVideo ? (
                  <p className="flex h-full items-center justify-center px-2 text-center text-body-sm text-ink-muted">
                    Video
                  </p>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={url} alt={alt} className="h-full w-full object-contain p-2" />
                )}
                {index === 0 && !isVideo ? (
                  <span className="absolute left-2 top-2 rounded-md bg-forest px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cream">
                    Hero
                  </span>
                ) : null}
              </div>
              <div className="space-y-1 border-t border-line px-2 py-2">
                <p className="truncate font-mono text-[11px] text-ink-muted">
                  {type} · order {str(m.order) || "0"}
                </p>
                <p className="truncate text-body-sm text-ink" title={url}>
                  {alt}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-full text-error"
                  disabled={!id || busyId === id}
                  onClick={() => void remove(id)}
                  aria-label={`Delete ${alt}`}
                >
                  {busyId === id ? "Deleting…" : "Delete"}
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
      {msg ? (
        <p className="mt-2 text-body-sm text-error" role="alert">
          {msg}
        </p>
      ) : null}
    </div>
  );
}

type MediaFileUploadProps = {
  productId: string;
  media: MediaRecord[];
  remaining: number;
};

/**
 * Multi-file PNG/JPEG/WebP picker → R2 presign PUT → ProductMedia row.
 */
function MediaFileUpload({ productId, media, remaining }: MediaFileUploadProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;

    const validation = validateProductImageFiles(files, imageCount(media));
    if (validation) {
      setMsg(validation);
      return;
    }

    setMsg(null);
    setBusy(true);
    const startOrder = nextMediaOrder(media);
    let uploaded = 0;
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setProgress(`Uploading ${i + 1}/${files.length}…`);
        const publicUrl = await presignAndUploadProductImage(productId, file);
        await clientApiJson(`/v1/admin/products/${encodeURIComponent(productId)}/media`, {
          method: "POST",
          json: {
            type: "IMAGE",
            url: publicUrl,
            altText: file.name.replace(/\.[^.]+$/, "") || null,
            order: startOrder + i,
          },
        });
        uploaded += 1;
      }
      setProgress(null);
      router.refresh();
    } catch (err) {
      setProgress(null);
      if (uploaded > 0) router.refresh();
      if (err instanceof ApiError && err.status === 503) {
        setMsg("File uploads are not configured on the API (enable R2 / storage). Paste a URL below.");
      } else {
        setMsg(err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Upload failed.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-lg border border-dashed border-line p-4">
      <h3 className="font-semibold text-forest">Upload images</h3>
      <p className="mt-1 text-body-sm text-ink-muted">JPEG, PNG, or WebP. Up to 8MB each.</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple
        className="sr-only"
        disabled={busy || remaining === 0}
        onChange={(e) => void onPick(e)}
        aria-label="Upload product images"
      />
      <Button
        type="button"
        className="mt-3"
        variant="primaryForest"
        size="sm"
        disabled={busy || remaining === 0}
        onClick={() => inputRef.current?.click()}
      >
        {busy ? progress ?? "Uploading…" : "Choose files"}
      </Button>
      {msg ? (
        <p className="mt-2 text-body-sm text-error" role="alert">
          {msg}
        </p>
      ) : null}
    </div>
  );
}

type MediaUrlAddFormProps = {
  productId: string;
  remaining: number;
};

/**
 * URL-paste fallback when R2 is unavailable or the image is already hosted.
 */
function MediaUrlAddForm({ productId, remaining }: MediaUrlAddFormProps) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [altText, setAltText] = useState("");
  const [order, setOrder] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function add() {
    setMsg(null);
    setBusy(true);
    try {
      await clientApiJson(`/v1/admin/products/${encodeURIComponent(productId)}/media`, {
        method: "POST",
        json: {
          type: "IMAGE",
          url: url.trim(),
          altText: altText.trim() || null,
          order: order.trim() === "" ? undefined : Number(order),
        },
      });
      setUrl("");
      setAltText("");
      setOrder("");
      router.refresh();
    } catch (e) {
      setMsg(e instanceof ApiError ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-lg border border-dashed border-line p-4">
      <h3 className="font-semibold text-forest">Add media (image URL)</h3>
      <p className="mt-1 text-body-sm text-ink-muted">Use when files are hosted elsewhere, or if uploads are unavailable.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Input className="sm:col-span-2" label="URL" value={url} onChange={(e) => setUrl(e.target.value)} />
        <Input label="Alt text" value={altText} onChange={(e) => setAltText(e.target.value)} />
        <Input label="Order" value={order} onChange={(e) => setOrder(e.target.value)} placeholder="auto" />
      </div>
      {msg ? (
        <p className="mt-2 text-body-sm text-error" role="alert">
          {msg}
        </p>
      ) : null}
      <Button
        type="button"
        className="mt-3"
        variant="secondary"
        size="sm"
        disabled={busy || remaining === 0 || !url.trim()}
        onClick={() => void add()}
      >
        {busy ? "Adding…" : "Add media"}
      </Button>
    </div>
  );
}
