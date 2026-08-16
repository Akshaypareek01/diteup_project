"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { HeroBannerOverlay } from "@/components/home/hero-banner-overlay";
import { HeroDesktopBannerSlider } from "@/components/home/HeroDesktopBannerSlider";
import { useHeroBannerVariant } from "@/components/home/HeroBannerVariantProvider";
import type { PublicProduct } from "@/lib/types/catalog";
import type { HomepageBannerSlide } from "@/lib/types/homepage-banners";
import { moneyNumber } from "@/lib/format-money";
import { pixelViewContent } from "@/lib/meta-pixel-events";
import {
  DESKTOP_BANNER_HEIGHT,
  DESKTOP_BANNER_WIDTH,
  MOBILE_BANNER_HEIGHT,
  MOBILE_BANNER_WIDTH,
} from "@/lib/homepage-banner-specs";

export type HeroSectionProps = {
  featured: PublicProduct | null;
  banners?: HomepageBannerSlide[];
};

/**
 * Full-width marketing banner for the home hero; retains ViewContent tracking when a featured product exists.
 */
export function HeroSection({ featured, banners = [] }: HeroSectionProps) {
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
  const cms = banners.filter((b) => b.desktopUrl && b.mobileUrl && b.href);

  return (
    <section
      id="shop"
      className="w-full scroll-mt-[104px] bg-[#142920]"
      aria-label="DiteUp hero banner"
    >
      <div className="relative min-h-0 w-full">
        {cms.length > 0 ? (
          <CmsHeroBanners slides={cms} shopHref={shopHref} />
        ) : (
          <FallbackHeroBanners useLightBanner={useLightBanner} shopHref={shopHref} />
        )}
      </div>
    </section>
  );
}

type CmsHeroBannersProps = {
  slides: HomepageBannerSlide[];
  shopHref: string;
};

/**
 * Admin-uploaded slides — full-bleed artwork, whole banner is the click-through link.
 */
function CmsHeroBanners({ slides, shopHref }: CmsHeroBannersProps) {
  return (
    <>
      <HeroDesktopBannerSlider
        className="md:hidden"
        layout="cover"
        aspectClass="aspect-[870/1808]"
        ariaLabel="Mobile hero banner slides"
        sizes="(min-width: 768px) 1px, 100vw"
        shopHref={shopHref}
        slides={slides.map((b) => ({
          src: b.mobileUrl,
          href: b.href,
          alt: b.alt || "DiteUp",
          width: MOBILE_BANNER_WIDTH,
          height: MOBILE_BANNER_HEIGHT,
        }))}
      />
      <HeroDesktopBannerSlider
        className="hidden md:block"
        layout="cover"
        ariaLabel="Desktop hero banner slides"
        sizes="(max-width: 767px) 1px, 100vw"
        shopHref={shopHref}
        slides={slides.map((b) => ({
          src: b.desktopUrl,
          href: b.href,
          alt: b.alt || "DiteUp",
          width: DESKTOP_BANNER_WIDTH,
          height: DESKTOP_BANNER_HEIGHT,
        }))}
      />
    </>
  );
}

type FallbackHeroBannersProps = {
  useLightBanner: boolean;
  shopHref: string;
};

/**
 * Built-in static assets when admin has not published homepage banners yet.
 */
function FallbackHeroBanners({ useLightBanner, shopHref }: FallbackHeroBannersProps) {
  const mobileSrc = useLightBanner
    ? "/assets/Images/mobile_banner_light.webp"
    : "/assets/Images/mobile_banner.webp";
  const desktopSrc = useLightBanner
    ? "/assets/Images/desktop_banner_light.webp"
    : "/assets/Images/desktop_banner.webp";

  return (
    <>
      <Image
        key={mobileSrc}
        src={mobileSrc}
        alt=""
        width={MOBILE_BANNER_WIDTH}
        height={MOBILE_BANNER_HEIGHT}
        priority
        sizes="(min-width: 768px) 1px, 100vw"
        role="presentation"
        className="h-auto w-full object-cover object-center md:hidden"
      />
      <HeroDesktopBannerSlider
        className="hidden md:block"
        layout="cover"
        ariaLabel="Desktop hero banner slides"
        sizes="(max-width: 767px) 1px, 100vw"
        shopHref={shopHref}
        slides={[
          {
            src: desktopSrc,
            width: DESKTOP_BANNER_WIDTH,
            height: DESKTOP_BANNER_HEIGHT,
            showOverlay: true,
            alt: "DiteUp clean nutrition hero",
          },
          {
            src: "/assets/Images/webbanner-slider2.webp",
            width: 1672,
            height: 941,
            showOverlay: false,
            alt: "DiteUp Energy Bite — all-day energy and clean nutrition",
            href: shopHref,
          },
        ]}
      />
      <div className="absolute inset-0 md:hidden">
        <HeroBannerOverlay shopHref={shopHref} />
      </div>
    </>
  );
}
