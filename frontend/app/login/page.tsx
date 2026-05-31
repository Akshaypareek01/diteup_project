import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { buildPrivatePageMetadata } from "@/lib/seo/private-metadata";

export const metadata: Metadata = buildPrivatePageMetadata("Log in");

export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-[420px] flex-col justify-center px-5 py-12">
      <h1 className="font-display text-display-md font-semibold text-forest">Log in</h1>
      <Suspense fallback={<p className="mt-6 text-body-sm text-ink-muted">Loading…</p>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
