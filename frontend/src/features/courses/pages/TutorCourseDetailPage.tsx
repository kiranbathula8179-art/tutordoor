import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, ArrowLeft, CalendarPlus, Plus, Rocket, SearchX, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import { Avatar } from "@/components/ui/Avatar";
import { Badge, statusToTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { PageLoader } from "@/components/ui/Spinner";
import {
  addCourseSessions,
  getCourse,
  listCourseEnrollments,
  publishCourse,
  type SessionScheduleEntry,
} from "@/features/courses/api";
import { formatCurrency, formatDateTime, getErrorMessage } from "@/lib/utils";

interface DraftSessionRow {
  title: string;
  scheduled_start: string; // datetime-local value
  scheduled_end: string;
}

export function TutorCourseDetailPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const queryClient = useQueryClient();
  const [draftSessions, setDraftSessions] = useState<DraftSessionRow[]>([]);

  const {
    data: course,
    isLoading,
    isError: courseError,
    refetch: refetchCourse,
  } = useQuery({
    queryKey: ["course", courseId],
    queryFn: () => getCourse(courseId!),
    enabled: !!courseId,
    retry: false,
  });

  const {
    data: enrollments = [],
    isError: enrollmentsError,
    refetch: refetchEnrollments,
  } = useQuery({
    queryKey: ["course-enrollments", courseId],
    queryFn: () => listCourseEnrollments(courseId!),
    enabled: !!courseId,
    retry: false,
  });

  const publishMutation = useMutation({
    mutationFn: () => publishCourse(courseId!),
    onSuccess: () => {
      toast.success("Course published — students can now enroll.");
      queryClient.invalidateQueries({ queryKey: ["course", courseId] });
      queryClient.invalidateQueries({ queryKey: ["my-teaching-courses"] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const addSessionsMutation = useMutation({
    mutationFn: () => {
      const payload: SessionScheduleEntry[] = draftSessions.map((row) => ({
        title: row.title || undefined,
        scheduled_start: new Date(row.scheduled_start).toISOString(),
        scheduled_end: new Date(row.scheduled_end).toISOString(),
      }));
      return addCourseSessions(courseId!, payload);
    },
    onSuccess: () => {
      toast.success("Sessions added to the schedule.");
      setDraftSessions([]);
      queryClient.invalidateQueries({ queryKey: ["course", courseId] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const addDraftRow = () =>
    setDraftSessions((rows) => [...rows, { title: "", scheduled_start: "", scheduled_end: "" }]);

  const updateDraftRow = (index: number, patch: Partial<DraftSessionRow>) =>
    setDraftSessions((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  const removeDraftRow = (index: number) => setDraftSessions((rows) => rows.filter((_, i) => i !== index));

  const canSubmitSessions =
    draftSessions.length > 0 && draftSessions.every((row) => row.scheduled_start && row.scheduled_end);

  if (isLoading) return <PageLoader />;

  if (!course) {
    return (
      <Card className="mx-auto max-w-lg">
        <EmptyState
          icon={courseError ? AlertCircle : SearchX}
          title={courseError ? "We couldn't load this course" : "Course not found"}
          description={
            courseError
              ? "Something went wrong reaching the server. Check your connection and try again."
              : "It may have been removed, or the link is out of date."
          }
          action={
            courseError ? (
              <Button variant="outline" onClick={() => refetchCourse()}>
                Retry
              </Button>
            ) : (
              <Link to="/tutor/courses">
                <Button variant="outline">Back to my courses</Button>
              </Link>
            )
          }
        />
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link to="/tutor/courses" className="mb-4 flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-navy">
        <ArrowLeft className="h-4 w-4" /> Back to my courses
      </Link>

      {/* ------------------------------------------------ Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-navy">{course.title}</h1>
          <p className="mt-1 text-slate-500">
            {course.subject.name} · {formatCurrency(course.price, course.currency)} ·{" "}
            {course.enrolled_count}/{course.max_students} enrolled
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={statusToTone(course.status)}>{course.status}</Badge>
          {course.status === "draft" && (
            <Button size="sm" onClick={() => publishMutation.mutate()} isLoading={publishMutation.isPending}>
              <Rocket className="h-4 w-4" /> Publish
            </Button>
          )}
        </div>
      </div>

      {course.status === "draft" && course.sessions.length === 0 && (
        <p className="mt-4 rounded-card border border-accent/30 bg-accent-subtle px-4 py-3 text-sm text-slate-600">
          Schedule at least one session below before publishing, so students know when classes run.
        </p>
      )}

      {/* ------------------------------------------------ Sessions */}
      <Card className="mt-6">
        <CardBody>
          <h2 className="font-display text-lg font-bold text-navy">Session schedule</h2>

          {course.sessions.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">No sessions scheduled yet.</p>
          ) : (
            <div className="mt-3 divide-y divide-line rounded-xl border border-line">
              {course.sessions.map((session) => (
                <div key={session.id} className="flex items-center gap-4 p-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-subtle font-mono text-xs font-semibold text-primary">
                    {session.session_number}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-navy">
                      {session.title || `Session ${session.session_number}`}
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatDateTime(session.scheduled_start)} → {formatDateTime(session.scheduled_end)}
                    </p>
                  </div>
                  <Badge tone={statusToTone(session.status)}>{session.status.replace("_", " ")}</Badge>
                </div>
              ))}
            </div>
          )}

          {/* -------------------------------------------- Add sessions */}
          <div className="mt-5 border-t border-line pt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-navy">Add sessions</p>
              <Button variant="outline" size="sm" onClick={addDraftRow}>
                <Plus className="h-4 w-4" /> Add row
              </Button>
            </div>

            {draftSessions.length === 0 ? (
              <p className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                <CalendarPlus className="h-4 w-4" /> Add rows, set times, then save them to the schedule.
              </p>
            ) : (
              <div className="mt-3 space-y-3">
                {draftSessions.map((row, index) => (
                  <div key={index} className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_1fr_2.5rem]">
                    <Input
                      label={index === 0 ? "Title (optional)" : undefined}
                      placeholder={`Session ${course.sessions.length + index + 1}`}
                      value={row.title}
                      onChange={(event) => updateDraftRow(index, { title: event.target.value })}
                    />
                    <Input
                      label={index === 0 ? "Starts" : undefined}
                      type="datetime-local"
                      value={row.scheduled_start}
                      onChange={(event) => updateDraftRow(index, { scheduled_start: event.target.value })}
                    />
                    <Input
                      label={index === 0 ? "Ends" : undefined}
                      type="datetime-local"
                      value={row.scheduled_end}
                      onChange={(event) => updateDraftRow(index, { scheduled_end: event.target.value })}
                    />
                    <button
                      onClick={() => removeDraftRow(index)}
                      aria-label="Remove session row"
                      className="mb-1 flex h-10 w-10 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-danger-subtle hover:text-danger"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <Button
                  onClick={() => addSessionsMutation.mutate()}
                  isLoading={addSessionsMutation.isPending}
                  disabled={!canSubmitSessions}
                >
                  Save {draftSessions.length} session{draftSessions.length === 1 ? "" : "s"}
                </Button>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* ------------------------------------------------ Enrollments */}
      <Card className="mt-6">
        <CardBody>
          <h2 className="flex items-center gap-2 font-display text-lg font-bold text-navy">
            <Users className="h-5 w-5" /> Enrolled students ({enrollments.length})
          </h2>

          {enrollmentsError ? (
            <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3">
              <p className="flex items-center gap-1.5 text-sm text-slate-500">
                <AlertCircle className="h-4 w-4 text-danger" /> Couldn't load enrollments.
              </p>
              <Button variant="outline" size="sm" onClick={() => refetchEnrollments()}>
                Retry
              </Button>
            </div>
          ) : enrollments.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">
              {course.status === "draft" ? "Publish the course to open enrollment." : "No enrollments yet."}
            </p>
          ) : (
            <div className="mt-3 divide-y divide-line">
              {enrollments.map((enrollment) => (
                <div key={enrollment.id} className="flex items-center gap-3 py-3">
                  <Avatar
                    src={enrollment.student.user.avatar}
                    firstName={enrollment.student.user.first_name}
                    lastName={enrollment.student.user.last_name}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-navy">{enrollment.student.user.full_name}</p>
                    <p className="text-xs text-slate-400">Progress: {enrollment.progress_percent}%</p>
                  </div>
                  <Badge tone={statusToTone(enrollment.status)}>{enrollment.status.replace("_", " ")}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
