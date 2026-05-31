"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/ToastProvider";
import { SiteModeStrip } from "@/components/site-mode/SiteModeStrip";
import { ApiError, clientApiJson } from "@/lib/client-api";
import { defaultSiteModeHeadline, siteModeReasonLabel } from "@/lib/site-mode-labels";
import type { PublicSiteMode, SiteModeReason, SiteModeSetting } from "@/lib/types/site-mode";
import { INACTIVE_SITE_MODE } from "@/lib/types/site-mode";

const REASONS: SiteModeReason[] = ["COMING_SOON", "UNDER_MAINTENANCE", "SALE"];

export type AdminSiteModePanelProps = {
  initialValue: SiteModeSetting;
};

/**
 * Converts an ISO timestamp to `datetime-local` input value in local time.
 */
function isoToDatetimeLocal(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${String(d.getFullYear())}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Converts `datetime-local` value to ISO UTC for API storage.
 */
function datetimeLocalToIso(local: string): string {
  if (!local) return "";
  return new Date(local).toISOString();
}

/**
 * Default end time — 24 hours from now — for new site mode configs.
 */
function defaultEndsAtLocal(): string {
  const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return isoToDatetimeLocal(d.toISOString());
}

/**
 * Parses admin setting JSON into form state with safe defaults.
 */
function parseInitial(value: unknown): {
  enabled: boolean;
  reason: SiteModeReason;
  endsAtLocal: string;
  headline: string;
  message: string;
} {
  const v =
    value && typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
  const reason = v.reason;
  const validReason: SiteModeReason =
    reason === "UNDER_MAINTENANCE" || reason === "SALE" ? reason : "COMING_SOON";
  const endsAt = typeof v.endsAt === "string" ? v.endsAt : "";
  return {
    enabled: typeof v.enabled === "boolean" ? v.enabled : false,
    reason: validReason,
    endsAtLocal: endsAt ? isoToDatetimeLocal(endsAt) : defaultEndsAtLocal(),
    headline: typeof v.headline === "string" ? v.headline : "",
    message: typeof v.message === "string" ? v.message : "",
  };
}

/**
 * Admin form for site-wide mode — reason, countdown end time, optional copy, live preview.
 */
export function AdminSiteModePanel({ initialValue }: AdminSiteModePanelProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const parsed = parseInitial(initialValue);
  const [enabled, setEnabled] = useState(parsed.enabled);
  const [reason, setReason] = useState<SiteModeReason>(parsed.reason);
  const [endsAtLocal, setEndsAtLocal] = useState(parsed.endsAtLocal);
  const [headline, setHeadline] = useState(parsed.headline);
  const [message, setMessage] = useState(parsed.message);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const minDatetimeLocal = useMemo(() => isoToDatetimeLocal(new Date(Date.now() + 60_000).toISOString()), []);

  const previewMode: PublicSiteMode = useMemo(() => {
    if (!enabled || !endsAtLocal) return INACTIVE_SITE_MODE;
    const endsAt = datetimeLocalToIso(endsAtLocal);
    const endsMs = Date.parse(endsAt);
    if (!Number.isFinite(endsMs) || endsMs <= Date.now()) return INACTIVE_SITE_MODE;
    const resolvedHeadline = headline.trim() || defaultSiteModeHeadline(reason);
    return {
      active: true,
      reason,
      endsAt,
      headline: resolvedHeadline,
      message: message.trim() || null,
      blocksCheckout: reason !== "SALE",
    };
  }, [enabled, reason, endsAtLocal, headline, message]);

  async function save() {
    setErr(null);
    if (enabled) {
      const endsAt = datetimeLocalToIso(endsAtLocal);
      const endsMs = Date.parse(endsAt);
      if (!endsAtLocal || !Number.isFinite(endsMs)) {
        const msg = "End date and time is required.";
        setErr(msg);
        showToast(msg, "error");
        return;
      }
      if (endsMs <= Date.now()) {
        const msg = "End date and time must be in the future.";
        setErr(msg);
        showToast(msg, "error");
        return;
      }
    }

    const payload: SiteModeSetting = {
      enabled,
      reason,
      endsAt: enabled ? datetimeLocalToIso(endsAtLocal) : "",
      headline: headline.trim() || undefined,
      message: message.trim() || undefined,
    };

    setSaving(true);
    try {
      await clientApiJson("/v1/admin/settings", {
        method: "PUT",
        json: { key: "siteMode", value: payload },
      });
      showToast(
        enabled ? "Site mode saved — storefront banner is live." : "Site mode turned off.",
      );
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
      <div className="rounded-lg border border-line bg-paper p-4">
        <h3 className="font-display text-lg font-semibold text-forest">Site-wide mode</h3>
        <p className="mt-1 text-body-sm text-ink-muted">
          Controls the header countdown banner and whether customers can checkout store-wide.
        </p>

        <div className="mt-4 space-y-4">
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="size-4 rounded border-line text-forest focus:ring-forest"
            />
            <span className="text-body font-medium text-ink">Enable site mode</span>
          </label>

          <div>
            <label
              htmlFor="site-mode-reason"
              className="mb-1.5 block font-mono text-eyebrow font-semibold uppercase text-ink-muted"
            >
              Reason
            </label>
            <select
              id="site-mode-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value as SiteModeReason)}
              disabled={!enabled}
              className="h-12 w-full rounded-sm border border-line bg-cream px-3 text-body text-ink outline-none focus:border-forest disabled:opacity-60"
            >
              {REASONS.map((r) => (
                <option key={r} value={r}>
                  {siteModeReasonLabel(r)}
                </option>
              ))}
            </select>
            <p className="mt-1 text-body-sm text-ink-muted">
              {reason === "SALE"
                ? "Sale mode shows the timer but checkout stays open."
                : "Coming soon and under maintenance block Add to cart and checkout."}
            </p>
          </div>

          <Input
            label="End date & time"
            name="endsAt"
            type="datetime-local"
            value={endsAtLocal}
            min={minDatetimeLocal}
            disabled={!enabled}
            onChange={(e) => setEndsAtLocal(e.target.value)}
            hint="Countdown runs until this time, then mode auto-expires."
          />

          <Input
            label="Custom headline (optional)"
            name="headline"
            value={headline}
            disabled={!enabled}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder={defaultSiteModeHeadline(reason)}
          />

          <Input
            label="Message (optional)"
            name="message"
            value={message}
            disabled={!enabled}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Short note shown in the banner"
          />
        </div>

        {err ? (
          <p className="mt-3 text-body-sm text-error" role="alert">
            {err}
          </p>
        ) : null}

        <Button
          type="button"
          variant="primaryForest"
          size="sm"
          className="mt-4"
          disabled={saving}
          onClick={() => void save()}
        >
          {saving ? "Saving…" : "Save site mode"}
        </Button>
      </div>

      <div className="rounded-lg border border-line bg-paper p-4">
        <h3 className="font-mono text-sm font-semibold text-forest">Live preview</h3>
        <p className="mt-1 text-body-sm text-ink-muted">How the storefront header strip will look.</p>
        <div className="mt-4 overflow-hidden rounded-md border border-line">
          {previewMode.active ? (
            <SiteModeStrip siteMode={previewMode} withShell />
          ) : (
            <p className="bg-cream px-4 py-6 text-center text-body-sm text-ink-muted">
              Site mode off — default free shipping banner will show.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
