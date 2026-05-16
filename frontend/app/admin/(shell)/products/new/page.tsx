import Link from "next/link";
import { AdminNewProductForm } from "@/components/admin/AdminNewProductForm";

export default function AdminNewProductPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-display-md font-semibold text-forest">New product</h1>
        <p className="mt-1 text-body text-ink-soft">`POST /v1/admin/products` creates the first variant + inventory.</p>
      </div>
      <AdminNewProductForm />
      <Link href="/admin/products" className="text-body-sm text-gold-deep hover:underline">
        ← Products
      </Link>
    </div>
  );
}
