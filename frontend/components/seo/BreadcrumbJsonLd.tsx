import { JsonLdScript } from "@/components/seo/JsonLdScript";
import { absoluteUrl } from "@/lib/seo/site-url";

type BreadcrumbJsonLdProps = {
  productName: string;
  productSlug: string;
};

/**
 * Home → Product breadcrumb trail for PDP rich results.
 */
export function BreadcrumbJsonLd({ productName, productSlug }: BreadcrumbJsonLdProps) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: absoluteUrl("/"),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: productName,
        item: absoluteUrl(`/product/${productSlug}`),
      },
    ],
  };

  return <JsonLdScript data={data} />;
}
