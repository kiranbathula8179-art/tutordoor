import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Search } from "lucide-react";
import { useState } from "react";

import { PageHeader } from "@/components/shared/PageHeader";
import { Badge, statusToTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { SectionLoader } from "@/components/ui/Spinner";
import { listAdminPayments } from "@/features/admin/api";
import { Paginator } from "@/features/admin/components/Paginator";
import { cn, formatCurrency, formatDateTime } from "@/lib/utils";

const PURPOSE_LABELS: Record<string, string> = {
  booking: "1-on-1 session",
  course_enrollment: "Course",
  subscription: "Subscription",
  wallet_topup: "Wallet top-up",
};

export function AdminPaymentsPage() {
  const [purpose, setPurpose] = useState("");
  const [status, setStatus] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ["admin-payments", purpose, status, query, page],
    queryFn: () =>
      listAdminPayments({
        purpose: purpose || undefined,
        status: status || undefined,
        q: query || undefined,
        page,
      }),
  });

  const onFilter = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setPage(1);
  };

  return (
    <div>
      <PageHeader title="Payments" description="The full transaction ledger." />

      <div className="mt-5 flex flex-wrap items-end gap-2">
        <Select
          label="Purpose"
          value={purpose}
          onChange={(event) => onFilter(setPurpose)(event.target.value)}
          options={[
            { value: "", label: "All purposes" },
            { value: "booking", label: "1-on-1 sessions" },
            { value: "course_enrollment", label: "Course enrollments" },
            { value: "subscription", label: "Subscriptions" },
            { value: "wallet_topup", label: "Wallet top-ups" },
          ]}
        />
        <Select
          label="Status"
          value={status}
          onChange={(event) => onFilter(setStatus)(event.target.value)}
          options={[
            { value: "", label: "All statuses" },
            { value: "paid", label: "Paid" },
            { value: "pending", label: "Pending" },
            { value: "created", label: "Created" },
            { value: "failed", label: "Failed" },
            { value: "refunded", label: "Refunded" },
          ]}
        />
        <Input
          label="Search"
          placeholder="Payer or order id"
          leadingIcon={<Search className="h-4 w-4" />}
          value={query}
          onChange={(event) => onFilter(setQuery)(event.target.value)}
          className="w-56"
        />
      </div>

      <div className="mt-5">
        {isLoading ? (
          <SectionLoader />
        ) : isError ? (
          <Card>
            <EmptyState
              icon={AlertCircle}
              title="We couldn't load payments"
              description="Something went wrong reaching the server. Check your connection and try again."
              action={
                <Button variant="outline" onClick={() => refetch()}>
                  Retry
                </Button>
              }
            />
          </Card>
        ) : !data || data.results.length === 0 ? (
          <Card>
            <EmptyState icon={Search} title="No payments match these filters" description="Try a different search term or filter." />
          </Card>
        ) : (
          <>
            <Card className={cn(isFetching && "opacity-60")}>
              <div className="divide-y divide-line">
                {data.results.map((payment) => (
                  <div key={payment.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-navy">{payment.user_name}</p>
                      <p className="truncate text-xs text-slate-400">{payment.user_email}</p>
                    </div>
                    <Badge tone="neutral">{PURPOSE_LABELS[payment.purpose] ?? payment.purpose}</Badge>
                    <span className="w-20 text-xs uppercase tracking-wide text-slate-400">{payment.gateway}</span>
                    <span className="w-36 text-xs text-slate-400">{formatDateTime(payment.created_at)}</span>
                    <span className="w-24 text-right font-mono text-sm font-semibold text-navy">
                      {formatCurrency(payment.net_payable, payment.currency)}
                    </span>
                    <Badge tone={statusToTone(payment.status)}>{payment.status.replace("_", " ")}</Badge>
                  </div>
                ))}
              </div>
            </Card>
            <Paginator
              currentPage={data.current_page}
              totalPages={data.total_pages}
              totalCount={data.count}
              onPageChange={setPage}
            />
          </>
        )}
      </div>
    </div>
  );
}
