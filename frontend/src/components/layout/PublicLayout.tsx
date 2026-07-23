import { Outlet } from "react-router-dom";

import { NavV3 } from "@/features/landing/v3/HeroV3";
import { FooterV3 } from "@/features/landing/v3/SectionsV3";

/**
 * Public frame — V3: every public page (landing, search, courses, tutor
 * profiles, statics, legal) shares the role-aware NavV3 header and FooterV3.
 * Authenticated visitors see their portal navigation here; guests see the
 * marketing links.
 */
export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <NavV3 />
      <main className="flex-1">
        <Outlet />
      </main>
      <FooterV3 />
    </div>
  );
}
