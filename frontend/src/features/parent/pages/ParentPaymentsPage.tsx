import { useQuery } from "@tanstack/react-query";
import { AlertCircle, CreditCard } from "lucide-react";

import { PageHeader } from "@/components/shared/PageHeader";
import { Badge, statusToTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionLoader } from "@/components/ui/Spinner";
import { listMyPayments } from "@/features/payments/api";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { Payment } from "@/types";

const PURPOSE_LABELS: Record<string, string> = {
  booking: "1-on-1 session",
  course_enrollment: "Course enrollment",
  subscription: "Subscription",
  wallet_topup: "Wallet top-up",
};

export function ParentPaymentsPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["my-payments"],
    queryFn: () => listMyPayments(),
  });

  const payments: Payment[] = data && "results" in data ? data.results : [];

  return (
    <div>
      <PageHeader title="Payments" description="Everything paid from this account, newest first." />

      <div className="mt-6">
        {isLoading ? (
          <SectionLoader />
        ) : isError ? (
          <Card>
            <EmptyState
              icon={AlertCircle}
              title="We couldn't load your payments"
              description="Something went wrong reaching the server. Check your connection and try again."
              action={
                <Button variant="outline" onClick={() => refetch()}>
                  Retry
                </Button>
              }
            />
          </Card>
        ) : payments.length === 0 ? (
          <Card>
            <EmptyState
              icon={CreditCard}
              title="No payments yet"
              description="Payments for your children's sessions and courses will appear here."
            />
          </Card>
        ) : (
          <Card>
            <div className="divide-y divide-line">
              {payments.map((payment) => (
                <div key={payment.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-navy">
                      {PURPOSE_LABELS[payment.purpose] ?? payment.purpose}
                    </p>
                    <p className="text-xs text-slate-400">{formatDateTime(payment.created_at)}</p>
                  </div>
                  <span className="text-xs uppercase tracking-wide text-slate-400">{payment.gateway}</span>
                  <Badge tone={statusToTone(payment.status)}>{payment.status.replace("_", " ")}</Badge>
                  <p className="w-24 text-right font-mono text-sm font-semibold text-navy">
                    {formatCurrency(payment.net_payable, payment.currency)}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
