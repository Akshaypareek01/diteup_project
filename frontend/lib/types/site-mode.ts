/** Site-wide mode reason from admin settings. */
export type SiteModeReason = "COMING_SOON" | "UNDER_MAINTENANCE" | "SALE";

/** Public payload from `GET /v1/site/mode`. */
export type PublicSiteMode = {
  active: boolean;
  reason: SiteModeReason | null;
  endsAt: string | null;
  headline: string;
  message: string | null;
  blocksCheckout: boolean;
};

/** Admin `siteMode` setting shape. */
export type SiteModeSetting = {
  enabled: boolean;
  reason: SiteModeReason;
  endsAt: string;
  headline?: string;
  message?: string;
};

/** Inactive default when API is unavailable or mode is off. */
export const INACTIVE_SITE_MODE: PublicSiteMode = {
  active: false,
  reason: null,
  endsAt: null,
  headline: "",
  message: null,
  blocksCheckout: false,
};
