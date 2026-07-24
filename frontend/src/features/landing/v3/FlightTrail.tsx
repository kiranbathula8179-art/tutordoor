import { motion } from "framer-motion";

import { prefersReducedMotion } from "@/lib/motion/quality";

/**
 * FlightTrail — V6 "The Journey" hero (DESIGN_V3.md V6 addendum). An
 * original aircraft-and-trail motif: a small silhouette climbs across the
 * dawn sky along a hand-authored curve while a matching SVG path "draws"
 * itself in sync, using Framer Motion's `pathLength` animation — a real,
 * well-supported technique, not a claim of photorealistic 3D.
 *
 * Purely atmospheric. It does not carry site navigation — real `<nav>`
 * links stay standard, accessible DOM elements regardless of this layer.
 * `aria-hidden` throughout.
 */

const PATH_D = "M 40 320 C 220 260 320 120 520 140 C 680 155 760 90 960 60";

// Waypoints sampled along PATH_D, as percentages of the 1000x400 viewBox —
// close enough to the curve to read as "flying along it," not exact.
const WAYPOINTS = [
  { left: "4%", top: "80%", rotate: -32 },
  { left: "32%", top: "30%", rotate: -28 },
  { left: "52%", top: "35%", rotate: -6 },
  { left: "96%", top: "15%", rotate: -24 },
];

export function FlightTrail({ className }: { className?: string }) {
  const still = prefersReducedMotion();

  return (
    <div aria-hidden="true" className={className}>
      <svg viewBox="0 0 1000 400" className="absolute inset-0 h-full w-full overflow-visible" preserveAspectRatio="none">
        <defs>
          <linearGradient id="flight-trail-gradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#F4B400" stopOpacity="0" />
            <stop offset="55%" stopColor="#F4B400" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#F7D774" stopOpacity="0.85" />
          </linearGradient>
        </defs>
        <motion.path
          d={PATH_D}
          fill="none"
          stroke="url(#flight-trail-gradient)"
          strokeWidth={2.5}
          strokeLinecap="round"
          initial={still ? { pathLength: 1 } : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={still ? { duration: 0 } : { duration: 3.2, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
        />
      </svg>

      <motion.div
        className="absolute h-8 w-8 -translate-x-1/2 -translate-y-1/2"
        initial={still ? { left: WAYPOINTS[2].left, top: WAYPOINTS[2].top, rotate: WAYPOINTS[2].rotate } : WAYPOINTS[0]}
        animate={
          still
            ? undefined
            : {
                left: WAYPOINTS.map((w) => w.left),
                top: WAYPOINTS.map((w) => w.top),
                rotate: WAYPOINTS.map((w) => w.rotate),
              }
        }
        transition={{ duration: 3.2, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
      >
        <svg viewBox="0 0 32 32" className="h-8 w-8 drop-shadow-[0_2px_6px_rgba(47,82,51,0.25)]">
          <path
            d="M16 2 L18.5 12 L28 16 L18.5 18 L16 30 L13.5 18 L4 16 L13.5 12 Z"
            fill="#FFFDF9"
            stroke="#2F5233"
            strokeWidth="1"
            strokeLinejoin="round"
          />
        </svg>
      </motion.div>
    </div>
  );
}
