import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { useEffect, useRef, type ReactNode } from "react";
import { useLocation } from "react-router-dom";

import { prefersReducedMotion } from "@/lib/motion/quality";

gsap.registerPlugin(ScrollTrigger);

/**
 * CinematicScrollEngine — the gsap/Lenis scroll spine, split out of
 * SmoothScrollProvider so these libraries only ever load when a cinematic-
 * world route is actually visited (see SmoothScrollProvider.tsx).
 *
 * Lenis owns wheel/touch scrolling; its scroll events drive GSAP ScrollTrigger,
 * and GSAP's ticker drives Lenis's rAF — one clock, no drift. This is the
 * pairing that makes pinned storytelling sections possible.
 *
 * Reduced motion: Lenis is never constructed anywhere.
 * Route changes: jump (not glide) to top, then refresh ScrollTrigger after
 * layout settles so pinned scenes measure the new page.
 */

declare global {
  interface Window {
    __lenis?: Lenis;
  }
}

export function CinematicScrollEngine({ children }: { children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  const location = useLocation();

  useEffect(() => {
    if (prefersReducedMotion()) return;

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
  }, []);

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
