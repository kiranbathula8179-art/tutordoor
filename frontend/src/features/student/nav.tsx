import { BookOpen, CalendarDays, LayoutDashboard, MessageCircle, Search, User, Wallet } from "lucide-react";

import type { DashboardNavItem } from "@/components/layout/DashboardLayout";

export const studentNavItems: DashboardNavItem[] = [
  { label: "Dashboard", to: "/student", icon: LayoutDashboard, end: true },
  { label: "Find a tutor", to: "/search", icon: Search },
  { label: "My bookings", to: "/student/bookings", icon: CalendarDays },
  { label: "My courses", to: "/student/courses", icon: BookOpen },
  { label: "Wallet", to: "/student/wallet", icon: Wallet },
  { label: "Messages", to: "/student/chat", icon: MessageCircle },
  { label: "Profile", to: "/student/profile", icon: User },
];
