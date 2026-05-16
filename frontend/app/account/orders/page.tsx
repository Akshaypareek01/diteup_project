import { AccountOrdersOverview, type AccountOrderSummary } from "@/components/account/AccountOrdersOverview";
import { serverApiFetch } from "@/lib/server-api";

type OrdersApiEnvelope = {
  orders?: AccountOrderSummary[];
};

export default async function AccountOrdersPage() {
  const res = await serverApiFetch("/v1/me/orders?limit=20&offset=0");
  if (!res.ok) {
    return <p className="text-body text-error">Could not load orders.</p>;
  }
  const data = (await res.json()) as OrdersApiEnvelope;
  const orders = data.orders ?? [];

  return <AccountOrdersOverview orders={orders} />;
}
