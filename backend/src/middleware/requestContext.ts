/**
 * Attaches a request id + child logger to every request, and emits
 * a single access-log entry per response. Cheap, structured, redacts secrets.
 */
import type { RequestHandler } from "express";
import { randomUUID } from "node:crypto";
import { logger, type Logger } from "../utils/logger.js";

declare module "express-serve-static-core" {
  interface Request {
    id: string;
    log: Logger;
  }
}

export const requestContext: RequestHandler = (req, res, next) => {
  const headerId = req.headers["x-request-id"];
  req.id = typeof headerId === "string" && headerId.length > 0 ? headerId : randomUUID();
  res.setHeader("x-request-id", req.id);
  req.log = logger.child({ reqId: req.id, method: req.method, path: req.path });

  const start = process.hrtime.bigint();
  res.on("finish", () => {
    const ms = Number(process.hrtime.bigint() - start) / 1_000_000;
    req.log.info(
      { status: res.statusCode, durationMs: Math.round(ms) },
      "request completed"
    );
  });

  next();
};
