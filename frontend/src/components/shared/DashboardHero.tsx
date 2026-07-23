import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { type ReactNode } from "react";

import { BrandMesh } from "@/components/ui/Surface";
import { DURATION, EASE_OUT, riseInit } from "@/lib/motion/tokens";

/**
 * DashboardHero — the shared welcome banner every portal dashboard opens with.
 * A brand-mesh gradient with an eyebrow pill, title, description, and an
 * optional action slot (a CTA button, a status badge, etc.). One component so
 * all five portals feel like the same premium product.
 */
export function DashboardHero({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <motion.div
      initial={riseInit(16)}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DURATION.slow, ease: EASE_OUT }}
      className="relative overflow-hidden rounded-3xl shadow-hover"
    >
      <BrandMesh />
      <div className="relative flex flex-col gap-5 p-7 sm:flex-row sm:items-end sm:justify-between sm:p-9">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5" /> {eyebrow}
          </span>
          <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">{title}</h1>
          {description && <p className="mt-2 max-w-xl text-blue-100">{description}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </motion.div>
  );
}
