import { cookies } from "next/headers";

/**
 * Resolves the backend origin for server-side fetches. Prefer `API_INTERNAL_URL` in dev/prod.
 */
export function tryGetServerApiBase(): string | null {
  const fromInternal = process.env.API_INTERNAL_URL?.replace(/\/$/, "");
  const fromProxy = process.env.API_PROXY_TARGET?.replace(/\/$/, "");
  const fromPublic = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  return fromInternal || fromProxy || fromPublic || null;
}

export type ServerApiFetchOptions = RequestInit & {
  /** When false, omits Cookie header (public catalog, health, etc.). Default true. */
  forwardCookies?: boolean;
  /**
   * When set, caches the response in the Next.js Data Cache for N seconds (ISR-style).
   * Only use for public, non-personalized endpoints. Default: uncached (`no-store`).
   */
  revalidate?: number;
};

/**
 * Server-only fetch to the Express API with optional cookie forwarding.
 * Returns `503` with a JSON body when no API base URL is configured (so `next build` can prerender).
 */
export async function serverApiFetch(path: string, options: ServerApiFetchOptions = {}): Promise<Response> {
  const base = tryGetServerApiBase();
  if (!base) {
    return new Response(
      JSON.stringify({
        message: "API base URL not configured. Set API_INTERNAL_URL or NEXT_PUBLIC_API_URL.",
      }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }

  const { forwardCookies = true, revalidate, ...init } = options;
  const headers = new Headers(init.headers);

  if (forwardCookies) {
    const cookieStore = cookies();
    const cookieHeader = cookieStore
      .getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join("; ");
    if (cookieHeader) {
      headers.set("Cookie", cookieHeader);
    }
  }

  // Personalized (cookie-forwarded) requests are never cached; public ones may opt into
  // short-lived Data Cache entries so every page view doesn't hit the API + DB.
  const cacheOptions: Pick<RequestInit, "cache" | "next"> =
    !forwardCookies && typeof revalidate === "number"
      ? { next: { revalidate } }
      : { cache: "no-store" };

  return fetch(`${base}${path.startsWith("/") ? path : `/${path}`}`, {
    ...init,
    ...cacheOptions,
    headers,
  });
}
