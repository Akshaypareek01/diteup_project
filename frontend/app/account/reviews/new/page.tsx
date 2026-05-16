import Link from "next/link";
import { NewReviewForm } from "@/components/account/NewReviewForm";

type Props = {
  searchParams: Record<string, string | string[] | undefined>;
};

/**
 * Deep-link from order page: `?orderId=&productId=&productName=` (productName optional label).
 */
export default async function NewReviewPage({ searchParams }: Props) {
  const orderId = typeof searchParams.orderId === "string" ? searchParams.orderId : "";
  const productId = typeof searchParams.productId === "string" ? searchParams.productId : "";
  const productNameRaw = typeof searchParams.productName === "string" ? searchParams.productName : "";
  const productLabel = productNameRaw.trim() || "this product";

  if (!orderId || !productId) {
    return (
      <>
        <h1 className="font-display text-display-md font-semibold text-forest">Write a review</h1>
        <p className="mt-4 text-body-sm text-ink-muted">
          Open a <Link href="/account/orders">delivered order</Link>, then use &quot;Write review&quot; on an item.
        </p>
      </>
    );
  }

  return (
    <>
      <h1 className="font-display text-display-md font-semibold text-forest">Write a review</h1>
      <p className="mt-2 text-body-sm text-ink-muted">Verified buyers only — PRD §6.7. Submissions are moderated.</p>
      <NewReviewForm orderId={orderId} productId={productId} productLabel={productLabel} />
    </>
  );
}
