import { lazy, Suspense, useMemo, type ReactNode } from "react";
import { useLocation } from "react-router-dom";

/**
 * SmoothScrollProvider — gates the cinematic gsap/Lenis scroll engine
 * (CinematicScrollEngine.tsx) to cinematic-world routes only, and code-splits
 * it via React.lazy so gsap/ScrollTrigger/Lenis are never downloaded by
 * users who only ever visit the portals (the vast majority of sessions).
 *
 * The two-world rule (DESIGN_V2.md): Lenis runs ONLY in the cinematic world —
 * landing, auth, search, courses, static pages. Inside the portals
 * (/student, /tutor, /parent, /institute, /admin) native scrolling is
 * untouched, because chat panes, modals, and data tables own their internal
 * scroll and must keep working exactly as before.
 */

const PORTAL_PREFIXES = ["/student", "/tutor", "/parent", "/institute", "/admin"];

const CinematicScrollEngine = lazy(() =>
  import("@/lib/motion/CinematicScrollEngine").then((m) => ({ default: m.CinematicScrollEngine }))
);

export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const location = useLocation();

  const isCinematicWorld = useMemo(
    () => !PORTAL_PREFIXES.some((prefix) => location.pathname.startsWith(prefix)),
    [location.pathname]
  );

  if (!isCinematicWorld) return <>{children}</>;

  return (
    <Suspense fallback={<>{children}</>}>
      <CinematicScrollEngine>{children}</CinematicScrollEngine>
    </Suspense>
  );
}
