/**
 * When a session cookie is present, require a trusted browser origin on mutating requests (PRD §13.2).
 */
import type { RequestHandler } from "express";

import { env } from "../config/env.js";
import { Forbidden } from "../utils/errors.js";

/**
 * Returns true when the URL's origin (`scheme://host`) is in the allowlist.
 */
function urlOriginAllowed(urlLike: string, allowed: Set<string>): boolean {
  try {
    const url = new URL(urlLike);
    return allowed.has(`${url.protocol}//${url.host}`);
  } catch {
    return false;
  }
}

/**
 * Blocks cross-site POST/PUT/PATCH/DELETE that carry `dt_access` without a trusted Origin/Referer.
 * In production, missing both headers is rejected.
 */
export function requireBrowserOriginForCookieAuth(allowedOrigins: string[]): RequestHandler {
  const set = new Set(allowedOrigins.filter(Boolean));
  return (req, _res, next) => {
    if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
      next();
      return;
    }
    const cookies = req.cookies as Record<string, string> | undefined;
    if (!cookies?.dt_access) {
      next();
      return;
    }

    const origin = req.get("origin");
    if (origin && set.has(origin)) {
      next();
      return;
    }

    const referer = req.get("referer");
    if (referer && urlOriginAllowed(referer, set)) {
      next();
      return;
    }

    if (env.NODE_ENV === "production") {
      next(Forbidden("Origin not allowed for cookie-authenticated request"));
      return;
    }

    next();
  };
}
