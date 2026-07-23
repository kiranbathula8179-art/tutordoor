import { cn, initials } from "@/lib/utils";

interface AvatarProps {
  src?: string | null;
  firstName: string;
  lastName: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  xs: "h-6 w-6 text-[0.65rem]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
  xl: "h-20 w-20 text-2xl",
};

/** Deterministic V3 tint per person — subtle background, dark text, AA. */
const PALETTE = [
  "bg-primary-subtle text-primary-dark",
  "bg-secondary-subtle text-secondary-dark",
  "bg-accent-subtle text-accent-dark",
  "bg-success-subtle text-success-dark",
];

function colorForName(name: string) {
  const index = name.charCodeAt(0) % PALETTE.length;
  return PALETTE[index];
}

export function Avatar({ src, firstName, lastName, size = "md", className }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={`${firstName} ${lastName}`}
        className={cn("rounded-full object-cover ring-1 ring-line", sizeClasses[size], className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full font-semibold",
        sizeClasses[size],
        colorForName(firstName || "T"),
        className
      )}
    >
      {initials(firstName, lastName)}
    </div>
  );
}
