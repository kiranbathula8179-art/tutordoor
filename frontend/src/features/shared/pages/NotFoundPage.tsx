import { Link } from "react-router-dom";

import { Button } from "@/components/ui/Button";
import { PublicAtmosphere } from "@/components/ui/Surface";
import { NavV3 } from "@/features/landing/v3/HeroV3";
import { FooterV3 } from "@/features/landing/v3/SectionsV3";

/**
 * 404 — V7 "One World" (DESIGN_V3.md V7 addendum; Design DNA #10, "the
 * brand is judged by its quietest moment"). This route sits outside
 * `PublicLayout` (a top-level catch-all, same as `LandingPage.tsx`), so it
 * mounts its own `PublicAtmosphere`/`NavV3`/`FooterV3` rather than the
 * routing tree being restructured — a genuinely unmatched URL under an
 * authenticated section still needs to fall through to this route
 * correctly, which nesting it under `PublicLayout` could have broken.
 */
export function NotFoundPage() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <PublicAtmosphere />
      <NavV3 />
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <span className="font-editorial text-6xl font-semibold text-navy">404</span>
        <h1 className="mt-3 font-display text-2xl font-bold text-navy">This page hasn&apos;t been assigned yet.</h1>
        <p className="mt-3 max-w-sm text-slate-600">
          The page you&apos;re looking for doesn&apos;t exist or may have moved.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link to="/">
            <Button>Back to home</Button>
          </Link>
          <Link to="/search">
            <Button variant="outline">Find a tutor</Button>
          </Link>
        </div>
      </main>
      <FooterV3 />
    </div>
  );
}
