import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useMutation } from "@tanstack/react-query";
import { Check, ShieldCheck, Tag, X } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  confirmRazorpayPayment,
  initiatePayment,
  validateCoupon,
  type CouponValidationResult,
} from "@/features/payments/api";
import { couponDiscount, payableTotal } from "@/features/payments/pricing";
import { launchRazorpayCheckout } from "@/features/payments/razorpay";
import { celebrate } from "@/lib/motion/celebrate";
import { env } from "@/lib/env";
import { cn, formatCurrency, getErrorMessage, sleep } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import type { PaymentPurpose } from "@/types";

const stripePromise = env.stripePublicKey ? loadStripe(env.stripePublicKey) : null;

interface CheckoutPanelProps {
  purpose: PaymentPurpose;
  referenceId: string;
  amount: string | number;
  currency: string;
  couponPurpose: "booking" | "course" | "subscription";
  description: string;
  /** Called once the payment is fully confirmed (or covered by a coupon). */
  onFinished: () => Promise<void> | void;
  /** For Stripe: repeatedly checks whether the server-side webhook has landed.
   *  Return true once confirmed. Omit to finish immediately after client success. */
  pollConfirmed?: () => Promise<boolean>;
}

export function CheckoutPanel({
  purpose,
  referenceId,
  amount,
  currency,
  couponPurpose,
  description,
  onFinished,
  pollConfirmed,
}: CheckoutPanelProps) {
  const user = useAuthStore((state) => state.user);

  const [gateway, setGateway] = useState<"razorpay" | "stripe">("razorpay");
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<CouponValidationResult | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(null);

  const discount = appliedCoupon ? couponDiscount(appliedCoupon.discount_amount) : 0;
  const totalPayable = payableTotal(amount, discount);

  const applyCouponMutation = useMutation({
    mutationFn: () => validateCoupon({ code: couponInput.trim(), order_amount: amount, purpose: couponPurpose }),
    onSuccess: (result) => {
      setAppliedCoupon(result);
      toast.success(`Coupon applied — you save ${formatCurrency(result.discount_amount, currency)}`);
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const handleStripeClientSuccess = async () => {
    if (!pollConfirmed) {
      celebrate();
      await onFinished();
      return;
    }
    for (let attempt = 0; attempt < 8; attempt++) {
      if (await pollConfirmed()) {
        celebrate();
        await onFinished();
        return;
      }
      await sleep(1500);
    }
    toast.success("Payment received — confirmation will appear shortly.");
    await onFinished();
  };

  const handlePay = async () => {
    setIsPaying(true);
    try {
      const { payment, gateway: gatewayInit } = await initiatePayment({
        purpose,
        reference_id: referenceId,
        gateway,
        coupon_code: appliedCoupon?.coupon.code,
      });

      if (!gatewayInit.requires_gateway) {
        // Coupon fully covered the amount — backend marked it paid already.
        celebrate();
        await onFinished();
        return;
      }

      if (gateway === "razorpay") {
        await launchRazorpayCheckout({
          keyId: gatewayInit.key_id!,
          amount: gatewayInit.amount!,
          currency: gatewayInit.currency!,
          orderId: gatewayInit.order_id!,
          description,
          user,
          onSuccess: async (response) => {
            try {
              await confirmRazorpayPayment({
                payment_id: payment.id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });
              celebrate();
              await onFinished();
            } catch (error) {
              toast.error(getErrorMessage(error));
            } finally {
              setIsPaying(false);
            }
          },
          onDismiss: () => setIsPaying(false),
        });
      } else {
        setStripeClientSecret(gatewayInit.client_secret!);
        setIsPaying(false);
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
      setIsPaying(false);
    }
  };

  return (
    <div>
      {/* ------------------------------------------------ Order summary */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-400">{description}</span>
          <span className="font-mono text-navy">{formatCurrency(amount, currency)}</span>
        </div>
        {appliedCoupon && (
          <div className="flex justify-between text-primary">
            <span className="flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5" /> Coupon {appliedCoupon.coupon.code}
              <button
                onClick={() => {
                  setAppliedCoupon(null);
                  setCouponInput("");
                }}
                aria-label="Remove coupon"
                className="rounded-full p-0.5 hover:bg-surface-3"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
            <span className="font-mono">-{formatCurrency(discount, currency)}</span>
          </div>
        )}
        <div className="flex items-baseline justify-between border-t border-line pt-3">
          <span className="font-semibold text-navy">Total</span>
          <span className="font-mono text-xl font-bold text-navy">{formatCurrency(totalPayable, currency)}</span>
        </div>
      </div>

      {/* ------------------------------------------------ Coupon */}
      {!appliedCoupon && !stripeClientSecret && (
        <div className="mt-5 flex items-end gap-2">
          <Input
            label="Have a coupon?"
            placeholder="e.g. WELCOME10"
            value={couponInput}
            onChange={(event) => setCouponInput(event.target.value.toUpperCase())}
          />
          <Button
            variant="outline"
            onClick={() => applyCouponMutation.mutate()}
            isLoading={applyCouponMutation.isPending}
            disabled={!couponInput.trim()}
          >
            Apply
          </Button>
        </div>
      )}

      {/* ------------------------------------------------ Gateway + pay */}
      {!stripeClientSecret && (
        <>
          <p className="mt-6 text-sm font-medium text-navy">Pay with</p>
          <div className="mt-2 grid grid-cols-2 gap-3" role="radiogroup" aria-label="Payment method">
            <button
              type="button"
              role="radio"
              aria-checked={gateway === "razorpay"}
              onClick={() => setGateway("razorpay")}
              className={cn(
                "relative rounded-xl border p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                gateway === "razorpay" ? "border-primary bg-primary-subtle shadow-soft" : "border-line hover:border-navy/25 hover:shadow-soft"
              )}
            >
              {gateway === "razorpay" && (
                <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white">
                  <Check className="h-3 w-3" />
                </span>
              )}
              <p className="font-semibold text-navy">Razorpay</p>
              <p className="mt-0.5 text-xs text-slate-500">UPI · Cards · Netbanking · Wallets</p>
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={gateway === "stripe"}
              onClick={() => setGateway("stripe")}
              disabled={!stripePromise}
              className={cn(
                "relative rounded-xl border p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-50",
                gateway === "stripe" ? "border-primary bg-primary-subtle shadow-soft" : "border-line hover:border-navy/25 hover:shadow-soft"
              )}
            >
              {gateway === "stripe" && (
                <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white">
                  <Check className="h-3 w-3" />
                </span>
              )}
              <p className="font-semibold text-navy">Card (Stripe)</p>
              <p className="mt-0.5 text-xs text-slate-400">{stripePromise ? "International cards" : "Not configured"}</p>
            </button>
          </div>

          <Button className="mt-6 w-full" size="lg" onClick={handlePay} isLoading={isPaying}>
            Pay {formatCurrency(totalPayable, currency)}
          </Button>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5" /> Secured by the payment gateway — TutorDoor never sees your card
            details.
          </p>
        </>
      )}

      {/* ------------------------------------------------ Stripe stage */}
      {stripeClientSecret && stripePromise && (
        <div className="mt-6">
          <Elements stripe={stripePromise} options={{ clientSecret: stripeClientSecret }}>
            <StripeForm
              amountLabel={formatCurrency(totalPayable, currency)}
              onSucceeded={handleStripeClientSuccess}
              onCancel={() => setStripeClientSecret(null)}
            />
          </Elements>
        </div>
      )}
    </div>
  );
}

function StripeForm({
  amountLabel,
  onSucceeded,
  onCancel,
}: {
  amountLabel: string;
  onSucceeded: () => Promise<void>;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!stripe || !elements) return;
    setIsSubmitting(true);

    const { error, paymentIntent } = await stripe.confirmPayment({ elements, redirect: "if_required" });

    if (error) {
      toast.error(error.message ?? "Payment failed. Please try again.");
      setIsSubmitting(false);
      return;
    }

    if (paymentIntent?.status === "succeeded" || paymentIntent?.status === "processing") {
      await onSucceeded();
    } else {
      toast.error("Payment did not complete. Please try again.");
    }
    setIsSubmitting(false);
  };

  return (
    <div>
      <PaymentElement />
      <div className="mt-5 flex gap-3">
        <Button variant="ghost" onClick={onCancel} disabled={isSubmitting}>
          Back
        </Button>
        <Button className="flex-1" onClick={handleSubmit} isLoading={isSubmitting} disabled={!stripe}>
          Pay {amountLabel}
        </Button>
      </div>
    </div>
  );
}
