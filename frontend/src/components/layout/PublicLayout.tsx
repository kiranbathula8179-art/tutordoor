import { Outlet } from "react-router-dom";

import { PublicAtmosphere } from "@/components/ui/Surface";
import { NavV3 } from "@/features/landing/v3/HeroV3";
import { FooterV3 } from "@/features/landing/v3/SectionsV3";

/**
 * Public frame — V7 "One World" (DESIGN_V3.md): every public page (search,
 * courses, tutor profiles, statics, legal) shares the role-aware NavV3
 * header, FooterV3, and the same `PublicAtmosphere` background Landing
 * uses, so the whole public surface reads as one continuous world instead
 * of resetting to flat white per page. Authenticated visitors see their
 * portal navigation here; guests see the marketing links.
 */
export function PublicLayout() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <PublicAtmosphere />
      <NavV3 />
      <main className="flex-1">
        <Outlet />
      </main>
      <FooterV3 />
    </div>
  );
}
