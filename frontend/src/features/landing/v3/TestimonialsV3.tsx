import { useQueries } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Quote } from "lucide-react";
import { Link } from "react-router-dom";

import { StarRating } from "@/components/shared/StarRating";
import { Avatar } from "@/components/ui/Avatar";
import { Skeleton } from "@/components/ui/Skeleton";
import { AmbientWash } from "@/components/ui/Surface";
import { SectionHeading } from "@/features/landing/v3/SectionHeading";
import { useLandingTutorPool } from "@/features/landing/v3/useTutorPool";
import { getTutorReviews } from "@/features/reviews/api";
import { prefersReducedMotion } from "@/lib/motion/quality";
import { staggerContainer, staggerItem } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";
import type { TutorProfile, TutorReview } from "@/types";

/**
 * Real testimonials, not invented ones — sourced from the public per-tutor
 * reviews endpoint (no platform-wide "top reviews" endpoint exists, and the
 * backend is frozen so one can't be added). Candidates come from the same
 * shared tutor pool Hero/FeaturedTutors use; only reviews with a written
 * comment and a rating of 4+ qualify. If none exist yet, the section hides
 * gracefully — the same pattern FeaturedTutorsV3/CategoriesV3 already use.
 */

const MIN_TESTIMONIAL_RATING = 4;
const MAX_CANDIDATE_TUTORS = 6;
const MAX_TESTIMONIALS = 6;

interface Testimonial {
  review: TutorReview;
  tutor: TutorProfile;
}

export function TestimonialsV3() {
  const still = prefersReducedMotion();
  const { data: pool, isLoading: poolLoading } = useLandingTutorPool();

  const candidates = (pool?.results ?? []).filter((tutor) => tutor.rating_count > 0).slice(0, MAX_CANDIDATE_TUTORS);

  const reviewQueries = useQueries({
    queries: candidates.map((tutor) => ({
      queryKey: ["landing-tutor-reviews", tutor.id],
      queryFn: () => getTutorReviews(tutor.id, { page_size: 5 }),
    })),
  });

  const stillFetching = poolLoading || reviewQueries.some((query) => query.isLoading);

  const testimonials: Testimonial[] = candidates
    .flatMap((tutor, index) => {
      const reviews = reviewQueries[index]?.data?.results ?? [];
      return reviews
        .filter((review) => review.rating >= MIN_TESTIMONIAL_RATING && review.comment.trim().length > 0)
        .map((review) => ({ review, tutor }));
    })
    .sort((a, b) => b.review.rating - a.review.rating || (a.review.created_at < b.review.created_at ? 1 : -1))
    .slice(0, MAX_TESTIMONIALS);

  if (stillFetching) {
    return (
      <section className="container-page py-20">
        <SectionHeading eyebrow="Testimonials" title="What learners say" />
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-56 rounded-2xl" />
          ))}
        </div>
      </section>
    );
  }

  // Nothing real to show yet on a fresh platform — hide, don't invent.
  if (testimonials.length === 0) return null;

  // Already sorted rating desc, then newest first — the first is legitimately "the best," not arbitrary.
  const [featured, ...rest] = testimonials;

  return (
    <section className="container-page relative py-20">
      <AmbientWash tones={["clay", "gold"]} />
      <SectionHeading eyebrow="Testimonials" title="What learners say" />
      <motion.div
        initial={still ? false : "hidden"}
        whileInView="show"
        viewport={{ once: true, margin: "-60px" }}
        variants={staggerContainer}
        className={cn("relative mt-8 grid gap-5", rest.length > 0 && "lg:grid-cols-[1.3fr_1fr]")}
      >
        {/* Editorial pull-quote treatment for the strongest real review. */}
        <motion.div
          variants={staggerItem}
          className="relative flex flex-col justify-between rounded-3xl border border-sand/70 bg-white/70 p-8 shadow-soft backdrop-blur-sm sm:p-10"
        >
          <Quote className="h-10 w-10 shrink-0 text-primary/20" aria-hidden="true" />
          <p className="mt-4 flex-1 font-display text-xl leading-relaxed text-navy sm:text-2xl">
            &ldquo;{featured.review.comment}&rdquo;
          </p>
          <div className="mt-8 flex items-center gap-3 border-t border-line pt-6">
            <Avatar
              src={featured.review.student.user.avatar}
              firstName={featured.review.student.user.first_name}
              lastName={featured.review.student.user.last_name}
              size="md"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-navy">{featured.review.student.user.full_name}</p>
              <Link
                to={`/tutors/${featured.tutor.id}`}
                className="truncate text-xs text-slate-500 transition-colors hover:text-primary"
              >
                Session with {featured.tutor.user.full_name}
              </Link>
            </div>
            <StarRating rating={featured.review.rating} size="sm" showValue={false} />
          </div>
        </motion.div>

        {rest.length > 0 && (
          <div className="flex flex-col gap-5">
            {rest.map(({ review, tutor }) => (
              <motion.div
                key={review.id}
                variants={staggerItem}
                className="flex flex-1 flex-col rounded-2xl border border-sand/70 bg-white/70 p-6 shadow-soft backdrop-blur-sm"
              >
                <Quote className="h-5 w-5 shrink-0 text-primary/25" aria-hidden="true" />
                <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600">&ldquo;{review.comment}&rdquo;</p>
                <div className="mt-4 flex items-center gap-3 border-t border-line pt-4">
                  <Avatar
                    src={review.student.user.avatar}
                    firstName={review.student.user.first_name}
                    lastName={review.student.user.last_name}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-navy">{review.student.user.full_name}</p>
                    <Link
                      to={`/tutors/${tutor.id}`}
                      className="truncate text-xs text-slate-500 transition-colors hover:text-primary"
                    >
                      Session with {tutor.user.full_name}
                    </Link>
                  </div>
                  <StarRating rating={review.rating} size="sm" showValue={false} />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </section>
  );
}
