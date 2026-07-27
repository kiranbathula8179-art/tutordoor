import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CalendarDays,
  Clock,
  GraduationCap,
  MessageSquare,
  Search,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Link } from "react-router-dom";

import { DashboardHero } from "@/components/shared/DashboardHero";
import { OnboardingChecklist } from "@/components/shared/OnboardingChecklist";
import { StatCard } from "@/components/shared/StatCard";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { apiClient } from "@/lib/api-client";
import { DURATION, EASE_OUT, motionSafe, riseInit } from "@/lib/motion/tokens";
import { useAuthStore } from "@/store/auth-store";

interface StudentDashboardSummary {
  upcoming_sessions: number;
  total_sessions_completed: number;
  total_hours_learned: string;
  active_course_enrollments: number;
}

async function fetchStudentSummary(): Promise<StudentDashboardSummary> {
  const { data } = await apiClient.get<{ summary: StudentDashboardSummary }>("/analytics/student/dashboard/");
  return data.summary;
}

const QUICK_ACTIONS = [
  { icon: Search, label: "Find a tutor", desc: "Browse verified profiles", to: "/search", tint: "text-primary bg-primary-subtle" },
  { icon: CalendarDays, label: "My bookings", desc: "Upcoming & past sessions", to: "/student/bookings", tint: "text-success-dark bg-success-subtle" },
  { icon: BookOpen, label: "My courses", desc: "Group learning", to: "/student/courses", tint: "text-accent-dark bg-accent-subtle" },
  { icon: MessageSquare, label: "Messages", desc: "Chat with tutors", to: "/student/chat", tint: "text-info-dark bg-info-subtle" },
] as const;

export function StudentDashboardPage() {
  const user = useAuthStore((state) => state.user);
  const {
    data: summary,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["student-dashboard-summary"],
    queryFn: fetchStudentSummary,
    retry: false,
  });

  const rise = (delay: number) => ({
    initial: riseInit(18),
    animate: { opacity: 1, y: 0 },
    transition: motionSafe({ duration: DURATION.slow, delay, ease: EASE_OUT }),
  });

  // Derived entirely from the summary this page already fetches — no new
  // query. Collapses on its own once both steps are done.
  const hasBooked = (summary?.upcoming_sessions ?? 0) > 0 || (summary?.total_sessions_completed ?? 0) > 0;
  const hasJoinedCourse = (summary?.active_course_enrollments ?? 0) > 0;

  return (
    <div className="space-y-6">
      <DashboardHero
        eyebrow="Student portal"
        title={`Welcome back, ${user?.first_name ?? "there"}`}
        description="Here's where your learning stands today — pick up right where you left off."
        action={
          <Link
            to="/search"
            className="inline-flex items-center gap-1.5 rounded-xl bg-canvas px-5 py-2.5 text-sm font-semibold text-primary shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          >
            <Search className="h-4 w-4" /> Find a tutor
          </Link>
        }
      />

      {/* ---------------------------------------------- Stats */}
      {isError ? (
        <motion.div {...rise(0.08)}>
          <Card>
            <EmptyState
              icon={AlertCircle}
              title="We couldn't load your stats"
              description="Something went wrong reaching the server. Your bookings and courses below are unaffected."
              action={
                <Button variant="outline" onClick={() => refetch()}>
                  Retry
                </Button>
              }
            />
          </Card>
        </motion.div>
      ) : (
        <motion.div {...rise(0.08)} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Clock} tint="primary" label="Upcoming sessions" value={summary?.upcoming_sessions ?? 0} isLoading={isLoading} />
          <StatCard icon={GraduationCap} tint="success" label="Sessions completed" value={summary?.total_sessions_completed ?? 0} isLoading={isLoading} />
          <StatCard icon={BookOpen} tint="accent" label="Active courses" value={summary?.active_course_enrollments ?? 0} isLoading={isLoading} />
          <StatCard icon={TrendingUp} tint="info" label="Hours learned" value={Number(summary?.total_hours_learned ?? 0).toFixed(1)} isLoading={isLoading} />
        </motion.div>
      )}

      {/* ---------------------------------------------- Getting started */}
      {!isError && (
        <motion.div {...rise(0.12)}>
          <OnboardingChecklist
            title="Getting started"
            steps={[
              { label: "Book your first session with a tutor", done: hasBooked, to: "/search" },
              { label: "Join a group course", done: hasJoinedCourse, to: "/student/courses" },
            ]}
          />
        </motion.div>
      )}

      {/* ---------------------------------------------- Quick actions */}
      <motion.div {...rise(0.16)}>
        <h2 className="mb-3 font-display text-lg font-bold text-navy">Quick actions</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.to}
              to={action.to}
              className="group flex items-center gap-3.5 rounded-2xl border border-line bg-canvas p-4 shadow-soft transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${action.tint}`}>
                <action.icon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-navy">{action.label}</p>
                <p className="truncate text-xs text-slate-500">{action.desc}</p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
            </Link>
          ))}
        </div>
      </motion.div>

      {/* ---------------------------------------------- Wallet strip */}
      <motion.div {...rise(0.24)}>
        <Link
          to="/student/wallet"
          className="group flex items-center gap-4 rounded-2xl border border-line bg-canvas p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-light text-white shadow-soft ring-4 ring-primary/20">
            <Wallet className="h-6 w-6" />
          </span>
          <div className="flex-1">
            <p className="font-semibold text-navy">Your wallet</p>
            <p className="text-sm text-slate-500">Top up once, book sessions in a tap — every transaction on an auditable ledger.</p>
          </div>
          <ArrowRight className="h-5 w-5 shrink-0 text-slate-300 transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
        </Link>
      </motion.div>
    </div>
  );
}
