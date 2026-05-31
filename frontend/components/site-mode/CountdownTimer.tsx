"use client";

import { useEffect, useState } from "react";

export type CountdownTimerProps = {
  /** ISO 8601 UTC end time. */
  endsAt: string;
  /** Called once when countdown reaches zero. */
  onExpire?: () => void;
  className?: string;
};

type CountdownParts = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
};

/**
 * Computes remaining time parts from an ISO end timestamp.
 */
function computeCountdown(endsAt: string): CountdownParts {
  const diffMs = Date.parse(endsAt) - Date.now();
  if (!Number.isFinite(diffMs) || diffMs <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  }
  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds, expired: false };
}

/**
 * Formats countdown parts as `Xd Xh Xm Xs` (omits zero day segment on short timers).
 */
function formatCountdown(parts: CountdownParts): string {
  const segments: string[] = [];
  if (parts.days > 0) segments.push(`${String(parts.days)}d`);
  segments.push(`${String(parts.hours).padStart(2, "0")}h`);
  segments.push(`${String(parts.minutes).padStart(2, "0")}m`);
  segments.push(`${String(parts.seconds).padStart(2, "0")}s`);
  return segments.join(" ");
}

/**
 * Live countdown display — updates every second until expiry.
 */
export function CountdownTimer({ endsAt, onExpire, className }: CountdownTimerProps) {
  const [parts, setParts] = useState(() => computeCountdown(endsAt));

  useEffect(() => {
    setParts(computeCountdown(endsAt));
    const id = window.setInterval(() => {
      const next = computeCountdown(endsAt);
      setParts(next);
      if (next.expired) {
        window.clearInterval(id);
        onExpire?.();
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [endsAt, onExpire]);

  if (parts.expired) {
    return (
      <span className={className} role="timer" aria-live="polite">
        Ended
      </span>
    );
  }

  return (
    <span className={className} role="timer" aria-live="polite" aria-atomic="true">
      {formatCountdown(parts)}
    </span>
  );
}
