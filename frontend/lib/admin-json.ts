import { serverApiFetch } from "@/lib/server-api";

/**
 * Parses JSON from an admin API response, or returns null when not OK / empty.
 */
export async function adminReadJson<T>(res: Response): Promise<T | null> {
  if (!res.ok) return null;
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/**
 * Server-side GET helper for admin JSON endpoints.
 */
export async function adminGet<T>(path: string): Promise<{ ok: boolean; status: number; data: T | null }> {
  const res = await serverApiFetch(path);
  const data = await adminReadJson<T>(res);
  return { ok: res.ok, status: res.status, data };
}
