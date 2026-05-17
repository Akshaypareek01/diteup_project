"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { HeroBannerOverlay } from "@/components/home/hero-banner-overlay";
import { useHeroBannerVariant } from "@/components/home/HeroBannerVariantProvider";
import type { PublicProduct } from "@/lib/types/catalog";
import { moneyNumber } from "@/lib/format-money";
import { pixelViewContent } from "@/lib/meta-pixel-events";

export type HeroSectionProps = {
  featured: PublicProduct | null;
};

/**
 * Full-width marketing banner for the home hero; retains ViewContent tracking when a featured product exists.
 */
export function HeroSection({ featured }: HeroSectionProps) {
  const { useLightBanner } = useHeroBannerVariant();
  const tracked = useRef(false);
  useEffect(() => {
    if (tracked.current || !featured?.variants?.length) return;
    tracked.current = true;
    const v = featured.variants.find((x) => x.isDefault) ?? featured.variants[0];
    pixelViewContent({
      content_ids: [v.id],
      value: moneyNumber(v.priceSale),
      currency: "INR",
    });
  }, [featured]);

  const shopHref = featured ? `/product/${featured.slug}` : "/#shop";

  const mobileSrc = useLightBanner
    ? "/assets/Images/mobile_banner_light.png"
    : "/assets/Images/mobile_banner.png";
  const desktopSrc = useLightBanner
    ? "/assets/Images/desktop_banner_light.png"
    : "/assets/Images/desktop_banner.png";

  return (
    <section
      id="shop"
      className="w-full scroll-mt-[104px] bg-[#142920]"
      aria-label="DiteUp hero banner"
    >
      {/* Full-bleed width — avoids cream gutters from max-width centering on wide viewports */}
      <div className="relative min-h-0 w-full">
        <Image
          key={mobileSrc}
          src={mobileSrc}
          alt=""
          width={870}
          height={1808}
          priority
          sizes="100vw"
          role="presentation"
          className="h-auto w-full object-cover object-center md:hidden"
        />
        <Image
          key={desktopSrc}
          src={desktopSrc}
          alt=""
          width={1774}
          height={887}
          priority
          sizes="100vw"
          role="presentation"
          className="hidden h-auto w-full object-cover object-center md:block"
        />
        <HeroBannerOverlay shopHref={shopHref} />
      </div>
    </section>
  );
}
