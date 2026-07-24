import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { motion } from "framer-motion";
import { UserPlus, Users } from "lucide-react";
import { Link } from "react-router-dom";

import { DashboardHero } from "@/components/shared/DashboardHero";
import { RequireParentProfile } from "@/components/shared/RequireParentProfile";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, statusToTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionLoader } from "@/components/ui/Spinner";
import { listMyChildren } from "@/features/parent/api";
import { staggerContainer, staggerItem } from "@/lib/motion/tokens";
import { prefersReducedMotion } from "@/lib/motion/quality";
import { useAuthStore } from "@/store/auth-store";

export function ParentDashboardPage() {
  const user = useAuthStore((state) => state.user);
  const still = prefersReducedMotion();
  const {
    data: children,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["parent-children"],
    queryFn: listMyChildren,
    retry: false,
  });

  // The children endpoint 404s when there's no parent profile yet — that's
  // the expected "get started" case. Any other error is a real failure and
  // must not be presented as if there's simply nothing set up.
  const noProfile = isError && isAxiosError(error) && error.response?.status === 404;
  const hasError = isError && !noProfile;

  return (
    <div>
      <DashboardHero
        eyebrow="Parent portal"
        title={`Welcome back, ${user?.first_name ?? "there"}`}
        description="Keep track of your children's learning in one place."
        action={
          children && children.length > 0 ? (
            <Link
              to="/parent/children"
              className="inline-flex items-center gap-1.5 rounded-xl bg-canvas px-5 py-2.5 text-sm font-semibold text-primary shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              <UserPlus className="h-4 w-4" /> Invite a child
            </Link>
          ) : undefined
        }
      />

      {isLoading && <SectionLoader />}

      {(noProfile || hasError) && (
        <RequireParentProfile
          icon={Users}
          title="Set up your parent profile to get started"
          description="Complete your profile, then invite your child's student account to link it here."
          action={
            <Link to="/parent/children">
              <Button>Complete profile</Button>
            </Link>
          }
          hasError={hasError}
          onRetry={() => refetch()}
        />
      )}

      {children && children.length === 0 && !isError && (
        <Card>
          <EmptyState
            icon={UserPlus}
            title="No children linked yet"
            description="Invite your child by their TutorDoor email to manage their bookings and view progress."
            action={
              <Link to="/parent/children">
                <Button>Invite a child</Button>
              </Link>
            }
          />
        </Card>
      )}

      {children && children.length > 0 && (
        <motion.div
          initial={still ? false : "hidden"}
          animate="show"
          variants={staggerContainer}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {children.map((link) => (
            <motion.div key={link.id} variants={staggerItem}>
            <Link to="/parent/children" className="group focus-visible:outline-none">
              <Card className="flex items-center gap-4 p-5 transition-all group-hover:-translate-y-0.5 group-hover:shadow-hover group-focus-visible:ring-2 group-focus-visible:ring-primary/30">
                <Avatar
                  src={link.student.user.avatar}
                  firstName={link.student.user.first_name}
                  lastName={link.student.user.last_name}
                  size="lg"
                />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-navy">{link.student.user.full_name}</p>
                  <p className="text-sm capitalize text-slate-500">{link.relationship}</p>
                  <Badge tone={statusToTone(link.status)} className="mt-1.5">
                    {link.status}
                  </Badge>
                </div>
              </Card>
            </Link>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
