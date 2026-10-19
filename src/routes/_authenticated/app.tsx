import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { PanelLeft, LogOut, Search, Plus } from "lucide-react";
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
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className={cn("sticky top-0 hidden h-screen shrink-0 transition-[width] md:block", collapsed ? "w-14" : "w-60")}>
        {sidebar}
      </aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden animate-in fade-in duration-200" onClick={() => setMobileOpen(false)}>
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
            <div className="truncate text-sm font-medium text-foreground">{current?.label ?? "Workspace"}</div>
            <span className="hidden lg:inline-flex ml-2 items-center rounded-full bg-muted/60 px-2 py-0.5 font-mono text-[10px] text-muted-foreground border border-border/40">
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
                placeholder="Search students, roll no, city…"
                className="h-9 pl-8 text-xs bg-muted/30 focus-visible:bg-background"
              />
            </div>
          </form>
          {canAccess(roles, "leads") && (
            <Button size="sm" asChild className="gap-1.5 shadow-sm">
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
            className="text-muted-foreground hover:text-destructive transition-colors"
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
