import type { AuthUser } from "./auth-user";
import { getAuthUser } from "./auth-user";

export type AdminUser = AuthUser;

/**
 * Server-side admin gate: same as customer session check, but requires `ADMIN` role.
 */
export async function getAdminUser(): Promise<AdminUser | null> {
  const user = await getAuthUser();
  if (!user || user.role !== "ADMIN") return null;
  return user;
}

export function assertAdmin(user: AdminUser | null): user is AdminUser {
  return user !== null && user.role === "ADMIN";
}
