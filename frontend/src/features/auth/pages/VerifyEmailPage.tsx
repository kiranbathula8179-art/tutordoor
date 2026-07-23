import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, XCircle } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { verifyEmail } from "@/features/auth/api";
import { useAuthStore } from "@/store/auth-store";

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const setUser = useAuthStore((state) => state.setUser);

  const { isSuccess, isError } = useQuery({
    queryKey: ["verify-email", token],
    queryFn: async () => {
      const result = await verifyEmail(token);
      setUser(result.user);
      return result;
    },
    enabled: !!token,
    retry: false,
  });

  if (!token) {
    return <StatusMessage icon={<XCircle className="h-10 w-10 text-danger" />} title="Missing verification link" description="Please use the link from your verification email." />;
  }

  if (!isSuccess && !isError) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <Spinner className="h-8 w-8" />
        <p className="text-slate-400">Verifying your email...</p>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <StatusMessage
        icon={<CheckCircle2 className="h-10 w-10 text-primary" />}
        title="Email verified!"
        description="Your account is fully activated."
        action={
          <Link to="/login">
            <Button>Continue to log in</Button>
          </Link>
        }
      />
    );
  }

  if (isError) {
    return (
      <StatusMessage
        icon={<XCircle className="h-10 w-10 text-danger" />}
        title="This link has expired"
        description="Request a new verification email from your account settings after logging in."
        action={
          <Link to="/login">
            <Button variant="outline">Back to log in</Button>
          </Link>
        }
      />
    );
  }

  return null;
}

function StatusMessage({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      {icon}
      <h1 className="font-display text-2xl font-bold text-navy">{title}</h1>
      <p className="text-slate-400">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
