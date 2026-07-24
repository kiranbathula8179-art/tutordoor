import { useMutation, useQuery } from "@tanstack/react-query";
import { BadgeCheck, CalendarDays, Clock, Globe, SearchX, Users } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageLoader } from "@/components/ui/Spinner";
import { StarRating } from "@/components/shared/StarRating";
import { enrollInCourse, getCourse } from "@/features/courses/api";
import { cn, formatCurrency, formatDate, formatDateTime, getErrorMessage } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";

/**
 * Course detail + enrollment — V7 "One World" (DESIGN_V3.md V7 addendum).
 * Sits on the shared `PublicAtmosphere`. Enrollment is transactional and
 * navigates away immediately on success (to payment or the dashboard) —
 * deliberately NOT given a signature threshold moment here: a reveal
 * animation would fight the speed a real purchase decision needs. Solid
 * white surfaces throughout for the same trust-legibility reasons as the
 * Tutor Profile booking panel.
 */
export function PublicCourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();

  const { data: course, isLoading } = useQuery({
    queryKey: ["course", courseId],
    queryFn: () => getCourse(courseId!),
    enabled: !!courseId,
  });

  const enrollMutation = useMutation({
    mutationFn: () => enrollInCourse(courseId!),
    onSuccess: (enrollment) => {
      if (enrollment.status === "active") {
        toast.success("You're enrolled — see you in class!");
        navigate("/student/courses");
      } else {
        navigate(`/student/courses/enroll/${enrollment.id}/pay`);
      }
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const handleEnroll = () => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: { pathname: `/courses/${courseId}` } } });
      return;
    }
    enrollMutation.mutate();
  };

  if (isLoading) return <PageLoader />;

  if (!course) {
    return (
      <Card className="mx-auto mt-10 max-w-lg border-sand/70 bg-white">
        <EmptyState
          icon={SearchX}
          title="Course not found"
          description="This course may have been removed, or the link is out of date."
          action={
            <Button variant="outline" onClick={() => navigate("/courses")}>
              Browse courses
            </Button>
          }
        />
      </Card>
    );
  }

  const isFull = course.seats_available <= 0;
  const isStudent = user?.role === "student";
  const isFree = Number(course.price) === 0;

  return (
    <div className="container-page py-10 pb-24 lg:pb-10">
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* ------------------------------------------------ Main column */}
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="neutral">{course.subject.name}</Badge>
            <Badge tone="info">{course.level.replace("_", " ")}</Badge>
            <Badge tone="neutral">
              <Globe className="h-3 w-3" /> {course.mode === "both" ? "Hybrid" : course.mode}
            </Badge>
          </div>

          <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-navy">{course.title}</h1>

          <Link to={`/tutors/${course.tutor.id}`} className="mt-4 inline-flex items-center gap-3 rounded-xl border border-sand bg-white p-3 pr-5 transition-shadow hover:shadow-soft">
            <Avatar
              src={course.tutor.user.avatar}
              firstName={course.tutor.user.first_name}
              lastName={course.tutor.user.last_name}
              size="md"
            />
            <div>
              <p className="flex items-center gap-1.5 text-sm font-semibold text-navy">
                {course.tutor.user.full_name}
                {course.tutor.is_verified && <BadgeCheck className="h-4 w-4 text-primary" />}
              </p>
              <StarRating rating={Number(course.tutor.rating_average)} count={course.tutor.rating_count} size="sm" />
            </div>
          </Link>

          <section className="mt-8">
            <h2 className="font-display text-xl font-bold text-navy">About this course</h2>
            <p className="mt-2 whitespace-pre-line text-slate-600">
              {course.description || "The tutor hasn't added a description yet."}
            </p>
          </section>

          <section className="mt-8">
            <h2 className="font-display text-xl font-bold text-navy">Schedule ({course.sessions.length} sessions)</h2>
            {course.sessions.length === 0 ? (
              <p className="mt-2 text-slate-400">Session times will be announced by the tutor.</p>
            ) : (
              <div className="mt-3 divide-y divide-sand/70 rounded-card border border-sand/70 bg-white">
                {course.sessions.map((session) => {
                  const isPast = new Date(session.scheduled_start) < new Date();
                  return (
                    <div key={session.id} className={cn("flex items-center gap-4 p-4", isPast && "opacity-60")}>
                      <span
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-mono text-xs font-semibold",
                          isPast ? "bg-surface-3 text-slate-500" : "bg-primary-subtle text-primary"
                        )}
                      >
                        {session.session_number}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-navy">
                          {session.title || `Session ${session.session_number}`}
                        </p>
                        <p className="text-xs text-slate-500">{formatDateTime(session.scheduled_start)}</p>
                      </div>
                      {isPast && <Badge tone="neutral">Past</Badge>}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* ------------------------------------------------ Enroll card */}
        <div className="hidden lg:sticky lg:top-24 lg:block lg:h-fit">
          <Card className="border-primary/20 bg-white shadow-hover">
            <CardBody className="p-6 pt-6">
              <p className="font-display text-4xl font-extrabold tracking-tight text-navy">
                {isFree ? "Free" : formatCurrency(course.price, course.currency)}
              </p>
              <p className="mt-1 text-sm text-slate-500">for the full {course.total_sessions}-session course</p>

              <Button
                className="mt-5 w-full"
                size="lg"
                onClick={handleEnroll}
                isLoading={enrollMutation.isPending}
                disabled={isFull || (isAuthenticated && !isStudent)}
              >
                {isFull ? "Course full" : "Enroll now"}
              </Button>
              {isAuthenticated && !isStudent && (
                <p className="mt-2 text-center text-xs text-slate-400">Log in with a student account to enroll.</p>
              )}

              <dl className="mt-6 space-y-2.5 border-t border-sand/70 pt-4 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="flex items-center gap-1.5 text-slate-400">
                    <Users className="h-4 w-4" /> Seats left
                  </dt>
                  <dd
                    className={cn(
                      "font-semibold",
                      course.seats_available > 0 && course.seats_available <= 3 ? "text-accent-dark" : "text-navy"
                    )}
                  >
                    {course.seats_available} of {course.max_students}
                  </dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="flex items-center gap-1.5 text-slate-400">
                    <Clock className="h-4 w-4" /> Duration
                  </dt>
                  <dd className="font-medium text-navy">{course.duration_weeks} weeks</dd>
                </div>
                {course.start_date && (
                  <div className="flex items-center justify-between">
                    <dt className="flex items-center gap-1.5 text-slate-400">
                      <CalendarDays className="h-4 w-4" /> Starts
                    </dt>
                    <dd className="font-medium text-navy">{formatDate(course.start_date)}</dd>
                  </div>
                )}
              </dl>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* ------------------------------------------------ Mobile enroll bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-sand/70 bg-white/95 backdrop-blur-xl lg:hidden">
        <div className="container-page flex items-center justify-between gap-3 py-3">
          <div>
            <p className="font-display text-xl font-extrabold text-navy">
              {isFree ? "Free" : formatCurrency(course.price, course.currency)}
            </p>
            <p className="text-[0.65rem] text-slate-400">{course.total_sessions} sessions</p>
          </div>
          <Button size="lg" onClick={handleEnroll} isLoading={enrollMutation.isPending} disabled={isFull || (isAuthenticated && !isStudent)}>
            {isFull ? "Course full" : "Enroll now"}
          </Button>
        </div>
      </div>
    </div>
  );
}
