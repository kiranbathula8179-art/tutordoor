import { describe, expect, it } from "vitest";

import { adminNavItems } from "@/features/admin/nav";
import { instituteNavItems } from "@/features/institute/nav";
import { parentNavItems } from "@/features/parent/nav";
import { studentNavItems } from "@/features/student/nav";
import { tutorNavItems } from "@/features/tutor/nav";
import type { UserRole } from "@/types";

/**
 * Navigation role restrictions. The sidebars and the role-aware top nav both
 * read these arrays, so a cross-portal link here would surface a route the
 * user cannot access (ProtectedRoute would bounce them). This asserts the
 * arrays stay within their own portal.
 */

const PORTAL_PREFIX: Record<UserRole, string> = {
  student: "/student",
  tutor: "/tutor",
  parent: "/parent",
  institute_admin: "/institute",
  admin: "/admin",
};

const NAVS: Record<UserRole, { label: string; to: string }[]> = {
  student: studentNavItems,
  tutor: tutorNavItems,
  parent: parentNavItems,
  institute_admin: instituteNavItems,
  admin: adminNavItems,
};

/** Routes any signed-in role may legitimately visit. */
const PUBLIC_PATHS = ["/search", "/courses"];

const ROLES = Object.keys(NAVS) as UserRole[];

describe("navigation role restrictions", () => {
  it("defines navigation for every role", () => {
    expect(ROLES).toHaveLength(5);
    for (const role of ROLES) {
      expect(NAVS[role].length).toBeGreaterThan(0);
    }
  });

  it("never links into another portal", () => {
    for (const role of ROLES) {
      const foreignPrefixes = ROLES.filter((r) => r !== role).map((r) => PORTAL_PREFIX[r]);

      for (const item of NAVS[role]) {
        if (PUBLIC_PATHS.includes(item.to)) continue;
        expect(item.to.startsWith(PORTAL_PREFIX[role])).toBe(true);

        for (const foreign of foreignPrefixes) {
          expect(
            item.to === foreign || item.to.startsWith(`${foreign}/`),
            `${role} nav links into ${foreign}: ${item.to}`
          ).toBe(false);
        }
      }
    }
  });

  it("starts every portal at its own dashboard", () => {
    for (const role of ROLES) {
      expect(NAVS[role][0].to).toBe(PORTAL_PREFIX[role]);
    }
  });

  it("uses absolute paths and unique destinations", () => {
    for (const role of ROLES) {
      const targets = NAVS[role].map((item) => item.to);
      for (const to of targets) expect(to.startsWith("/")).toBe(true);
      expect(new Set(targets).size).toBe(targets.length);
    }
  });

  it("gives every item a non-empty label", () => {
    for (const role of ROLES) {
      for (const item of NAVS[role]) expect(item.label.trim().length).toBeGreaterThan(0);
    }
  });
});
