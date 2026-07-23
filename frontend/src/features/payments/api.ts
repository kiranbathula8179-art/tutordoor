import { apiClient } from "@/lib/api-client";
import type { PaginatedResponse, Payment, PaymentPurpose, Wallet, WalletTransaction } from "@/types";

export interface GatewayInitResponse {
  requires_gateway: boolean;
  gateway?: "razorpay" | "stripe";
  // Razorpay fields
  order_id?: string;
  amount?: number;
  currency?: string;
  key_id?: string;
  // Stripe fields
  client_secret?: string;
  payment_intent_id?: string;
}

export interface InitiatePaymentPayload {
  purpose: PaymentPurpose;
  reference_id: string;
  gateway: "razorpay" | "stripe";
  coupon_code?: string;
}

export async function initiatePayment(
  payload: InitiatePaymentPayload
): Promise<{ payment: Payment; gateway: GatewayInitResponse }> {
  const { data } = await apiClient.post<{ payment: Payment; gateway: GatewayInitResponse }>("/payments/initiate/", payload);
  return data;
}

export async function confirmRazorpayPayment(payload: {
  payment_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}): Promise<Payment> {
  const { data } = await apiClient.post<{ payment: Payment }>("/payments/confirm/razorpay/", payload);
  return data.payment;
}

export interface CouponValidationResult {
  coupon: {
    id: string;
    code: string;
    description: string;
    discount_type: "percentage" | "flat";
    discount_value: string;
  };
  discount_amount: string;
}

export async function validateCoupon(payload: {
  code: string;
  order_amount: string | number;
  purpose: "all" | "booking" | "course" | "subscription";
}): Promise<CouponValidationResult> {
  const { data } = await apiClient.post<CouponValidationResult>("/payments/coupons/validate/", payload);
  return data;
}

export async function getMyWallet(): Promise<Wallet> {
  const { data } = await apiClient.get<{ wallet: Wallet }>("/payments/wallet/");
  return data.wallet;
}

export async function getWalletTransactions(category?: string): Promise<WalletTransaction[]> {
  const { data } = await apiClient.get<{ results: WalletTransaction[] }>("/payments/wallet/transactions/", {
    params: category ? { category } : undefined,
  });
  return data.results;
}

export async function topupWallet(payload: {
  amount: number;
  gateway: "razorpay" | "stripe";
}): Promise<{ payment: Payment; gateway: GatewayInitResponse }> {
  const { data } = await apiClient.post<{ payment: Payment; gateway: GatewayInitResponse }>("/payments/wallet/topup/", payload);
  return data;
}

export async function listMyPayments(params: { status?: string; purpose?: string } = {}): Promise<
  PaginatedResponse<Payment> | { results: Payment[] }
> {
  const { data } = await apiClient.get("/payments/me/", { params });
  return data;
}
