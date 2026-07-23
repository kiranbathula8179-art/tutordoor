import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowRight, CalendarCheck, ChevronDown, ShieldCheck, Video, Wallet } from "lucide-react";
import { Link } from "react-router-dom";

import { Logo } from "@/components/shared/Logo";
import { Skeleton } from "@/components/ui/Skeleton";
import { SectionHeading } from "@/features/landing/v3/SectionHeading";
import { iconForSubject } from "@/features/landing/v3/subjectIcons";
import { useLandingTutorPool } from "@/features/landing/v3/useTutorPool";
import { getSubjects } from "@/features/tutors/api";
import { TutorResultCard } from "@/features/tutors/components/TutorResultCard";
import { DURATION, EASE_OUT, fadeRise, motionSafe, staggerContainer, staggerItem } from "@/lib/motion/tokens";

/**
 * Landing V3 sections — real data, truthful copy, subtle motion, on the
 * canonical `lib/motion/tokens.ts` system shared with every other elevated
 * page (Auth, Tutor Profile, Booking, Wallet, Chat, all 5 dashboards).
 * Deliberately absent (documented in DESIGN_V3 + KNOWN_LIMITATIONS): a
 * pricing section — no public plans endpoint, backend is frozen. Testimonials
 * are NOT absent here — see TestimonialsV3.tsx, sourced from real per-tutor
 * reviews via the public reviews endpoint.
 */

// ---------------------------------------------------------------------------
// Categories — live from the API, real per-subject icon
// ---------------------------------------------------------------------------

