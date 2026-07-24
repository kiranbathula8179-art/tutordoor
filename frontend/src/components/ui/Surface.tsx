import { forwardRef, type HTMLAttributes } from "react";

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
type AmbientTone = "blue" | "cyan" | "sky" | "lavender" | "indigo";

const AMBIENT_TONE_CLASSES: Record<AmbientTone, string> = {
  blue: "bg-primary/[0.08]",
  cyan: "bg-secondary/[0.08]",
  sky: "bg-sky-400/[0.09]",
  lavender: "bg-violet-300/[0.08]",
  indigo: "bg-indigo-400/[0.07]",
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
