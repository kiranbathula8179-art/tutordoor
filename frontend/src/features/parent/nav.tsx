import { CalendarDays, CreditCard, LayoutDashboard, TrendingUp, Users } from "lucide-react";

import type { DashboardNavItem } from "@/components/layout/DashboardLayout";

export const parentNavItems: DashboardNavItem[] = [
  { label: "Dashboard", to: "/parent", icon: LayoutDashboard, end: true },
  { label: "My children", to: "/parent/children", icon: Users },
  { label: "Bookings", to: "/parent/bookings", icon: CalendarDays },
  { label: "Progress reports", to: "/parent/progress", icon: TrendingUp },
  { label: "Payments", to: "/parent/payments", icon: CreditCard },
];
