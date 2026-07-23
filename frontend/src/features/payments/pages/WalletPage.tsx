import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowDownLeft, ArrowUpRight, Lock, Plus, ShieldCheck, TrendingDown, TrendingUp, Wallet as WalletIcon } from "lucide-react";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";

import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { SectionLoader } from "@/components/ui/Spinner";
import { BrandMesh } from "@/components/ui/Surface";
import {
  confirmRazorpayPayment,
  getMyWallet,
  getWalletTransactions,
  topupWallet,
} from "@/features/payments/api";
import { launchRazorpayCheckout } from "@/features/payments/razorpay";
import { celebrate } from "@/lib/motion/celebrate";
import { DURATION, EASE_OUT, riseInit } from "@/lib/motion/tokens";
import { prefersReducedMotion } from "@/lib/motion/quality";
import { cn, formatCurrency, formatDate, formatDateTime, getErrorMessage } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";

/**
 * Wallet — premium rebuild. A brand-mesh balance hero with at-a-glance
 * credit/debit totals, a date-grouped ledger that reads as a trust artifact,
 * and the top-up modal. ALL payment logic — top-up flow, Razorpay signature
 * confirm, freeze gating, confirmed-success celebrations — is preserved
 * verbatim; only the presentation changed.
 */

const CATEGORY_LABELS: Record<string, string> = {
  booking_payout: "Session payout",
  course_payout: "Course payout",
  refund: "Refund",
  referral_bonus: "Referral bonus",
  coupon_credit: "Coupon credit",
  wallet_topup: "Top-up",
  withdrawal: "Withdrawal",
  manual_adjustment: "Adjustment",
  subscription_payment: "Subscription",
};

