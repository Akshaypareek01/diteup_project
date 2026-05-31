/**
 * Public site-wide configuration endpoints.
 */
import type { Request, Response, NextFunction } from "express";

import { getEffectiveSiteMode, getPublicMetaPixelId } from "../services/settings.js";

/** GET /v1/site/mode — active site mode for banners and checkout gating. */
export async function getSiteMode(_req: Request, res: Response, next: NextFunction) {
  try {
    const siteMode = await getEffectiveSiteMode();
    res.status(200).json({ siteMode });
  } catch (err) {
    next(err);
  }
}

/** GET /v1/site/integrations — public storefront integration IDs (no secrets). */
export async function getSiteIntegrations(_req: Request, res: Response, next: NextFunction) {
  try {
    const metaPixelId = await getPublicMetaPixelId();
    res.status(200).json({ metaPixelId });
  } catch (err) {
    next(err);
  }
}
