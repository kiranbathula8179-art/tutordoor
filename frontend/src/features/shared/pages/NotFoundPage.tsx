import { Link } from "react-router-dom";

import { Button } from "@/components/ui/Button";

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-6 text-center">
      <span className="font-display text-display-md text-navy">404</span>
      <h1 className="mt-2 font-display text-2xl font-bold text-navy">This page hasn&apos;t been assigned yet.</h1>
      <p className="mt-3 max-w-sm text-slate-400">
        The page you&apos;re looking for doesn&apos;t exist or may have moved.
      </p>
      <Link to="/" className="mt-6">
        <Button>Back to home</Button>
      </Link>
    </div>
  );
}
