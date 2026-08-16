"use client";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

export type BuyNowAuthDialogProps = {
  open: boolean;
  onClose: () => void;
  onLogin: () => void;
  onGuestCheckout: () => void;
  onCreateAccount: () => void;
};

/**
 * Guest Buy-now gate: log in, create an account, or continue to checkout without signing in.
 */
export function BuyNowAuthDialog({
  open,
  onClose,
  onLogin,
  onGuestCheckout,
  onCreateAccount,
}: BuyNowAuthDialogProps) {
  return (
    <Modal open={open} title="How do you want to checkout?" onClose={onClose}>
      <p className="text-body text-ink-soft">
        Log in to use saved addresses, or continue as a guest.
      </p>
      <div className="mt-6 flex flex-col gap-3">
        <Button
          type="button"
          variant="primaryForest"
          size="lg"
          className="w-full rounded-xl"
          onClick={onLogin}
        >
          Log in
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="lg"
          className="w-full rounded-xl"
          onClick={onGuestCheckout}
        >
          Continue as guest
        </Button>
      </div>
      <p className="mt-4 text-center text-body-sm text-ink-muted">
        New here?{" "}
        <button
          type="button"
          className="font-semibold text-forest underline underline-offset-2"
          onClick={onCreateAccount}
        >
          Create account
        </button>
      </p>
    </Modal>
  );
}
