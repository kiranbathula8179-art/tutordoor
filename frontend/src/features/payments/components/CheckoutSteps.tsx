import { Check } from "lucide-react";

/**
 * CheckoutSteps — shared progress indicator for the two payment flows
 * (booking, course enrollment). V8: extracted from `BookingPaymentPage`
 * so `EnrollmentPaymentPage` can use the identical component instead of a
 * duplicated, drifted copy — both payment pages now go through the same
 * checkout shell (DESIGN_V3.md V8 section, Milestone 2).
 */
export function CheckoutSteps({ steps, current }: { steps: [string, string, string]; current: number }) {
  return (
    <nav aria-label="Checkout progress" className="flex items-center gap-2">
      {steps.map((label, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <div key={label} className="flex flex-1 items-center gap-2 last:flex-none">
            <div className="flex items-center gap-2">
              <span
                className={
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors " +
                  (done
                    ? "bg-success text-white"
                    : active
                      ? "bg-primary text-white"
                      : "bg-surface-3 text-slate-400")
                }
              >
                {done ? <Check className="h-3.5 w-3.5" /> : index + 1}
              </span>
              <span
                className={
                  "text-xs font-semibold " + (active ? "text-navy" : done ? "text-success-dark" : "text-slate-400")
                }
              >
                {label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={"h-0.5 flex-1 rounded-full " + (done ? "bg-success" : "bg-surface-4")} />
            )}
          </div>
        );
      })}
    </nav>
  );
}
