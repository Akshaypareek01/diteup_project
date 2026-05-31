import { JsonLdScript } from "@/components/seo/JsonLdScript";

export type FaqJsonLdItem = {
  question: string;
  answer: string;
};

type FaqJsonLdProps = {
  items: FaqJsonLdItem[];
};

/**
 * FAQPage structured data for home or PDP accordions.
 */
export function FaqJsonLd({ items }: FaqJsonLdProps) {
  if (items.length === 0) return null;

  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return <JsonLdScript data={data} />;
}
