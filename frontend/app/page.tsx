import type { Metadata } from "next";
import { FaqSection, HOME_FAQ_ITEMS } from "@/components/home/FaqSection";
import { HeroSection } from "@/components/home/HeroSection";
import { IngredientsSection } from "@/components/home/IngredientsSection";
import { PerfectForEveryYouSection } from "@/components/home/PerfectForEveryYouSection";
import { RegulatoryTrustStripSection } from "@/components/home/RegulatoryTrustStripSection";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { WhyChoosePressSection } from "@/components/home/WhyChoosePressSection";
import { TrustBarSection } from "@/components/home/TrustBarSection";
import { SiteShell } from "@/components/layout/SiteShell";
import { FaqJsonLd } from "@/components/seo/FaqJsonLd";
import { buildHomeMetadata, resolveSiteSeo } from "@/lib/seo/resolve-site-seo";
import { fetchFeaturedProduct } from "@/lib/storefront-api";
import { fetchProductReviewsBySlug } from "@/lib/storefront-reviews";

/**
 * Home page metadata — keyword-rich title for soaked breakfast positioning.
 */
export async function generateMetadata(): Promise<Metadata> {
  const siteSeo = await resolveSiteSeo();
  return buildHomeMetadata(siteSeo);
}

export default async function HomePage() {
  const featured = await fetchFeaturedProduct();
  const reviewsPayload =
    featured?.slug != null && featured.slug.length > 0
      ? await fetchProductReviewsBySlug(featured.slug)
      : null;

  return (
    <SiteShell>
      <FaqJsonLd items={HOME_FAQ_ITEMS} />
      <HeroSection featured={featured} />
      <WhyChoosePressSection />
      <TrustBarSection />
      <PerfectForEveryYouSection />
      <RegulatoryTrustStripSection />
      <IngredientsSection />
      <TestimonialsSection reviewsPayload={reviewsPayload} />
      <FaqSection />
    </SiteShell>
  );
}
