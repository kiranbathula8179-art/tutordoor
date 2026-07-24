import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { motion } from "framer-motion";
import { ArrowRight, GraduationCap, Star, Users } from "lucide-react";
import { Link } from "react-router-dom";

import { DashboardHero } from "@/components/shared/DashboardHero";
import { RequireInstituteProfile } from "@/components/shared/RequireInstituteProfile";
import { StatCard } from "@/components/shared/StatCard";
import { Card } from "@/components/ui/Card";
import { SectionLoader } from "@/components/ui/Spinner";
import { getMyInstituteProfile } from "@/features/institute/api";
import { DURATION, EASE_OUT, motionSafe, riseInit } from "@/lib/motion/tokens";
import { useAuthStore } from "@/store/auth-store";

function ActionTile({ icon: Icon, kicker, title, to }: { icon: typeof Users; kicker: string; title: string; to: string }) {
  return (
    <Link to={to} className="group focus-visible:outline-none">
      <Card className="flex h-full items-center gap-4 p-5 transition-all group-hover:-translate-y-0.5 group-hover:shadow-hover group-focus-visible:ring-2 group-focus-visible:ring-primary/30">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-subtle text-primary">
          <Icon className="h-5 w-5" />
        </span>
        <div className="flex-1">
          <p className="text-xs font-medium text-slate-500">{kicker}</p>
          <p className="font-semibold text-navy">{title}</p>
        </div>
        <ArrowRight className="h-4 w-4 text-slate-300 transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
      </Card>
    </Link>
  );
}

export function InstituteDashboardPage() {
  const user = useAuthStore((state) => state.user);
  const {
    data: institute,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["my-institute"],
    queryFn: getMyInstituteProfile,
    retry: false,
  });

  const noProfile = isError && isAxiosError(error) && error.response?.status === 404;
  const hasError = isError && !noProfile;

  const rise = (delay: number) => ({
    initial: riseInit(18),
    animate: { opacity: 1, y: 0 },
    transition: motionSafe({ duration: DURATION.slow, delay, ease: EASE_OUT }),
  });

  if (isLoading) return <SectionLoader />;

  if (noProfile || hasError || !institute) {
    return (
      <RequireInstituteProfile
        icon={GraduationCap}
        title="Set up your institute profile"
        description="Add your institute's details to start inviting tutors and enrolling students."
        hasError={hasError}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div>
      <DashboardHero
        eyebrow="Institute portal"
        title={institute.institute_name}
        description={`Welcome back, ${user?.first_name ?? "there"}.`}
        action={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold capitalize text-white">
            {institute.verification_status.replace("_", " ")}
          </span>
        }
      />

      <motion.div {...rise(0.08)} className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={Star}
          tint="accent"
          label="Institute rating"
          value={Number(institute.rating_average).toFixed(1)}
          sub={`${institute.rating_count} review${institute.rating_count === 1 ? "" : "s"}`}
        />
        <ActionTile icon={Users} kicker="Manage your" title="Tutor roster" to="/institute/tutors" />
        <ActionTile icon={GraduationCap} kicker="Enroll and track" title="Students" to="/institute/students" />
      </motion.div>
    </div>
  );
}
