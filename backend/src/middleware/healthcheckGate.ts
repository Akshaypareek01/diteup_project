/**
 * Guards sensitive health probes in production.
 */
import type { RequestHandler } from "express";

import { env } from "../config/env.js";

/**
 * When `HEALTHCHECK_SECRET` is set in production, requires matching `X-Health-Secret` header.
 * Returns 404 (not 401) to avoid advertising the endpoint.
 */
export const requireHealthcheckSecret: RequestHandler = (req, res, next) => {
  const secret = env.HEALTHCHECK_SECRET?.trim();
  if (!secret || env.NODE_ENV !== "production") {
    next();
    return;
  }
  if (req.get("x-health-secret") === secret) {
    next();
    return;
  }
  res.status(404).end();
};
