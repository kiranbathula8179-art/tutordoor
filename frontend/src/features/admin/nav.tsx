import {
  BadgeCheck,
  CalendarDays,
  CreditCard,
  Database,
  LayoutDashboard,
  Tag,
  TrendingUp,
  Users,
} from "lucide-react";

import type { DashboardNavItem } from "@/components/layout/DashboardLayout";

export const adminNavItems: DashboardNavItem[] = [
  { label: "Dashboard", to: "/admin", icon: LayoutDashboard, end: true },
  { label: "Tutor verifications", to: "/admin/verifications", icon: BadgeCheck },
  { label: "Users", to: "/admin/users", icon: Users },
  { label: "Bookings", to: "/admin/bookings", icon: CalendarDays },
  { label: "Payments", to: "/admin/payments", icon: CreditCard },
  { label: "Coupons", to: "/admin/coupons", icon: Tag },
  { label: "Master data", to: "/admin/master-data", icon: Database },
  { label: "Reports", to: "/admin/reports", icon: TrendingUp },
];
