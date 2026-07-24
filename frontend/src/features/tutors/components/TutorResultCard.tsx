import { ArrowUpRight, BadgeCheck, Clock, Globe2, GraduationCap, MapPin, Star, Video, Zap } from "lucide-react";
import { Link } from "react-router-dom";

import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";
import type { TutorProfile } from "@/types";

/**
 * Search result card — V3 (redesign). Surfaces the full decision set:
 * verification, rating, experience, subjects, languages, teaching mode,
 * price, response time, and live availability. Same /tutors/:id destination
 * and data as always; premium hover-lift, no tilt/glow.
 */
export function TutorResultCard({ tutor }: { tutor: TutorProfile }) {
  const subjects = (tutor.tutor_subjects ?? []).slice(0, 3);
  const extraSubjects = Math.max((tutor.tutor_subjects?.length ?? 0) - subjects.length, 0);
  const rating = Number(tutor.rating_average);
  const languages = (tutor.languages ?? []).slice(0, 2);

  const modeLabel =
    tutor.teaching_mode === "both"
      ? "Online · In-person"
      : tutor.teaching_mode === "offline"
        ? tutor.city || "In-person"
        : "Online";
  const ModeIcon = tutor.teaching_mode === "offline" ? MapPin : tutor.teaching_mode === "both" ? Globe2 : Video;

  return (
    <Link
      to={`/tutors/${tutor.id}`}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-sand/70 bg-white shadow-soft transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
    >
      {/* Gradient header wash — solid card, just a soft warm tint at the top */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-br from-forest-subtle via-[#FFF8E8] to-transparent opacity-70 transition-opacity group-hover:opacity-100"
      />

      <div className="relative p-5">
        {tutor.is_featured && (
          <Badge tone="gold" className="absolute right-4 top-4">
            Featured
          </Badge>
        )}
        <div className="flex items-start gap-3.5">
          <div className="relative">
            <Avatar
              src={tutor.user.avatar}
              firstName={tutor.user.first_name}
              lastName={tutor.user.last_name}
              size="lg"
              className="ring-4 ring-white"
            />
            {tutor.is_accepting_students && (
              <span
                className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white"
                title="Accepting students"
              >
                <span className="h-2.5 w-2.5 rounded-full bg-success ring-2 ring-white" />
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1 pt-1">
            <p className="flex items-center gap-1.5 font-display font-bold text-navy">
              <span className="truncate">{tutor.user.full_name}</span>
              {tutor.is_verified && <BadgeCheck className="h-4 w-4 shrink-0 text-primary" aria-label="Verified" />}
            </p>
            <p className="mt-0.5 truncate text-sm text-slate-500">{tutor.headline || "Experienced tutor"}</p>
          </div>
        </div>

        {/* Rating · experience */}
        <div className="mt-3.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
          <span className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-accent text-accent" />
            <span className="font-semibold text-navy">{rating > 0 ? rating.toFixed(1) : "New"}</span>
            {tutor.rating_count > 0 && <span className="text-xs text-slate-400">({tutor.rating_count})</span>}
          </span>
          {tutor.experience_years > 0 && (
            <span className="flex items-center gap-1 text-slate-600">
              <GraduationCap className="h-4 w-4 text-slate-400" />
              {tutor.experience_years} yr{tutor.experience_years === 1 ? "" : "s"} exp
            </span>
          )}
        </div>

        {/* Subjects */}
        {subjects.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {subjects.map((ts) => (
              <Badge key={ts.id} tone="neutral">
                {ts.subject.name}
              </Badge>
            ))}
            {extraSubjects > 0 && <Badge tone="neutral">+{extraSubjects}</Badge>}
          </div>
        )}

        {/* Meta grid */}
        <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 border-t border-sand/70 pt-4 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <ModeIcon className="h-3.5 w-3.5 text-slate-400" />
            <span className="truncate">{modeLabel}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-slate-400" />
            <span className="truncate">~{tutor.response_time_minutes} min reply</span>
          </div>
          {languages.length > 0 && (
            <div className="flex items-center gap-1.5">
              <Globe2 className="h-3.5 w-3.5 text-slate-400" />
              <span className="truncate">{languages.join(", ")}</span>
            </div>
          )}
          {tutor.total_sessions_completed > 0 && (
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              <span className="truncate">{tutor.total_sessions_completed} sessions</span>
            </div>
          )}
        </dl>
      </div>

      {/* Footer: price + CTA */}
      <div className="relative mt-auto flex items-center justify-between border-t border-sand/70 bg-linen/40 px-5 py-3.5">
        <p className="font-display text-lg font-bold text-navy">
          {formatCurrency(tutor.hourly_rate, tutor.currency)}
          <span className="text-xs font-normal text-slate-400">/hr</span>
        </p>
        <span className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-soft transition-all group-hover:bg-primary-dark group-hover:shadow-hover">
          View profile
          <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
