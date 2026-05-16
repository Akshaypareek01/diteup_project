/* eslint-disable @typescript-eslint/consistent-type-definitions */
export {};

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
    }) => { open: () => void };
  }
}
