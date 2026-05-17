/**
 * Browser key for persisting essential vs analytics cookie choices (localStorage).
 * Kept in one module so the Meta Pixel bootstrap and the banner stay in sync.
 */
export const COOKIE_CONSENT_STORAGE_KEY = "dt_cookie_consent";

/** User choice: analytics allowed (Meta grant) or essential-only (Meta revoke). */
export type CookieConsentValue = "essential_only" | "analytics_accepted";

/**
 * Reads the stored cookie consent choice, if any and valid.
 */
export function readCookieConsent(): CookieConsentValue | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    if (raw === "essential_only" || raw === "analytics_accepted") {
      return raw;
    }
    return null;
  } catch (err) {
    console.warn("Cookie consent read failed", err);
    return null;
  }
}

/**
 * Persists the user's cookie consent. Fails softly in private mode or quota errors.
 */
export function writeCookieConsent(value: CookieConsentValue): void {
  try {
    window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, value);
  } catch (err) {
    console.warn("Cookie consent could not be saved", err);
  }
}

/**
 * Applies the choice to Meta Pixel consent mode. `fbq` queues calls before the script finishes loading.
 */
export function syncMetaPixelConsent(choice: CookieConsentValue): void {
  if (typeof window === "undefined") return;
  const fbq = window.fbq;
  if (typeof fbq !== "function") return;
  try {
    if (choice === "analytics_accepted") {
      fbq("consent", "grant");
    } else {
      fbq("consent", "revoke");
    }
  } catch (err) {
    console.warn("Meta Pixel consent update failed", err);
  }
}
