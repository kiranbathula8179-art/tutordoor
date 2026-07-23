import { useQuery } from "@tanstack/react-query";
import { useMasterData } from "@/lib/master-data";
import { BookOpen, CalendarDays, Users } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { listPublishedCourses } from "@/features/courses/api";
import { getSubjects } from "@/features/tutors/api";
import { cn, formatCurrency, formatDate } from "@/lib/utils";

export function PublicCoursesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { optionsFor } = useMasterData(["skill_level"]);
  const subjectId = searchParams.get("subject_id") ?? "";
  const level = searchParams.get("level") ?? "";
  const mode = searchParams.get("mode") ?? "";

  const { data: subjects = [] } = useQuery({ queryKey: ["subjects"], queryFn: () => getSubjects() });

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["public-courses", subjectId, level, mode],
    queryFn: () =>
      listPublishedCourses({
        subject_id: subjectId || undefined,
        level: level || undefined,
        mode: mode || undefined,
      }),
  });

  const updateFilter = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  };

  return (
    <div className="container-page py-10">
      <h1 className="font-display text-display-sm font-bold tracking-tight text-navy">Group courses</h1>
      <p className="mt-2 max-w-lg text-slate-500">
        Structured programs with a fixed schedule, limited seats, and one price for the whole series.
      </p>

      <div className="mt-6 grid max-w-2xl gap-3 sm:grid-cols-3">
        <Select
          aria-label="Filter by subject"
          value={subjectId}
          onChange={(event) => updateFilter("subject_id", event.target.value)}
          options={[{ value: "", label: "Any subject" }, ...subjects.map((subject) => ({ value: subject.id, label: subject.name }))]}
        />
        <Select
          aria-label="Filter by level"
          value={level}
          onChange={(event) => updateFilter("level", event.target.value)}
          options={[{ value: "", label: "Any level" }, ...optionsFor("skill_level")]}
        />
        <Select
          aria-label="Filter by mode"
          value={mode}
          onChange={(event) => updateFilter("mode", event.target.value)}
          options={[
            { value: "", label: "Any mode" },
            { value: "online", label: "Online" },
            { value: "offline", label: "In-person" },
            { value: "both", label: "Hybrid" },
          ]}
        />
      </div>

      <div className="mt-8">
        {isLoading ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3" role="status" aria-label="Loading courses">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-64 rounded-card" />
            ))}
          </div>
        ) : !data || data.results.length === 0 ? (
          <div className="rounded-card border border-line bg-canvas shadow-soft">
            <EmptyState
              icon={BookOpen}
              title="No courses match these filters yet"
              description="Try clearing a filter, or check back soon — tutors publish new courses regularly."
              action={
                (subjectId || level || mode) ? (
                  <Button variant="outline" onClick={() => setSearchParams({})}>
                    Clear filters
                  </Button>
                ) : undefined
              }
            />
          </div>
        ) : (
          <div className={cn("grid gap-5 md:grid-cols-2 lg:grid-cols-3", isFetching && "opacity-60")}>
            {data.results.map((course) => (
              <Link
                key={course.id}
                to={`/courses/${course.id}`}
                className="group flex flex-col rounded-card border border-line bg-canvas p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                <div className="flex items-start justify-between gap-2">
                  <Badge tone="neutral">{course.subject.name}</Badge>
                  <Badge tone="info">{course.level.replace("_", " ")}</Badge>
                </div>

                <h2 className="mt-3 font-display text-lg font-bold leading-snug text-navy">{course.title}</h2>

                <div className="mt-3 flex items-center gap-2">
                  <Avatar
                    src={course.tutor.user.avatar}
                    firstName={course.tutor.user.first_name}
                    lastName={course.tutor.user.last_name}
                    size="sm"
                  />
                  <span className="text-sm text-slate-600">{course.tutor.user.full_name}</span>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                  <span>{course.total_sessions} sessions</span>
                  <span
                    className={cn(
                      "flex items-center gap-1",
                      course.seats_available > 0 && course.seats_available <= 3 && "font-semibold text-accent-dark"
                    )}
                  >
                    <Users className="h-3.5 w-3.5" />
                    {course.seats_available > 0 && course.seats_available <= 3
                      ? `Only ${course.seats_available} seat${course.seats_available === 1 ? "" : "s"} left`
                      : `${course.seats_available} seat${course.seats_available === 1 ? "" : "s"} left`}
                  </span>
                  {course.start_date && (
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {formatDate(course.start_date)}
                    </span>
                  )}
                </div>

                <p className="mt-auto pt-4 font-display text-xl font-bold tracking-tight text-navy">
                  {Number(course.price) === 0 ? "Free" : formatCurrency(course.price, course.currency)}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
