/* eslint-disable @typescript-eslint/consistent-type-definitions */
export {};

type RazorpayPaymentFailedResponse = {
  error?: {
    description?: string;
    reason?: string;
    code?: string;
  };
};

type RazorpayCheckoutInstance = {
  open: () => void;
  on: (event: "payment.failed", handler: (response: RazorpayPaymentFailedResponse) => void) => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: {
      key: string;
      amount: number;
      currency: string;
      order_id: string;
      name: string;
      description?: string;
      handler: (response: {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
      }) => void;
      modal?: { ondismiss?: () => void };
      prefill?: { email?: string; contact?: string };
    }) => RazorpayCheckoutInstance;
  }
}

export type { RazorpayPaymentFailedResponse, RazorpayCheckoutInstance };
