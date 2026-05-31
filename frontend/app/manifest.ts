import type { MetadataRoute } from "next";

/**
 * Web app manifest for install prompts and mobile browser chrome.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DiteUp — Clean Nutrition",
    short_name: "DiteUp",
    description:
      "Pre-portioned soaked breakfast packs with clean ingredients. High protein, no added sugar.",
    start_url: "/",
    display: "standalone",
    background_color: "#F5F0E6",
    theme_color: "#1F3D2E",
    icons: [
      {
        src: "/assets/logos/diteup-logo.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
