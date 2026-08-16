"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/ToastProvider";
import { ApiError, clientApiJson } from "@/lib/client-api";
import { presignAndUploadBannerImage, validateBannerImageFile } from "@/lib/banner-image-upload";
import {
  DESKTOP_BANNER_SPEC,
  MAX_HOMEPAGE_BANNERS,
  MOBILE_BANNER_SPEC,
} from "@/lib/homepage-banner-specs";
import type { HomepageBannerSlide } from "@/lib/types/homepage-banners";

export type AdminHomepageBannersPanelProps = {
  initialValue: unknown;
};

/**
 * Parses stored setting JSON into editable slide rows.
 */
function parseSlides(value: unknown): HomepageBannerSlide[] {
  if (!value || typeof value !== "object") return [];
  const slides = (value as { slides?: unknown }).slides;
  if (!Array.isArray(slides)) return [];
  return slides
    .filter((s): s is Record<string, unknown> => Boolean(s && typeof s === "object"))
    .map((s, i) => ({
      id: typeof s.id === "string" && s.id ? s.id : `slide-${i}`,
      desktopUrl: typeof s.desktopUrl === "string" ? s.desktopUrl : "",
      mobileUrl: typeof s.mobileUrl === "string" ? s.mobileUrl : "",
      href: typeof s.href === "string" ? s.href : "",
      alt: typeof s.alt === "string" ? s.alt : "",
      order: Number.isFinite(Number(s.order)) ? Number(s.order) : i,
    }))
    .sort((a, b) => a.order - b.order);
}

/**
 * Admin homepage hero — desktop + mobile artwork, click-through link, exact pixel specs.
 */
