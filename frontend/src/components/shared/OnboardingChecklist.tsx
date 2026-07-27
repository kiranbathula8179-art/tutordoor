import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";

import { Card, CardBody } from "@/components/ui/Card";
import { prefersReducedMotion } from "@/lib/motion/quality";
import { staggerContainer, staggerItem } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";

export interface OnboardingStep {
  label: string;
  done: boolean;
  to: string;
}

/**
 * A reusable "getting started" checklist. Purely presentational — the
 * caller computes each step's `done` state from data it is already
 * fetching for the page (no new API calls happen here, and none should be
 * added by any caller). Fully collapses once every step is done, so it
 * never lingers as a permanent fixture once someone is past onboarding.
 */
export function OnboardingChecklist({ title, steps }: { title: string; steps: OnboardingStep[] }) {
  const still = prefersReducedMotion();
  const doneCount = steps.filter((step) => step.done).length;

  if (doneCount === steps.length) return null;

  return (
    <Card>
      <CardBody>
        <div className="flex items-center justify-between gap-3">
          <p className="font-display text-base font-bold text-navy">{title}</p>
          <span className="text-xs font-medium text-slate-500">
            {doneCount} of {steps.length} done
          </span>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-pill bg-surface-3">
          <div
            className="h-full rounded-pill bg-primary transition-all"
            style={{ width: `${(doneCount / steps.length) * 100}%` }}
          />
        </div>
        <motion.ul
          initial={still ? false : "hidden"}
          animate="show"
          variants={staggerContainer}
          className="mt-4 space-y-1"
        >
          {steps.map((step) => (
            <motion.li key={step.label} variants={staggerItem}>
              <Link
                to={step.to}
                aria-label={`${step.label} — ${step.done ? "done" : "not done yet"}`}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-2 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                  step.done ? "text-slate-400" : "text-navy hover:bg-surface-3"
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                    step.done ? "border-success bg-success text-white" : "border-line bg-canvas"
                  )}
                >
                  {step.done && <Check className="h-3 w-3" />}
                </span>
                <span className={cn(step.done && "line-through decoration-slate-300")}>{step.label}</span>
              </Link>
            </motion.li>
          ))}
        </motion.ul>
      </CardBody>
    </Card>
  );
}
