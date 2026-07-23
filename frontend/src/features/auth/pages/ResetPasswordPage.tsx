import { zodResolver } from "@hookform/resolvers/zod";
import { KeyRound, Lock, Mail } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PasswordStrength } from "@/components/ui/PasswordStrength";
import { confirmPasswordReset } from "@/features/auth/api";
import { resetPasswordSchema, type ResetPasswordFormValues } from "@/features/auth/schemas";
import { getErrorMessage } from "@/lib/utils";

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { email: searchParams.get("email") ?? "" },
  });

  const onSubmit = async (values: ResetPasswordFormValues) => {
    setIsSubmitting(true);
    try {
      await confirmPasswordReset(values);
      toast.success("Password reset. You can log in now.");
      navigate("/login");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="font-display text-3xl font-extrabold tracking-tight text-navy">Enter your new password</h1>
      <p className="mt-2 text-slate-500">Check your email or phone for the reset code.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
        <Input label="Email address" type="email" leadingIcon={<Mail className="h-4 w-4" />} error={errors.email?.message} {...register("email")} />
        <Input label="Reset code" leadingIcon={<KeyRound className="h-4 w-4" />} error={errors.code?.message} {...register("code")} />
        <div>
          <Input label="New password" type="password" leadingIcon={<Lock className="h-4 w-4" />} error={errors.new_password?.message} {...register("new_password")} />
          <PasswordStrength value={watch("new_password") ?? ""} />
        </div>
        <Input label="Confirm new password" type="password" leadingIcon={<Lock className="h-4 w-4" />} error={errors.confirm_password?.message} {...register("confirm_password")} />

        <Button type="submit" className="w-full" isLoading={isSubmitting}>
          Reset password
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-slate-500">
        <Link to="/login" className="font-semibold text-primary transition-colors hover:text-primary-dark">
          Back to log in
        </Link>
      </p>
    </div>
  );
}
