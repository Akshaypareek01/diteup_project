"use client";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

export type CheckoutErrorDialogProps = {
  message: string | null;
  open: boolean;
  onClose: () => void;
};

/**
 * Blocking checkout error dialog so validation/payment messages are not buried below the form.
 */
export function CheckoutErrorDialog({ message, open, onClose }: CheckoutErrorDialogProps) {
  return (
    <Modal open={open && Boolean(message)} title="Can't place order" onClose={onClose}>
      <p className="text-body text-forest" role="alert">
        {message}
      </p>
      <Button
        type="button"
        variant="primaryGold"
        size="lg"
        className="mt-6 w-full rounded-2xl"
        onClick={onClose}
      >
        OK
      </Button>
    </Modal>
  );
}

/**
 * Compact error next to Place order — visible where the shopper actually taps.
 */
export function CheckoutOrderErrorBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p
      className="rounded-xl border border-error/40 bg-paper px-3 py-2 text-center text-body-sm font-medium text-error shadow-sm"
      role="alert"
    >
      {message}
    </p>
  );
}
