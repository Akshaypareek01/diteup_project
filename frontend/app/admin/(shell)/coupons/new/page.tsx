import Link from "next/link";
import { AdminCouponCreateForm } from "@/components/admin/AdminCouponCreateForm";

/**
 * Create coupon — `POST /v1/admin/coupons`.
 */
export default function AdminNewCouponPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-display-md font-semibold text-forest">New coupon</h1>
        <p className="mt-1 text-body text-ink-soft">Code is stored uppercase. Free shipping uses value 0.</p>
      </div>
      <AdminCouponCreateForm />
      <Link href="/admin/coupons" className="text-body-sm text-gold-deep hover:underline">
        ← Coupons
      </Link>
    </div>
  );
}
