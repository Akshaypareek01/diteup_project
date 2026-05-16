import { notFound } from "next/navigation";
import { fetchProductBySlug } from "@/lib/storefront-api";
import { fetchProductReviewsBySlug } from "@/lib/storefront-reviews";
import { ProductDetailClient } from "@/components/product/ProductDetailClient";

type Props = { params: { slug: string } };

export default async function ProductPage({ params }: Props) {
  const product = await fetchProductBySlug(params.slug);
  if (!product) {
    notFound();
  }
  const reviews = await fetchProductReviewsBySlug(params.slug, {
    page: "1",
    pageSize: "30",
    sort: "helpful",
  });
  return <ProductDetailClient product={product} reviews={reviews} />;
}
