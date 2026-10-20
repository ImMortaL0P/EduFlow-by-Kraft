import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Panel, Empty, Tag, Kpi } from "@/components/kraft";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fmtDate, isOverdue } from "@/lib/format";
import { useSession } from "@/lib/roles";

export const Route = createFileRoute("/_authenticated/app/tasks")({
  head: () => ({ meta: [{ title: "Tasks & Follow-ups — TrajectX" }] }),
  component: TasksPage,
});

function TasksPage() {
  const qc = useQueryClient();
  const { data: me } = useSession();
  const [tab, setTab] = useState<"mine" | "overdue" | "all" | "done">("mine");
  const [title, setTitle] = useState("");
  const [due, setDue] = useState(new Date().toISOString().slice(0, 10));
  const { data = [], isLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => (await supabase.from("tasks").select("*, leads(full_name), students(full_name)").order("due_date")).data ?? [],
  });

  const myTasksCount = data.filter((t) => t.status === "open" && (t.assigned_to === me?.id || !t.assigned_to)).length;
  const overdueCount = data.filter((t) => t.status === "open" && isOverdue(t.due_date)).length;
  const openCount = data.filter((t) => t.status === "open").length;
  const doneCount = data.filter((t) => t.status === "done").length;

  const rows = data.filter((t) =>
    tab === "done" ? t.status === "done" : t.status === "open" && (tab === "all" || (tab === "overdue" ? isOverdue(t.due_date) : t.assigned_to === me?.id || !t.assigned_to)),
  );
  const refresh = () => { qc.invalidateQueries({ queryKey: ["tasks"] }); qc.invalidateQueries({ queryKey: ["overview"] }); };

  async function complete(id: string) {
    const { error } = await supabase.from("tasks").update({ status: "done", completed_at: new Date().toISOString() }).eq("id", id);
    if (error) toast.error(error.message); else refresh();
  }
  async function reschedule(id: string, d: string) {
    const { error } = await supabase.from("tasks").update({ due_date: d }).eq("id", id);
    if (error) toast.error(error.message); else refresh();
  }
  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const { error } = await supabase.from("tasks").insert({ title, due_date: due, assigned_to: me?.id, created_by: me?.id });
    if (error) return toast.error(error.message);
    setTitle("");
    refresh();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operations & Cadence"
        title="Tasks & Follow-ups"
        description="Daily follow-ups, diagnostic debriefs, document verifications and reminder queues."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi label="My pending tasks" value={myTasksCount} hint="Assigned to your queue" />
        <Kpi label="Overdue follow-ups" value={overdueCount} tone={overdueCount > 0 ? "warning" : "default"} hint="Breached SLA" />
        <Kpi label="Total open tasks" value={openCount} tone="primary" hint="Institution wide" />
        <Kpi label="Completed" value={doneCount} hint="Resolved tasks" />
      </div>

      <Panel>
        <form onSubmit={add} className="mb-5 flex flex-wrap items-center gap-2">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Add follow-up, interview prep task, or mock debrief…"
            className="h-9 max-w-md flex-1"
          />
          <Input
            type="date"
            value={due}
            onChange={(e) => setDue(e.target.value)}
            className="h-9 w-40 font-mono text-xs"
          />
          <Button type="submit" className="h-9 shadow-sm">Add task</Button>
        </form>

        <div className="mb-4 flex flex-wrap gap-1.5 border-b border-border/50 pb-3">
          {(["mine", "overdue", "all", "done"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                tab === t
                  ? "bg-ink text-background shadow-sm"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {{ mine: `My Tasks (${myTasksCount})`, overdue: `Overdue (${overdueCount})`, all: `All Open (${openCount})`, done: `Completed (${doneCount})` }[t]}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-sm text-muted-foreground">Loading tasks…</div>
        ) : rows.length === 0 ? (
          <Empty title="All clear" hint="No tasks found matching this view." />
        ) : (
          <ul className="divide-y divide-border/40">
            {rows.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center gap-3 py-3 px-1 transition-colors hover:bg-muted/30 rounded-md">
                {t.status === "open" && (
                  <input
                    type="checkbox"
                    className="size-4 rounded border-border accent-primary cursor-pointer"
                    onChange={() => complete(t.id)}
                    aria-label="Mark task complete"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className={`text-sm font-medium ${t.status === "done" ? "text-muted-foreground line-through" : "text-foreground"}`}>
                    {t.title}
                  </div>
                  <div className="font-mono text-xs text-muted-foreground mt-0.5">
                    <span className="uppercase text-[10px] tracking-wider text-muted-foreground/80">{t.task_type || "Follow-up"}</span>
                    {t.leads?.full_name && (
                      <> · Enquiry: <Link to="/app/leads" className="font-medium text-foreground hover:text-primary transition-colors">{t.leads.full_name}</Link></>
                    )}
                    {t.students?.full_name && t.student_id && (
                      <> · Student: <Link to="/app/students/$id" params={{ id: t.student_id }} className="font-medium text-foreground hover:text-primary transition-colors">{t.students.full_name}</Link></>
                    )}
                  </div>
                </div>
                {t.priority === "high" && <Tag tone="primary">High</Tag>}
                {t.status === "open" && isOverdue(t.due_date) && <Tag tone="warning">Overdue</Tag>}
                {t.status === "open" ? (
                  <Input
                    type="date"
                    className="h-8 w-36 font-mono text-xs"
                    value={t.due_date}
                    onChange={(e) => e.target.value && reschedule(t.id, e.target.value)}
                  />
                ) : (
                  <span className="font-mono text-xs text-muted-foreground tabular">
                    Completed {fmtDate(t.completed_at)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
