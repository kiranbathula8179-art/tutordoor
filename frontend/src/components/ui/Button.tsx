import { Loader2 } from "lucide-react";
import { type ButtonHTMLAttributes, forwardRef } from "react";

import { cn } from "@/lib/utils";

/**
 * Button — V3 spec (DESIGN_V3.md): every variant carries the full state
 * contract (hover, active, focus-visible ring, loading, disabled). Same API
 * as before plus the spec-named "danger" and "success" variants
 * ("destructive" remains as an alias — zero breaking changes).
 * md = 44px touch target; sm (40px) is the documented desktop-dense exception.
 */

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "destructive" | "success";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary: "bg-primary text-white shadow-soft hover:bg-primary-dark hover:shadow-hover focus-visible:ring-primary/40",
  secondary: "bg-surface-3 text-navy hover:bg-surface-4 focus-visible:ring-slate-400/40",
  outline:
    "border border-line bg-canvas text-slate-700 hover:border-navy/25 hover:bg-surface focus-visible:ring-primary/30",
  ghost: "text-slate-600 hover:bg-surface-3 hover:text-navy focus-visible:ring-slate-400/40",
  danger: "bg-danger text-white shadow-soft hover:bg-danger-dark hover:shadow-hover focus-visible:ring-danger/40",
  destructive: "bg-danger text-white shadow-soft hover:bg-danger-dark hover:shadow-hover focus-visible:ring-danger/40",
  success: "bg-success text-white shadow-soft hover:bg-success-dark hover:shadow-hover focus-visible:ring-success/40",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-10 px-4 text-sm",
  md: "h-11 px-5 text-[0.95rem]",
  lg: "h-12 px-6 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-xl font-semibold",
          "transition-[background-color,border-color,box-shadow,transform] duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          "active:scale-[0.97] active:translate-y-0 motion-safe:hover:-translate-y-0.5",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
