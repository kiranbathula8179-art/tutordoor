import { motion, useScroll, useTransform } from "framer-motion";
import { forwardRef, type HTMLAttributes } from "react";

import { prefersReducedMotion } from "@/lib/motion/quality";
import { cn } from "@/lib/utils";

/**
 * Surface primitives — the anti-flatness toolkit.
 *
 * The brief's rule: "Never use flat white." These are composable, decorative,
 * pointer-events-none layers that give any page depth without distraction.
 * Drop one or more inside a `relative` container behind your content.
 *
 * All are `aria-hidden` and non-interactive by design.
 */

/** Fine dot-grid — the quiet workhorse for app/dashboard backgrounds. */
export function DotGrid({ className, size = 28 }: { className?: string; size?: number }) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0", className)}
      style={{
        backgroundImage: "radial-gradient(circle at 1px 1px, rgb(15 23 42 / 0.04) 1px, transparent 0)",
        backgroundSize: `${size}px ${size}px`,
      }}
    />
  );
}

/** SVG feTurbulence noise — the texture that makes gradients feel like paper. */
export function NoiseTexture({ className, opacity = 0.025 }: { className?: string; opacity?: number }) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0", className)}
      style={{
        opacity,
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
      }}
    />
  );
}

/** A large, soft, blurred gradient orb — the "soft radial light" of the brief. */
export function GradientOrb({
  className,
  color = "primary",
  size = 320,
}: {
  className?: string;
  color?: "primary" | "secondary" | "accent" | "white";
  size?: number;
}) {
  const tint = {
    primary: "bg-primary/20",
    secondary: "bg-secondary/20",
    accent: "bg-accent/20",
    white: "bg-white/15",
  }[color];
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute rounded-full blur-3xl", tint, className)}
      style={{ width: size, height: size }}
    />
  );
}

/**
 * AuroraWash — V4 addendum: BrandMesh/GradientOrb's "louder sibling" for
 * arrival moments that want more drift than a static wash, short of the
 * cinematic-dark aesthetic V3 already retired. 2–3 slow-drifting orbs, no
 * shader, no WebGL — just the existing `animate-float-slow` keyframe with
 * staggered negative delays so the orbs don't move in lockstep.
 *
 * Allowed only on: the landing hero background, the auth BrandMesh panel.
 * Never on portal dashboards, page bodies, or cards (DESIGN_V3.md V4).
 */
export function AuroraWash({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <div
        className="absolute -left-24 top-24 h-72 w-72 animate-float-slow rounded-full bg-primary/15 blur-3xl motion-reduce:animate-none"
        style={{ animationDelay: "-1.5s" }}
      />
      <div
        className="absolute -right-16 top-8 h-64 w-64 animate-float-slow rounded-full bg-secondary/15 blur-3xl motion-reduce:animate-none"
        style={{ animationDelay: "-4s" }}
      />
      <div
        className="absolute bottom-0 left-1/3 h-56 w-56 animate-float-slow rounded-full bg-accent/10 blur-3xl motion-reduce:animate-none"
        style={{ animationDelay: "-6.5s" }}
      />
    </div>
  );
}

/**
 * GlassPanel — V4 addendum: a restrained frosted-glass surface for content
 * that floats over real imagery or a saturated brand background. One blur
 * layer, one border, one shadow — no inner glow, no gradient border, no
 * second translucent layer (that's the "heavy glass" V3 rejected).
 *
 * Two tones, not a light/dark theme switch — pick by what's underneath:
 * `light` (default) for content over real imagery or plain-enough ground;
 * `dark` for content sitting directly on a saturated wash like `BrandMesh`,
 * where a white glass panel would fight the wash instead of sitting on it.
 *
 * Allowed only on: the sticky nav once scrolled past a hero, floating cards
 * over the landing hero, auth brand-panel content over BrandMesh. Never on
 * dashboard cards, tables, forms, modals, or any surface over plain
 * canvas/surface — there, "glass" just reads as a low-contrast box; use
 * `Card` instead (DESIGN_V3.md V4).
 */
