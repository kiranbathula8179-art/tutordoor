import { type LucideIcon } from "lucide-react";
import { useInView, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useRef } from "react";

import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { prefersReducedMotion } from "@/lib/motion/quality";
import { cn } from "@/lib/utils";

/** Same feel as SPRING.soft (lib/motion/tokens.ts) — useSpring wants SpringOptions, not a full Transition. */
const COUNT_UP_SPRING = { stiffness: 260, damping: 30 };

/**
 * StatCard — premium dashboard metric tile. Gradient-glow icon chip, a
 * decorative corner wash, hover-lift, and an animated count-up for numeric
 * values (respects reduced-motion). Real values only — never invents data.
 */
const TINTS = {
  primary: { chip: "from-primary to-primary-light", glow: "bg-primary/10", ring: "ring-primary/20" },
  success: { chip: "from-success to-emerald-400", glow: "bg-success/10", ring: "ring-success/20" },
  warning: { chip: "from-warning to-amber-400", glow: "bg-warning/10", ring: "ring-warning/20" },
  accent: { chip: "from-accent to-orange-400", glow: "bg-accent/10", ring: "ring-accent/20" },
  info: { chip: "from-info to-sky-400", glow: "bg-info/10", ring: "ring-info/20" },
} as const;

function AnimatedValue({ value }: { value: string | number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const still = prefersReducedMotion();

  // Only animate pure numbers; strings (₹, %, "New") render as-is.
  const numeric = typeof value === "number" ? value : Number(String(value).replace(/[^0-9.]/g, ""));
  const isPlainNumber = typeof value === "number" || /^[\d.]+$/.test(String(value));

  const mv = useMotionValue(0);
  const spring = useSpring(mv, COUNT_UP_SPRING);

  useEffect(() => {
    if (inView && isPlainNumber && !still) mv.set(numeric);
  }, [inView, isPlainNumber, still, numeric, mv]);

  useEffect(() => {
    if (!isPlainNumber || still) return;
    const decimals = String(value).includes(".") ? 1 : 0;
    return spring.on("change", (latest) => {
      if (ref.current) ref.current.textContent = latest.toFixed(decimals);
    });
  }, [spring, isPlainNumber, still, value]);

  return <span ref={ref}>{!isPlainNumber || still ? value : "0"}</span>;
}

export function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  tint = "primary",
  isLoading,
  className,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub?: string;
  tint?: keyof typeof TINTS;
  isLoading?: boolean;
  className?: string;
}) {
  const t = TINTS[tint];
  return (
    <Card
      className={cn(
        "group relative overflow-hidden p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-hover",
        className
      )}
    >
      {/* decorative corner glow */}
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl transition-opacity duration-300 group-hover:opacity-80",
          t.glow
        )}
      />
      <div className="relative flex items-start justify-between">
        <span
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-soft ring-4",
            t.chip,
            t.ring
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>
      {isLoading ? (
        <Skeleton className="mt-4 h-9 w-24" />
      ) : (
        <p className="relative mt-4 font-display text-3xl font-extrabold tracking-tight text-navy">
          <AnimatedValue value={value} />
        </p>
      )}
      <p className="relative mt-1 text-sm font-medium text-slate-500">{label}</p>
      {sub && <p className="relative mt-0.5 text-xs text-slate-400">{sub}</p>}
    </Card>
  );
}
