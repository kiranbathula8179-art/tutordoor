import { useQuery } from "@tanstack/react-query";
import { format, subDays } from "date-fns";
import { motion } from "framer-motion";
import { AlertCircle, BarChart3 } from "lucide-react";
import { useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { PageHeader } from "@/components/shared/PageHeader";
import { StarRating } from "@/components/shared/StarRating";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { SectionLoader } from "@/components/ui/Spinner";
import {
  getMetricsTrend,
  getRevenueReport,
  getTopSubjects,
  getTopTutors,
} from "@/features/admin/api";
import { DURATION, EASE_OUT, riseInit } from "@/lib/motion/tokens";
import { formatCurrency, formatDate } from "@/lib/utils";

const COLORS = {
  board: "#2563EB",
  penRed: "#06B6D4",
  gold: "#F97316",
  inkFaint: "#94A3B8",
};

const PURPOSE_LABELS: Record<string, string> = {
  booking: "1-on-1 sessions",
  course_enrollment: "Course enrollments",
  subscription: "Subscriptions",
  wallet_topup: "Wallet top-ups",
};

export function AdminReportsPage() {
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 29), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const {
    data: trend = [],
    isLoading: trendLoading,
    isError: trendError,
    refetch: refetchTrend,
  } = useQuery({
    queryKey: ["admin-metrics-trend", startDate, endDate],
    queryFn: () => getMetricsTrend(startDate, endDate),
    enabled: !!startDate && !!endDate,
  });

  const {
    data: revenueRows = [],
    isLoading: revenueLoading,
    isError: revenueError,
    refetch: refetchRevenue,
  } = useQuery({
    queryKey: ["admin-revenue-report", startDate, endDate],
    queryFn: () => getRevenueReport(startDate, endDate),
    enabled: !!startDate && !!endDate,
  });

  const {
    data: topTutors = [],
    isLoading: topTutorsLoading,
    isError: topTutorsError,
    refetch: refetchTopTutors,
  } = useQuery({ queryKey: ["admin-top-tutors"], queryFn: () => getTopTutors(8) });

  const {
    data: topSubjects = [],
    isLoading: topSubjectsLoading,
    isError: topSubjectsError,
    refetch: refetchTopSubjects,
  } = useQuery({ queryKey: ["admin-top-subjects"], queryFn: () => getTopSubjects(8) });

  const chartData = trend.map((row) => ({
    date: format(new Date(row.date), "d MMM"),
    gmv: Number(row.gross_merchandise_value),
    platformRevenue: Number(row.platform_revenue),
    created: row.total_bookings_created,
    completed: row.completed_bookings,
    cancelled: row.cancelled_bookings,
    signups: row.new_signups,
  }));

  const revenueTotal = revenueRows.reduce((sum, row) => sum + Number(row.total_amount), 0);
  const maxSubjectCount = Math.max(1, ...topSubjects.map((subject) => subject.booking_count));

  return (
    <motion.div
      initial={riseInit(16)}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DURATION.slow, ease: EASE_OUT }}
    >
      <PageHeader
        title="Reports"
        description="Daily platform snapshots, revenue, and leaderboards."
        actions={
          <div className="flex items-end gap-2">
            <Input label="From" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
            <Input label="To" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
          </div>
        }
      />

      {/* ------------------------------------------------ Trend charts */}
      {trendLoading ? (
        <SectionLoader />
      ) : trendError ? (
        <Card className="mt-6">
          <EmptyState
            icon={AlertCircle}
            title="We couldn't load the trend data"
            description="Something went wrong reaching the server. Check your connection and try again."
            action={
              <Button variant="outline" onClick={() => refetchTrend()}>
                Retry
              </Button>
            }
          />
        </Card>
      ) : chartData.length === 0 ? (
        <Card className="mt-6">
          <CardBody className="flex flex-col items-center gap-3 py-14 text-center">
            <BarChart3 className="h-8 w-8 text-slate-400" />
            <p className="font-medium text-navy">No snapshots in this range yet</p>
            <p className="max-w-md text-sm text-slate-500">
              Daily metrics are captured by the scheduled snapshot task (Celery beat) — data appears from the first
              full day the workers run.
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <Card>
            <CardBody>
              <h2 className="font-display text-lg font-bold text-navy">Revenue trend</h2>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1B2B2612" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: COLORS.inkFaint }} />
                    <YAxis tick={{ fontSize: 11, fill: COLORS.inkFaint }} width={56} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="gmv" name="GMV" stroke={COLORS.board} strokeWidth={2} dot={false} />
                    <Line
                      type="monotone"
                      dataKey="platformRevenue"
                      name="Platform revenue"
                      stroke={COLORS.penRed}
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <h2 className="font-display text-lg font-bold text-navy">Activity trend</h2>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1B2B2612" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: COLORS.inkFaint }} />
                    <YAxis tick={{ fontSize: 11, fill: COLORS.inkFaint }} width={40} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="created" name="Bookings created" stroke={COLORS.board} strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="completed" name="Completed" stroke={COLORS.gold} strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="signups" name="New signups" stroke={COLORS.penRed} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* ------------------------------------------------ Revenue by purpose */}
      <Card className="mt-6">
        <CardBody>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-lg font-bold text-navy">Revenue by purpose</h2>
            <p className="text-sm text-slate-500">
              {formatDate(startDate)} – {formatDate(endDate)} ·{" "}
              <span className="font-mono font-semibold text-navy">{formatCurrency(revenueTotal)}</span> total
            </p>
          </div>
          {revenueLoading ? (
            <SectionLoader />
          ) : revenueError ? (
            <EmptyState
              icon={AlertCircle}
              title="We couldn't load revenue"
              description="Something went wrong reaching the server. Check your connection and try again."
              action={
                <Button variant="outline" onClick={() => refetchRevenue()}>
                  Retry
                </Button>
              }
            />
          ) : revenueRows.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No paid transactions in this range.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {revenueRows.map((row) => {
                const share = revenueTotal > 0 ? (Number(row.total_amount) / revenueTotal) * 100 : 0;
                return (
                  <div key={row.purpose}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-navy">{PURPOSE_LABELS[row.purpose] ?? row.purpose}</span>
                      <span className="font-mono text-navy">
                        {formatCurrency(row.total_amount)}{" "}
                        <span className="text-xs text-slate-400">({row.transaction_count} txns)</span>
                      </span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-pill bg-surface-3">
                      <div className="h-full rounded-pill bg-primary" style={{ width: `${share}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>

      {/* ------------------------------------------------ Leaderboards */}
      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardBody>
            <h2 className="font-display text-lg font-bold text-navy">Top tutors</h2>
            {topTutorsLoading ? (
              <SectionLoader />
            ) : topTutorsError ? (
              <EmptyState
                icon={AlertCircle}
                title="We couldn't load top tutors"
                description="Something went wrong reaching the server."
                action={
                  <Button variant="outline" size="sm" onClick={() => refetchTopTutors()}>
                    Retry
                  </Button>
                }
              />
            ) : topTutors.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">No tutor activity yet.</p>
            ) : (
              <div className="mt-3 divide-y divide-line">
                {topTutors.map((tutor, index) => (
                  <div key={tutor.id} className="flex items-center gap-3 py-3">
                    <span className="w-6 text-center font-mono text-sm font-semibold text-slate-400">{index + 1}</span>
                    <Avatar
                      src={tutor.user.avatar}
                      firstName={tutor.user.first_name}
                      lastName={tutor.user.last_name}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-navy">{tutor.user.full_name}</p>
                      <p className="text-xs text-slate-400">
                        {tutor.total_sessions_completed} sessions{tutor.city ? ` · ${tutor.city}` : ""}
                      </p>
                    </div>
                    <StarRating rating={Number(tutor.rating_average)} size="sm" />
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h2 className="font-display text-lg font-bold text-navy">Top subjects</h2>
            {topSubjectsLoading ? (
              <SectionLoader />
            ) : topSubjectsError ? (
              <EmptyState
                icon={AlertCircle}
                title="We couldn't load top subjects"
                description="Something went wrong reaching the server."
                action={
                  <Button variant="outline" size="sm" onClick={() => refetchTopSubjects()}>
                    Retry
                  </Button>
                }
              />
            ) : topSubjects.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">No bookings with subjects yet.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {topSubjects.map((subject) => (
                  <div key={subject.subject__name}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-navy">{subject.subject__name}</span>
                      <span className="font-mono text-xs text-slate-400">{subject.booking_count} bookings</span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-pill bg-surface-3">
                      <div
                        className="h-full rounded-pill bg-gold-star"
                        style={{ width: `${(subject.booking_count / maxSubjectCount) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </motion.div>
  );
}
