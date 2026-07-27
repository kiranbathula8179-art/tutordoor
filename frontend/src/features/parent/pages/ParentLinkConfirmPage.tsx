import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { confirmParentLink } from "@/features/parent/api";
import { celebrate } from "@/lib/motion/celebrate";

export function ParentLinkConfirmPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const { data: link, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["confirm-parent-link", token],
    queryFn: () => confirmParentLink(token),
    enabled: !!token,
    retry: false,
  });

  // A real, earned, one-time moment — a family connection just went live.
  useEffect(() => {
    if (link) celebrate();
  }, [link]);

  // An invalid/expired/already-used token is a 400 from the backend — that's
  // a real "this link is dead" case. Anything else (network, 5xx) is a
  // transient failure and shouldn't force the student to request a new invite.
  const linkInvalid = !token || (isError && isAxiosError(error) && error.response?.status === 400);
  const hasError = isError && !linkInvalid;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-6 text-center">
      {linkInvalid ? (
        <>
          <XCircle className="h-10 w-10 text-danger" />
          <h1 className="mt-3 font-display text-2xl font-bold text-navy">This link isn&apos;t valid anymore</h1>
          <p className="mt-2 max-w-sm text-slate-400">
            It may have expired or already been used. Ask your parent to send a fresh invitation.
          </p>
          <Link to="/" className="mt-6">
            <Button variant="outline">Back to home</Button>
          </Link>
        </>
      ) : hasError ? (
        <>
          <AlertCircle className="h-10 w-10 text-danger" />
          <h1 className="mt-3 font-display text-2xl font-bold text-navy">Something went wrong</h1>
          <p className="mt-2 max-w-sm text-slate-400">
            We couldn't reach the server to confirm this link. Check your connection and try again.
          </p>
          <Button className="mt-6" variant="outline" onClick={() => refetch()}>
            Retry
          </Button>
        </>
      ) : isLoading ? (
        <>
          <Spinner className="h-8 w-8" />
          <p className="mt-3 text-slate-400">Confirming the link...</p>
        </>
      ) : (
        <>
          <CheckCircle2 className="h-10 w-10 text-primary" />
          <h1 className="mt-3 font-display text-2xl font-bold text-navy">You&apos;re linked!</h1>
          <p className="mt-2 max-w-sm text-slate-400">
            Your {link?.relationship ?? "parent"} can now help manage your bookings and follow your progress on
            TutorDoor.
          </p>
          <Link to="/login" className="mt-6">
            <Button>Continue to log in</Button>
          </Link>
        </>
      )}
    </div>
  );
}
