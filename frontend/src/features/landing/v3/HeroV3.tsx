import { motion } from "framer-motion";
import { ArrowRight, BadgeCheck, CalendarCheck, GraduationCap, Lock, Search, ShieldCheck, Sparkles, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import { StarRating } from "@/components/shared/StarRating";
import { Avatar } from "@/components/ui/Avatar";
import { AuroraWash, DotGrid, GlassPanel } from "@/components/ui/Surface";
import { useLandingTutorPool } from "@/features/landing/v3/useTutorPool";
import { DURATION, EASE_OUT, motionSafe, riseInit } from "@/lib/motion/tokens";
import { cn, formatCurrency } from "@/lib/utils";
import type { TutorProfile } from "@/types";

/**
 * Landing V3 — bright hero (DESIGN_V3.md, migration step 3).
 *
 * The hero's visual is REAL top-rated tutors from the live search API — the
 * product itself is the illustration, so nothing is faked. No WebGL, no dark
 * field; canvas white, one subtle primary wash, Jakarta display type.
 */

// ---------------------------------------------------------------------------
// Announcement bar (dismissible) + sticky nav
// ---------------------------------------------------------------------------

export function AnnouncementBar() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return (
    <div className="relative bg-primary px-10 py-2 text-center text-sm font-medium text-white">
      <Link to="/courses" className="inline-flex items-center gap-1.5 hover:underline">
        New · Small-group courses are live — browse the catalog <ArrowRight className="h-3.5 w-3.5" />
      </Link>
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss announcement"
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-white/80 transition-colors hover:bg-white/15 hover:text-white"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export { NavV3 } from "@/components/layout/NavV3";

// ---------------------------------------------------------------------------
// Hero — copy + search on the left, real tutors as the visual on the right
// ---------------------------------------------------------------------------

const TRUST_CHIPS = [
  { icon: ShieldCheck, text: "Document-verified tutors" },
  { icon: CalendarCheck, text: "Book real availability" },
  { icon: Lock, text: "Secure payments" },
];

function TutorPreviewCard({ tutor, className }: { tutor: TutorProfile; className?: string }) {
  const subject = tutor.tutor_subjects?.[0]?.subject.name;
  return (
    <Link
      to={`/tutors/${tutor.id}`}
      className={cn(
        "flex w-72 items-center gap-3 rounded-2xl border border-line bg-canvas p-4 shadow-hover transition-all",
        "hover:-translate-y-0.5 hover:shadow-dropdown motion-reduce:animate-none",
        className
      )}
    >
      <Avatar src={tutor.user.avatar} firstName={tutor.user.first_name} lastName={tutor.user.last_name} size="md" />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1 truncate text-sm font-semibold text-navy">
          {tutor.user.full_name}
          {tutor.is_verified && <BadgeCheck className="h-4 w-4 shrink-0 text-primary" />}
        </p>
        <p className="truncate text-xs text-slate-500">{subject ?? tutor.headline ?? "Tutor"}</p>
        <div className="mt-0.5 flex items-center gap-1.5">
          <StarRating rating={Number(tutor.rating_average)} size="sm" showValue={false} />
          <span className="text-[0.7rem] font-medium text-slate-500">
            {formatCurrency(tutor.hourly_rate, tutor.currency)}/hr
          </span>
        </div>
      </div>
    </Link>
  );
}

/** Entrance transition — canonical motion tokens, staggered by delay. */
const arriveProps = (delay: number) => ({
  initial: riseInit(18),
  animate: { opacity: 1, y: 0 },
  transition: motionSafe({ duration: DURATION.slow, delay, ease: EASE_OUT }),
});

export function HeroV3() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const { data } = useLandingTutorPool();
  const topTutors = (data?.results ?? []).slice(0, 3);

  const onSearch = (event: FormEvent) => {
    event.preventDefault();
    navigate(`/search${query.trim() ? `?q=${encodeURIComponent(query.trim())}` : ""}`);
  };

  return (
    <section className="relative overflow-hidden">
      {/* Layered depth: radial wash → AuroraWash's slow-drifting orbs (V4 addendum, Surface.tsx) */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-[480px] bg-[radial-gradient(60%_100%_at_50%_0%,#EFF6FF_0%,transparent_70%)]" />
        {/* Editorial watermark — the kind of oversized, near-invisible mark that gives a hero room to breathe. */}
        <GraduationCap className="absolute -right-16 -top-10 hidden h-[420px] w-[420px] text-primary/[0.035] lg:block" />
      </div>
      <AuroraWash className="h-[480px]" />
      <DotGrid size={22} className="h-[480px] opacity-60" />
      <div className="container-page relative grid items-center gap-12 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
        <div>
          <motion.span
            {...arriveProps(0)}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary-subtle px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-primary"
          >
            <Sparkles className="h-3.5 w-3.5" /> Verified tutors, real availability
          </motion.span>
          <motion.h1
            {...arriveProps(0.05)}
            className="mt-4 max-w-xl font-display text-[2.75rem] font-extrabold leading-[1.03] tracking-[-0.03em] text-navy sm:text-6xl lg:text-[4.1rem]"
          >
            The right tutor for{" "}
            <span className="bg-gradient-to-r from-primary via-primary-light to-secondary bg-clip-text text-transparent">
              every learner.
            </span>
          </motion.h1>
          <motion.p {...arriveProps(0.12)} className="mt-5 max-w-lg text-lg leading-relaxed text-slate-600">
            Search verified tutors, book straight into their real availability, and learn live — one-on-one or in
            small-group courses. Payments and progress in one place.
          </motion.p>

          <motion.form
            {...arriveProps(0.2)}
            onSubmit={onSearch}
            className="mt-8 flex max-w-lg items-center gap-2 rounded-2xl border border-line bg-canvas p-2 pl-4 shadow-soft transition-shadow focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20"
          >
            <Search className="h-5 w-5 shrink-0 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="What do you want to learn? Try “Physics”…"
              aria-label="Search tutors by subject or name"
              className="w-full bg-transparent text-navy placeholder:text-slate-400 focus:outline-none"
            />
            <button
              type="submit"
              className="flex shrink-0 items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition-all hover:bg-primary-dark hover:shadow-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 active:scale-[0.97] motion-safe:hover:-translate-y-0.5"
            >
              Search <ArrowRight className="h-4 w-4" />
            </button>
          </motion.form>

          <motion.div
            {...arriveProps(0.28)}
            className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-line pt-5"
          >
            {TRUST_CHIPS.map(({ icon: Icon, text }) => (
              <span key={text} className="flex items-center gap-2 text-sm font-medium text-slate-600">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-subtle text-primary">
                  <Icon className="h-3.5 w-3.5" />
                </span>
                {text}
              </span>
            ))}
          </motion.div>
        </div>

        {/* The product as the illustration — real top-rated tutors, hand-placed rather than stacked */}
        {topTutors.length > 0 && (
          <div className="relative hidden justify-center lg:flex" aria-label="A few of our top-rated tutors">
            <motion.div
              {...arriveProps(0.5)}
              className="absolute -left-10 top-1/2 z-10 -translate-y-1/2"
            >
              <GlassPanel className="flex items-center gap-3 rounded-2xl px-4 py-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-success/15 text-success">
                  <ShieldCheck className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-bold leading-tight text-navy">100% verified</p>
                  <p className="text-xs leading-tight text-slate-500">Document-checked</p>
                </div>
              </GlassPanel>
            </motion.div>
            <div className="space-y-5">
              {topTutors.map((tutor, index) => (
                <motion.div
                  key={tutor.id}
                  {...arriveProps(0.25 + index * 0.1)}
                  className={cn(
                    "animate-float-slow motion-reduce:animate-none",
                    index === 0 && "-translate-x-6 -rotate-2",
                    index === 1 && "rotate-1",
                    index === 2 && "translate-x-6 -rotate-1"
                  )}
                  style={{ animationDelay: `${index * -2.3}s` }}
                >
                  <TutorPreviewCard tutor={tutor} />
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
