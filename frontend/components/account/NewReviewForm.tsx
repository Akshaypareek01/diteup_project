"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Toggle } from "@/components/ui/Toggle";
import { ApiError, clientApiJson } from "@/lib/client-api";
import {
  MAX_REVIEW_IMAGES,
  presignAndUploadReviewImages,
  validateReviewImageFiles,
} from "@/lib/review-image-upload";

export type NewReviewFormProps = {
  orderId: string;
  productId: string;
  productLabel: string;
};

type CreateReviewResponse = {
  review: {
    id: string;
    productId: string;
    orderId: string;
    rating: number;
    title: string | null;
    body: string;
    authorName: string;
    isApproved: boolean;
    isVerified: boolean;
    images: unknown;
    createdAt: string;
  };
};

const REVIEW_ACCEPT = "image/jpeg,image/png,image/webp,image/heic,image/heif";

/**
 * Verified-buyer review — `POST /v1/reviews`, optional photos via presigned PUT (`POST /v1/reviews/images/upload-url` + `PUT /v1/reviews/:id`).
 */
export function NewReviewForm({ orderId, productId, productLabel }: NewReviewFormProps) {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [previews, setPreviews] = useState<{ name: string; url: string }[]>([]);

  useEffect(() => {
    const next = files.map((f) => ({ name: f.name, url: URL.createObjectURL(f) }));
    setPreviews(next);
    return () => {
      next.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [files]);

  function onPickFiles(ev: React.ChangeEvent<HTMLInputElement>) {
    const picked = ev.target.files ? Array.from(ev.target.files) : [];
    setFiles(picked.slice(0, MAX_REVIEW_IMAGES));
    ev.target.value = "";
  }

  function removeFileAt(idx: number) {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const trimmed = body.trim();
    const fileErr = validateReviewImageFiles(files);
    if (fileErr) {
      setErr(fileErr);
      return;
    }
    setBusy(true);
    try {
      if (files.length === 0) {
        await clientApiJson("/v1/reviews", {
          method: "POST",
          json: {
            orderId,
            productId,
            rating,
            title: title.trim() || null,
            body: trimmed,
            displayName: displayName.trim() || null,
            anonymous,
          },
        });
      } else {
        const payload: Record<string, unknown> = {
          orderId,
          productId,
          rating,
          title: title.trim() || null,
          body: trimmed,
          displayName: displayName.trim() || null,
          anonymous,
        };
        if (files.length > 0) {
          payload.images = [];
        }
        const created = await clientApiJson<CreateReviewResponse>("/v1/reviews", {
          method: "POST",
          json: payload,
        });
        const reviewId = created.review.id;
        try {
          const urls = await presignAndUploadReviewImages(reviewId, files);
          await clientApiJson(`/v1/reviews/${reviewId}`, {
            method: "PUT",
            json: { images: urls.map((url) => ({ url })) },
          });
        } catch (uploadErr) {
          console.error(uploadErr);
          setErr(
            "Review was saved without photos — storage may be unavailable, or uploads failed. You can try editing your review within seven days.",
          );
          setFiles([]);
          return;
        }
      }
      router.push("/account");
      router.refresh();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Could not submit review.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="mt-8 max-w-lg space-y-4" onSubmit={submit} aria-label="Write product review">
      <p className="text-body-sm text-ink-muted">
        Product: <span className="font-semibold text-forest">{productLabel}</span>
      </p>
      <div>
        <label className="mb-1.5 block font-mono text-eyebrow font-semibold uppercase text-ink-muted" htmlFor="rating">
          Rating
        </label>
        <select
          id="rating"
          name="rating"
          value={rating}
          onChange={(ev) => setRating(Number(ev.target.value))}
          className="h-12 w-full rounded-lg border border-line bg-paper px-3 text-body outline-none focus:border-forest"
          aria-label="Star rating"
        >
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n} stars
            </option>
          ))}
        </select>
      </div>
      <Input label="Title (optional)" name="title" value={title} onChange={(ev) => setTitle(ev.target.value)} />
      <div>
        <label className="mb-1.5 block font-mono text-eyebrow font-semibold uppercase text-ink-muted" htmlFor="review-body">
          Review (min 20 characters)
        </label>
        <textarea
          id="review-body"
          name="body"
          required
          minLength={20}
          maxLength={2000}
          value={body}
          onChange={(ev) => setBody(ev.target.value)}
          className="min-h-[140px] w-full rounded-lg border border-line bg-paper p-3 text-body outline-none focus:border-forest"
          aria-required="true"
        />
      </div>
      <div>
        <label
          className="mb-1.5 block font-mono text-eyebrow font-semibold uppercase text-ink-muted"
          htmlFor="review-photos"
        >
          Photos (optional, max {MAX_REVIEW_IMAGES})
        </label>
        <input
          id="review-photos"
          type="file"
          accept={REVIEW_ACCEPT}
          multiple
          className="block w-full cursor-pointer text-body-sm text-ink-muted file:mr-3 file:cursor-pointer file:rounded-md file:border file:border-line file:bg-paper file:px-3 file:py-2 file:font-semibold file:text-gold-deep"
          aria-describedby="review-photos-hint"
          onChange={onPickFiles}
        />
        <p id="review-photos-hint" className="mt-1.5 text-body-sm text-ink-muted">
          JPEG, PNG, WebP or HEIC, up to 5MB each.
        </p>
        {files.length > 0 ? (
          <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3" aria-label="Selected review photos">
            {previews.map((p, i) => (
              <li key={`${p.name}-${i}`} className="relative overflow-hidden rounded-lg border border-line bg-parchment">
                {/* eslint-disable-next-line @next/next/no-img-element -- local blob previews */}
                <img src={p.url} alt={`Selected photo ${p.name}`} className="h-24 w-full object-cover" />
                <button
                  type="button"
                  className="absolute right-1 top-1 rounded bg-paper/90 px-2 py-0.5 text-eyebrow font-semibold text-error shadow-sm"
                  onClick={() => removeFileAt(i)}
                  aria-label={`Remove photo ${p.name}`}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <Input
        label="Display name (optional if not anonymous)"
        name="displayName"
        value={displayName}
        onChange={(ev) => setDisplayName(ev.target.value)}
      />
      <Toggle label="Post as Anonymous" checked={anonymous} onCheckedChange={setAnonymous} />
      {err ? (
        <p className="text-body-sm text-error" role="alert">
          {err}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <Button type="submit" variant="primaryGold" size="md" disabled={busy}>
          {busy ? "Submitting…" : "Submit review"}
        </Button>
        <Link href="/account/orders" className="inline-flex h-11 items-center text-body-sm text-gold-deep underline">
          Cancel
        </Link>
      </div>
    </form>
  );
}
