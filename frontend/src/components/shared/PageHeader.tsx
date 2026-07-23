import { type ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * PageHeader — the standard opening of every portal page (V3 polish
 * program). Title in Jakarta, optional description, actions right-aligned.
 * Adopt this instead of hand-rolled h1 rows for instant consistency.
 */
export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-6 flex flex-wrap items-end justify-between gap-3", className)}>
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-navy sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
