import { motion } from "framer-motion";
import { BookOpen, CalendarCheck, GraduationCap, Lightbulb, Lock, ShieldCheck, Sparkles, Star } from "lucide-react";
import { Link, Outlet, useLocation, useSearchParams } from "react-router-dom";

import { AuroraWash, BrandMesh, GlassPanel } from "@/components/ui/Surface";
import { Logo } from "@/components/shared/Logo";
import { DURATION, EASE_OUT, riseInit } from "@/lib/motion/tokens";
import { prefersReducedMotion } from "@/lib/motion/quality";

/**
 * Auth — premium split experience. Form on a clean, softly-lit canvas (left);
 * a living brand panel (right, lg+) with a mesh-gradient backdrop, floating
 * education glyphs, a route-aware narrative, and animated trust stats.
 *
 * As in every prior generation: ZERO edits to the five auth page files — they
 * render ink-on-light and the canvas keeps them there.
 */

interface Narrative {
  eyebrow: string;
  headline: string;
  sub: string;
}

function narrativeFor(pathname: string, role: string | null): Narrative {
  if (pathname.startsWith("/register") && role === "tutor")
    return {
      eyebrow: "For tutors",
      headline: "Teach on your terms.",
      sub: "A verified profile, bookings that land only inside your real availability, and earnings on a ledger you can read line by line.",
    };
  if (pathname.startsWith("/register"))
    return {
      eyebrow: "Create your account",
      headline: "Start learning your way.",
      sub: "Search verified tutors, book live sessions and group courses, and keep progress and payments in one place.",
    };
  if (pathname.startsWith("/forgot-password") || pathname.startsWith("/reset-password"))
    return {
      eyebrow: "Account recovery",
      headline: "Let's get you back in.",
      sub: "We'll email you a reset link. Your bookings, wallet, and progress are exactly where you left them.",
    };
  if (pathname.startsWith("/verify-email"))
    return {
      eyebrow: "Almost there",
      headline: "One click to confirm.",
      sub: "Verifying your email keeps your account — and everyone else's — trustworthy.",
    };
  return {
    eyebrow: "Welcome back",
    headline: "Good to see you again.",
    sub: "Pick up right where you left off — your tutors, sessions, and messages are waiting.",
  };
}

const TRUST_STATS = [
  { value: "100%", label: "Tutors verified by review" },
  { value: "0", label: "Hidden fees, ever" },
  { value: "24/7", label: "Learn on your schedule" },
];

const FLOATING = [
  { icon: GraduationCap, className: "left-[8%] top-[18%]", delay: 0 },
  { icon: BookOpen, className: "right-[12%] top-[26%]", delay: 1.1 },
  { icon: Star, className: "left-[16%] top-[52%]", delay: 2.2 },
  { icon: Lightbulb, className: "right-[18%] top-[60%]", delay: 0.6 },
  { icon: CalendarCheck, className: "left-[26%] top-[78%]", delay: 1.7 },
];

const TRUST_POINTS = [
  { icon: ShieldCheck, text: "Tutors verified by document review" },
  { icon: CalendarCheck, text: "Bookings only inside real availability" },
  { icon: Lock, text: "Payments on an auditable ledger" },
];

export function AuthLayout() {
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const narrative = narrativeFor(pathname, searchParams.get("role"));
  const still = prefersReducedMotion();

  return (
    <div className="grid min-h-screen bg-canvas lg:grid-cols-[1fr_1.05fr]">
      {/* ------------------------------------------------ Form side */}
      <div className="relative flex flex-col px-6 py-8 sm:px-12">
        {/* faint corner light so the form side isn't flat white */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-primary/[0.06] blur-3xl"
        />
        <Link to="/" aria-label="TutorDoor home" className="relative w-fit">
          <Logo />
        </Link>

        <div className="relative flex flex-1 items-center justify-center py-10">
          <motion.div
            initial={riseInit(16)}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: DURATION.slow, ease: EASE_OUT }}
            className="w-full max-w-md"
          >
            <Outlet />
            <p className="mt-8 flex items-center justify-center gap-1.5 text-center text-xs text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              Protected by verified identities and PCI-compliant gateways.
            </p>
          </motion.div>
        </div>
      </div>

      {/* ------------------------------------------------ Brand panel */}
      <div className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12">
        <BrandMesh />
        <AuroraWash />

        {/* Floating education glyphs */}
        {!still &&
          FLOATING.map(({ icon: Icon, className, delay }, i) => (
            <motion.div
              key={i}
              aria-hidden="true"
              className={`pointer-events-none absolute ${className}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, y: [0, -14, 0] }}
              transition={{
                opacity: { duration: 0.8, delay: delay * 0.3 },
                y: { duration: 6 + i, repeat: Infinity, ease: "easeInOut", delay },
              }}
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white/80 backdrop-blur-sm ring-1 ring-white/15">
                <Icon className="h-5 w-5" />
              </span>
            </motion.div>
          ))}

        <motion.div
          initial={riseInit(20)}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: DURATION.slow, delay: still ? 0 : 0.1, ease: EASE_OUT }}
          className="relative mt-16 max-w-md"
        >
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5" /> {narrative.eyebrow}
          </span>
          <h1 className="mt-4 font-display text-4xl font-extrabold leading-[1.08] tracking-tight text-white">
            {narrative.headline}
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-blue-100">{narrative.sub}</p>
        </motion.div>

        {/* Animated trust stats + points — GlassPanel (dark tone), V4 addendum:
            floating brand-panel content over BrandMesh */}
        <motion.div
          initial={riseInit(20)}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: DURATION.slow, delay: still ? 0 : 0.2, ease: EASE_OUT }}
          className="relative"
        >
          <GlassPanel tone="dark" className="rounded-2xl p-5">
            <div className="grid grid-cols-3 gap-4 border-b border-white/15 pb-5">
              {TRUST_STATS.map((stat) => (
                <div key={stat.label}>
                  <p className="font-display text-2xl font-extrabold tracking-tight text-white">{stat.value}</p>
                  <p className="mt-0.5 text-xs leading-tight text-blue-100">{stat.label}</p>
                </div>
              ))}
            </div>
            <ul className="mt-5 space-y-2.5">
              {TRUST_POINTS.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-sm font-medium text-blue-50">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/15">
                    <Icon className="h-3.5 w-3.5 text-white" />
                  </span>
                  {text}
                </li>
              ))}
            </ul>
          </GlassPanel>
        </motion.div>
      </div>
    </div>
  );
}
