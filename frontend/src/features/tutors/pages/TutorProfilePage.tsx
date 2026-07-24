import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  BookOpen,
  Clock,
  Globe2,
  GraduationCap,
  Languages,
  MapPin,
  PlayCircle,
  SearchX,
  Sparkles,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageLoader } from "@/components/ui/Spinner";
import { AmbientWash } from "@/components/ui/Surface";
import { StarRating } from "@/components/shared/StarRating";
import { BookingModal } from "@/features/bookings/components/BookingModal";
import { getTutorById } from "@/features/tutors/api";
import { apiClient } from "@/lib/api-client";
import { DURATION, EASE_OUT, riseInit, staggerContainer, staggerItem } from "@/lib/motion/tokens";
import { prefersReducedMotion } from "@/lib/motion/quality";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import type { PaginatedResponse, TutorProfile, TutorReview } from "@/types";

/**
 * Tutor public profile — V7 "One World" (DESIGN_V3.md V7 addendum),
 * editorial and trustworthy. Sits on the shared `PublicAtmosphere`
 * (mounted once by `PublicLayout`); the cover band moved from a saturated
 * blue `BrandMesh` fill to a warm ambient wash so the page's one big color
 * block isn't blue (V7 reserves blue for interactive elements). Overlapping
 * identity card, animated stat tiles, rich subject/language sections,
 * review composition with a rating-distribution bar, and an elevated
 * sticky booking panel + mobile booking bar — all kept solid/light
 * surfaces, not translucent, for trust-signal legibility.
 *
 * PRESERVED VERBATIM: both queries and their keys, the auth redirect (with
 * `state.from`), the student/parent booking guard, the demo-class truth, and
 * BookingModal wiring. Only the presentation changed.
 */

async function fetchTutorReviews(tutorId: string): Promise<PaginatedResponse<TutorReview>> {
  const { data } = await apiClient.get<PaginatedResponse<TutorReview>>(`/reviews/tutors/${tutorId}/`);
  return data;
}

