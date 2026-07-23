import {
  BadgeCheck,
  BookOpen,
  CalendarClock,
  CalendarDays,
  LayoutDashboard,
  MessageCircle,
  User,
  Wallet,
} from "lucide-react";

import type { DashboardNavItem } from "@/components/layout/DashboardLayout";

export const tutorNavItems: DashboardNavItem[] = [
  { label: "Dashboard", to: "/tutor", icon: LayoutDashboard, end: true },
  { label: "My bookings", to: "/tutor/bookings", icon: CalendarDays },
  { label: "Availability", to: "/tutor/availability", icon: CalendarClock },
  { label: "My courses", to: "/tutor/courses", icon: BookOpen },
  { label: "Verification", to: "/tutor/verification", icon: BadgeCheck },
  { label: "Earnings & wallet", to: "/tutor/earnings", icon: Wallet },
  { label: "Messages", to: "/tutor/chat", icon: MessageCircle },
  { label: "Profile", to: "/tutor/profile", icon: User },
];
