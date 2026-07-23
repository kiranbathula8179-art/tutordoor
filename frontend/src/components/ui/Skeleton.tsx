import { cn } from "@/lib/utils";

/**
 * Loading placeholders (V3 spec). Compose <Skeleton> blocks to mirror the
 * real layout; <SkeletonText> covers the common paragraph case.
 */

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("animate-pulse rounded-lg bg-surface-4/70", className)} />;
}

const LINE_WIDTHS = ["w-full", "w-11/12", "w-4/5", "w-2/3"];

export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton key={index} className={cn("h-4", LINE_WIDTHS[index % LINE_WIDTHS.length])} />
      ))}
    </div>
  );
}
