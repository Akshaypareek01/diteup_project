"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { captureFbclidFromUrl } from "@/lib/meta-attribution";
import { pixelTrack } from "@/lib/meta-pixel-events";

/**
 * Fires PageView on App Router client-side navigations.
 *
 * The inline bootstrap in `MetaPixel` only runs on a full document load, so without
 * this every in-app navigation (home to PDP to cart to checkout) is invisible to Meta.
 * The first render is skipped because the bootstrap already tracked that PageView.
 */
export function MetaPixelRouteEvents() {
  const pathname = usePathname();
  const initialPathname = useRef(pathname);

  useEffect(() => {
    captureFbclidFromUrl(window.location.search);
  }, [pathname]);

  useEffect(() => {
    if (pathname === initialPathname.current) return;
    initialPathname.current = pathname;
    pixelTrack("PageView");
  }, [pathname]);

  return null;
}
