import { useQuery } from "@tanstack/react-query";
import { AlertCircle, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { PageHeader } from "@/components/shared/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Badge, statusToTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionLoader } from "@/components/ui/Spinner";
import { listChildEnrollments, listMyChildren } from "@/features/parent/api";
import { cn } from "@/lib/utils";

export function ParentProgressPage() {
  const {
    data: children = [],
    isLoading: childrenLoading,
    isError: childrenError,
    refetch: refetchChildren,
  } = useQuery({
    queryKey: ["parent-children"],
    queryFn: listMyChildren,
    retry: false,
  });

  const visibleChildren = useMemo(
    () => children.filter((link) => link.status === "active" && link.can_view_progress),
    [children]
  );

  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // Default to the first progress-visible child once loaded.
  useEffect(() => {
    if (!selectedStudentId && visibleChildren.length > 0) {
      setSelectedStudentId(visibleChildren[0].student.id);
    }
  }, [visibleChildren, selectedStudentId]);

  const {
    data: enrollments = [],
    isLoading: enrollmentsLoading,
    isError: enrollmentsError,
    refetch: refetchEnrollments,
  } = useQuery({
    queryKey: ["child-enrollments", selectedStudentId],
    queryFn: () => listChildEnrollments(selectedStudentId!),
    enabled: !!selectedStudentId,
    retry: false,
  });

  if (childrenLoading) return <SectionLoader />;

  if (childrenError) {
    return (
      <div>
        <PageHeader title="Progress reports" />
        <Card className="mt-6">
          <EmptyState
            icon={AlertCircle}
            title="We couldn't load your children"
            description="Something went wrong reaching the server. Check your connection and try again."
            action={
              <Button variant="outline" onClick={() => refetchChildren()}>
                Retry
              </Button>
            }
          />
        </Card>
      </div>
    );
  }

  if (visibleChildren.length === 0) {
    return (
      <div>
        <PageHeader title="Progress reports" />
        <Card className="mt-6">
          <EmptyState
            icon={TrendingUp}
            title="No progress to show yet"
            description="Progress appears once a child confirms your link (with progress sharing enabled) and enrolls in a course."
            action={
              <Link to="/parent/children">
                <Button variant="outline">Manage children</Button>
              </Link>
            }
          />
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Progress reports"
        description="Attendance and assignment completion, rolled into one number per course."
      />

      {/* ------------------------------------------------ Child selector */}
      <div className="mt-5 flex flex-wrap gap-2" role="radiogroup" aria-label="Select child">
        {visibleChildren.map((link) => (
          <button
            key={link.id}
            role="radio"
            aria-checked={selectedStudentId === link.student.id}
            onClick={() => setSelectedStudentId(link.student.id)}
            className={cn(
              "flex items-center gap-2 rounded-pill border px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
              selectedStudentId === link.student.id
                ? "border-primary bg-primary-subtle text-primary-dark"
                : "border-line text-slate-600 hover:border-navy/25"
            )}
          >
            <Avatar
              src={link.student.user.avatar}
              firstName={link.student.user.first_name}
              lastName={link.student.user.last_name}
              size="sm"
            />
            {link.student.user.first_name}
          </button>
        ))}
      </div>

      {/* ------------------------------------------------ Enrollments */}
      <div className="mt-6">
        {enrollmentsLoading ? (
          <SectionLoader />
        ) : enrollmentsError ? (
          <Card>
            <EmptyState
              icon={AlertCircle}
              title="We couldn't load progress"
              description="Something went wrong reaching the server. Check your connection and try again."
              action={
                <Button variant="outline" onClick={() => refetchEnrollments()}>
                  Retry
                </Button>
              }
            />
          </Card>
        ) : enrollments.length === 0 ? (
          <div className="rounded-card border border-dashed border-line py-14 text-center">
            <p className="font-medium text-navy">No course enrollments yet</p>
            <p className="mt-1 text-sm text-slate-500">
              Progress tracking starts when they join a course.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {enrollments.map((enrollment) => (
              <Card key={enrollment.id}>
                <CardBody>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-display text-lg font-bold text-navy">{enrollment.course.title}</p>
                      <p className="text-sm text-slate-500">
                        {enrollment.course.subject.name} · taught by {enrollment.course.tutor.user.full_name}
                      </p>
                    </div>
                    <Badge tone={statusToTone(enrollment.status)}>{enrollment.status.replace("_", " ")}</Badge>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Overall progress</span>
                      <span className="font-mono">{enrollment.progress_percent}%</span>
                    </div>
                    <div
                      className="mt-1 h-2.5 overflow-hidden rounded-pill bg-surface-3"
                      role="progressbar"
                      aria-valuenow={Number(enrollment.progress_percent)}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${enrollment.course.title} progress`}
                    >
                      <div
                        className="h-full rounded-pill bg-primary transition-all"
                        style={{ width: `${enrollment.progress_percent}%` }}
                      />
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
