import { cn } from "@/lib/utils";

export function Logo({ className, dark = false }: { className?: string; dark?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <svg width="30" height="30" viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="8" className={dark ? "fill-chalk" : "fill-primary"} />
        <path
          d="M11 6H21C21.5523 6 22 6.44772 22 7V26H10V7C10 6.44772 10.4477 6 11 6Z"
          className={dark ? "stroke-primary" : "stroke-white"}
          strokeWidth="1.6"
        />
        <circle cx="18.2" cy="16.2" r="1.1" className="fill-accent" />
        <path d="M7 26H25" className={dark ? "stroke-primary" : "stroke-white"} strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      <span className={cn("font-display text-xl font-semibold tracking-tight", dark ? "text-white" : "text-navy")}>
        TutorDoor
      </span>
    </div>
  );
}
