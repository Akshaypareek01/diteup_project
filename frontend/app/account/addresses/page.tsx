import { AddressesBookClient, type MeAddressRow } from "@/components/account/AddressesBookClient";
import { serverApiFetch } from "@/lib/server-api";

export default async function AccountAddressesPage() {
  const res = await serverApiFetch("/v1/me/addresses");
  if (!res.ok) {
    return <p className="text-body text-error">Could not load addresses.</p>;
  }
  const data = (await res.json()) as { addresses?: MeAddressRow[] };

  return <AddressesBookClient initialAddresses={data.addresses ?? []} />;
}
