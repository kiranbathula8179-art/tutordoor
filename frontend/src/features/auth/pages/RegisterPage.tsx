import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Lock, User as UserIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, useSearchParams } from "react-router-dom";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PasswordStrength } from "@/components/ui/PasswordStrength";
import { useAuth } from "@/features/auth/use-auth";
import { registerSchema, type RegisterFormValues } from "@/features/auth/schemas";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

const ROLE_OPTIONS: { value: Exclude<UserRole, "admin">; label: string }[] = [
  { value: "student", label: "Student" },
  { value: "tutor", label: "Tutor" },
  { value: "parent", label: "Parent" },
  { value: "institute_admin", label: "Institute" },
];

export function RegisterPage() {
  const [searchParams] = useSearchParams();
  const defaultRole = (searchParams.get("role") as RegisterFormValues["role"]) || "student";
  const { register: registerUser, isRegistering } = useAuth();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: defaultRole },
  });

  const selectedRole = watch("role");
  const passwordValue = watch("password") ?? "";

  const onSubmit = (values: RegisterFormValues) => {
    const { confirm_password: _confirmPassword, ...payload } = values;
    registerUser(payload);
  };

  return (
    <div>
      <h1 className="font-display text-3xl font-extrabold tracking-tight text-navy">Create your account</h1>
      <p className="mt-2 text-slate-500">Join as a student, tutor, parent, or institute.</p>

      <div className="mt-6 grid grid-cols-4 gap-2" role="radiogroup" aria-label="Account type">
        {ROLE_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selectedRole === option.value}
            onClick={() => setValue("role", option.value)}
            className={cn(
              "rounded-xl border px-2 py-2.5 text-center text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
              selectedRole === option.value
                ? "border-primary bg-primary-subtle text-primary-dark"
                : "border-line text-slate-600 hover:border-navy/25"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input label="First name" leadingIcon={<UserIcon className="h-4 w-4" />} error={errors.first_name?.message} {...register("first_name")} />
          <Input label="Last name" error={errors.last_name?.message} {...register("last_name")} />
        </div>
        <Input
          label="Email address"
          type="email"
          placeholder="you@example.com"
          leadingIcon={<Mail className="h-4 w-4" />}
          error={errors.email?.message}
          {...register("email")}
        />
        <div>
          <Input
            label="Password"
            type="password"
            leadingIcon={<Lock className="h-4 w-4" />}
            error={errors.password?.message}
            {...register("password")}
          />
          <PasswordStrength value={passwordValue} />
        </div>
        <Input
          label="Confirm password"
          type="password"
          leadingIcon={<Lock className="h-4 w-4" />}
          error={errors.confirm_password?.message}
          {...register("confirm_password")}
        />
        <Input label="Referral code (optional)" placeholder="e.g. AB12CD34" {...register("referral_code")} />

        <Button type="submit" className="w-full" isLoading={isRegistering}>
          Create account
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-primary transition-colors hover:text-primary-dark">
          Log in
        </Link>
      </p>
    </div>
  );
}
