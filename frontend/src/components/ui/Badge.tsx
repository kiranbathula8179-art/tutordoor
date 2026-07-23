import { type HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info" | "gold";

/** V3 semantic tints: subtle background + dark text, AA contrast throughout. */
const toneClasses: Record<BadgeTone, string> = {
  neutral: "bg-surface-3 text-slate-600",
  success: "bg-success-subtle text-success-dark",
  warning: "bg-warning-subtle text-warning-dark",
  danger: "bg-danger-subtle text-danger-dark",
  info: "bg-info-subtle text-info-dark",
  gold: "bg-accent-subtle text-accent-dark",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        toneClasses[tone],
        className
      )}
      {...props}
    />
  );
}

/** Maps common backend status strings to a sensible badge tone automatically. */
export function statusToTone(status: string): BadgeTone {
  const positive = ["confirmed", "completed", "active", "paid", "verified", "approved", "sent", "credited"];
  const negative = ["cancelled", "failed", "rejected", "no_show", "expired", "revoked", "dropped"];
  const pending = ["pending", "pending_payment", "not_submitted", "draft"];

  if (positive.includes(status)) return "success";
  if (negative.includes(status)) return "danger";
  if (pending.includes(status)) return "warning";
  return "neutral";
}
