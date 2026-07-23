import { BookOpen, Building2, GraduationCap, LayoutDashboard, Users } from "lucide-react";

import type { DashboardNavItem } from "@/components/layout/DashboardLayout";

export const instituteNavItems: DashboardNavItem[] = [
  { label: "Dashboard", to: "/institute", icon: LayoutDashboard, end: true },
  { label: "Tutor roster", to: "/institute/tutors", icon: GraduationCap },
  { label: "Enrolled students", to: "/institute/students", icon: Users },
  { label: "Courses", to: "/institute/courses", icon: BookOpen },
  { label: "Institute profile", to: "/institute/profile", icon: Building2 },
];
