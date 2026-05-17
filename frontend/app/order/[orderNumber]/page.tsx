import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OrderTrackingShell, type OrderDetailInitial } from "@/components/order/OrderTrackingShell";
import { serverApiFetch, tryGetServerApiBase } from "@/lib/server-api";

type Props = { params: { orderNumber: string }; searchParams: { token?: string } };

/**
 * Locks the browser tab title to brand for the tracking experience.
 */
export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  return {
    title: "DiteUp",
    description: `Track order ${params.orderNumber} on DiteUp.`,
    robots: { index: false, follow: false },
  };
}

/**
 * Order tracking — SSR snapshot + client polling via `OrderTrackingShell`.
 */
export default async function OrderPage({ params, searchParams }: Props) {
  if (!tryGetServerApiBase()) {
    notFound();
  }

  const token = searchParams.token;
  const q = token ? `?token=${encodeURIComponent(token)}` : "";
  const res = await serverApiFetch(`/v1/orders/${encodeURIComponent(params.orderNumber)}${q}`);

  if (res.status === 404 || res.status === 403) {
    notFound();
  }

  if (!res.ok) {
    return (
      <div className="min-h-screen bg-cream px-4 py-16 text-center text-forest">
        <p className="mt-8 text-body">We could not load this order.</p>
      </div>
    );
  }

  const initial = (await res.json()) as OrderDetailInitial;

  return (
    <OrderTrackingShell
      orderNumber={params.orderNumber}
      guestToken={token}
      initial={initial}
    />
  );
}
