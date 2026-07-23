import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { useLocation } from "react-router-dom";

import { prefersReducedMotion } from "@/lib/motion/quality";

gsap.registerPlugin(ScrollTrigger);

/**
 * SmoothScrollProvider — the scroll spine of the cinematic system.
 *
 * Lenis owns wheel/touch scrolling; its scroll events drive GSAP ScrollTrigger,
 * and GSAP's ticker drives Lenis's rAF — one clock, no drift. This is the
 * pairing that makes pinned storytelling sections possible.
 *
 * The two-world rule (DESIGN_V2.md): Lenis runs ONLY in the cinematic world —
 * landing, auth, search, courses, static pages. Inside the portals
 * (/student, /tutor, /parent, /institute, /admin) native scrolling is
 * untouched, because chat panes, modals, and data tables own their internal
 * scroll and must keep working exactly as before.
 *
 * Reduced motion: Lenis is never constructed anywhere.
 * Route changes: jump (not glide) to top, then refresh ScrollTrigger after
 * layout settles so pinned scenes measure the new page.
 */

const PORTAL_PREFIXES = ["/student", "/tutor", "/parent", "/institute", "/admin"];

declare global {
  interface Window {
    __lenis?: Lenis;
  }
}

export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  const location = useLocation();

  const isCinematicWorld = useMemo(
    () => !PORTAL_PREFIXES.some((prefix) => location.pathname.startsWith(prefix)),
    [location.pathname]
  );

  useEffect(() => {
    if (!isCinematicWorld || prefersReducedMotion()) return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // expo-out
      smoothWheel: true,
      touchMultiplier: 1.4,
    });
    lenisRef.current = lenis;
    window.__lenis = lenis;

    lenis.on("scroll", ScrollTrigger.update);

    const tick = (time: number) => {
      lenis.raf(time * 1000); // gsap ticker reports seconds; lenis wants ms
    };
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisRef.current = null;
      delete window.__lenis;
    };
  }, [isCinematicWorld]);

  // Route change: hard jump to top, then re-measure pinned scenes.
  useEffect(() => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo(0, 0);
    }
    const id = window.setTimeout(() => ScrollTrigger.refresh(), 120);
    return () => window.clearTimeout(id);
  }, [location.pathname]);

  return <>{children}</>;
}
