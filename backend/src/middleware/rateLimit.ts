/**
 * Lightweight in-memory rate limiter (sliding window approximation).
 *
 * For a global limiter across replicas, swap buckets for Redis/Upstash (PRD §13.2) — same middleware shape.
 * Keys are typically `${routeName}:${ipOrEmail}`.
 */
import type { RequestHandler } from "express";
import { RateLimited } from "../utils/errors.js";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// Janitor — sweep expired buckets every minute
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key);
  }
}, 60_000).unref();

export type RateLimitOptions = {
  windowMs: number;
  max: number;
  /** Derive the key from the request. Defaults to IP. */
  keyFn?: (req: Parameters<RequestHandler>[0]) => string;
  /** Custom error message. */
  message?: string;
};

export function rateLimit(opts: RateLimitOptions): RequestHandler {
  const { windowMs, max, message } = opts;
  const keyFn =
    opts.keyFn ?? ((req) => (req.ip ?? req.socket.remoteAddress ?? "anon"));

  return (req, _res, next) => {
    const key = `${req.baseUrl}${req.path}:${keyFn(req)}`;
    const now = Date.now();
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt < now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (bucket.count >= max) {
      return next(RateLimited(message ?? "Too many requests, please try again later"));
    }

    bucket.count += 1;
    next();
  };
}
