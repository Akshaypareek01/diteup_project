/**
 * Authentication + authorization middleware.
 *
 * - authRequired:  verifies access JWT, loads user, checks isActive + tokenVersion,
 *                  attaches user to req.auth.
 * - optionalAuth:  same as above but doesn't reject if no/invalid token.
 * - roleRequired:  must follow authRequired; checks role.
 * - emailVerified: must follow authRequired; rejects if email unverified.
 *
 * Token sources (in priority order):
 *   1. Authorization: Bearer <token>
 *   2. Cookie: dt_access=<token>
 */
import type { RequestHandler } from "express";
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import type { Role } from "@prisma/client";

import { verifyAccessToken } from "../utils/jwt.js";
import { prisma } from "../utils/prisma.js";
import { EmailNotVerified, Forbidden, Unauthorized } from "../utils/errors.js";

export type AuthContext = {
  userId: string;
  role: Role;
  emailVerified: boolean;
};

declare module "express-serve-static-core" {
  interface Request {
    auth?: AuthContext;
  }
}

function extractToken(req: Parameters<RequestHandler>[0]): string | null {
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) return header.slice(7).trim();
  const cookieToken = (req as { cookies?: Record<string, string> }).cookies?.dt_access;
  return cookieToken ?? null;
}

async function resolveAuth(req: Parameters<RequestHandler>[0]): Promise<AuthContext | null> {
  const token = extractToken(req);
  if (!token) return null;

  let payload: ReturnType<typeof verifyAccessToken>;
  try {
    payload = verifyAccessToken(token);
  } catch (err) {
    if (err instanceof TokenExpiredError) throw Unauthorized("Access token expired");
    if (err instanceof JsonWebTokenError) throw Unauthorized("Invalid access token");
    throw err;
  }

  // Load user to verify isActive — JWT payload alone isn't enough since admin
  // may have disabled the account mid-session.
  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, role: true, isActive: true, emailVerified: true, lockedUntil: true },
  });

  if (!user) throw Unauthorized("Account not found");
  if (!user.isActive) throw Unauthorized("Account is disabled");
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    throw Unauthorized("Account temporarily locked");
  }

  return { userId: user.id, role: user.role, emailVerified: user.emailVerified };
}

export const authRequired: RequestHandler = async (req, _res, next) => {
  try {
    const auth = await resolveAuth(req);
    if (!auth) throw Unauthorized();
    req.auth = auth;
    next();
  } catch (err) {
    next(err);
  }
};

export const optionalAuth: RequestHandler = async (req, _res, next) => {
  try {
    const auth = await resolveAuth(req);
    if (auth) req.auth = auth;
    next();
  } catch {
    // Swallow errors — optional means we don't reject on bad tokens
    next();
  }
};

export function roleRequired(...allowed: Role[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.auth) return next(Unauthorized());
    if (!allowed.includes(req.auth.role)) return next(Forbidden());
    next();
  };
}

export const emailVerifiedRequired: RequestHandler = (req, _res, next) => {
  if (!req.auth) return next(Unauthorized());
  if (!req.auth.emailVerified) return next(EmailNotVerified());
  next();
};
