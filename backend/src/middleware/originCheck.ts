/**
 * When a session cookie is present, require `Origin` to match an allowed front-end (PRD §13.2).
 */
import type { RequestHandler } from "express";

import { Forbidden } from "../utils/errors.js";

/**
 * Blocks cross-site POST/PUT/PATCH/DELETE that carry `dt_access` without a trusted `Origin`.
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
    if (!origin) {
      next();
      return;
    }
    if (!set.has(origin)) {
      next(Forbidden("Origin not allowed for cookie-authenticated request"));
      return;
    }
    next();
  };
}
