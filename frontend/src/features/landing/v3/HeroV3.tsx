import { motion } from "framer-motion";
import { ArrowRight, BadgeCheck, CalendarCheck, Lock, Search, ShieldCheck, Sparkles, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import { StarRating } from "@/components/shared/StarRating";
import { Avatar } from "@/components/ui/Avatar";
import { GlassPanel } from "@/components/ui/Surface";
import { FlightTrail } from "@/features/landing/v3/FlightTrail";
import { useLandingTutorPool } from "@/features/landing/v3/useTutorPool";
import { DURATION, EASE_OUT, motionSafe, riseInit } from "@/lib/motion/tokens";
import { cn, formatCurrency } from "@/lib/utils";
import type { TutorProfile } from "@/types";

/**
 * Landing V6 hero — "The Journey" (DESIGN_V3.md V6 addendum). A dawn-sky
 * gradient, slow-drifting cloud blooms, and an original aircraft-and-trail
 * motif (FlightTrail.tsx) replace V5's cool ambient-blue treatment on the
 * hero specifically. Real tutors remain the illustration on the right —
 * still no invented imagery there, just a warmer atmosphere around it.
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
        "flex w-72 items-center gap-3 rounded-2xl border border-sand bg-white/80 p-4 shadow-hover backdrop-blur-md transition-all",
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
      {/* Dawn accent over the shared PublicAtmosphere: no opaque fill of its
          own anymore (V7 Milestone 2) — just a soft gold wash and drifting
          cloud blooms layered on top of the page-wide atmosphere. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(70%_90%_at_30%_0%,rgba(244,180,0,0.12)_0%,transparent_70%)]" />
        <div className="absolute -left-24 top-8 h-64 w-[32rem] animate-float-slow rounded-[50%] bg-white/70 blur-3xl motion-reduce:animate-none" />
        <div
          className="absolute -right-16 top-28 h-56 w-[28rem] animate-float-slow rounded-[50%] bg-white/60 blur-3xl motion-reduce:animate-none"
          style={{ animationDelay: "-3.5s" }}
        />
        <div
          className="absolute left-1/3 top-4 h-40 w-80 animate-float-slow rounded-[50%] bg-sage/[0.12] blur-3xl motion-reduce:animate-none"
          style={{ animationDelay: "-5s" }}
        />
      </div>
      <FlightTrail className="pointer-events-none absolute inset-x-0 top-0 hidden h-[420px] lg:block" />
      <div className="container-page relative grid items-center gap-12 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
        <div>
          <motion.span
            {...arriveProps(0)}
            className="inline-flex items-center gap-1.5 rounded-full bg-forest-subtle px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-forest"
          >
            <Sparkles className="h-3.5 w-3.5" /> Verified tutors, real availability
          </motion.span>
          <motion.h1
            {...arriveProps(0.05)}
            className="mt-4 max-w-xl font-editorial text-[2.75rem] font-semibold leading-[1.05] tracking-[-0.02em] text-navy sm:text-6xl lg:text-[4.1rem]"
          >
            The right tutor,{" "}
            <span className="bg-gradient-to-r from-forest via-forest to-gold-star bg-clip-text italic text-transparent">
              one page away.
            </span>
          </motion.h1>
          <motion.p {...arriveProps(0.12)} className="mt-5 max-w-lg text-lg leading-relaxed text-slate-600">
            Search verified tutors, book straight into their real availability, and learn live — one-on-one or in
            small-group courses. Payments and progress in one place.
          </motion.p>

          <motion.form
            {...arriveProps(0.2)}
            onSubmit={onSearch}
            className="mt-8 flex max-w-lg items-center gap-2 rounded-2xl border border-sand bg-white/80 p-2 pl-4 shadow-soft backdrop-blur-md transition-shadow focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20"
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
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-forest-subtle text-forest">
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
