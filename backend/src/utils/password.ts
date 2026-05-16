/**
 * Bcrypt password hashing utilities.
 */
import bcrypt from "bcrypt";

const COST = 12;

/** Hash a plaintext password with bcrypt at cost 12. */
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, COST);
}

/** Compare a plaintext password to a stored bcrypt hash. */
export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/**
 * Server-side password rule check.
 * Mirrored client-side. ≥8 chars, ≥1 letter, ≥1 number.
 */
export function isStrongPassword(pw: string): boolean {
  return pw.length >= 8 && /[a-zA-Z]/.test(pw) && /\d/.test(pw);
}
