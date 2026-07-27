import { motion } from "framer-motion";
import { LogOut, Menu as MenuIcon, X } from "lucide-react";
import { type LucideIcon } from "lucide-react";
import { useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";

import { Avatar } from "@/components/ui/Avatar";
import { MeshBackground } from "@/components/ui/Surface";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { Logo } from "@/components/shared/Logo";
import { useAuth } from "@/features/auth/use-auth";
import { prefersReducedMotion } from "@/lib/motion/quality";
import { cn } from "@/lib/utils";

/**
 * Portal shell — V3 "Bright" (DESIGN_V3.md, migration step 5).
 *
 * White sidebar with the sliding primary indicator, blur header, content on
 * the surface canvas — one file restaging the chrome of all five portals,
 * with zero edits to any portal page.
 */

export interface DashboardNavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  end?: boolean;
  /** Marks a real nav destination that isn't built yet — renders an honest "Soon" tag so it never looks like a broken link. */
  soon?: boolean;
}

interface DashboardLayoutProps {
  navItems: DashboardNavItem[];
  portalLabel: string;
}

export function DashboardLayout({ navItems, portalLabel }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const still = prefersReducedMotion();

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center px-6">
        <Link to="/" aria-label="TutorDoor home">
          <Logo />
        </Link>
      </div>

      <p className="px-6 pb-3 pt-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{portalLabel}</p>

      <nav className="flex-1 space-y-0.5 px-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                isActive ? "font-semibold text-primary-dark" : "font-medium text-slate-600 hover:bg-surface-3 hover:text-navy"
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="portal-nav-active"
                    transition={still ? { duration: 0 } : { type: "spring", stiffness: 400, damping: 34 }}
                    className="absolute inset-0 rounded-xl bg-primary-subtle"
                    aria-hidden="true"
                  />
                )}
                <item.icon
                  className={cn(
                    "relative h-[1.1rem] w-[1.1rem] transition-colors",
                    isActive ? "text-primary" : "text-slate-400 group-hover:text-slate-600"
                  )}
                />
                <span className="relative flex-1">{item.label}</span>
                {item.soon && (
                  <span className="relative rounded-full bg-surface-3 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-slate-400">
                    Soon
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {user && (
        <div className="border-t border-line p-3">
          <div className="flex items-center gap-3 rounded-xl px-2 py-2">
            <Avatar src={user.avatar} firstName={user.first_name} lastName={user.last_name} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-navy">{user.full_name}</p>
              <p className="truncate text-xs text-slate-500">{user.email}</p>
            </div>
            <button
              onClick={() => logout()}
              aria-label="Log out"
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-surface-3 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="relative min-h-screen bg-surface">
      <MeshBackground />
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 border-r border-line bg-canvas lg:block">
        {sidebarContent}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 border-r border-line bg-canvas shadow-dropdown">
            {sidebarContent}
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-canvas/80 px-4 backdrop-blur-xl lg:px-8">
          <button
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-surface-3 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <MenuIcon className="h-5 w-5" />
          </button>
          <div className="flex-1" />
          <NotificationBell />
        </header>

        <motion.main
          key={pathname}
          initial={still ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto min-h-[calc(100vh-4rem)] max-w-7xl p-4 lg:p-8"
        >
          <Outlet />
        </motion.main>
      </div>

      {mobileOpen && (
        <button
          className="fixed right-4 top-4 z-50 rounded-full border border-line bg-canvas p-2 text-slate-700 shadow-dropdown lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
