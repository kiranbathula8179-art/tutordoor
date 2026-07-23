import { Check, X } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * PasswordStrength — live feedback on the SAME rules the schema enforces
 * (10+ characters, upper + lowercase, a number, a symbol). It reports real
 * requirement state rather than a decorative score, so a "strong" reading
 * always means the form will actually accept the password.
 *
 * Accessible: the summary is announced via aria-live, and each requirement is
 * text (not colour alone). Purely presentational — no form logic here.
 */

export interface PasswordRule {
  label: string;
  test: (value: string) => boolean;
}

export const PASSWORD_RULES: PasswordRule[] = [
  { label: "At least 10 characters", test: (v) => v.length >= 10 },
  { label: "Upper & lowercase letters", test: (v) => /[a-z]/.test(v) && /[A-Z]/.test(v) },
  { label: "A number", test: (v) => /\d/.test(v) },
  { label: "A symbol", test: (v) => /[^A-Za-z0-9]/.test(v) },
];

const LEVELS = [
  { label: "Too short", bar: "bg-danger", text: "text-danger-dark" },
  { label: "Weak", bar: "bg-danger", text: "text-danger-dark" },
  { label: "Fair", bar: "bg-warning", text: "text-warning-dark" },
  { label: "Good", bar: "bg-gold-star", text: "text-gold-star-dark" },
  { label: "Strong", bar: "bg-success", text: "text-success-dark" },
] as const;

export function PasswordStrength({ value, className }: { value: string; className?: string }) {
  if (!value) return null;

  const passed = PASSWORD_RULES.filter((rule) => rule.test(value)).length;
  const level = LEVELS[passed];

  return (
    <div className={cn("mt-2", className)}>
      {/* Segmented meter — one segment per satisfied requirement */}
      <div className="flex gap-1.5" aria-hidden="true">
        {PASSWORD_RULES.map((_, index) => (
          <span
            key={index}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors duration-300",
              index < passed ? level.bar : "bg-surface-4"
            )}
          />
        ))}
      </div>

      <p className="mt-1.5 text-xs font-semibold" aria-live="polite">
        <span className={level.text}>{level.label}</span>
        <span className="font-normal text-slate-500"> — {passed} of {PASSWORD_RULES.length} requirements met</span>
      </p>

      <ul className="mt-2 grid gap-1 sm:grid-cols-2">
        {PASSWORD_RULES.map((rule) => {
          const ok = rule.test(value);
          return (
            <li
              key={rule.label}
              className={cn("flex items-center gap-1.5 text-xs", ok ? "text-success-dark" : "text-slate-500")}
            >
              {ok ? (
                <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              ) : (
                <X className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
              )}
              <span>{rule.label}</span>
              <span className="sr-only">{ok ? " — met" : " — not met"}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
