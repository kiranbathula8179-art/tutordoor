import { type LucideIcon } from "lucide-react";
import { type ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Empty state (V3 spec): icon · headline · description · actions.
 * Keep copy specific and kind — say what's empty and what to do next.
 *
 * `secondaryAction` and `discovery` are additive, optional slots (V9) for
 * first-time-use states that have a real next step to offer beyond Retry —
 * never used on error branches, where a plain Retry stays the honest answer.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  discovery,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  secondaryAction?: ReactNode;
  discovery?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center gap-3 px-6 py-14 text-center", className)}>
      <div className="rounded-2xl bg-surface p-3.5 text-slate-400">
        <Icon className="h-7 w-7" aria-hidden="true" />
      </div>
      <p className="font-display text-base font-semibold text-navy">{title}</p>
      {description && <p className="max-w-sm text-sm leading-relaxed text-slate-500">{description}</p>}
      {(action || secondaryAction) && (
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          {action}
          {secondaryAction}
        </div>
      )}
      {discovery && <div className="mt-8 w-full">{discovery}</div>}
    </div>
  );
}