export function WalletPage({ heading = "Wallet" }: { heading?: string }) {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const still = prefersReducedMotion();
  const [topupOpen, setTopupOpen] = useState(false);
  const [topupAmount, setTopupAmount] = useState("500");
  const [isToppingUp, setIsToppingUp] = useState(false);

  const { data: wallet, isLoading: walletLoading } = useQuery({ queryKey: ["wallet"], queryFn: getMyWallet });
  const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ["wallet-transactions"],
    queryFn: () => getWalletTransactions(),
  });

  // At-a-glance totals across the loaded ledger (presentational only).
  const { credited, debited } = useMemo(() => {
    let credited = 0;
    let debited = 0;
    for (const t of transactions) {
      if (t.transaction_type === "credit") credited += Number(t.amount);
      else debited += Number(t.amount);
    }
    return { credited, debited };
  }, [transactions]);

  // Group ledger rows by day for scannability (presentational only).
  const grouped = useMemo(() => {
    const map = new Map<string, typeof transactions>();
    for (const t of transactions) {
      const key = formatDate(t.created_at);
      const list = map.get(key) ?? [];
      list.push(t);
      map.set(key, list);
    }
    return Array.from(map.entries());
  }, [transactions]);

  const refreshWallet = async () => {
    await queryClient.invalidateQueries({ queryKey: ["wallet"] });
    await queryClient.invalidateQueries({ queryKey: ["wallet-transactions"] });
  };

  const confirmMutation = useMutation({
    mutationFn: confirmRazorpayPayment,
    onSuccess: async () => {
      celebrate();
      toast.success("Wallet topped up!");
      setTopupOpen(false);
      await refreshWallet();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
    onSettled: () => setIsToppingUp(false),
  });

  const handleTopup = async () => {
    const amount = Number(topupAmount);
    if (!amount || amount < 1) {
      toast.error("Enter an amount of at least ₹1.");
      return;
    }

    setIsToppingUp(true);
    try {
      const { payment, gateway } = await topupWallet({ amount, gateway: "razorpay" });

      if (!gateway.requires_gateway) {
        celebrate();
        toast.success("Wallet topped up!");
        setTopupOpen(false);
        await refreshWallet();
        setIsToppingUp(false);
        return;
      }

      await launchRazorpayCheckout({
        keyId: gateway.key_id!,
        amount: gateway.amount!,
        currency: gateway.currency!,
        orderId: gateway.order_id!,
        description: "Wallet top-up",
        user,
        onSuccess: (response) =>
          confirmMutation.mutate({
            payment_id: payment.id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          }),
        onDismiss: () => setIsToppingUp(false),
      });
    } catch (error) {
      toast.error(getErrorMessage(error));
      setIsToppingUp(false);
    }
  };

  return (
    <div>
      <PageHeader title={heading} description="Top up once, book in a tap — every rupee on an auditable ledger." />

      {/* ------------------------------------------------ Balance hero */}
      {walletLoading ? (
        <SectionLoader />
      ) : (
        <motion.div
          initial={riseInit(16)}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: DURATION.slow, ease: EASE_OUT }}
          className="relative mt-5 overflow-hidden rounded-3xl shadow-hover"
        >
          <BrandMesh />
          <div className="relative p-6 sm:p-8">
            <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 text-white ring-1 ring-white/20">
                  <WalletIcon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-100">Available balance</p>
                  <p className="font-display text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
                    {formatCurrency(wallet?.balance ?? 0, wallet?.currency)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {wallet?.is_frozen && (
                  <span className="flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-xs font-semibold text-white">
                    <Lock className="h-3 w-3" /> Frozen
                  </span>
                )}
                <button
                  onClick={() => setTopupOpen(true)}
                  disabled={wallet?.is_frozen}
                  className="flex items-center gap-1.5 rounded-xl bg-canvas px-5 py-2.5 text-sm font-semibold text-primary shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none disabled:hover:translate-y-0"
                >
                  <Plus className="h-4 w-4" /> Add money
                </button>
              </div>
            </div>

            {/* At-a-glance in/out totals */}
            {transactions.length > 0 && (
              <div className="mt-6 grid grid-cols-2 gap-3 border-t border-white/15 pt-5">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 text-white">
                    <TrendingUp className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-xs text-blue-100">Total in</p>
                    <p className="font-display text-lg font-bold text-white">+{formatCurrency(credited)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 text-white">
                    <TrendingDown className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-xs text-blue-100">Total out</p>
                    <p className="font-display text-lg font-bold text-white">−{formatCurrency(debited)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* ------------------------------------------------ Ledger */}
      <div className="mt-8 flex items-end justify-between">
        <div>
          <h2 className="font-display text-lg font-bold text-navy">Ledger</h2>
          <p className="text-sm text-slate-500">Every movement, with the balance it left behind.</p>
        </div>
        <span className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
          <ShieldCheck className="h-3.5 w-3.5 text-success" /> Tamper-evident
        </span>
      </div>

      <div className="mt-4">
        {transactionsLoading ? (
          <SectionLoader />
        ) : transactions.length === 0 ? (
          <Card>
            <EmptyState
              icon={WalletIcon}
              title="No transactions yet"
              description="Payouts, refunds, and top-ups will appear here as they happen."
            />
          </Card>
        ) : (
          <div className="space-y-5">
            {grouped.map(([day, rows]) => (
              <div key={day}>
                <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-slate-400">{day}</p>
                <Card>
                  <ul className="divide-y divide-line">
                    {rows.map((transaction, index) => {
                      const isCredit = transaction.transaction_type === "credit";
                      return (
                        <motion.li
                          key={transaction.id}
                          initial={still ? false : { opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: still ? 0 : Math.min(index, 10) * 0.03, ease: EASE_OUT }}
                          className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-surface/50"
                        >
                          <div
                            className={cn(
                              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                              isCredit ? "bg-success-subtle text-success-dark" : "bg-surface-3 text-slate-500"
                            )}
                          >
                            {isCredit ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-navy">
                              {CATEGORY_LABELS[transaction.category] ?? transaction.category}
                            </p>
                            <p className="truncate text-xs text-slate-500">
                              {transaction.description || formatDateTime(transaction.created_at)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={cn("font-display text-sm font-bold", isCredit ? "text-success-dark" : "text-navy")}>
                              {isCredit ? "+" : "−"}
                              {formatCurrency(transaction.amount)}
                            </p>
                            <p className="text-[0.7rem] text-slate-400">Bal {formatCurrency(transaction.balance_after)}</p>
                          </div>
                        </motion.li>
                      );
                    })}
                  </ul>
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ------------------------------------------------ Top-up modal */}
      <Modal isOpen={topupOpen} onClose={() => setTopupOpen(false)} title="Add money to wallet" size="sm">
        <Input
          label="Amount (₹)"
          type="number"
          min={1}
          value={topupAmount}
          onChange={(event) => setTopupAmount(event.target.value)}
        />
        <div className="mt-3 flex gap-2">
          {[500, 1000, 2000].map((preset) => (
            <button
              key={preset}
              onClick={() => setTopupAmount(String(preset))}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                topupAmount === String(preset)
                  ? "border-primary bg-primary-subtle text-primary-dark"
                  : "border-line text-slate-600 hover:border-navy/25 hover:text-navy"
              )}
            >
              ₹{preset}
            </button>
          ))}
        </div>
        <Button className="mt-5 w-full" onClick={handleTopup} isLoading={isToppingUp}>
          Pay with Razorpay
        </Button>
        <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-slate-400">
          <Lock className="h-3 w-3" /> Secured by Razorpay · PCI-compliant
        </p>
      </Modal>
    </div>
  );
}
