import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Kpi, PageHeader, Panel, Empty, ExamTag } from "@/components/kraft";
import { conversionRate, fmtDate, isOverdue, LEAD_STATUS_LABEL } from "@/lib/format";
import { useMyRoles, canAccess, useSession } from "@/lib/roles";

export const Route = createFileRoute("/_authenticated/app/")({
  head: () => ({ meta: [{ title: "Overview — KRAFT" }] }),
  component: Overview,
});

function Overview() {
  const { data: roles = [] } = useMyRoles();
  const showLeads = canAccess(roles, "leads");
  const { data: me } = useSession();
  const { data } = useQuery({
    queryKey: ["overview", me?.id],
    enabled: !!me,
    queryFn: async () => {
      const [leads, students, stages, tasks] = await Promise.all([
        supabase.from("leads").select("id, status, created_at, source"),
        supabase.from("students").select("id, full_name, exam, stage_id, planned_exam_date, status"),
        supabase.from("journey_stages").select("id, name, exam, position").order("position"),
        supabase.from("tasks").select("id, title, due_date, status").eq("status", "open").order("due_date").limit(50),
      ]);
      return { leads: leads.data ?? [], students: students.data ?? [], stages: stages.data ?? [], tasks: tasks.data ?? [] };
    },
  });
  const leads = data?.leads ?? [];
  const students = data?.students ?? [];
  const stages = data?.stages ?? [];
  const tasks = data?.tasks ?? [];
  const since30 = Date.now() - 30 * 864e5;
  const newLeads = leads.filter((l) => new Date(l.created_at).getTime() > since30).length;
  const overdue = tasks.filter((t) => isOverdue(t.due_date)).length;
  const active = students.filter((s) => s.status === "active").length;

  const stageNames = [...new Set(stages.map((s) => s.name))];
  const stageData = stageNames.map((name) => ({
    name,
    count: students.filter((st) => stages.find((s) => s.id === st.stage_id)?.name === name).length,
  }));
  const funnel = Object.entries(LEAD_STATUS_LABEL).map(([k, label]) => ({ name: label, count: leads.filter((l) => l.status === k).length, key: k }));
  const upcoming = students
    .filter((s) => s.planned_exam_date && new Date(s.planned_exam_date).getTime() > Date.now())
    .sort((a, b) => a.planned_exam_date!.localeCompare(b.planned_exam_date!))
    .slice(0, 6);

  return (
    <div>
      <PageHeader eyebrow="Institution overview" title="Today at KRAFT" description="Every figure below is calculated live from enquiry, student and task records." />
      <div className="mb-8 grid grid-cols-2 gap-y-6 md:grid-cols-5">
        {showLeads && <Kpi label="New enquiries · 30d" value={newLeads} />}
        {showLeads && <Kpi label="Lead → enrolment" value={`${conversionRate(leads.map((l) => l.status))}%`} tone="primary" hint={`${leads.length} total enquiries`} />}
        <Kpi label="Active students" value={active} />
        <Kpi label="Open tasks" value={tasks.length} />
        <Kpi label="Overdue follow-ups" value={overdue} tone={overdue ? "warning" : undefined} />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Students by journey stage" className="lg:col-span-2" action={<Link to="/app/journey" className="text-xs text-primary">Open board →</Link>}>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={stageData}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-25} textAnchor="end" height={60} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={28} />
                <Tooltip cursor={{ fill: "var(--muted)" }} />
                <Bar dataKey="count" fill="var(--chart-2)" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Upcoming exams">
          {upcoming.length === 0 ? <Empty title="None scheduled" /> : (
            <ul className="divide-y">
              {upcoming.map((s) => (
                <li key={s.id} className="flex items-center justify-between py-2 text-sm">
                  <Link to="/app/students/$id" params={{ id: s.id }} className="hover:text-primary">{s.full_name}</Link>
                  <span className="flex items-center gap-2"><ExamTag exam={s.exam} /><span className="tabular text-xs">{fmtDate(s.planned_exam_date)}</span></span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        {showLeads && (
          <Panel title="Admissions pipeline" className="lg:col-span-3">
            <div className="h-56">
              <ResponsiveContainer>
                <BarChart data={funnel} layout="vertical" margin={{ left: 40 }}>
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={140} />
                  <Tooltip cursor={{ fill: "var(--muted)" }} />
                  <Bar dataKey="count" radius={[0, 2, 2, 0]}>
                    {funnel.map((f) => <Cell key={f.key} fill={f.key === "converted" ? "var(--chart-1)" : f.key === "lost" ? "var(--chart-4)" : "var(--chart-3)"} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        )}
      </div>
    </div>
  );
}
