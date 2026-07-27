import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { AlertCircle, ArrowRight, Building2, CalendarClock, Star, TrendingUp, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

import { DashboardHero } from "@/components/shared/DashboardHero";
import { OnboardingChecklist } from "@/components/shared/OnboardingChecklist";
import { StatCard } from "@/components/shared/StatCard";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { listMyInstituteInvites, respondToInstituteInvite } from "@/features/institute/api";
import { apiClient } from "@/lib/api-client";
import { DURATION, EASE_OUT, motionSafe, riseInit } from "@/lib/motion/tokens";
import { formatCurrency, getErrorMessage } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";

interface TutorDashboardSummary {
  upcoming_sessions: number;
  total_earnings: string;
  wallet_balance: string;
  rating_average: string;
  rating_count: number;
  total_sessions_completed: number;
  completion_rate_percent: number;
}

async function fetchTutorSummary(): Promise<TutorDashboardSummary> {
  const { data } = await apiClient.get<{ summary: TutorDashboardSummary }>("/analytics/tutor/dashboard/");
  return data.summary;
}

export function TutorDashboardPage() {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const {
    data: summary,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["tutor-dashboard-summary"],
    queryFn: fetchTutorSummary,
    retry: false,
  });

  const { data: instituteLinks = [] } = useQuery({
    queryKey: ["my-institute-invites"],
    queryFn: listMyInstituteInvites,
    retry: false,
  });
  const pendingInvites = instituteLinks.filter((link) => link.status === "pending");

  const rise = (delay: number) => ({
    initial: riseInit(18),
    animate: { opacity: 1, y: 0 },
    transition: motionSafe({ duration: DURATION.slow, delay, ease: EASE_OUT }),
  });

  // Derived entirely from the summary this page already fetches — no new query.
  const hasBooking = (summary?.upcoming_sessions ?? 0) > 0 || (summary?.total_sessions_completed ?? 0) > 0;
  const hasEarnings = Number(summary?.total_earnings ?? 0) > 0;

  const respondMutation = useMutation({
    mutationFn: ({ instituteId, accept }: { instituteId: string; accept: boolean }) =>
      respondToInstituteInvite(instituteId, accept),
    onSuccess: (_, variables) => {
      toast.success(variables.accept ? "You've joined the institute." : "Invitation declined.");
      queryClient.invalidateQueries({ queryKey: ["my-institute-invites"] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return (
    <div>
      <DashboardHero
        eyebrow="Tutor portal"
        title={`Welcome back, ${user?.first_name ?? "there"}`}
        description="Here's how your teaching practice is doing."
        action={
          !user?.is_email_verified ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold text-white">
              Email not verified
            </span>
          ) : undefined
        }
      />

      {pendingInvites.length > 0 && (
        <Card className="mb-6 border-accent/30 bg-accent-subtle">
          <CardBody className="p-5 pt-5">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold text-navy">
              <Building2 className="h-5 w-5 text-accent-dark" /> Institute invitations
            </h2>
            <div className="mt-3 space-y-3">
              {pendingInvites.map((invite) => (
                <div key={invite.id} className="flex flex-wrap items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-navy">{invite.institute.institute_name}</p>
                    <p className="text-xs text-slate-500">
                      {invite.role_title || "Faculty"}
                      {invite.institute.city ? ` · ${invite.institute.city}` : ""}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => respondMutation.mutate({ instituteId: invite.institute.id, accept: true })}
                    isLoading={respondMutation.isPending}
                  >
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => respondMutation.mutate({ instituteId: invite.institute.id, accept: false })}
                    disabled={respondMutation.isPending}
                  >
                    Decline
                  </Button>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {isError ? (
        <motion.div {...rise(0.08)}>
          <Card>
            <EmptyState
              icon={AlertCircle}
              title="We couldn't load your stats"
              description="Something went wrong reaching the server. Try again in a moment."
              action={
                <Button variant="outline" onClick={() => refetch()}>
                  Retry
                </Button>
              }
            />
          </Card>
        </motion.div>
      ) : (
        <>
          <motion.div {...rise(0.08)} className="mb-6">
            <OnboardingChecklist
              title="Getting started"
              steps={[
                { label: "Get your first booking", done: hasBooking, to: "/tutor/availability" },
                { label: "Reach your first payout", done: hasEarnings, to: "/tutor/earnings" },
              ]}
            />
          </motion.div>

          <motion.div {...rise(0.1)} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={CalendarClock} tint="primary" label="Upcoming sessions" value={summary?.upcoming_sessions ?? 0} isLoading={isLoading} />
            <StatCard
              icon={Star}
              tint="accent"
              label="Rating"
              value={Number(summary?.rating_average ?? 0).toFixed(1)}
              sub={`${summary?.rating_count ?? 0} review${(summary?.rating_count ?? 0) === 1 ? "" : "s"}`}
              isLoading={isLoading}
            />
            <StatCard icon={TrendingUp} tint="success" label="Completion rate" value={`${summary?.completion_rate_percent ?? 0}%`} isLoading={isLoading} />
            <StatCard icon={Wallet} tint="info" label="Wallet balance" value={formatCurrency(summary?.wallet_balance ?? 0)} isLoading={isLoading} />
          </motion.div>

          {/* Earnings spotlight */}
          <motion.div {...rise(0.18)} className="mt-6 rounded-2xl border border-primary/20 bg-primary-subtle p-6 sm:p-8">
            <div className="flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm font-medium text-primary-dark">Total earnings to date</p>
                <p className="mt-1 font-display text-4xl font-extrabold tracking-tight text-navy">
                  {formatCurrency(summary?.total_earnings ?? 0)}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Link to="/tutor/availability">
                  <Button variant="secondary">Manage availability</Button>
                </Link>
                <Link
                  to="/tutor/earnings"
                  className="flex items-center gap-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-primary-dark transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                >
                  View ledger <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}
