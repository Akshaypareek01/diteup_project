import { BenefitsSection } from "@/components/home/BenefitsSection";
import { DiffersSection } from "@/components/home/DiffersSection";
import { FaqSection } from "@/components/home/FaqSection";
import { FinalCtaSection } from "@/components/home/FinalCtaSection";
import { GalleryStripSection } from "@/components/home/GalleryStripSection";
import { HeroSection } from "@/components/home/HeroSection";
import { HowToSection } from "@/components/home/HowToSection";
import { IngredientsSection } from "@/components/home/IngredientsSection";
import { NutritionSection } from "@/components/home/NutritionSection";
import { PressStripSection } from "@/components/home/PressStripSection";
import { SocialProofSection } from "@/components/home/SocialProofSection";
import { StickyBuyBar } from "@/components/home/StickyBuyBar";
import { StorySection } from "@/components/home/StorySection";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { TrustBarSection } from "@/components/home/TrustBarSection";
import { SiteShell } from "@/components/layout/SiteShell";
import { CookieBanner } from "@/components/legal/CookieBanner";

import { fetchFeaturedProduct } from "@/lib/storefront-api";
import { fetchProductReviewsBySlug } from "@/lib/storefront-reviews";

export default async function HomePage() {
  const featured = await fetchFeaturedProduct();
  const homeReviews = featured?.slug
    ? await fetchProductReviewsBySlug(featured.slug, {
        page: "1",
        pageSize: "6",
        sort: "helpful",
      })
    : null;

  return (
    <SiteShell>
      <HeroSection featured={featured} />
      <SocialProofSection />
      <GalleryStripSection />
      <DiffersSection />
      <PressStripSection />
      <TrustBarSection />
      <StorySection />
      <IngredientsSection />
      <BenefitsSection />
      <HowToSection />
      <NutritionSection />
      <TestimonialsSection reviewsPayload={homeReviews} />
      <FaqSection />
      <FinalCtaSection />
      <div className="pb-24 md:pb-0" aria-hidden />
      <StickyBuyBar featured={featured} />
      <CookieBanner />
    </SiteShell>
  );
}
