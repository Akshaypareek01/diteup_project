import type { Metadata } from "next";
import { ForgotPasswordClient } from "@/components/auth/ForgotPasswordClient";
import { buildPrivatePageMetadata } from "@/lib/seo/private-metadata";

export const metadata: Metadata = buildPrivatePageMetadata("Forgot password");

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-[420px] flex-col justify-center px-5 py-12">
      <h1 className="font-display text-display-md font-semibold text-forest">Forgot password</h1>
      <p className="mt-2 text-body-sm text-ink-muted">We email a 6-digit code when the account exists.</p>
      <ForgotPasswordClient />
    </div>
  );
}