export function TutorProfilePage() {
  const { tutorId } = useParams<{ tutorId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [bookingOpen, setBookingOpen] = useState(false);
  const still = prefersReducedMotion();

  const { data: tutor, isLoading } = useQuery({
    queryKey: ["tutor", tutorId],
    queryFn: () => getTutorById(tutorId!),
    enabled: !!tutorId,
  });

  const { data: reviews } = useQuery({
    queryKey: ["tutor-reviews", tutorId],
    queryFn: () => fetchTutorReviews(tutorId!),
    enabled: !!tutorId,
  });

  const canBook = !isAuthenticated || user?.role === "student" || user?.role === "parent";

  const handleBookClick = () => {
    if (!isAuthenticated) {
      navigate("/login", { state: { from: { pathname: `/tutors/${tutorId}` } } });
      return;
    }
    if (user?.role !== "student" && user?.role !== "parent") {
      return;
    }
    setBookingOpen(true);
  };

  if (isLoading) return <PageLoader />;

  if (!tutor) {
    return (
      <Card className="mx-auto mt-10 max-w-lg border-sand/70 bg-white">
        <EmptyState
          icon={SearchX}
          title="Tutor not found"
          description="This profile may have been removed, or the link is out of date."
          action={
            <Button variant="outline" onClick={() => navigate("/search")}>
              Browse tutors
            </Button>
          }
        />
      </Card>
    );
  }

  const ratingValue = Number(tutor.rating_average);

  return (
    <div className="relative pb-24 lg:pb-16">
      <section className="relative h-44 overflow-hidden sm:h-56">
        <AmbientWash tones={["gold", "forest"]} />
        <div className="absolute inset-0 bg-gradient-to-br from-[#FFF8E8]/60 via-transparent to-forest-subtle/40" />
      </section>

      <div className="container-page relative">
        <motion.div
          initial={riseInit(24)}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: DURATION.slow, ease: EASE_OUT }}
          className="relative -mt-20 rounded-3xl border border-sand/70 bg-white p-6 shadow-dialog sm:p-8"
        >
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <Avatar
              src={tutor.user.avatar}
              firstName={tutor.user.first_name}
              lastName={tutor.user.last_name}
              size="xl"
              className="h-28 w-28 shrink-0 text-3xl shadow-hover ring-4 ring-white"
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="font-editorial text-3xl font-semibold tracking-tight text-navy">
                  {tutor.user.full_name}
                </h1>
                {tutor.is_verified && (
                  <Badge tone="success">
                    <BadgeCheck className="h-3.5 w-3.5" /> Verified
                  </Badge>
                )}
                {tutor.is_accepting_students && (
                  <Badge tone="info">
                    <span className="h-1.5 w-1.5 rounded-full bg-info-dark" /> Accepting students
                  </Badge>
                )}
              </div>
              {tutor.headline && <p className="mt-1.5 max-w-2xl text-lg text-slate-600">{tutor.headline}</p>}

              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500">
                <span className="flex items-center gap-1.5">
                  <Globe2 className="h-4 w-4 text-slate-400" />
                  {tutor.teaching_mode === "both" ? "Online & in-person" : tutor.teaching_mode}
                </span>
                {tutor.city && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    {tutor.city}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-slate-400" />
                  Replies in ~{tutor.response_time_minutes} min
                </span>
              </div>

              {tutor.intro_video_url && (
                <a
                  href={tutor.intro_video_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-sand bg-white px-3.5 py-2 text-sm font-semibold text-primary shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                >
                  <PlayCircle className="h-4 w-4" /> Watch intro video
                </a>
              )}
            </div>
          </div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="mt-6 grid grid-cols-2 gap-3 border-t border-sand/70 pt-6 sm:grid-cols-4"
          >
            <ProfileStat icon={Star} tint="accent" value={tutor.rating_count > 0 ? ratingValue.toFixed(1) : "New"} label={tutor.rating_count > 0 ? `${tutor.rating_count} reviews` : "No reviews yet"} />
            <ProfileStat icon={Users} tint="primary" value={tutor.total_sessions_completed} label="Sessions taught" />
            <ProfileStat icon={GraduationCap} tint="success" value={tutor.experience_years} label="Years experience" />
            <ProfileStat icon={TrendingUp} tint="info" value={`~${tutor.response_time_minutes}m`} label="Response time" />
          </motion.div>
        </motion.div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
          <div className="min-w-0 space-y-6">
            <SectionCard icon={BookOpen} title="About" delay={0.05}>
              <p className="whitespace-pre-line leading-relaxed text-slate-600">
                {tutor.bio || "This tutor hasn't added a bio yet."}
              </p>
            </SectionCard>

            <SectionCard icon={Sparkles} title="Subjects taught" delay={0.1}>
              {tutor.tutor_subjects.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {tutor.tutor_subjects.map((ts) => (
                    <div
                      key={ts.id}
                      className="flex items-center gap-3 rounded-xl border border-sand/70 bg-linen/40 p-3.5 transition-colors hover:border-primary/40"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-subtle text-primary">
                        <BookOpen className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-navy">{ts.subject.name}</p>
                        <p className="text-xs capitalize text-slate-500">{ts.expertise_level.replace(/_/g, " ")}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No subjects listed yet.</p>
              )}
            </SectionCard>

            {tutor.languages.length > 0 && (
              <SectionCard icon={Languages} title="Languages" delay={0.15}>
                <div className="flex flex-wrap gap-2">
                  {tutor.languages.map((language) => (
                    <span
                      key={language}
                      className="rounded-full bg-surface-3 px-3 py-1.5 text-sm font-medium capitalize text-slate-700"
                    >
                      {language}
                    </span>
                  ))}
                </div>
              </SectionCard>
            )}

            <SectionCard icon={Star} title="Reviews" delay={0.2}>
              <ReviewSummary tutor={tutor} reviewCount={reviews?.count} reviews={reviews?.results ?? []} />

              <div className="mt-5 space-y-4">
                {reviews && reviews.results.length === 0 && (
                  <EmptyState
                    icon={Star}
                    title="No reviews yet"
                    description="Reviews appear here after students complete sessions with this tutor."
                  />
                )}
                {reviews?.results.map((review) => (
                  <div key={review.id} className="rounded-2xl border border-sand/70 bg-linen/40 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <Avatar
                          firstName={review.student.user.first_name}
                          lastName={review.student.user.last_name}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-navy">
                            {review.student.user.full_name}
                          </p>
                          <p className="text-xs text-slate-400">{formatDate(review.created_at)}</p>
                        </div>
                      </div>
                      <StarRating rating={review.rating} showValue={false} size="sm" />
                    </div>
                    {review.comment && (
                      <p className="mt-3 text-sm leading-relaxed text-slate-600">{review.comment}</p>
                    )}
                    {review.tutor_response && (
                      <div className="mt-3 rounded-xl bg-white p-3.5 text-sm ring-1 ring-sand">
                        <p className="font-semibold text-navy">Tutor&apos;s response</p>
                        <p className="mt-1 leading-relaxed text-slate-600">{review.tutor_response}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>

          <div className="hidden lg:sticky lg:top-24 lg:block lg:h-fit">
            <motion.div
              initial={riseInit(20)}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: DURATION.slow, delay: still ? 0 : 0.15, ease: EASE_OUT }}
            >
              <Card className="overflow-hidden border-primary/20 bg-white shadow-hover">
                <div className="relative bg-gradient-to-br from-primary-subtle to-secondary-subtle px-6 py-5">
                  <p className="font-display text-4xl font-extrabold tracking-tight text-navy">
                    {formatCurrency(tutor.hourly_rate, tutor.currency)}
                    <span className="text-base font-medium text-slate-500"> /hour</span>
                  </p>
                  <p className="mt-0.5 text-sm text-slate-600">Free demo class available — once per tutor.</p>
                </div>
                <CardBody className="p-6 pt-5">
                  <Button className="w-full" size="lg" onClick={handleBookClick} disabled={!canBook}>
                    Book a session
                  </Button>
                  {!canBook && (
                    <p className="mt-2 text-center text-xs text-slate-400">
                      Booking is available on student and parent accounts.
                    </p>
                  )}

                  <dl className="mt-6 space-y-3 border-t border-sand/70 pt-5 text-sm">
                    <StatRow label="Sessions completed" value={tutor.total_sessions_completed} />
                    <StatRow label="Experience" value={`${tutor.experience_years} years`} />
                    <StatRow label="Teaching mode" value={tutor.teaching_mode === "both" ? "Online & in-person" : tutor.teaching_mode} capitalize />
                    <StatRow label="Languages" value={tutor.languages.join(", ") || "—"} />
                  </dl>
                </CardBody>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-sand/70 bg-white/95 backdrop-blur-xl lg:hidden">
        <div className="container-page flex items-center justify-between gap-3 py-3">
          <div>
            <p className="font-display text-xl font-extrabold text-navy">
              {formatCurrency(tutor.hourly_rate, tutor.currency)}
              <span className="text-xs font-medium text-slate-400"> /hr</span>
            </p>
            {!canBook && <p className="text-[0.65rem] text-slate-400">Student & parent accounts only</p>}
          </div>
          <Button size="lg" onClick={handleBookClick} disabled={!canBook}>
            Book a session
          </Button>
        </div>
      </div>

      <BookingModal tutor={tutor} isOpen={bookingOpen} onClose={() => setBookingOpen(false)} />
    </div>
  );
}

const STAT_TINTS = {
  primary: "bg-primary-subtle text-primary",
  success: "bg-success-subtle text-success-dark",
  accent: "bg-accent-subtle text-accent-dark",
  info: "bg-info-subtle text-info-dark",
} as const;

function ProfileStat({
  icon: Icon,
  value,
  label,
  tint,
}: {
  icon: typeof Star;
  value: string | number;
  label: string;
  tint: keyof typeof STAT_TINTS;
}) {
  return (
    <motion.div variants={staggerItem} className="rounded-2xl border border-sand/70 bg-linen/40 p-3.5 text-center sm:text-left">
      <span className={cn("inline-flex h-9 w-9 items-center justify-center rounded-lg", STAT_TINTS[tint])}>
        <Icon className="h-4 w-4" />
      </span>
      <p className="mt-2 font-display text-xl font-extrabold tracking-tight text-navy">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </motion.div>
  );
}

function SectionCard({
  icon: Icon,
  title,
  delay,
  children,
}: {
  icon: typeof Star;
  title: string;
  delay: number;
  children: React.ReactNode;
}) {
  const still = prefersReducedMotion();
  return (
    <motion.section
      initial={riseInit(18)}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: DURATION.base, delay: still ? 0 : delay, ease: EASE_OUT }}
    >
      <Card className="border-sand/70 bg-white">
        <CardBody className="p-6 pt-6">
          <h2 className="flex items-center gap-2 font-display text-xl font-bold text-navy">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-subtle text-primary">
              <Icon className="h-4 w-4" />
            </span>
            {title}
          </h2>
          <div className="mt-4">{children}</div>
        </CardBody>
      </Card>
    </motion.section>
  );
}

function ReviewSummary({
  tutor,
  reviewCount,
  reviews,
}: {
  tutor: TutorProfile;
  reviewCount?: number;
  reviews: TutorReview[];
}) {
  const ratingValue = Number(tutor.rating_average);
  const total = reviews.length;

  const dist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => Math.round(r.rating) === star).length,
  }));

  return (
    <div className="flex flex-col gap-6 rounded-2xl border border-sand/70 bg-linen/40 p-5 sm:flex-row sm:items-center">
      <div className="text-center sm:w-40 sm:shrink-0">
        <p className="font-display text-5xl font-extrabold tracking-tight text-navy">
          {tutor.rating_count > 0 ? ratingValue.toFixed(1) : "—"}
        </p>
        <div className="mt-1 flex justify-center">
          <StarRating rating={ratingValue} showValue={false} />
        </div>
        <p className="mt-1 text-xs text-slate-500">
          {tutor.rating_count > 0
            ? `${reviewCount ?? tutor.rating_count} review${(reviewCount ?? tutor.rating_count) === 1 ? "" : "s"}`
            : "No ratings yet"}
        </p>
      </div>
      {total > 0 && (
        <div className="flex-1 space-y-1.5">
          {dist.map(({ star, count }) => (
            <div key={star} className="flex items-center gap-2 text-xs">
              <span className="flex w-8 items-center gap-0.5 text-slate-500">
                {star}
                <Star className="h-3 w-3 fill-accent text-accent" />
              </span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-3">
                <div
                  className="h-full rounded-full bg-accent"
                  style={{ width: `${total > 0 ? (count / total) * 100 : 0}%` }}
                />
              </div>
              <span className="w-6 text-right text-slate-400">{count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatRow({ label, value, capitalize }: { label: string; value: string | number; capitalize?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className={cn("text-right font-semibold text-navy", capitalize && "capitalize")}>{value}</dd>
    </div>
  );
}