export const GLASS_PANEL_CLASSES = "border border-white/40 bg-white/70 shadow-dropdown backdrop-blur-xl";
const GLASS_PANEL_DARK_CLASSES = "border border-white/10 bg-navy/60 shadow-dropdown backdrop-blur-xl";

export const GlassPanel = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement> & { tone?: "light" | "dark" }>(
  ({ className, tone = "light", ...props }, ref) => (
    <div ref={ref} className={cn(tone === "dark" ? GLASS_PANEL_DARK_CLASSES : GLASS_PANEL_CLASSES, className)} {...props} />
  )
);
GlassPanel.displayName = "GlassPanel";

/**
 * AmbientWash — V5 "Ambient Light" (DESIGN_V3.md V5 addendum, landing page
 * only). One or two very large, extremely soft blurred color blooms —
 * 200-400px blur, ~4-12% opacity — suggesting light drifting behind the
 * section rather than a flat fill. Each landing section gets its own tone
 * combination instead of alternating solid backgrounds.
 */
type AmbientTone = "blue" | "cyan" | "sky" | "lavender" | "indigo" | "sand" | "clay" | "forest" | "gold";

const AMBIENT_TONE_CLASSES: Record<AmbientTone, string> = {
  blue: "bg-primary/[0.08]",
  cyan: "bg-secondary/[0.08]",
  sky: "bg-sky-400/[0.09]",
  lavender: "bg-violet-300/[0.08]",
  indigo: "bg-indigo-400/[0.07]",
  /* ---- V7 "One World" warm tones (DESIGN_V3.md V7 addendum) ---- */
  sand: "bg-sand/[0.35]",
  clay: "bg-clay/[0.08]",
  forest: "bg-forest/[0.08]",
  gold: "bg-gold-star/[0.09]",
};

export function AmbientWash({
  tones,
  className,
}: {
  /** One or two tones — rendered as large blooms in opposite corners. */
  tones: [AmbientTone] | [AmbientTone, AmbientTone];
  className?: string;
}) {
  return (
    <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <div
        className={cn(
          "absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full blur-[220px]",
          AMBIENT_TONE_CLASSES[tones[0]]
        )}
      />
      {tones[1] && (
        <div
          className={cn(
            "absolute -right-24 bottom-0 h-[380px] w-[380px] rounded-full blur-[220px]",
            AMBIENT_TONE_CLASSES[tones[1]]
          )}
        />
      )}
    </div>
  );
}

/**
 * MeshBackground — a full light mesh-gradient wash for app page shells.
 * Layers a canvas tint with two off-screen color blooms and optional dot grid.
 * This is the default "alive but calm" backdrop for authenticated pages.
 */
export function MeshBackground({ className, withGrid = true }: { className?: string; withGrid?: boolean }) {
  return (
    <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <div className="absolute inset-0 bg-surface" />
      <div className="absolute -left-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-brick/[0.06] blur-3xl" />
      <div className="absolute -right-32 top-1/3 h-[28rem] w-[28rem] rounded-full bg-gold-star/[0.07] blur-3xl" />
      {withGrid && <DotGrid />}
      <NoiseTexture opacity={0.04} />
    </div>
  );
}

/**
 * BrandMesh — the saturated version for hero panels and auth brand columns:
 * a primary→cyan diagonal beneath dot texture and white light blooms.
 */
export function BrandMesh({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-dark to-secondary" />
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: "radial-gradient(rgb(255 255 255 / 0.14) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      <div className="absolute -right-16 -top-16 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -bottom-24 -left-10 h-72 w-72 rounded-full bg-secondary/30 blur-3xl" />
      <NoiseTexture opacity={0.05} />
    </div>
  );
}

