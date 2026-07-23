import { type LucideIcon } from "lucide-react";
import { type ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Empty state (V3 spec): icon · headline · description · actions.
 * Keep copy specific and kind — say what's empty and what to do next.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center gap-3 px-6 py-14 text-center", className)}>
      <div className="rounded-2xl bg-surface p-3.5 text-slate-400">
        <Icon className="h-7 w-7" aria-hidden="true" />
      </div>
      <p className="font-display text-base font-semibold text-navy">{title}</p>
      {description && <p className="max-w-sm text-sm leading-relaxed text-slate-500">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
