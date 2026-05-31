import type { SiteModeReason } from "@/lib/types/site-mode";

/**
 * Human-readable labels for admin UI and storefront banners.
 */
export function siteModeReasonLabel(reason: SiteModeReason): string {
  switch (reason) {
    case "COMING_SOON":
      return "Coming soon";
    case "UNDER_MAINTENANCE":
      return "Under maintenance";
    case "SALE":
      return "Sale / discount";
  }
}

/**
 * Default headline when admin omits a custom headline.
 */
export function defaultSiteModeHeadline(reason: SiteModeReason): string {
  switch (reason) {
    case "COMING_SOON":
      return "Coming soon";
    case "UNDER_MAINTENANCE":
      return "Under maintenance";
    case "SALE":
      return "Sale ends in";
  }
}
