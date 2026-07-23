import { Menu as HeadlessMenu, Transition } from "@headlessui/react";
import { ChevronDown, LogOut, Menu as MenuIcon, X } from "lucide-react";
import { Fragment, useState } from "react";
import { Link, NavLink } from "react-router-dom";

import { NotificationBell } from "@/components/layout/NotificationBell";
import { type DashboardNavItem } from "@/components/layout/DashboardLayout";
import { Avatar } from "@/components/ui/Avatar";
import { Logo } from "@/components/shared/Logo";
import { useAuth } from "@/features/auth/use-auth";
import { adminNavItems } from "@/features/admin/nav";
import { instituteNavItems } from "@/features/institute/nav";
import { parentNavItems } from "@/features/parent/nav";
import { studentNavItems } from "@/features/student/nav";
import { tutorNavItems } from "@/features/tutor/nav";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

/**
 * NavV3 — THE application header for the public frame (landing, search,
 * courses, tutor profiles, statics), now role-aware. Authenticated users get
 * their portal's own navigation — sourced from the SAME nav arrays the
 * dashboard sidebar uses (single source of truth, zero drift) — plus the
 * existing NotificationBell and an avatar menu with Logout. Guests keep the
 * marketing links. Fixes the "stuck on /search with no way back" gap.
 */

const ROLE_NAVS: Record<UserRole, DashboardNavItem[]> = {
  student: studentNavItems,
  tutor: tutorNavItems,
  parent: parentNavItems,
  institute_admin: instituteNavItems,
  admin: adminNavItems,
};

const PRIMARY_LINKS = 4;

const GUEST_LINKS = [
  { label: "Find tutors", to: "/search" },
  { label: "Courses", to: "/courses" },
  { label: "Become a tutor", to: "/register?role=tutor" },
];

function TopNavLink({ item, end }: { item: { label: string; to: string }; end?: boolean }) {
  return (
    <NavLink
      to={item.to}
      end={end}
      className={({ isActive }) =>
        cn(
          "relative flex h-16 items-center px-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
          isActive ? "font-semibold text-navy" : "font-medium text-slate-600 hover:text-navy"
        )
      }
    >
      {({ isActive }) => (
        <>
          {item.label}
          {isActive && (
            <span aria-hidden="true" className="absolute inset-x-1 bottom-0 h-0.5 rounded-full bg-primary" />
          )}
        </>
      )}
    </NavLink>
  );
}

export function NavV3() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const roleItems = user ? ROLE_NAVS[user.role] ?? [] : [];
  const primary = roleItems.slice(0, PRIMARY_LINKS);
  const overflow = roleItems.slice(PRIMARY_LINKS);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/80 backdrop-blur-xl">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link to="/" aria-label="TutorDoor home" className="shrink-0">
          <Logo />
        </Link>

        {/* ---------------------------------------------- Center links (desktop) */}
        <nav className="hidden items-center gap-6 md:flex" aria-label="Primary">
          {user
            ? primary.map((item) => <TopNavLink key={item.to} item={item} end={item.end} />)
            : GUEST_LINKS.map((item) => <TopNavLink key={item.to} item={item} />)}
        </nav>

        {/* ---------------------------------------------- Right side */}
        <div className="flex items-center gap-1.5">
          {user ? (
            <>
              <NotificationBell />
              <HeadlessMenu as="div" className="relative">
                <HeadlessMenu.Button className="flex items-center gap-1.5 rounded-full p-1 pr-2 transition-colors hover:bg-surface-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30">
                  <Avatar src={user.avatar} firstName={user.first_name} lastName={user.last_name} size="sm" />
                  <ChevronDown className="hidden h-4 w-4 text-slate-400 sm:block" />
                </HeadlessMenu.Button>
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-150"
                  enterFrom="opacity-0 translate-y-1"
                  enterTo="opacity-100 translate-y-0"
                  leave="transition ease-in duration-100"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <HeadlessMenu.Items className="absolute right-0 mt-2 w-60 origin-top-right rounded-2xl border border-line bg-canvas p-2 shadow-dropdown focus:outline-none">
                    <div className="border-b border-line px-3 pb-2.5 pt-1.5">
                      <p className="truncate text-sm font-semibold text-navy">{user.full_name}</p>
                      <p className="truncate text-xs text-slate-500">{user.email}</p>
                    </div>
                    <div className="py-1.5">
                      {overflow.map((item) => (
                        <HeadlessMenu.Item key={item.to}>
                          {({ active }) => (
                            <Link
                              to={item.to}
                              className={cn(
                                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-700",
                                active && "bg-surface-3 text-navy"
                              )}
                            >
                              <item.icon className="h-4 w-4 text-slate-400" />
                              {item.label}
                            </Link>
                          )}
                        </HeadlessMenu.Item>
                      ))}
                    </div>
                    <div className="border-t border-line pt-1.5">
                      <HeadlessMenu.Item>
                        {({ active }) => (
                          <button
                            onClick={() => logout()}
                            className={cn(
                              "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600",
                              active && "bg-surface-3 text-navy"
                            )}
                          >
                            <LogOut className="h-4 w-4" />
                            Log out
                          </button>
                        )}
                      </HeadlessMenu.Item>
                    </div>
                  </HeadlessMenu.Items>
                </Transition>
              </HeadlessMenu>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="hidden rounded-xl px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-surface-3 hover:text-navy sm:block"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-soft transition-all hover:bg-primary-dark hover:shadow-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2"
              >
                Get started
              </Link>
            </>
          )}

          {/* Mobile menu trigger */}
          <button
            onClick={() => setMobileOpen((open) => !open)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-surface-3 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 md:hidden"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* ---------------------------------------------- Mobile panel */}
      {mobileOpen && (
        <nav
          aria-label="Mobile"
          className="border-t border-line bg-canvas shadow-dropdown md:hidden"
        >
          <div className="container-page space-y-0.5 py-3">
            {(user ? roleItems : GUEST_LINKS.map((g) => ({ ...g, icon: undefined as never, end: undefined }))).map(
              (item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={"end" in item ? item.end : undefined}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm",
                      isActive
                        ? "bg-primary-subtle font-semibold text-primary-dark"
                        : "font-medium text-slate-600 hover:bg-surface-3 hover:text-navy"
                    )
                  }
                >
                  {"icon" in item && item.icon && <item.icon className="h-[1.1rem] w-[1.1rem]" />}
                  {item.label}
                </NavLink>
              )
            )}
            {user ? (
              <button
                onClick={() => {
                  setMobileOpen(false);
                  logout();
                }}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-surface-3 hover:text-navy"
              >
                <LogOut className="h-[1.1rem] w-[1.1rem]" /> Log out
              </button>
            ) : (
              <div className="flex gap-2 pt-2">
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 rounded-xl border border-line px-4 py-2.5 text-center text-sm font-medium text-slate-700 hover:bg-surface"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-center text-sm font-semibold text-white"
                >
                  Get started
                </Link>
              </div>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