export function AdminHomepageBannersPanel({ initialValue }: AdminHomepageBannersPanelProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [slides, setSlides] = useState<HomepageBannerSlide[]>(() => parseSlides(initialValue));
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function updateSlide(id: string, patch: Partial<HomepageBannerSlide>) {
    setSlides((current) => current.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  function addSlide() {
    if (slides.length >= MAX_HOMEPAGE_BANNERS) return;
    setSlides((current) => [
      ...current,
      {
        id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `slide-${Date.now()}`,
        desktopUrl: "",
        mobileUrl: "",
        href: "/product/energy-bite-750g",
        alt: "",
        order: current.length,
      },
    ]);
  }

  function removeSlide(id: string) {
    setSlides((current) => current.filter((s) => s.id !== id).map((s, i) => ({ ...s, order: i })));
  }

  async function save() {
    setErr(null);
    const prepared = slides.map((s, i) => ({
      ...s,
      desktopUrl: s.desktopUrl.trim(),
      mobileUrl: s.mobileUrl.trim(),
      href: s.href.trim(),
      alt: s.alt.trim(),
      order: i,
    }));
    const incomplete = prepared.find((s) => !s.desktopUrl || !s.mobileUrl || !s.href);
    if (incomplete) {
      const msg = "Each banner needs a desktop image, mobile image, and link.";
      setErr(msg);
      showToast(msg, "error");
      return;
    }
    setSaving(true);
    try {
      await clientApiJson("/v1/admin/settings", {
        method: "PUT",
        json: { key: "homepageBanners", value: { slides: prepared } },
      });
      showToast("Homepage banners saved.");
      router.refresh();
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Save failed.";
      setErr(msg);
      showToast(msg, "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-line bg-cream p-4 text-body-sm text-ink">
        <p className="font-semibold text-forest">Exact upload sizes</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            <span className="font-medium">Desktop:</span> {DESKTOP_BANNER_SPEC}. Export WebP or PNG. Artwork fills
            the full-bleed hero (`object-cover`).
          </li>
          <li>
            <span className="font-medium">Mobile:</span> {MOBILE_BANNER_SPEC}. Separate portrait crop — do not reuse
            the desktop file.
          </li>
        </ul>
        <p className="mt-2 text-ink-muted">
          Click-through link is the whole banner. Use a path like{" "}
          <code className="rounded bg-paper px-1">/product/energy-bite-750g</code> or a full URL.
        </p>
      </div>

      {slides.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line bg-paper px-4 py-8 text-center text-body-sm text-ink-muted">
          No banners yet. Add a slide, upload desktop + mobile artwork, set the link, then save. Until then the site
          uses the built-in fallback images.
        </p>
      ) : (
        <ul className="space-y-4">
          {slides.map((slide, index) => (
            <li key={slide.id}>
              <BannerSlideEditor
                slide={slide}
                index={index}
                onChange={(patch) => updateSlide(slide.id, patch)}
                onRemove={() => removeSlide(slide.id)}
              />
            </li>
          ))}
        </ul>
      )}

      {err ? (
        <p className="text-body-sm text-error" role="alert">
          {err}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={slides.length >= MAX_HOMEPAGE_BANNERS}
          onClick={addSlide}
        >
          Add banner
        </Button>
        <Button type="button" variant="primaryForest" size="sm" disabled={saving} onClick={() => void save()}>
          {saving ? "Saving…" : "Save banners"}
        </Button>
      </div>
    </div>
  );
}

type BannerSlideEditorProps = {
  slide: HomepageBannerSlide;
  index: number;
  onChange: (patch: Partial<HomepageBannerSlide>) => void;
  onRemove: () => void;
};

/**
 * One hero slide: desktop + mobile uploads, alt, click-through href.
 */
function BannerSlideEditor({ slide, index, onChange, onRemove }: BannerSlideEditorProps) {
  return (
    <div className="rounded-lg border border-line bg-paper p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold text-forest">Banner {index + 1}</h3>
        <Button type="button" variant="ghost" size="sm" className="text-error" onClick={onRemove}>
          Remove
        </Button>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <BannerSlot
          label="Desktop image"
          spec={DESKTOP_BANNER_SPEC}
          url={slide.desktopUrl}
          onUploaded={(url) => onChange({ desktopUrl: url })}
        />
        <BannerSlot
          label="Mobile image"
          spec={MOBILE_BANNER_SPEC}
          url={slide.mobileUrl}
          onUploaded={(url) => onChange({ mobileUrl: url })}
        />
        <Input
          className="sm:col-span-2"
          label="Click-through link"
          value={slide.href}
          onChange={(e) => onChange({ href: e.target.value })}
          placeholder="/product/energy-bite-750g"
        />
        <Input
          className="sm:col-span-2"
          label="Alt text"
          value={slide.alt}
          onChange={(e) => onChange({ alt: e.target.value })}
          placeholder="Energy Bite 750g"
        />
      </div>
    </div>
  );
}

type BannerSlotProps = {
  label: string;
  spec: string;
  url: string;
  onUploaded: (url: string) => void;
};

/**
 * File picker + preview for one banner crop (desktop or mobile).
 */
function BannerSlot({ label, spec, url, onUploaded }: BannerSlotProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const validation = validateBannerImageFile(file);
    if (validation) {
      setMsg(validation);
      return;
    }
    setMsg(null);
    setBusy(true);
    try {
      const publicUrl = await presignAndUploadBannerImage(file);
      onUploaded(publicUrl);
    } catch (err) {
      if (err instanceof ApiError && err.status === 503) {
        setMsg("Uploads are not configured (enable R2).");
      } else {
        setMsg(err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Upload failed.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <p className="mb-1.5 font-mono text-eyebrow font-semibold uppercase text-ink-muted">{label}</p>
      <p className="mb-2 text-body-sm text-ink-muted">{spec}</p>
      <div className="overflow-hidden rounded-lg border border-line bg-cream">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="max-h-40 w-full object-contain p-2" />
        ) : (
          <p className="px-3 py-10 text-center text-body-sm text-ink-muted">No image yet</p>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        disabled={busy}
        onChange={(e) => void onPick(e)}
        aria-label={`Upload ${label}`}
      />
      <Button
        type="button"
        className="mt-2"
        variant="secondary"
        size="sm"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        {busy ? "Uploading…" : url ? "Replace" : "Upload"}
      </Button>
      {msg ? (
        <p className="mt-1 text-body-sm text-error" role="alert">
          {msg}
        </p>
      ) : null}
    </div>
  );
}
