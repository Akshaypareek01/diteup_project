/** India Standard Time — admin UI always renders this, independent of server TZ. */
export const IST_TIME_ZONE = "Asia/Kolkata";

/**
 * Parses an API timestamp; returns null when missing/invalid.
 */
function toDate(value: string | Date | null | undefined): Date | null {
  if (value == null || value === "") return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Formats an instant in IST for admin tables (`16 Aug 2026, 3:41 pm`).
 */
export function formatIstDateTime(value: string | Date | null | undefined): string {
  const d = toDate(value);
  if (!d) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: IST_TIME_ZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

/**
 * Formats an IST calendar date (no time) for admin lists.
 */
export function formatIstDate(value: string | Date | null | undefined): string {
  const d = toDate(value);
  if (!d) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: IST_TIME_ZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}
