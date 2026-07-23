import { useQuery } from "@tanstack/react-query";
import { AlertCircle, ArrowRight, BadgeCheck, CalendarDays, TrendingUp, Users } from "lucide-react";
import { Link } from "react-router-dom";

import { DashboardHero } from "@/components/shared/DashboardHero";
import { StatCard } from "@/components/shared/StatCard";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionLoader } from "@/components/ui/Spinner";
import { apiClient } from "@/lib/api-client";
import { cn, formatCurrency } from "@/lib/utils";

interface AdminDashboardSummary {
  total_users: number;
  users_by_role: Record<string, number>;
  new_signups_this_month: number;
  pending_tutor_verifications: number;
  bookings_by_status: Record<string, number>;
  revenue_this_month: string;
  active_subscriptions: number;
}

async function fetchAdminSummary(): Promise<AdminDashboardSummary> {
  const { data } = await apiClient.get<{ summary: AdminDashboardSummary }>("/analytics/admin/dashboard/");
  return data.summary;
}

const STATUS_BAR: Record<string, string> = {
  confirmed: "bg-success",
  completed: "bg-success",
  pending: "bg-warning",
  pending_payment: "bg-warning",
  cancelled: "bg-danger",
};

function DistributionCard({
  title,
  entries,
  barClass,
}: {
  title: string;
  entries: [string, number][];
  barClass?: (key: string) => string;
}) {
  const total = entries.reduce((sum, [, count]) => sum + count, 0) || 1;
  return (
    <Card>
      <CardBody className="p-5 pt-5">
        <h2 className="font-display text-lg font-bold text-navy">{title}</h2>
        <div className="mt-4 space-y-3.5">
          {entries.map(([key, count]) => (
            <div key={key}>
              <div className="flex items-center justify-between text-sm">
                <span className="capitalize text-slate-600">{key.replace(/_/g, " ")}</span>
                <span className="font-semibold text-navy">{count}</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-3">
                <div
                  className={cn("h-full rounded-full", barClass?.(key) ?? "bg-primary")}
                  style={{ width: `${Math.max((count / total) * 100, count > 0 ? 3 : 0)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

export function AdminDashboardPage() {
  const {
    data: summary,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["admin-dashboard-summary"],
    queryFn: fetchAdminSummary,
  });

  if (isLoading) return <SectionLoader />;

  if (isError) {
    return (
      <div>
        <DashboardHero eyebrow="Admin portal" title="Platform overview" description="A live snapshot of TutorDoor right now." />
        <Card>
          <EmptyState
            icon={AlertCircle}
            title="We couldn't load the platform snapshot"
            description="Something went wrong reaching the server. Try again in a moment."
            action={
              <Button variant="outline" onClick={() => refetch()}>
                Retry
              </Button>
            }
          />
        </Card>
      </div>
    );
  }

  const totalBookings = summary
    ? Object.values(summary.bookings_by_status).reduce((sum, count) => sum + count, 0)
    : 0;

  return (
    <div>
      <DashboardHero
        eyebrow="Admin portal"
        title="Platform overview"
        description="A live snapshot of TutorDoor right now."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          tint="primary"
          label="Total users"
          value={summary?.total_users ?? 0}
          sub={`+${summary?.new_signups_this_month ?? 0} this month`}
        />
        <StatCard icon={CalendarDays} tint="info" label="Total bookings" value={totalBookings} />
        <StatCard icon={TrendingUp} tint="success" label="Revenue this month" value={formatCurrency(summary?.revenue_this_month ?? 0)} />
        <StatCard
          icon={BadgeCheck}
          tint="warning"
          label="Pending verifications"
          value={summary?.pending_tutor_verifications ?? 0}
        />
      </div>

      {(summary?.pending_tutor_verifications ?? 0) > 0 && (
        <Link
          to="/admin/verifications"
          className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary transition-colors hover:text-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          Review the verification queue <ArrowRight className="h-4 w-4" />
        </Link>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <DistributionCard title="Users by role" entries={Object.entries(summary?.users_by_role ?? {})} />
        <DistributionCard
          title="Bookings by status"
          entries={Object.entries(summary?.bookings_by_status ?? {})}
          barClass={(key) => STATUS_BAR[key] ?? "bg-slate-400"}
        />
      </div>
    </div>
  );
}
