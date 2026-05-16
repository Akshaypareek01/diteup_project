import { ResetPasswordClient } from "@/components/auth/ResetPasswordClient";

export default function ResetPasswordPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-[420px] flex-col justify-center px-5 py-12">
      <h1 className="font-display text-display-md font-semibold text-forest">Reset password</h1>
      <p className="mt-2 text-body-sm text-ink-muted">Enter the code from your email and choose a new password.</p>
      <ResetPasswordClient />
    </div>
  );
}
