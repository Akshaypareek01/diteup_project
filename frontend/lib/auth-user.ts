import { serverApiFetch, tryGetServerApiBase } from "@/lib/server-api";

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  role: string;
};

/**
 * Current session from `GET /v1/auth/me` (any role). Returns null when logged out or API unavailable.
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  if (!tryGetServerApiBase()) return null;
  try {
    const res = await serverApiFetch("/v1/auth/me");
    if (!res.ok) return null;
    const data = (await res.json()) as { user?: AuthUser };
    return data.user ?? null;
  } catch {
    return null;
  }
}
