import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, CalendarClock, Check, CreditCard, Lock, SearchX, ShieldCheck } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageLoader } from "@/components/ui/Spinner";
import { MeshBackground } from "@/components/ui/Surface";
import { getBooking } from "@/features/bookings/api";
import { CheckoutPanel } from "@/features/payments/components/CheckoutPanel";
import { celebrate } from "@/lib/motion/celebrate";
import { DURATION, EASE_OUT, riseInit } from "@/lib/motion/tokens";

export function BookingPaymentPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: booking, isLoading } = useQuery({
    queryKey: ["booking", bookingId],
    queryFn: () => getBooking(bookingId!),
    enabled: !!bookingId,
  });

  const finishSuccessfully = async () => {
    celebrate();
    await queryClient.invalidateQueries({ queryKey: ["booking", bookingId] });
    await queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
    toast.success("Payment complete — your session is confirmed!");
    navigate(`/student/bookings/${bookingId}`);
  };

  /** After Stripe confirms client-side, the backend webhook flips the booking
   *  to confirmed — poll briefly so the user lands on an up-to-date page. */
  const pollConfirmed = async () => {
    const fresh = await getBooking(bookingId!);
    return fresh.status === "confirmed";
  };

  if (isLoading) return <PageLoader />;

  if (!booking) {
    return (
      <Card className="mx-auto max-w-lg">
        <EmptyState
          icon={SearchX}
          title="Booking not found"
          description="It may have been cancelled, or the link is out of date."
          action={
            <Link to="/student/bookings">
              <Button variant="outline">Back to bookings</Button>
            </Link>
          }
        />
      </Card>
    );
  }

  if (booking.status !== "pending_payment") {
    return (
      <div className="mx-auto max-w-lg text-center">
        <ShieldCheck className="mx-auto h-10 w-10 text-success" />
        <h1 className="mt-3 font-display text-xl font-bold text-navy">Nothing to pay here</h1>
        <p className="mt-2 text-slate-500">
          This booking is {booking.status.replace("_", " ")} — no payment is due.
        </p>
        <Link to={`/student/bookings/${booking.id}`} className="mt-6 inline-block">
          <Button variant="outline">View booking</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <MeshBackground />
      <motion.div
        initial={riseInit(16)}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: DURATION.slow, ease: EASE_OUT }}
        className="relative mx-auto max-w-2xl px-4 py-8"
      >
        <Link
          to={`/student/bookings/${booking.id}`}
          className="mb-5 inline-flex items-center gap-1.5 rounded-lg text-sm font-medium text-slate-500 transition-colors hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          <ArrowLeft className="h-4 w-4" /> Back to booking
        </Link>

        {/* Checkout progress — Apple-style clarity on where you are */}
        <CheckoutSteps />

        <h1 className="mt-6 font-display text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">
          Complete your payment
        </h1>
        <p className="mt-1 text-slate-500">
          Session with {booking.tutor.user.full_name}
          {booking.subject ? ` · ${booking.subject.name}` : ""}
        </p>

        {/* Session detail strip */}
        <div className="mt-5 flex items-center gap-3 rounded-2xl border border-line bg-canvas p-4 shadow-soft">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-subtle text-primary">
            <CalendarClock className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-navy">
              {booking.tutor.user.full_name}
              {booking.subject ? ` · ${booking.subject.name}` : ""}
            </p>
            <p className="text-xs capitalize text-slate-500">
              {booking.booking_type?.replace(/_/g, " ") ?? "Session"} · {booking.mode ?? "online"}
            </p>
          </div>
        </div>

        <Card className="mt-5">
          <CardBody>
            <CheckoutPanel
              purpose="booking"
              referenceId={booking.id}
              amount={booking.price}
              currency={booking.currency}
              couponPurpose="booking"
              description="Session price"
              onFinished={finishSuccessfully}
              pollConfirmed={pollConfirmed}
            />
          </CardBody>
        </Card>

        {/* Trust footer — answers "why book now / is this safe" */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-slate-500">
          <span className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5 text-success" /> Secure payment</span>
          <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-primary" /> Verified tutors</span>
          <span className="flex items-center gap-1.5"><CreditCard className="h-3.5 w-3.5 text-slate-400" /> Auditable ledger</span>
        </div>
      </motion.div>
    </div>
  );
}

function CheckoutSteps() {
  const steps = ["Session", "Payment", "Confirmed"];
  const current = 1; // On the payment page, step 2 of 3 is active.
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
