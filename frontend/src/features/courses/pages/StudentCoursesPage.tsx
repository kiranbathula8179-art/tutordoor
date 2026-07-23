import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, BookOpen, LogOut, Video } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { PageHeader } from "@/components/shared/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, statusToTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { SectionLoader } from "@/components/ui/Spinner";
import { dropEnrollment, joinCourseSession, listMyEnrollments } from "@/features/courses/api";
import { formatDateTime, getErrorMessage } from "@/lib/utils";
import type { CourseEnrollment, CourseSession } from "@/types";

/** The next session a student can act on: live now, or the soonest upcoming. */
function nextActionableSession(sessions: CourseSession[]): CourseSession | undefined {
  const live = sessions.find((session) => session.status === "live");
  if (live) return live;
  const now = Date.now();
  return sessions
    .filter((session) => session.status === "scheduled" && new Date(session.scheduled_start).getTime() >= now - 15 * 60_000)
    .sort((a, b) => new Date(a.scheduled_start).getTime() - new Date(b.scheduled_start).getTime())[0];
}

export function StudentCoursesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [dropTarget, setDropTarget] = useState<CourseEnrollment | null>(null);

  const {
    data: enrollments = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["my-enrollments"],
    queryFn: () => listMyEnrollments(),
  });

  const joinMutation = useMutation({
    mutationFn: joinCourseSession,
    onSuccess: (details) => window.open(details.join_url, "_blank", "noopener,noreferrer"),
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const dropMutation = useMutation({
    mutationFn: () => dropEnrollment(dropTarget!.id),
    onSuccess: () => {
      toast.success("You've left the course.");
      setDropTarget(null);
      queryClient.invalidateQueries({ queryKey: ["my-enrollments"] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  return (
    <div>
      <PageHeader
        title="My courses"
        actions={
          <Link to="/courses">
            <Button variant="outline">Browse courses</Button>
          </Link>
        }
      />

      {isLoading ? (
        <SectionLoader />
      ) : isError ? (
        <Card className="mt-6">
          <EmptyState
            icon={AlertCircle}
            title="We couldn't load your courses"
            description="Something went wrong reaching the server. Check your connection and try again."
            action={
              <Button variant="outline" onClick={() => refetch()}>
                Retry
              </Button>
            }
          />
        </Card>
      ) : enrollments.length === 0 ? (
        <Card className="mt-6">
          <EmptyState
            icon={BookOpen}
            title="You're not enrolled in any courses yet"
            description="Group courses give you a fixed schedule, classmates, and one price for the whole series."
            action={
              <Link to="/courses">
                <Button>Find a course</Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <div className="mt-6 space-y-4">
          {enrollments.map((enrollment) => {
            const nextSession = nextActionableSession(enrollment.course.sessions);
            return (
              <Card key={enrollment.id}>
                <CardBody>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        to={`/courses/${enrollment.course.id}`}
                        className="font-display text-lg font-bold text-navy hover:underline"
                      >
                        {enrollment.course.title}
                      </Link>
                      <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                        <Avatar
                          src={enrollment.course.tutor.user.avatar}
                          firstName={enrollment.course.tutor.user.first_name}
                          lastName={enrollment.course.tutor.user.last_name}
                          size="sm"
                        />
                        {enrollment.course.tutor.user.full_name} · {enrollment.course.subject.name}
                      </div>
                    </div>
                    <Badge tone={statusToTone(enrollment.status)}>{enrollment.status.replace("_", " ")}</Badge>
                  </div>

                  {/* -------------------------------- Progress */}
                  {enrollment.status === "active" && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>Progress</span>
                        <span className="font-mono">{enrollment.progress_percent}%</span>
                      </div>
                      <div
                        className="mt-1 h-2 overflow-hidden rounded-pill bg-surface-3"
                        role="progressbar"
                        aria-valuenow={Number(enrollment.progress_percent)}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label="Course progress"
                      >
                        <div
                          className="h-full rounded-pill bg-primary transition-all"
                          style={{ width: `${enrollment.progress_percent}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* -------------------------------- Actions */}
                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    {enrollment.status === "pending_payment" && (
                      <Button onClick={() => navigate(`/student/courses/enroll/${enrollment.id}/pay`)}>
                        Complete payment
                      </Button>
                    )}

                    {enrollment.status === "active" && nextSession && (
                      <Button
                        onClick={() => joinMutation.mutate(nextSession.id)}
                        isLoading={joinMutation.isPending && joinMutation.variables === nextSession.id}
                      >
                        <Video className="h-4 w-4" />
                        {nextSession.status === "live" ? "Join live session" : "Join next session"}
                      </Button>
                    )}

                    {enrollment.status === "active" && nextSession && (
                      <span className="text-xs text-slate-400">
                        {nextSession.status === "live"
                          ? "Class is live right now"
                          : `Next: ${formatDateTime(nextSession.scheduled_start)}`}
                      </span>
                    )}

                    {(enrollment.status === "active" || enrollment.status === "pending_payment") && (
                      <button
                        onClick={() => setDropTarget(enrollment)}
                        className="ml-auto flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-danger"
                      >
                        <LogOut className="h-3.5 w-3.5" /> Leave course
                      </button>
                    )}
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      {/* ------------------------------------------------ Drop confirmation */}
      <Modal
        isOpen={!!dropTarget}
        onClose={() => setDropTarget(null)}
        title={`Leave ${dropTarget?.course.title ?? "this course"}?`}
        size="sm"
      >
        <p className="text-sm text-slate-500">
          Your seat opens up for someone else. Refund eligibility follows the refund policy.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setDropTarget(null)}>
            Stay enrolled
          </Button>
          <Button variant="destructive" onClick={() => dropMutation.mutate()} isLoading={dropMutation.isPending}>
            Leave course
          </Button>
        </div>
      </Modal>
    </div>
  );
}
