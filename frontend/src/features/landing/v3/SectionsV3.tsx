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
import { prefersReducedMotion } from "@/lib/motion/quality";
import { cn } from "@/lib/utils";

/** Rotating icon-badge tones for Categories — real brand colors only, cycled for variety. */
const CATEGORY_TONES = [
  "bg-primary-subtle text-primary",
  "bg-secondary/10 text-secondary",
  "bg-accent/10 text-accent",
];

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
  const still = prefersReducedMotion();
  const { data: subjects = [] } = useQuery({ queryKey: ["subjects"], queryFn: () => getSubjects() });
  const shown = subjects.slice(0, 8);

  if (shown.length === 0) return null;

  return (
    <section className="container-page py-20">
      <SectionHeading eyebrow="Categories" title="Popular subjects to explore" />
      <motion.div
        initial={still ? false : "hidden"}
        whileInView="show"
        viewport={{ once: true, margin: "-60px" }}
        variants={staggerContainer}
        className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4"
      >
        {shown.map((subject, index) => {
          const Icon = iconForSubject(subject.name);
          const tone = CATEGORY_TONES[index % CATEGORY_TONES.length];
          const featured = index === 0;
          return (
            <motion.div key={subject.id} variants={staggerItem} className={cn(featured && "col-span-2 md:col-span-2")}>
              <Link
                to={`/search?subject_id=${subject.id}`}
                className={cn(
                  "group flex h-full flex-col justify-between rounded-2xl border border-line bg-canvas shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                  featured ? "p-6" : "p-5"
                )}
              >
                <span
                  className={cn(
                    "flex items-center justify-center rounded-xl",
                    tone,
                    featured ? "h-11 w-11" : "h-9 w-9"
                  )}
                >
                  <Icon className={featured ? "h-5 w-5" : "h-4 w-4"} />
                </span>
                <div className={featured ? "mt-8" : "mt-6"}>
                  <p className={cn("font-semibold text-navy", featured && "font-display text-lg")}>{subject.name}</p>
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
  const still = prefersReducedMotion();
  const { data, isLoading } = useLandingTutorPool();

  // Slice past the 3 tutors Hero already shows, so the sections never repeat people.
  const featured = (data?.results ?? []).slice(3, 6);

  // Nothing to show on a fresh platform — fail gracefully, like CategoriesV3.
  if (!isLoading && featured.length === 0) return null;

  return (
    <section className="container-page py-20">
      <SectionHeading eyebrow="Tutors" title="Learn from verified tutors" />
      <motion.div
        initial={still ? false : "hidden"}
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
          className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-canvas px-5 py-2.5 text-sm font-semibold text-navy shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:scale-[0.97]"
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
  const still = prefersReducedMotion();
  return (
    <section className="bg-surface py-20">
      <div className="container-page">
        <SectionHeading eyebrow="How it works" title="From search to session in three steps" />
        <motion.div
          initial={still ? false : "hidden"}
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          variants={staggerContainer}
          className="relative mt-12 grid gap-5 md:grid-cols-3"
        >
          {/* Connecting line — the numbered badges read as a timeline, not three loose cards. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-[16.5%] right-[16.5%] top-[22px] hidden h-px bg-line md:block"
          />
          {STEPS.map((step, index) => (
            <motion.div key={step.title} variants={staggerItem} className="relative">
              <span className="relative z-10 flex h-11 w-11 items-center justify-center rounded-full bg-primary text-sm font-bold text-white shadow-soft ring-4 ring-surface">
                {index + 1}
              </span>
              <div className="mt-5 rounded-2xl border border-line bg-canvas p-6 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-hover">
                <h3 className="font-display text-lg font-bold text-navy">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.body}</p>
              </div>
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
  const still = prefersReducedMotion();
  return (
    <section className="py-20">
      <div className="container-page">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          {/* Asymmetric split, not another grid-of-cards — the section makes a claim, then proves it. */}
          <div>
            <SectionHeading eyebrow="Why TutorDoor" title="Built for trust, not just traffic" />
            <motion.div
              initial={still ? false : "hidden"}
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
              variants={fadeRise}
              transition={motionSafe({ duration: DURATION.slow, delay: 0.1, ease: EASE_OUT })}
            >
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-600">
                Every line below is something the platform actually enforces — not a promise.
              </p>
              <div className="mt-8 flex gap-8 border-t border-line pt-6">
                <div>
                  <p className="font-display text-3xl font-extrabold tracking-tight text-navy">100%</p>
                  <p className="mt-1 text-xs text-slate-500">Tutors verified by review</p>
                </div>
                <div>
                  <p className="font-display text-3xl font-extrabold tracking-tight text-navy">0</p>
                  <p className="mt-1 text-xs text-slate-500">Hidden fees, ever</p>
                </div>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={still ? false : "hidden"}
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            variants={staggerContainer}
            className="grid gap-4 sm:grid-cols-2"
          >
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <motion.div
                key={title}
                variants={staggerItem}
                className="rounded-2xl border border-line bg-canvas p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-hover"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-subtle text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-semibold text-navy">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{body}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
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
  const still = prefersReducedMotion();
  return (
    <section className="bg-surface py-20">
      <div className="container-page max-w-3xl">
        <SectionHeading eyebrow="FAQ" title="Questions, answered" />
        <motion.div
          initial={still ? false : "hidden"}
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
  const still = prefersReducedMotion();
  return (
    <section className="container-page py-20">
      <motion.div
        initial={still ? false : "hidden"}
        whileInView="show"
        viewport={{ once: true, margin: "-60px" }}
        variants={fadeRise}
        transition={motionSafe({ duration: DURATION.slow, ease: EASE_OUT })}
        className="relative overflow-hidden rounded-3xl bg-primary px-8 py-14 shadow-hover sm:px-14"
      >
        {/* Soft internal light — the same bg-white/10 + bg-secondary blur-3xl blooms BrandMesh already uses. */}
        <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 -left-10 h-64 w-64 rounded-full bg-secondary/20 blur-3xl" />
        <div className="relative flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="max-w-xl font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Start learning with a tutor who's actually available.
          </h2>
          <div className="flex shrink-0 flex-wrap items-center gap-3">
            <Link
              to="/register"
              className="rounded-xl bg-canvas px-6 py-3 font-semibold text-primary shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 active:scale-[0.97]"
            >
              Create a free account
            </Link>
            <Link
              to="/search"
              className="rounded-xl px-6 py-3 font-semibold text-white/90 transition-all hover:bg-white/10 hover:text-white active:scale-[0.97]"
            >
              Browse tutors →
            </Link>
          </div>
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
    <footer className="relative border-t border-line bg-canvas">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"
      />
      <div className="container-page grid gap-12 py-14 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-500">
            Verified tutors, real availability, and payments you can audit — for every learner.
          </p>
        </div>
        {FOOTER_GROUPS.map((group) => (
          <nav key={group.heading} aria-label={group.heading}>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">{group.heading}</p>
            <ul className="mt-4 space-y-2.5">
              {group.links.map(([label, to]) => (
                <li key={to}>
                  <Link to={to} className="text-sm text-slate-600 transition-colors hover:text-primary">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-line py-5">
        <div className="container-page flex flex-col items-center justify-between gap-2 text-xs text-slate-400 sm:flex-row">
          <p>© {new Date().getFullYear()} TutorDoor. All rights reserved.</p>
          <p className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" /> Verified tutors · Secure payments
          </p>
        </div>
      </div>
    </footer>
  );
}
