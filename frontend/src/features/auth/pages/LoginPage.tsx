import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Lock } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/features/auth/use-auth";
import { loginSchema, type LoginFormValues } from "@/features/auth/schemas";

export function LoginPage() {
  const { login, isLoggingIn } = useAuth();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  return (
    <div>
      <h1 className="font-display text-3xl font-extrabold tracking-tight text-navy">Welcome back</h1>
      <p className="mt-2 text-slate-500">Log in to continue your learning.</p>

      <form onSubmit={handleSubmit((values) => login(values))} className="mt-8 space-y-4">
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
            placeholder="••••••••••"
            leadingIcon={<Lock className="h-4 w-4" />}
            error={errors.password?.message}
            {...register("password")}
          />
          <div className="mt-2 text-right">
            <Link to="/forgot-password" className="text-sm font-medium text-primary transition-colors hover:text-primary-dark">
              Forgot password?
            </Link>
          </div>
        </div>

        <Button type="submit" className="w-full" isLoading={isLoggingIn}>
          Log in
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-slate-500">
        New to TutorDoor?{" "}
        <Link to="/register" className="font-semibold text-primary transition-colors hover:text-primary-dark">
          Create an account
        </Link>
      </p>
    </div>
  );
}
