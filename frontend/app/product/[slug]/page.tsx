import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDetailClient } from "@/components/product/ProductDetailClient";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";
import { FaqJsonLd } from "@/components/seo/FaqJsonLd";
import { ProductJsonLd } from "@/components/seo/ProductJsonLd";
import { buildProductMetadata } from "@/lib/seo/product-metadata";
import { fetchProductBySlug } from "@/lib/storefront-api";
import { fetchProductReviewsBySlug } from "@/lib/storefront-reviews";
import type { PublicProductFaq } from "@/lib/types/catalog";

type Props = { params: { slug: string } };

/**
 * PDP metadata from admin SEO JSON with product fallbacks.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const pageData = await fetchProductBySlug(params.slug);
  if (!pageData) {
    return { title: "Product not found" };
  }
  return buildProductMetadata(pageData.product);
}

/**
 * Maps product FAQ rows to FAQPage JSON-LD entries.
 */
function mapProductFaqs(faqs: PublicProductFaq[] | undefined) {
  if (!faqs?.length) return [];
  return faqs
    .filter((f) => f.question?.trim() && f.answer?.trim())
    .map((f) => ({ question: f.question.trim(), answer: f.answer.trim() }));
}

export default async function ProductPage({ params }: Props) {
  const pageData = await fetchProductBySlug(params.slug);
  if (!pageData) {
    notFound();
  }
  const reviews = await fetchProductReviewsBySlug(params.slug, {
    page: "1",
    pageSize: "30",
    sort: "helpful",
  });
  const faqItems = mapProductFaqs(pageData.product.faqs);

  return (
    <>
      <ProductJsonLd product={pageData.product} reviewSummary={reviews?.summary ?? null} />
      <BreadcrumbJsonLd productName={pageData.product.name} productSlug={pageData.product.slug} />
      {faqItems.length > 0 ? <FaqJsonLd items={faqItems} /> : null}
      <ProductDetailClient product={pageData.product} reviews={reviews} />
    </>
  );
}
