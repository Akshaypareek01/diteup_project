import { notFound } from "next/navigation";
import { fetchProductBySlug } from "@/lib/storefront-api";
import { fetchProductReviewsBySlug } from "@/lib/storefront-reviews";
import { ProductDetailClient } from "@/components/product/ProductDetailClient";

type Props = { params: { slug: string } };

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
  return <ProductDetailClient product={pageData.product} reviews={reviews} />;
}
