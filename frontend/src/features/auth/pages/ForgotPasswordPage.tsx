import { zodResolver } from "@hookform/resolvers/zod";
import { Mail } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { requestPasswordReset } from "@/features/auth/api";
import { forgotPasswordSchema, type ForgotPasswordFormValues } from "@/features/auth/schemas";
import { getErrorMessage } from "@/lib/utils";

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    setIsSubmitting(true);
    try {
      await requestPasswordReset(values.email);
      toast.success("If that email exists, a reset code is on its way.");
      navigate(`/reset-password?email=${encodeURIComponent(values.email)}`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="font-display text-3xl font-extrabold tracking-tight text-navy">Reset your password</h1>
      <p className="mt-2 text-slate-500">Enter your email and we&apos;ll send you a reset code.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
        <Input
          label="Email address"
          type="email"
          placeholder="you@example.com"
          leadingIcon={<Mail className="h-4 w-4" />}
          error={errors.email?.message}
          defaultValue={getValues("email")}
          {...register("email")}
        />
        <Button type="submit" className="w-full" isLoading={isSubmitting}>
          Send reset code
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-slate-500">
        Remembered it?{" "}
        <Link to="/login" className="font-semibold text-primary transition-colors hover:text-primary-dark">
          Back to log in
        </Link>
      </p>
    </div>
  );
}
