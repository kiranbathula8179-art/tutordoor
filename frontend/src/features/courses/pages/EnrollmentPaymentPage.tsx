import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { PageLoader } from "@/components/ui/Spinner";
import { listMyEnrollments } from "@/features/courses/api";
import { CheckoutPanel } from "@/features/payments/components/CheckoutPanel";

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
      <div className="mx-auto max-w-lg text-center">
        <h1 className="font-display text-xl font-bold text-navy">Enrollment not found</h1>
        <p className="mt-2 text-slate-400">It may have been dropped or expired.</p>
        <Link to="/courses" className="mt-6 inline-block">
          <Button variant="outline">Browse courses</Button>
        </Link>
      </div>
    );
  }

  if (enrollment.status !== "pending_payment") {
    return (
      <div className="mx-auto max-w-lg text-center">
        <ShieldCheck className="mx-auto h-10 w-10 text-primary" />
        <h1 className="mt-3 font-display text-xl font-bold text-navy">Nothing to pay here</h1>
        <p className="mt-2 text-slate-400">
          This enrollment is {enrollment.status.replace("_", " ")} — no payment is due.
        </p>
        <Link to="/student/courses" className="mt-6 inline-block">
          <Button variant="outline">Go to my courses</Button>
        </Link>
      </div>
    );
  }

  const finish = async () => {
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
    <div className="mx-auto max-w-2xl">
      <Link to="/student/courses" className="mb-4 flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-navy">
        <ArrowLeft className="h-4 w-4" /> Back to my courses
      </Link>

      <h1 className="font-display text-2xl font-bold text-navy">Complete your enrollment</h1>
      <p className="mt-1 text-slate-500">
        {enrollment.course.title} · taught by {enrollment.course.tutor.user.full_name}
      </p>

      <Card className="mt-6">
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
    </div>
  );
}
