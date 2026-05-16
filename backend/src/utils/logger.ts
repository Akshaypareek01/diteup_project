/**
 * Pino-based structured logger. Pretty in dev, JSON in prod.
 */
import pino from "pino";
import { env } from "../config/env.js";

const isDev = env.NODE_ENV === "development";

export const logger = pino({
  level: env.ENABLE_DEBUG_LOGS ? "debug" : isDev ? "debug" : "info",
  ...(isDev && {
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "HH:MM:ss.l",
        ignore: "pid,hostname",
      },
    },
  }),
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "*.password",
      "*.passwordHash",
      "*.codeHash",
      "*.tokenHash",
      "*.razorpaySignature",
      "*.RAZORPAY_KEY_SECRET",
      "*.JWT_ACCESS_SECRET",
      "*.JWT_REFRESH_SECRET",
    ],
    censor: "[REDACTED]",
  },
});

export type Logger = typeof logger;
