export type ApiErrorBody = {
  message?: string;
  error?: { message?: string; code?: string };
};

/**
 * Thrown when a `/v1/*` JSON response is not ok.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, message: string, body: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

/**
 * Parses API error message from common backend shapes.
 */
export function pickApiMessage(body: unknown, fallback: string): string {
  if (body && typeof body === "object") {
    const o = body as ApiErrorBody;
    if (typeof o.message === "string" && o.message) return o.message;
    if (o.error && typeof o.error.message === "string" && o.error.message) return o.error.message;
  }
  return fallback;
}

/** Single in-flight refresh so parallel 401s share one cookie rotation. */
let refreshInFlight: Promise<boolean> | null = null;

/**
 * Rotates the HTTP-only access cookie using the refresh cookie. Returns whether a new access token was issued.
 */
async function refreshAccessToken(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const res = await fetch("/v1/auth/refresh", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        });
        await res.text().catch(() => {});
        return res.ok;
      } catch {
        return false;
      } finally {
        refreshInFlight = null;
      }
    })();
  }
  return refreshInFlight;
}

/**
 * Returns true when the server rejected a JWT access cookie as expired (`middleware/auth.ts`).
 */
function isExpiredAccessMessage(message: string): boolean {
  return message.includes("Access token expired");
}

type ClientJsonInit = RequestInit & { json?: unknown };

async function sendClientApiJsonOnce<T>(path: string, init: ClientJsonInit): Promise<T> {
  const url = path.startsWith("/v1/") ? path : `/v1${path.startsWith("/") ? path : `/${path}`}`;
  const { json, headers: hdrs, ...rest } = init;
  const headers = new Headers(hdrs);
  if (json !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(url, {
    ...rest,
    credentials: "include",
    headers,
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });

  const text = await res.text();
  let parsed: unknown = null;
  if (text) {
    try {
      parsed = JSON.parse(text) as unknown;
    } catch {
      parsed = { raw: text };
    }
  }

  if (!res.ok) {
    throw new ApiError(
      res.status,
      pickApiMessage(parsed, `Request failed (${res.status})`),
      parsed,
    );
  }

  return parsed as T;
}

/**
 * Browser fetch to proxied `/v1` with cookies — same origin as the Next app.
 * On a 401 “Access token expired”, calls `POST /v1/auth/refresh` once and retries the request.
 */
export async function clientApiJson<T>(path: string, init: ClientJsonInit = {}): Promise<T> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return await sendClientApiJsonOnce<T>(path, init);
    } catch (e) {
      const isFirst = attempt === 0;
      const canRefresh =
        isFirst &&
        e instanceof ApiError &&
        e.status === 401 &&
        isExpiredAccessMessage(e.message);
      if (!canRefresh) throw e;
      const ok = await refreshAccessToken();
      if (!ok) throw e;
    }
  }
  throw new Error("clientApiJson retry exhausted");
}
