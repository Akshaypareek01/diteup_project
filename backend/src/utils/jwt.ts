/**
 * JWT issuance and verification for access + refresh tokens.
 *
 * Access tokens are short-lived (15 min default) and carry user identity + role.
 * Refresh tokens are long-lived (30 days), httpOnly cookie, carry user id + tokenVersion.
 * Bumping tokenVersion on the user row invalidates every outstanding refresh token.
 */
import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env.js";

export type AccessPayload = {
  sub: string;        // userId
  role: "CUSTOMER" | "ADMIN";
  emailVerified: boolean;
  /** Matches `User.tokenVersion` — invalidated on logout / password reset. */
  tv: number;
};

export type RefreshPayload = {
  sub: string;
  tokenVersion: number;
};

export function signAccessToken(payload: AccessPayload): string {
  const opts: SignOptions = { expiresIn: env.JWT_ACCESS_TTL as SignOptions["expiresIn"] };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, opts);
}

export function signRefreshToken(payload: RefreshPayload): string {
  const opts: SignOptions = { expiresIn: env.JWT_REFRESH_TTL as SignOptions["expiresIn"] };
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, opts);
}

export function verifyAccessToken(token: string): AccessPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessPayload;
}

export function verifyRefreshToken(token: string): RefreshPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshPayload;
}
