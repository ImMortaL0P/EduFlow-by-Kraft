import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Panel, Empty, Tag } from "@/components/kraft";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fmtDate, isOverdue } from "@/lib/format";
import { useSession } from "@/lib/roles";

export const Route = createFileRoute("/_authenticated/app/tasks")({
  head: () => ({ meta: [{ title: "Tasks & Follow-ups — KRAFT" }] }),
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
    <div>
      <PageHeader eyebrow="Operations" title="Tasks & Follow-ups" description="Your follow-ups, calls and reminders, with overdue items surfaced first." />
      <Panel>
        <form onSubmit={add} className="mb-4 flex flex-wrap gap-2">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="New task…" className="max-w-sm" />
          <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} className="w-40" />
          <Button type="submit" variant="outline">Add</Button>
        </form>
        <div className="mb-4 flex gap-1">
          {(["mine", "overdue", "all", "done"] as const).map((t) => (
            <Button key={t} size="sm" variant={tab === t ? "default" : "ghost"} onClick={() => setTab(t)}>{{ mine: "My tasks", overdue: "Overdue", all: "All open", done: "Completed" }[t]}</Button>
          ))}
        </div>
        {isLoading ? null : rows.length === 0 ? <Empty title="All clear" hint="No tasks in this view." /> : (
          <ul className="divide-y">
            {rows.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center gap-3 py-2.5">
                {t.status === "open" && <input type="checkbox" className="size-4 accent-primary" onChange={() => complete(t.id)} aria-label="Complete" />}
                <div className="min-w-0 flex-1">
                  <div className={`text-sm ${t.status === "done" ? "text-muted-foreground line-through" : ""}`}>{t.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {t.task_type}
                    {t.leads?.full_name && <> · <Link to="/app/leads" className="hover:text-primary">{t.leads.full_name}</Link></>}
                    {t.students?.full_name && t.student_id && <> · <Link to="/app/students/$id" params={{ id: t.student_id }} className="hover:text-primary">{t.students.full_name}</Link></>}
                  </div>
                </div>
                {t.priority === "high" && <Tag tone="primary">High</Tag>}
                {t.status === "open" && isOverdue(t.due_date) && <Tag tone="warning">Overdue</Tag>}
                {t.status === "open" ? <Input type="date" className="h-8 w-36 text-xs" value={t.due_date} onChange={(e) => e.target.value && reschedule(t.id, e.target.value)} /> : <span className="tabular text-xs text-muted-foreground">{fmtDate(t.completed_at)}</span>}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
