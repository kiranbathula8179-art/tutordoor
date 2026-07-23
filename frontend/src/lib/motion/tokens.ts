import type { Transition, Variants } from "framer-motion";

import { prefersReducedMotion } from "@/lib/motion/quality";

/**
 * Motion tokens — the single source of truth for how TutorDoor moves.
 *
 * Premium products feel coherent because every animation shares the same
 * physical vocabulary: the same ease, the same rhythm, the same restraint.
 * Instead of each component inventing its own `transition={{ duration: 0.3 }}`,
 * they compose these tokens. Change the feel of the whole app in one place.
 *
 * Everything here is reduced-motion aware via `motionSafe()` — when a user
 * asks for stillness, entrances collapse to instant and only opacity remains.
 */

// ---- Easings (cubic-bezier) -------------------------------------------------
// EASE_OUT: the workhorse — decisive start, gentle settle (Apple/Linear feel).
// EASE_SPRING: a touch of overshoot for playful, tactile moments.
export const EASE_OUT = [0.16, 1, 0.3, 1] as const;
export const EASE_IN_OUT = [0.65, 0, 0.35, 1] as const;
export const EASE_SPRING = [0.34, 1.56, 0.64, 1] as const;

// ---- Durations (seconds) ----------------------------------------------------
export const DURATION = {
  fast: 0.18, // hovers, taps, toggles
  base: 0.32, // the default entrance
  slow: 0.5, // heroes, first paint
  slower: 0.7, // ambient, decorative
} as const;

// ---- Spring presets ---------------------------------------------------------
export const SPRING = {
  soft: { type: "spring", stiffness: 260, damping: 30 } as Transition,
  snappy: { type: "spring", stiffness: 420, damping: 34 } as Transition,
  bouncy: { type: "spring", stiffness: 500, damping: 24 } as Transition,
} as const;

/**
 * Wrap any transition so it respects reduced-motion. When reduced motion is
 * on, transitions become instant (duration 0) — callers should also drop
 * transforms from their initial state (use `fadeInit`).
 */
export function motionSafe(transition: Transition): Transition {
  return prefersReducedMotion() ? { duration: 0 } : transition;
}

/** initial-state helper: `y`-rise normally, opacity-only under reduced motion. */
export function riseInit(y = 16) {
  return prefersReducedMotion() ? { opacity: 0 } : { opacity: 0, y };
}

// ---- Reusable variants ------------------------------------------------------

/** Staggered container: children animate in sequence. */
export const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: prefersReducedMotion() ? 0 : 0.06, delayChildren: 0.04 },
  },
};

/** A single item that rises + fades within a stagger container. */
export const staggerItem: Variants = {
  hidden: prefersReducedMotion() ? { opacity: 0 } : { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.slow, ease: EASE_OUT },
  },
};

/** Simple fade + rise, for one-off elements. */
export const fadeRise: Variants = {
  hidden: prefersReducedMotion() ? { opacity: 0 } : { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: DURATION.slow, ease: EASE_OUT } },
};

/** Convenience props for a hover-lift interactive card (whileHover/whileTap). */
export const hoverLift = {
  whileHover: prefersReducedMotion() ? {} : { y: -4, transition: { duration: DURATION.fast, ease: EASE_OUT } },
  whileTap: prefersReducedMotion() ? {} : { scale: 0.99 },
};
