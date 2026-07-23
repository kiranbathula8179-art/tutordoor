import { motion } from "framer-motion";
import { useId, useRef } from "react";

import { prefersReducedMotion } from "@/lib/motion/quality";
import { cn } from "@/lib/utils";

/**
 * Tabs (V3 spec): underline style with a sliding active indicator, full
 * keyboard support (Left/Right/Home/End), counts, reduced-motion respected.
 * Pages should adopt this instead of hand-rolled tab button rows.
 */

export interface TabItem {
  value: string;
  label: string;
  count?: number;
}

export function Tabs({
  items,
  value,
  onChange,
  className,
}: {
  items: TabItem[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  const layoutId = useId();
  const listRef = useRef<HTMLDivElement>(null);
  const still = prefersReducedMotion();

  const onKeyDown = (event: React.KeyboardEvent) => {
    const currentIndex = items.findIndex((item) => item.value === value);
    let nextIndex = -1;
    if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % items.length;
    else if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + items.length) % items.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = items.length - 1;
    if (nextIndex >= 0) {
      event.preventDefault();
      onChange(items[nextIndex].value);
      const buttons = listRef.current?.querySelectorAll<HTMLButtonElement>("[role='tab']");
      buttons?.[nextIndex]?.focus();
    }
  };

  return (
    <div
      ref={listRef}
      role="tablist"
      onKeyDown={onKeyDown}
      className={cn("flex items-center gap-1 overflow-x-auto border-b border-line", className)}
    >
      {items.map((item) => {
        const isActive = item.value === value;
        return (
          <button
            key={item.value}
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(item.value)}
            className={cn(
              "relative flex shrink-0 items-center gap-1.5 px-3.5 py-2.5 text-sm transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-1",
              isActive ? "font-semibold text-primary" : "font-medium text-slate-500 hover:text-navy"
            )}
          >
            {item.label}
            {typeof item.count === "number" && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[0.7rem] font-semibold",
                  isActive ? "bg-primary-subtle text-primary-dark" : "bg-surface-3 text-slate-500"
                )}
              >
                {item.count}
              </span>
            )}
            {isActive && (
              <motion.span
                layoutId={layoutId}
                transition={still ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 34 }}
                className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary"
                aria-hidden="true"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
