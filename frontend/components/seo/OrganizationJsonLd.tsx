import { JsonLdScript } from "@/components/seo/JsonLdScript";
import { defaultOgImageUrl } from "@/lib/seo/defaults";
import type { PublicSiteSeo } from "@/lib/seo/resolve-site-seo";
import { absoluteUrl, getSiteUrl } from "@/lib/seo/site-url";

type OrganizationJsonLdProps = {
  siteSeo: PublicSiteSeo;
};

/**
 * Resolves absolute logo URL for JSON-LD when admin stores a relative path.
 */
function resolveOrganizationLogoUrl(logo: string): string {
  if (!logo.trim()) return defaultOgImageUrl();
  if (logo.startsWith("http://") || logo.startsWith("https://")) return logo.trim();
  return absoluteUrl(logo);
}

/**
 * Organization + WebSite structured data for the global layout.
 */
export function OrganizationJsonLd({ siteSeo }: OrganizationJsonLdProps) {
  const siteUrl = getSiteUrl();
  const logo = resolveOrganizationLogoUrl(siteSeo.organizationLogo);

  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteSeo.organizationName,
    url: siteUrl,
    logo,
    email: siteSeo.contactEmail,
    sameAs: [] as string[],
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteSeo.organizationName,
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/product/{search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <JsonLdScript data={organization} />
      <JsonLdScript data={website} />
    </>
  );
}
