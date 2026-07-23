import { loadScript } from "@/lib/load-script";
import type { User } from "@/types";

export interface RazorpayCheckoutResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description?: string;
  prefill?: { name?: string; email?: string };
  theme?: { color?: string };
  handler: (response: RazorpayCheckoutResponse) => void;
  modal?: { ondismiss?: () => void };
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => { open: () => void };
  }
}

interface LaunchArgs {
  keyId: string;
  amount: number;
  currency: string;
  orderId: string;
  description: string;
  user: User | null;
  onSuccess: (response: RazorpayCheckoutResponse) => void;
  onDismiss: () => void;
}

/** Loads Checkout.js (once) and opens the Razorpay payment sheet. */
export async function launchRazorpayCheckout(args: LaunchArgs): Promise<void> {
  await loadScript("https://checkout.razorpay.com/v1/checkout.js");

  const razorpay = new window.Razorpay({
    key: args.keyId,
    amount: args.amount,
    currency: args.currency,
    order_id: args.orderId,
    name: "TutorDoor",
    description: args.description,
    prefill: { name: args.user?.full_name, email: args.user?.email },
    theme: { color: "#2563EB" },
    handler: args.onSuccess,
    modal: { ondismiss: args.onDismiss },
  });
  razorpay.open();
}