export function CategoriesV3() {
  const { data: subjects = [] } = useQuery({ queryKey: ["subjects"], queryFn: () => getSubjects() });
  const shown = subjects.slice(0, 8);

  if (shown.length === 0) return null;

  return (
    <section className="container-page py-20">
      <SectionHeading eyebrow="Categories" title="Popular subjects to explore" />
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-60px" }}
        variants={staggerContainer}
        className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4"
      >
        {shown.map((subject) => {
          const Icon = iconForSubject(subject.name);
          return (
            <motion.div key={subject.id} variants={staggerItem}>
              <Link
                to={`/search?subject_id=${subject.id}`}
                className="group flex h-full flex-col justify-between rounded-2xl border border-line bg-canvas p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-subtle text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="mt-6">
                  <p className="font-semibold text-navy">{subject.name}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                    Find tutors <ArrowRight className="h-3 w-3" />
                  </p>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Featured tutors — shares the landing tutor pool with Hero (real data,
// trusts the API's own -is_featured,-rating_average ordering); graceful when empty
// ---------------------------------------------------------------------------

export function FeaturedTutorsV3() {
  const { data, isLoading } = useLandingTutorPool();

  // Slice past the 3 tutors Hero already shows, so the sections never repeat people.
  const featured = (data?.results ?? []).slice(3, 6);

  // Nothing to show on a fresh platform — fail gracefully, like CategoriesV3.
  if (!isLoading && featured.length === 0) return null;

  return (
    <section className="container-page py-20">
      <SectionHeading eyebrow="Tutors" title="Learn from verified tutors" />
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-60px" }}
        variants={staggerContainer}
        className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
      >
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-2xl" />)
          : featured.map((tutor) => (
              <motion.div key={tutor.id} variants={staggerItem} className="h-full">
                <TutorResultCard tutor={tutor} />
              </motion.div>
            ))}
      </motion.div>
      <div className="mt-8 flex justify-center">
        <Link
          to="/search"
          className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-canvas px-5 py-2.5 text-sm font-semibold text-navy shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          Browse all tutors <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// How it works
// ---------------------------------------------------------------------------

const STEPS = [
  {
    title: "Find your tutor",
    body: "Search by subject and compare verified profiles — ratings come from completed sessions only, never purchased.",
  },
  {
    title: "Book real availability",
    body: "Pick a slot straight from the tutor's live calendar. Double-booking is impossible — the database forbids it.",
  },
  {
    title: "Learn live, pay safely",
    body: "Join your class from the booking, pay through secure gateways, and leave a review that actually counts.",
  },
];

export function HowItWorksV3() {
  return (
    <section className="bg-surface py-20">
      <div className="container-page">
        <SectionHeading eyebrow="How it works" title="From search to session in three steps" />
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          variants={staggerContainer}
          className="mt-10 grid gap-5 md:grid-cols-3"
        >
          {STEPS.map((step, index) => (
            <motion.div
              key={step.title}
              variants={staggerItem}
              className="rounded-2xl border border-line bg-canvas p-6 shadow-soft"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-sm font-bold text-white">
                {index + 1}
              </span>
              <h3 className="mt-5 font-display text-lg font-bold text-navy">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.body}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Why TutorDoor — four truthful capabilities
// ---------------------------------------------------------------------------

const FEATURES = [
  { icon: ShieldCheck, title: "Verified by review", body: "Tutor documents are reviewed before the verified badge ever appears." },
  { icon: CalendarCheck, title: "Availability you can trust", body: "Bookings land only inside published availability — conflicts are blocked at the database level." },
  { icon: Wallet, title: "Every rupee on a ledger", body: "Wallets record each movement with the balance it left behind. Nothing vanishes." },
  { icon: Video, title: "Live classes built in", body: "Every confirmed session gets its own secure video room — no extra apps." },
];

export function WhyV3() {
  return (
    <section className="container-page py-20">
      <SectionHeading eyebrow="Why TutorDoor" title="Built for trust, not just traffic" />
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-60px" }}
        variants={staggerContainer}
        className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
      >
        {FEATURES.map(({ icon: Icon, title, body }) => (
          <motion.div key={title} variants={staggerItem}>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-subtle text-primary">
              <Icon className="h-5 w-5" />
            </span>
            <h3 className="mt-4 font-semibold text-navy">{title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{body}</p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// FAQ — real product answers
// ---------------------------------------------------------------------------

const FAQS = [
  ["How do bookings work?", "Search a tutor, pick a slot from their live availability, and pay to confirm. The session appears in your dashboard with its video room."],
  ["Can I cancel a booking?", "Yes — with at least 12 hours' notice before the start time you're eligible for a refund per the refund policy."],
  ["Which payment methods are supported?", "Razorpay and Stripe at checkout, plus your TutorDoor wallet balance and coupon codes where applicable."],
  ["How do I become a tutor?", "Register as a tutor, upload your verification documents, publish your availability and subjects — bookings can start once you're reviewed."],
  ["What are group courses?", "Tutors run multi-session small-group courses with a fixed schedule. Enroll once and every session lands in your calendar."],
  ["Can parents follow their child's learning?", "Yes — parents link a child's account (the student confirms) and can then see bookings, progress, and payments."],
] as const;

export function FaqV3() {
  return (
    <section className="bg-surface py-20">
      <div className="container-page max-w-3xl">
        <SectionHeading eyebrow="FAQ" title="Questions, answered" />
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          variants={staggerContainer}
          className="mt-8 space-y-3"
        >
          {FAQS.map(([question, answer]) => (
            <motion.details
              key={question}
              variants={staggerItem}
              className="group rounded-2xl border border-line bg-canvas px-5 shadow-soft open:shadow-hover"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-4 font-medium text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 [&::-webkit-details-marker]:hidden">
                {question}
                <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
              </summary>
              <p className="pb-4 text-sm leading-relaxed text-slate-600">{answer}</p>
            </motion.details>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// CTA + footer
// ---------------------------------------------------------------------------

export function CtaV3() {
  return (
    <section className="container-page py-20">
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-60px" }}
        variants={fadeRise}
        transition={motionSafe({ duration: DURATION.slow, ease: EASE_OUT })}
        className="rounded-3xl bg-primary px-8 py-14 text-center shadow-hover sm:px-14"
      >
        <h2 className="mx-auto max-w-2xl font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Start learning with a tutor who's actually available.
        </h2>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/register"
            className="rounded-xl bg-canvas px-6 py-3 font-semibold text-primary shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          >
            Create a free account
          </Link>
          <Link
            to="/search"
            className="rounded-xl px-6 py-3 font-semibold text-white/90 transition-colors hover:bg-white/10 hover:text-white"
          >
            Browse tutors →
          </Link>
        </div>
      </motion.div>
    </section>
  );
}

const FOOTER_GROUPS = [
  { heading: "Product", links: [["Find tutors", "/search"], ["Courses", "/courses"], ["Become a tutor", "/register?role=tutor"]] },
  { heading: "Company", links: [["About", "/about"], ["Trust & Safety", "/trust-safety"], ["Support", "/support"]] },
  { heading: "Legal", links: [["Terms", "/terms"], ["Privacy", "/privacy"], ["Refunds", "/refunds"]] },
] as const;

export function FooterV3() {
  return (
    <footer className="border-t border-line bg-canvas">
      <div className="container-page grid gap-10 py-12 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-slate-500">
            Verified tutors, real availability, and payments you can audit — for every learner.
          </p>
        </div>
        {FOOTER_GROUPS.map((group) => (
          <nav key={group.heading} aria-label={group.heading}>
            <p className="text-sm font-semibold text-navy">{group.heading}</p>
            <ul className="mt-3 space-y-2">
              {group.links.map(([label, to]) => (
                <li key={to}>
                  <Link to={to} className="text-sm text-slate-500 transition-colors hover:text-navy">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-line py-5 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} TutorDoor. All rights reserved.
      </div>
    </footer>
  );
}
