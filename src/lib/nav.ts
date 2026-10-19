import {
  LayoutDashboard, Inbox, Route as RouteIcon, Users, MessagesSquare, BookOpen, GraduationCap, LineChart,
  CalendarCheck, ListTodo, Target, School, Wallet, BarChart3, UserCog, Bell, Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  key: string;
  label: string;
  to: string;
  icon: LucideIcon;
};

export const NAV: readonly NavItem[] = [
  { key: "overview", label: "Overview", to: "/app", icon: LayoutDashboard },
  { key: "leads", label: "Enquiries & Leads", to: "/app/leads", icon: Inbox },
  { key: "journey", label: "Student Journey", to: "/app/journey", icon: RouteIcon },
  { key: "students", label: "Students", to: "/app/students", icon: Users },
  { key: "counselling", label: "Counselling", to: "/app/counselling", icon: MessagesSquare },
  { key: "courses", label: "Courses & Batches", to: "/app/m/courses", icon: BookOpen },
  { key: "academics", label: "Academic Operations", to: "/app/m/academics", icon: GraduationCap },
  { key: "tests", label: "Tests & Performance", to: "/app/m/tests", icon: LineChart },
  { key: "attendance", label: "Attendance", to: "/app/m/attendance", icon: CalendarCheck },
  { key: "tasks", label: "Tasks & Follow-ups", to: "/app/tasks", icon: ListTodo },
  { key: "readiness", label: "Exam Readiness", to: "/app/m/readiness", icon: Target },
  { key: "applications", label: "B-School Applications", to: "/app/m/applications", icon: School },
  { key: "fees", label: "Fees & Payments", to: "/app/m/fees", icon: Wallet },
  { key: "analytics", label: "Analytics & Reports", to: "/app/m/analytics", icon: BarChart3 },
  { key: "team", label: "Team", to: "/app/team", icon: UserCog },
  { key: "notifications", label: "Notifications", to: "/app/m/notifications", icon: Bell },
  { key: "settings", label: "Settings", to: "/app/m/settings", icon: Settings },
] as const;
