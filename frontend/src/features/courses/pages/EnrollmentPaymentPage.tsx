import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, CreditCard, Lock, SearchX, ShieldCheck } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageLoader } from "@/components/ui/Spinner";
import { MeshBackground } from "@/components/ui/Surface";
import { listMyEnrollments } from "@/features/courses/api";
import { CheckoutPanel } from "@/features/payments/components/CheckoutPanel";
import { CheckoutSteps } from "@/features/payments/components/CheckoutSteps";
import { celebrate } from "@/lib/motion/celebrate";
import { DURATION, EASE_OUT, riseInit } from "@/lib/motion/tokens";

/**
 * Course enrollment payment — V8 (DESIGN_V3.md V8 section, Milestone 2).
 * Brought up to `BookingPaymentPage`'s existing standard (same
 * `CheckoutPanel`, same checkout shell) rather than the reverse — this
 * page was a bare-bones sibling of an already-polished page, exactly the
 * kind of "quiet moment" gap Design DNA Principle 10 exists to catch.
 */
export function EnrollmentPaymentPage() {
  const { enrollmentId } = useParams<{ enrollmentId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: enrollments, isLoading } = useQuery({
    queryKey: ["my-enrollments"],
    queryFn: () => listMyEnrollments(),
  });

  const enrollment = enrollments?.find((entry) => entry.id === enrollmentId);

  if (isLoading) return <PageLoader />;

  if (!enrollment) {
    return (
      <Card className="mx-auto max-w-lg">
        <EmptyState
          icon={SearchX}
          title="Enrollment not found"
          description="It may have been dropped or expired."
          action={
            <Link to="/courses">
              <Button variant="outline">Browse courses</Button>
            </Link>
          }
        />
      </Card>
    );
  }

  if (enrollment.status !== "pending_payment") {
    return (
      <div className="mx-auto max-w-lg text-center">
        <ShieldCheck className="mx-auto h-10 w-10 text-success" />
        <h1 className="mt-3 font-display text-xl font-bold text-navy">Nothing to pay here</h1>
        <p className="mt-2 text-slate-500">
          This enrollment is {enrollment.status.replace("_", " ")} — no payment is due.
        </p>
        <Link to="/student/courses" className="mt-6 inline-block">
          <Button variant="outline">Go to my courses</Button>
        </Link>
      </div>
    );
  }

  const finish = async () => {
    celebrate();
    await queryClient.invalidateQueries({ queryKey: ["my-enrollments"] });
    toast.success("You're enrolled — see you in class!");
    navigate("/student/courses");
  };

  /** Stripe confirmation lands via webhook; check whether the enrollment flipped to active. */
  const pollConfirmed = async () => {
    const fresh = await listMyEnrollments();
    return fresh.find((entry) => entry.id === enrollmentId)?.status === "active";
  };

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
          to="/student/courses"
          className="mb-5 inline-flex items-center gap-1.5 rounded-lg text-sm font-medium text-slate-500 transition-colors hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          <ArrowLeft className="h-4 w-4" /> Back to my courses
        </Link>

        <CheckoutSteps steps={["Course", "Payment", "Enrolled"]} current={1} />

        <h1 className="mt-6 font-display text-2xl font-extrabold tracking-tight text-navy sm:text-3xl">
          Complete your enrollment
        </h1>
        <p className="mt-1 text-slate-500">taught by {enrollment.course.tutor.user.full_name}</p>

        {/* Course detail strip — mirrors BookingPaymentPage's session strip */}
        <div className="mt-5 flex items-center gap-3 rounded-2xl border border-line bg-canvas p-4 shadow-soft">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-subtle text-primary">
            <BookOpen className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-navy">{enrollment.course.title}</p>
            <p className="text-xs capitalize text-slate-500">
              {enrollment.course.total_sessions} sessions · {enrollment.course.mode ?? "online"}
            </p>
          </div>
        </div>

        <Card className="mt-5">
          <CardBody>
            <CheckoutPanel
              purpose="course_enrollment"
              referenceId={enrollment.id}
              amount={enrollment.course.price}
              currency={enrollment.course.currency}
              couponPurpose="course"
              description="Course fee"
              onFinished={finish}
              pollConfirmed={pollConfirmed}
            />
          </CardBody>
        </Card>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-slate-500">
          <span className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5 text-success" /> Secure payment</span>
          <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-primary" /> Verified tutors</span>
          <span className="flex items-center gap-1.5"><CreditCard className="h-3.5 w-3.5 text-slate-400" /> Auditable ledger</span>
        </div>
      </motion.div>
    </div>
  );
}
