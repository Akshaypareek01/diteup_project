import type { Metadata } from "next";
import { FaqPageContent } from "@/components/faq/FaqPageContent";
import { SiteShell } from "@/components/layout/SiteShell";
import { FaqJsonLd } from "@/components/seo/FaqJsonLd";
import { ENERGY_BITE_FAQ_ITEMS } from "@/lib/energy-bite-faqs";
import { buildSharedSocialMetadata } from "@/lib/seo/defaults";

export const metadata: Metadata = {
  title: "FAQ — DiteUp Energy Bite",
  description:
    "Answers about DiteUp Energy Bite — how to use it, ingredients, storage, shipping, returns, and more.",
  ...buildSharedSocialMetadata({
    title: "FAQ — DiteUp Energy Bite",
    description:
      "Answers about DiteUp Energy Bite — how to use it, ingredients, storage, shipping, returns, and more.",
    path: "/faq",
  }),
};

/** Dedicated FAQ page with full Energy Bite Q&A list. */
export default function FaqPage() {
  return (
    <SiteShell headerVariant="compact">
      <FaqJsonLd items={ENERGY_BITE_FAQ_ITEMS} />
      <FaqPageContent />
    </SiteShell>
  );
}
