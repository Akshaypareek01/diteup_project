/**
 * DiteUp API server entrypoint.
 * Wires middleware (security, logging, parsing), routes (mounted under /v1),
 * and global error handling. Exits cleanly on SIGINT/SIGTERM.
 */
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Request, type Response } from "express";
import helmet from "helmet";
import * as Sentry from "@sentry/node";

import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";
import { prisma } from "./utils/prisma.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { requestContext } from "./middleware/requestContext.js";
import { requireBrowserOriginForCookieAuth } from "./middleware/originCheck.js";
import { startBackgroundSchedulers } from "./jobs/scheduler.js";
import * as webhookController from "./controllers/webhooks.js";
import * as marketingController from "./controllers/marketing.js";
import * as resendWebhookController from "./controllers/resendWebhook.js";
import authRoutes from "./routes/auth.js";
import cartRoutes from "./routes/cart.js";
import catalogRoutes from "./routes/catalog.js";
import checkoutRoutes from "./routes/checkout.js";
import meRoutes from "./routes/me.js";
import reviewRoutes from "./routes/reviews.js";
import adminRoutes from "./routes/admin.js";

if (env.SENTRY_DSN) {
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    tracesSampleRate: env.NODE_ENV === "production" ? 0.05 : 1.0,
  });
}

function createApp(): express.Application {
  const app = express();
  const allowedOrigins = env.CORS_ORIGIN.split(",").map((s) => s.trim());

  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  app.use(helmet());
  app.use(
    cors({
      origin: allowedOrigins,
      credentials: true,
    }),
  );

  app.post(
    "/v1/webhooks/razorpay",
    express.raw({ type: "application/json" }),
    webhookController.postRazorpayWebhook,
  );

  app.post("/v1/webhooks/resend", express.json({ limit: "256kb" }), resendWebhookController.postResendWebhook);

  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use(requireBrowserOriginForCookieAuth(allowedOrigins));
  app.use(requestContext);

  app.get("/v1/marketing/unsubscribe", marketingController.getMarketingUnsubscribe);

  app.get("/health", (_req: Request, res: Response) => {
    res.json({ ok: true, service: "diteup-api", env: env.NODE_ENV });
  });

  app.get("/health/db", async (_req: Request, res: Response) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ ok: true, db: "up" });
    } catch (err) {
      logger.error({ err }, "DB health check failed");
      res.status(503).json({ ok: false, db: "down" });
    }
  });

  // ---- Route mounts (added as phases complete) ----
  app.use("/v1/auth", authRoutes);
  app.use("/v1/me", meRoutes);
  app.use("/v1", catalogRoutes); // products/featured, products/:slug, pincode/check, notify-me
  app.use("/v1", cartRoutes); // coupons/validate, cart/preview
  app.use("/v1", checkoutRoutes); // orders, payments/verify
  app.use("/v1", reviewRoutes); // reviews (auth mutations)
  app.use("/v1", adminRoutes); // admin (dashboard, moderation, …)
  // app.use("/v1/products", productRoutes);
  // app.use("/v1/orders", orderRoutes);
  // app.use("/v1/webhooks", webhookRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

async function startServer(): Promise<void> {
  const app = createApp();
  const server = app.listen(env.PORT, () => {
    logger.info(
      { port: env.PORT, env: env.NODE_ENV },
      `DiteUp API listening on http://localhost:${env.PORT}`,
    );
  });

  startBackgroundSchedulers();

  const shutdown = async (signal: string) => {
    logger.info({ signal }, "Shutting down");
    server.close(() => logger.info("HTTP server closed"));
    await prisma.$disconnect();
    if (env.SENTRY_DSN) {
      await Sentry.close(2000);
    }
    process.exit(0);
  };
  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

void startServer();
