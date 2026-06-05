import Link from "next/link";
import { FlowHeader } from "@/components/layout/FlowHeader";

export type OrderAccessDeniedProps = {
  orderNumber: string;
};

/**
 * Shown when order exists but the viewer lacks auth or a valid guest tracking token.
 */
export function OrderAccessDenied({ orderNumber }: OrderAccessDeniedProps) {
  return (
    <div className="min-h-screen bg-cream pb-12">
      <FlowHeader backHref="/" />
      <main className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="font-mono text-eyebrow tracking-[0.14em] text-ink-muted">ORDER ACCESS</p>
        <h1 className="mt-3 font-display text-display-md font-semibold text-forest">
          Sign in or use your email link
        </h1>
        <p className="mt-4 text-body text-ink-soft">
          Order <strong className="text-forest">#{orderNumber}</strong> can&apos;t be opened without permission.
          Use the <strong>Track order</strong> button from your order confirmation email, or sign in to the account
          that placed this order.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/login"
            className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-forest px-6 py-3 font-sans text-body-sm font-semibold uppercase tracking-wide text-cream transition hover:bg-sage"
          >
            Sign in
          </Link>
          <Link
            href="/"
            className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-line bg-paper px-6 py-3 font-sans text-body-sm font-semibold text-forest transition hover:bg-beige/40"
          >
            Back to home
          </Link>
        </div>
      </main>
    </div>
  );
}
