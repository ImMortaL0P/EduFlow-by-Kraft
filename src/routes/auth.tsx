import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — KRAFT Student Journey Manager" },
      { name: "description", content: "Sign in to the KRAFT CAT & GMAT coaching workspace." },
      { property: "og:title", content: "Sign in — KRAFT" },
      { property: "og:description", content: "Access the KRAFT Student Journey Manager." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/app" });
    });
    const { data } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) navigate({ to: "/app" });
    });
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Signed in successfully");
        navigate({ to: "/app" });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name } },
        });
        if (error) throw error;
        toast.success("Account created successfully");
        navigate({ to: "/app" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  async function quickLogin(demoEmail: string, demoPass: string) {
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: demoEmail,
        password: demoPass,
      });
      if (error) throw error;
      toast.success(`Signed in as ${demoEmail}`);
      navigate({ to: "/app" });
    } catch (err: any) {
      toast.error(err.message || "Quick login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <aside className="hidden flex-col justify-between bg-ink p-10 text-ink-foreground md:flex">
        <Link to="/" className="font-mono text-sm tracking-[0.2em]">KRAFT</Link>
        <blockquote className="font-display text-4xl font-extrabold leading-tight tracking-tight">
          One record for every aspirant — <em className="text-primary not-italic">enquiry to admit.</em>
        </blockquote>
        <p className="eyebrow text-ink-foreground/60">CAT · GMAT · Student Journey Manager</p>
      </aside>
      <main className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <p className="eyebrow">{mode === "signin" ? "Welcome back" : "Create account"}</p>
          <h1 className="font-display mt-2 text-3xl font-bold tracking-tight">{mode === "signin" ? "Sign in" : "Join the workspace"}</h1>

          {/* Instant One-Click Login */}
          <div className="mt-6 rounded-md border border-primary/20 bg-primary/5 p-3">
            <div className="flex items-center gap-1.5 font-mono text-[11px] font-medium uppercase tracking-wider text-primary">
              <Sparkles className="size-3.5" /> Instant Workspace Access
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Pre-configured administrator account connected to MongoDB Atlas.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2.5 w-full border-primary/30 text-xs font-medium hover:bg-primary/10"
              disabled={busy}
              onClick={() => quickLogin("admin@kraft.edu", "Admin@123456")}
            >
              Sign in as Super Administrator
            </Button>
          </div>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />or credentials<span className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@kraft.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "signin" ? "New here?" : "Already have an account?"}{" "}
            <button
              className="font-medium text-primary underline-offset-4 hover:underline"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            >
              {mode === "signin" ? "Create an account" : "Sign in"}
            </button>
          </p>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Roles and permissions are managed in the Team section.
          </p>
        </div>
      </main>
    </div>
  );
}
