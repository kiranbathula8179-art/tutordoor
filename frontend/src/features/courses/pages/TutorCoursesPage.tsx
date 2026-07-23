import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { useMasterData } from "@/lib/master-data";
import { AlertCircle, BookOpen, Plus, ShieldAlert, Users } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

import { PageHeader } from "@/components/shared/PageHeader";
import { RequireTutorProfile } from "@/components/shared/RequireTutorProfile";
import { Badge, statusToTone } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { SectionLoader } from "@/components/ui/Spinner";
import { Textarea } from "@/components/ui/Textarea";
import { Tabs } from "@/components/ui/Tabs";
import { createCourse, listMyTeachingCourses } from "@/features/courses/api";
import { getMyTutorProfile, getSubjects } from "@/features/tutors/api";
import { formatCurrency, formatDate, getErrorMessage } from "@/lib/utils";

const STATUS_TABS = [
  { key: "", label: "All" },
  { key: "draft", label: "Drafts" },
  { key: "published", label: "Published" },
] as const;

export function TutorCoursesPage() {
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [createOpen, setCreateOpen] = useState(false);

  const {
    data: profile,
    isError: profileFetchFailed,
    error: profileError,
    refetch: refetchProfile,
  } = useQuery({
    queryKey: ["my-tutor-profile"],
    queryFn: getMyTutorProfile,
    retry: false,
  });

  const noProfile = profileFetchFailed && isAxiosError(profileError) && profileError.response?.status === 404;
  const profileHasError = profileFetchFailed && !noProfile;

  const {
    data: courses = [],
    isLoading,
    isError: coursesError,
    refetch: refetchCourses,
  } = useQuery({
    queryKey: ["my-teaching-courses", statusFilter],
    queryFn: () => listMyTeachingCourses(statusFilter || undefined),
    enabled: !profileFetchFailed,
    retry: false,
  });

  const isVerified = profile?.verification_status === "verified";

  if (noProfile || profileHasError) {
    return (
      <div>
        <PageHeader title="My courses" />
        <RequireTutorProfile
          icon={BookOpen}
          title="Create your tutor profile first"
          description="Courses are published under your tutor profile."
          hasError={profileHasError}
          onRetry={() => refetchProfile()}
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="My courses"
        description="Group programs with scheduled sessions, seats, and one price."
        actions={
          <Button onClick={() => setCreateOpen(true)} disabled={!isVerified}>
            <Plus className="h-4 w-4" /> New course
          </Button>
        }
      />

      {!isVerified && (
        <div className="mt-5 flex items-center gap-3 rounded-card border border-accent/30 bg-accent-subtle px-5 py-4">
          <ShieldAlert className="h-5 w-5 shrink-0 text-accent-dark" />
          <p className="text-sm text-slate-600">
            Course creation unlocks once you&apos;re verified.{" "}
            <Link to="/tutor/verification" className="font-semibold text-danger hover:underline">
              Complete verification →
            </Link>
          </p>
        </div>
      )}

      <Tabs
        className="mt-5"
        items={STATUS_TABS.map(({ key, label }) => ({ value: key, label }))}
        value={statusFilter}
        onChange={(value) => setStatusFilter(value as typeof statusFilter)}
      />

      <div className="mt-6">
        {isLoading ? (
          <SectionLoader />
        ) : coursesError ? (
          <div className="rounded-card border border-line bg-canvas shadow-soft">
            <EmptyState
              icon={AlertCircle}
              title="We couldn't load your courses"
              description="Something went wrong reaching the server. Check your connection and try again."
              action={
                <Button variant="outline" onClick={() => refetchCourses()}>
                  Retry
                </Button>
              }
            />
          </div>
        ) : courses.length === 0 ? (
          <div className="rounded-card border border-dashed border-line py-16 text-center">
            <p className="font-medium text-navy">No courses here yet</p>
            <p className="mt-1 text-sm text-slate-500">
              {isVerified ? "Create your first course to teach a group." : "Get verified, then create your first course."}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {courses.map((course) => (
              <Link
                key={course.id}
                to={`/tutor/courses/${course.id}`}
                className="group rounded-card border border-line bg-canvas p-5 transition-all hover:-translate-y-0.5 hover:shadow-hover"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-navy">{course.title}</p>
                    <p className="text-sm text-slate-500">{course.subject.name}</p>
                  </div>
                  <Badge tone={statusToTone(course.status)}>{course.status}</Badge>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {course.enrolled_count}/{course.max_students} enrolled
                  </span>
                  <span>{course.sessions.length} sessions scheduled</span>
                  {course.start_date && <span>Starts {formatDate(course.start_date)}</span>}
                </div>

                <p className="mt-3 font-mono text-lg font-semibold text-navy">
                  {formatCurrency(course.price, course.currency)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>

      <CreateCourseModal isOpen={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}

function CreateCourseModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { optionsFor } = useMasterData(["skill_level"]);
  const { data: subjects = [] } = useQuery({ queryKey: ["subjects"], queryFn: () => getSubjects() });

  const [form, setForm] = useState({
    subject_id: "",
    title: "",
    description: "",
    level: "all_levels",
    mode: "online",
    total_sessions: 8,
    duration_weeks: 4,
    max_students: 10,
    price: "",
    start_date: "",
    end_date: "",
  });

  const set = (key: keyof typeof form, value: string | number) => setForm((f) => ({ ...f, [key]: value }));

  const createMutation = useMutation({
    mutationFn: () =>
      createCourse({
        ...form,
        price: form.price,
        start_date: form.start_date || undefined,
        end_date: form.end_date || undefined,
      }),
    onSuccess: () => {
      toast.success("Course created as a draft — add sessions, then publish.");
      queryClient.invalidateQueries({ queryKey: ["my-teaching-courses"] });
      onClose();
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });

  const handleCreate = () => {
    if (!form.subject_id) return toast.error("Pick a subject.");
    if (!form.title.trim()) return toast.error("Give the course a title.");
    if (form.price === "" || Number(form.price) < 0) return toast.error("Set a price (0 is allowed for free courses).");
    createMutation.mutate();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create a course" size="lg">
      <div className="space-y-4">
        <Input
          label="Title"
          placeholder="e.g. Class 10 Maths Board Crash Course"
          value={form.title}
          onChange={(event) => set("title", event.target.value)}
        />
        <Textarea
          label="Description"
          rows={3}
          placeholder="What will students achieve by the end?"
          value={form.description}
          onChange={(event) => set("description", event.target.value)}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Subject"
            placeholder="Choose subject"
            value={form.subject_id}
            onChange={(event) => set("subject_id", event.target.value)}
            options={subjects.map((subject) => ({ value: subject.id, label: subject.name }))}
          />
          <Select
            label="Level"
            value={form.level}
            onChange={(event) => set("level", event.target.value)}
            options={optionsFor("skill_level")}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Input
            label="Total sessions"
            type="number"
            min={1}
            value={form.total_sessions}
            onChange={(event) => set("total_sessions", Number(event.target.value))}
          />
          <Input
            label="Duration (weeks)"
            type="number"
            min={1}
            value={form.duration_weeks}
            onChange={(event) => set("duration_weeks", Number(event.target.value))}
          />
          <Input
            label="Max students"
            type="number"
            min={1}
            value={form.max_students}
            onChange={(event) => set("max_students", Number(event.target.value))}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Select
            label="Mode"
            value={form.mode}
            onChange={(event) => set("mode", event.target.value)}
            options={[
              { value: "online", label: "Online" },
              { value: "offline", label: "In-person" },
              { value: "both", label: "Hybrid" },
            ]}
          />
          <Input
            label="Price (₹)"
            type="number"
            min={0}
            value={form.price}
            onChange={(event) => set("price", event.target.value)}
          />
          <Input
            label="Start date"
            type="date"
            value={form.start_date}
            onChange={(event) => set("start_date", event.target.value)}
          />
        </div>

        <div className="flex justify-end gap-2 border-t border-line pt-4">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleCreate} isLoading={createMutation.isPending}>
            Create draft
          </Button>
        </div>
      </div>
    </Modal>
  );
}
