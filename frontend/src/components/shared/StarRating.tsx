import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  count?: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  className?: string;
}

const sizeClasses = { sm: "h-3.5 w-3.5", md: "h-4 w-4", lg: "h-5 w-5" };

export function StarRating({ rating, count, size = "md", showValue = true, className }: StarRatingProps) {
  const rounded = Math.round(rating * 2) / 2;

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((position) => (
          <Star
            key={position}
            className={cn(
              sizeClasses[size],
              position <= rounded ? "fill-gold-star text-gold-star" : "fill-line text-navy/10"
            )}
          />
        ))}
      </div>
      {showValue && (
        <span className="text-sm font-medium text-slate-600">
          {rating.toFixed(1)}
          {typeof count === "number" && <span className="text-slate-400"> ({count})</span>}
        </span>
      )}
    </div>
  );
}
