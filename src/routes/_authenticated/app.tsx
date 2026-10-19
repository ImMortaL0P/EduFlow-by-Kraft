import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { PanelLeft, LogOut, Search, Plus, Bell, ExternalLink, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { canAccess, ROLE_LABELS, useMyRoles, useSession } from "@/lib/roles";
import { NAV } from "@/lib/nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/app")({
  head: () => ({ meta: [{ title: "Workspace — KRAFT" }, { name: "robots", content: "noindex" }] }),
  component: AppLayout,
});

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

  const initials = user?.email ? user.email.slice(0, 2).toUpperCase() : "AD";

  const sidebar = (
    <nav className="flex h-full flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border/80">
      <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-4">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="font-mono text-sm font-semibold tracking-[0.25em] text-sidebar-accent-foreground group-hover:text-primary transition-colors">
            {collapsed ? "K" : "KRAFT"}
          </span>
          {!collapsed && (
            <span className="text-[10px] uppercase font-mono tracking-widest text-sidebar-foreground/50">
              Journey
            </span>
          )}
        </Link>
        {!collapsed && (
          <Link
            to="/"
            title="View Public Website"
            className="text-sidebar-foreground/40 hover:text-sidebar-accent-foreground transition-colors p-1"
          >
            <ExternalLink className="size-3.5" />
          </Link>
        )}
      </div>

      <ul className="flex-1 space-y-1 overflow-y-auto p-2.5">
        {items.map((n) => {
          const active = current?.key === n.key;
          return (
            <li key={n.key}>
              <Link
                to={n.to as string}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-xs font-medium transition-all duration-150",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-xs font-semibold"
                    : "text-sidebar-foreground/75 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                )}
                title={n.label}
              >
                <n.icon className={cn("size-4 shrink-0 transition-colors", active ? "text-primary" : "text-sidebar-foreground/60")} />
                {!collapsed && <span className="truncate">{n.label}</span>}
              </Link>
            </li>
          );
        })}
      </ul>

      {!collapsed && (
        <div className="border-t border-sidebar-border/80 p-3 bg-sidebar-accent/20">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary font-mono text-xs font-semibold">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-medium text-sidebar-accent-foreground">
                {user?.email}
              </div>
              <div className="mt-0.5 truncate text-[10px] font-mono uppercase tracking-wider text-sidebar-foreground/50">
                {roles[0] ? ROLE_LABELS[roles[0]] : "Staff Member"}
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className={cn("sticky top-0 hidden h-screen shrink-0 transition-[width] duration-300 ease-in-out md:block", collapsed ? "w-14" : "w-60")}>
        {sidebar}
      </aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden animate-in fade-in duration-200" onClick={() => setMobileOpen(false)}>
          <div className="h-full w-64 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {sidebar}
          </div>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border/70 bg-background/90 px-4 backdrop-blur-md">
          <Button variant="ghost" size="icon" className="hidden md:inline-flex text-muted-foreground hover:text-foreground" onClick={() => setCollapsed(!collapsed)} aria-label="Toggle sidebar">
            <PanelLeft className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" className="md:hidden text-muted-foreground hover:text-foreground" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <PanelLeft className="size-4" />
          </Button>

          <div className="min-w-0 flex items-center gap-2">
            <Link to="/app" className="eyebrow hover:text-primary transition-colors hidden sm:inline">Workspace</Link>
            <span className="text-muted-foreground/40 hidden sm:inline">/</span>
            <div className="truncate text-sm font-semibold text-foreground tracking-tight">{current?.label ?? "Workspace"}</div>
            <span className="hidden lg:inline-flex ml-2 items-center gap-1.5 rounded-full bg-muted/60 px-2.5 py-0.5 font-mono text-[10px] text-muted-foreground border border-border/50">
              <span className="size-1.5 rounded-full bg-success animate-pulse" />
              Cycle 2025–26
            </span>
          </div>

          <form
            className="ml-auto hidden max-w-xs flex-1 items-center sm:flex"
            onSubmit={(e) => { e.preventDefault(); navigate({ to: "/app/students", search: { q } }); }}
          >
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search candidates, roll no, city…"
                className="h-9 pl-8 pr-12 text-xs bg-muted/40 focus-visible:bg-background border-border/60 transition-colors"
              />
              <kbd className="pointer-events-none absolute right-2.5 top-2.5 hidden h-4 select-none items-center gap-1 rounded bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-80 sm:flex">
                ↵
              </kbd>
            </div>
          </form>

          {canAccess(roles, "notifications") && (
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="relative text-muted-foreground hover:text-foreground"
              title="Notifications"
            >
              <Link to="/app/m/notifications">
                <Bell className="size-4" />
                <span className="absolute top-2 right-2 size-1.5 rounded-full bg-primary" />
              </Link>
            </Button>
          )}

          {canAccess(roles, "leads") && (
            <Button size="sm" asChild className="gap-1.5 shadow-sm text-xs h-8">
              <Link to="/app/leads" search={{ new: true }}>
                <Plus className="size-3.5" /> <span className="hidden sm:inline">New enquiry</span>
              </Link>
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            aria-label="Sign out"
            title="Sign out"
            className="text-muted-foreground hover:text-destructive transition-colors size-8"
            onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/auth" }); }}
          >
            <LogOut className="size-4" />
          </Button>
        </header>

        <main className="flex-1 p-4 md:p-8">
          {!isLoading && roles.length === 0 ? (
            <div className="mx-auto max-w-md py-24 text-center">
              <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Awaiting access</h1>
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
