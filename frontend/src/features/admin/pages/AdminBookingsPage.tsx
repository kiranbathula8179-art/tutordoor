import { useQuery } from "@tanstack/react-query";
import { AlertCircle, ArrowRight, Search } from "lucide-react";
import { useState } from "react";

import { PageHeader } from "@/components/shared/PageHeader";
import { Badge, statusToTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { SectionLoader } from "@/components/ui/Spinner";
import { Tabs } from "@/components/ui/Tabs";
import { listAdminBookings } from "@/features/admin/api";
import { Paginator } from "@/features/admin/components/Paginator";
import { cn, formatCurrency, formatDateTime } from "@/lib/utils";

const STATUS_TABS = [
  { key: "", label: "All" },
  { key: "pending_payment", label: "Pending payment" },
  { key: "confirmed", label: "Confirmed" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
] as const;

export function AdminBookingsPage() {
  const [status, setStatus] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ["admin-bookings", status, query, page],
    queryFn: () => listAdminBookings({ status: status || undefined, q: query || undefined, page }),
  });

  return (
    <div>
      <PageHeader title="Bookings" description="Every 1-on-1 session across the platform." />

      <div className="mt-5 flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex flex-wrap gap-1 border-b border-line">
          <Tabs
            items={STATUS_TABS.map(({ key, label }) => ({ value: key, label }))}
            value={status}
            onChange={(value) => {
              setStatus(value);
              setPage(1);
            }}
          />
        </div>
        <Input
          placeholder="Search student or tutor"
          leadingIcon={<Search className="h-4 w-4" />}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setPage(1);
          }}
          className="ml-auto w-60"
        />
      </div>

      <div className="mt-5">
        {isLoading ? (
          <SectionLoader />
        ) : isError ? (
          <Card>
            <EmptyState
              icon={AlertCircle}
              title="We couldn't load bookings"
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
            <EmptyState icon={Search} title="No bookings match these filters" description="Try a different search term or filter." />
          </Card>
        ) : (
          <>
            <Card className={cn(isFetching && "opacity-60")}>
              <div className="divide-y divide-line">
                {data.results.map((booking) => (
                  <div key={booking.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                    <div className="flex min-w-0 flex-1 items-center gap-2 text-sm">
                      <span className="truncate font-semibold text-navy">{booking.student.user.full_name}</span>
                      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span className="truncate font-semibold text-navy">{booking.tutor.user.full_name}</span>
                      {booking.is_demo && <Badge tone="gold">Demo</Badge>}
                    </div>
                    <span className="w-32 truncate text-xs text-slate-400">{booking.subject?.name ?? "—"}</span>
                    <span className="w-36 text-xs text-slate-400">{formatDateTime(booking.start_time)}</span>
                    <span className="w-20 text-right font-mono text-sm text-navy">
                      {formatCurrency(booking.price, booking.currency)}
                    </span>
                    <Badge tone={statusToTone(booking.status)}>{booking.status.replace("_", " ")}</Badge>
                    <Badge tone={statusToTone(booking.payment_status)}>
                      {booking.payment_status.replace("_", " ")}
                    </Badge>
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
