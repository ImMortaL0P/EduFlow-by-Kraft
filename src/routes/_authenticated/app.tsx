import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import {
  LayoutDashboard, Inbox, Route as RouteIcon, Users, MessagesSquare, BookOpen, GraduationCap, LineChart,
  CalendarCheck, ListTodo, Target, School, Wallet, BarChart3, UserCog, Bell, Settings, PanelLeft, LogOut, Search, Plus,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { canAccess, ROLE_LABELS, useMyRoles, useSession } from "@/lib/roles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/app")({
  head: () => ({ meta: [{ title: "Workspace — KRAFT" }, { name: "robots", content: "noindex" }] }),
  component: AppLayout,
});

export const NAV = [
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

function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: roles = [], isLoading } = useMyRoles();
  const { data: user } = useSession();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const items = NAV.filter((n) => canAccess(roles, n.key));
  const current = NAV.find((n) => (n.to === "/app" ? pathname === "/app" : pathname.startsWith(n.to)));

  const sidebar = (
    <nav className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4">
        <span className="font-mono text-sm font-medium tracking-[0.2em] text-sidebar-accent-foreground">{collapsed ? "K" : "KRAFT"}</span>
        {!collapsed && <span className="text-[10px] uppercase tracking-widest text-sidebar-foreground/60">Journey</span>}
      </div>
      <ul className="flex-1 space-y-0.5 overflow-y-auto p-2">
        {items.map((n) => {
          const active = current?.key === n.key;
          return (
            <li key={n.key}>
              <Link
                to={n.to as string}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-sm px-2.5 py-2 text-sm transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  active && "bg-sidebar-accent text-sidebar-accent-foreground shadow-[inset_2px_0_0_var(--sidebar-primary)]",
                )}
                title={n.label}
              >
                <n.icon className="size-4 shrink-0" />
                {!collapsed && <span className="truncate">{n.label}</span>}
              </Link>
            </li>
          );
        })}
      </ul>
      {!collapsed && (
        <div className="border-t border-sidebar-border p-3 text-xs">
          <div className="truncate text-sidebar-accent-foreground">{user?.email}</div>
          <div className="mt-0.5 truncate text-sidebar-foreground/60">{roles.map((r) => ROLE_LABELS[r]).join(", ") || "No role assigned"}</div>
        </div>
      )}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <aside className={cn("sticky top-0 hidden h-screen shrink-0 transition-[width] md:block", collapsed ? "w-14" : "w-60")}>{sidebar}</aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setMobileOpen(false)}>
          <div className="h-full w-64" onClick={(e) => e.stopPropagation()}>{sidebar}</div>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur">
          <Button variant="ghost" size="icon" className="hidden md:inline-flex" onClick={() => setCollapsed(!collapsed)} aria-label="Toggle sidebar"><PanelLeft /></Button>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu"><PanelLeft /></Button>
          <div className="min-w-0">
            <div className="eyebrow">Workspace</div>
            <div className="truncate text-sm font-medium">{current?.label ?? "Workspace"}</div>
          </div>
          <form
            className="ml-auto hidden max-w-xs flex-1 items-center sm:flex"
            onSubmit={(e) => { e.preventDefault(); navigate({ to: "/app/students", search: { q } }); }}
          >
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search students…" className="h-9 pl-8" />
            </div>
          </form>
          {canAccess(roles, "leads") && (
            <Button size="sm" asChild><Link to="/app/leads" search={{ new: true }}><Plus /> <span className="hidden sm:inline">New enquiry</span></Link></Button>
          )}
          <Button variant="ghost" size="icon" aria-label="Sign out" onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/auth" }); }}><LogOut /></Button>
        </header>
        <main className="flex-1 p-4 md:p-8">
          {!isLoading && roles.length === 0 ? (
            <div className="mx-auto max-w-md py-24 text-center">
              <h1 className="font-display text-4xl">Awaiting access</h1>
              <p className="mt-3 text-muted-foreground">Your account has no role yet. Ask a Super Administrator to assign one from the Team page.</p>
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  );
}