/**
 * PublicAtmosphere — V7 "One World" (DESIGN_V3.md V7 addendum). The
 * background system for the entire public surface (Landing, global public
 * nav/footer, Search, Tutor Profile, Courses, About/Trust/Support/Legal,
 * public auth). One fixed, page-spanning layer of warm multi-layer radial
 * gradient blooms over a `linen` base plus a soft grain texture — mounted
 * once per page (`LandingPage.tsx`, `PublicLayout.tsx`) so the whole page
 * sits on a continuous atmosphere instead of resetting to flat white
 * between sections.
 *
 * Blooms drift slowly on scroll (never static) via Framer Motion's
 * `useScroll`/`useTransform`, gated by `prefersReducedMotion()` — a fully
 * static composition when reduced motion is on, matching every other
 * scroll/loop animation in this codebase.
 *
 * Out of scope: authenticated portals (Student/Tutor/Parent/Institute/
 * Admin) keep their existing `MeshBackground`/`canvas` treatment — this
 * primitive is public-surface only (V8 will decide the portal treatment
 * later, not this).
 */
export function PublicAtmosphere({ className }: { className?: string }) {
  const still = prefersReducedMotion();
  const { scrollYProgress } = useScroll();
  const driftDown = useTransform(scrollYProgress, [0, 1], [0, 140]);
  const driftUp = useTransform(scrollYProgress, [0, 1], [0, -110]);
  const driftSide = useTransform(scrollYProgress, [0, 1], [0, 90]);

  return (
    <div aria-hidden="true" className={cn("pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-linen", className)}>
      <motion.div
        className="absolute -left-40 -top-20 h-[38rem] w-[38rem] rounded-full bg-sage/[0.16] blur-[220px]"
        style={still ? undefined : { y: driftDown }}
      />
      <motion.div
        className="absolute -right-32 top-[18%] h-[34rem] w-[34rem] rounded-full bg-gold-star/[0.14] blur-[220px]"
        style={still ? undefined : { y: driftUp }}
      />
      <motion.div
        className="absolute left-1/4 top-[52%] h-[30rem] w-[30rem] rounded-full bg-clay/[0.09] blur-[220px]"
        style={still ? undefined : { x: driftSide }}
      />
      <div className="absolute -right-40 bottom-[-8%] h-[36rem] w-[36rem] rounded-full bg-forest/[0.10] blur-[220px]" />
      <NoiseTexture opacity={0.03} />
    </div>
  );
}

const ORGANIC_EDGE_FILL: Record<"linen" | "sand" | "canvas", string> = {
  linen: "fill-linen",
  sand: "fill-sand",
  canvas: "fill-canvas",
};

const ORGANIC_EDGE_PATH: Record<"top" | "bottom", string> = {
  // A "cap" shape flush with its own container's top edge, filled down to a
  // wavy line — sits INSIDE whatever it's placed in (e.g. a dark footer),
  // so it survives `overflow-hidden` on the parent instead of relying on a
  // negative offset that clips away.
  top: "M0,56 C240,10 480,110 720,72 C960,34 1200,100 1440,64 L1440,0 L0,0 Z",
  bottom: "M0,64 C240,110 480,10 720,48 C960,86 1200,20 1440,56 L1440,120 L0,120 Z",
};

/**
 * OrganicEdge — V7 "One World" (DESIGN_V3.md V7 addendum). A reusable,
 * hand-authored SVG wave divider for blending a raised content band into
 * the shared `PublicAtmosphere` instead of cutting it off on a hard
 * rectangular edge. Purely decorative — `aria-hidden`, non-interactive.
 *
 * Sits flush inside its own container (top-0 or bottom-0, no negative
 * offset) so it isn't clipped by a parent's `overflow-hidden` — place it
 * as the first child of whatever should get the wavy edge.
 */
export function OrganicEdge({
  className,
  position = "bottom",
  tone = "linen",
}: {
  className?: string;
  position?: "top" | "bottom";
  tone?: "linen" | "sand" | "canvas";
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1440 120"
      preserveAspectRatio="none"
      className={cn(
        "pointer-events-none absolute inset-x-0 h-20 w-full",
        position === "top" ? "top-0" : "bottom-0",
        className
      )}
    >
      <path d={ORGANIC_EDGE_PATH[position]} className={ORGANIC_EDGE_FILL[tone]} />
    </svg>
  );
}
