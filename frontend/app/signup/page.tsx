import type { Metadata } from "next";
import Link from "next/link";
import { SignupPageClient } from "@/components/auth/SignupPageClient";
import { buildPrivatePageMetadata } from "@/lib/seo/private-metadata";

export const metadata: Metadata = buildPrivatePageMetadata("Sign up");

export default function SignupPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-[420px] flex-col justify-center px-5 py-12">
      <h1 className="font-display text-display-md font-semibold text-forest">Sign up</h1>
      <SignupPageClient />
      <p className="mt-6 text-body-sm">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-forest underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
