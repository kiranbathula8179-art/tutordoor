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
