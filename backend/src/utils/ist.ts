/** India Standard Time — no DST. All admin display / day-boundaries use this. */
export const IST_TIME_ZONE = "Asia/Kolkata";

/**
 * Instant of 00:00:00 Asia/Kolkata on the IST calendar day containing `now`.
 * Independent of process `TZ` (prod Node is typically UTC).
 */
export function startOfIstDay(now = new Date()): Date {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: IST_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const num = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value ?? "0");
  const y = num("year");
  const m = num("month");
  const d = num("day");
  return new Date(Date.UTC(y, m - 1, d) - 330 * 60 * 1000);
}

/**
 * Formats an instant for admin/Excel in IST (`16 Aug 2026, 3:41 pm`).
 */
export function formatIstDateTime(value: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: IST_TIME_ZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(value);
}
