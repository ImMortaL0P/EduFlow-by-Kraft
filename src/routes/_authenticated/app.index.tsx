import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Kpi, PageHeader, Panel, Empty, ExamTag, Tag } from "@/components/kraft";
import { conversionRate, fmtDate, isOverdue, LEAD_STATUS_LABEL } from "@/lib/format";
import { useMyRoles, canAccess, useSession } from "@/lib/roles";
import { TrendingUp, Users, Calendar, ArrowRight, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/")({
  head: () => ({ meta: [{ title: "Overview — KRAFT" }] }),
  component: Overview,
});

function Overview() {
  const { data: roles = [] } = useMyRoles();
  const showLeads = canAccess(roles, "leads");
  const { data: me } = useSession();
  const { data, isLoading } = useQuery({
    queryKey: ["overview", me?.id],
    enabled: !!me,
    queryFn: async () => {
      const [leads, students, stages, tasks] = await Promise.all([
        supabase.from("leads").select("id, status, created_at, source, exam"),
        supabase.from("students").select("id, full_name, exam, stage_id, planned_exam_date, status"),
        supabase.from("journey_stages").select("id, name, exam, position").order("position"),
        supabase.from("tasks").select("id, title, due_date, status").eq("status", "open").order("due_date").limit(50),
      ]);
      return {
        leads: leads.data ?? [],
        students: students.data ?? [],
        stages: stages.data ?? [],
        tasks: tasks.data ?? [],
      };
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

  const catStudents = students.filter((s) => s.exam === "CAT").length;
  const gmatStudents = students.filter((s) => s.exam === "GMAT").length;

  const stageNames = [...new Set(stages.map((s) => s.name))];
  const stageData = stageNames.map((name) => ({
    name,
    count: students.filter((st) => stages.find((s) => s.id === st.stage_id)?.name === name).length,
  }));

  const funnel = Object.entries(LEAD_STATUS_LABEL).map(([k, label]) => ({
    name: label,
    count: leads.filter((l) => l.status === k).length,
    key: k,
  }));

  const upcoming = students
    .filter((s) => s.planned_exam_date && new Date(s.planned_exam_date).getTime() > Date.now())
    .sort((a, b) => a.planned_exam_date!.localeCompare(b.planned_exam_date!))
    .slice(0, 6);

  const customTooltipStyle = {
    backgroundColor: "var(--color-card)",
    borderColor: "var(--color-rule)",
    borderRadius: "0.25rem",
    fontFamily: "var(--font-mono)",
    fontSize: "12px",
    boxShadow: "0 4px 12px rgba(23, 23, 26, 0.08)",
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      <PageHeader
        eyebrow="Institutional Intelligence"
        title="Today at KRAFT"
        description="Unified live cockpit computed directly from MongoDB Atlas enquiry records, student journeys, and daily follow-up queues."
        action={
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-muted-foreground">Active Cohort:</span>
            <Tag tone="primary">{catStudents} CAT</Tag>
            <Tag tone="ink">{gmatStudents} GMAT</Tag>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-y-6 md:grid-cols-5 gap-x-4">
        {showLeads && (
          <Kpi
            label="New enquiries · 30d"
            value={newLeads}
            hint="Fresh lead inflow"
            tone="primary"
          />
        )}
        {showLeads && (
          <Kpi
            label="Lead → enrolment"
            value={`${conversionRate(leads.map((l) => l.status))}%`}
            tone="warning"
            hint={`${leads.length} total enquiries logged`}
          />
        )}
        <Kpi label="Active students" value={active} hint={`${students.length} total roster`} />
        <Kpi label="Open tasks" value={tasks.length} hint="Assigned action items" />
        <Kpi
          label="Overdue follow-ups"
          value={overdue}
          tone={overdue > 0 ? "warning" : "success"}
          hint={overdue > 0 ? "Requires counsellor action" : "All queues current"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Stage Distribution Chart */}
        <Panel
          title="Students by Preparation Stage"
          className="lg:col-span-2"
          action={
            <Link
              to="/app/journey"
              className="inline-flex items-center gap-1 font-mono text-xs text-primary transition-transform hover:translate-x-0.5"
            >
              Open Kanban Board <ArrowRight className="size-3" />
            </Link>
          }
        >
          <div className="h-72 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stageData}>
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10, fill: "var(--color-muted-foreground)", fontFamily: "var(--font-mono)" }}
                  interval={0}
                  angle={-25}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "var(--color-muted-foreground)", fontFamily: "var(--font-mono)" }}
                  width={28}
                />
                <Tooltip
                  cursor={{ fill: "var(--color-muted)", opacity: 0.4 }}
                  contentStyle={customTooltipStyle}
                />
                <Bar
                  dataKey="count"
                  fill="var(--color-ink)"
                  radius={[3, 3, 0, 0]}
                  isAnimationActive={true}
                  animationDuration={900}
                  animationEasing="ease-out"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        {/* Upcoming Exam Deadlines */}
        <Panel title="Approaching Target Exams">
          {upcoming.length === 0 ? (
            <Empty title="None scheduled" hint="All upcoming attempts are current" />
          ) : (
            <ul className="divide-y text-sm">
              {upcoming.map((s) => (
                <li key={s.id} className="flex items-center justify-between py-3">
                  <div>
                    <Link
                      to="/app/students/$id"
                      params={{ id: s.id }}
                      className="font-medium hover:text-primary transition-colors"
                    >
                      {s.full_name}
                    </Link>
                    <div className="text-[11px] font-mono text-muted-foreground">
                      Planned Attempt
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <ExamTag exam={s.exam} />
                    <span className="tabular font-mono text-xs text-muted-foreground">
                      {fmtDate(s.planned_exam_date)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {/* Funnel Chart */}
        {showLeads && (
          <Panel title="Admissions Pipeline Funnel" className="lg:col-span-3">
            <div className="h-64 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnel} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <XAxis
                    type="number"
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: "var(--color-muted-foreground)", fontFamily: "var(--font-mono)" }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "var(--color-foreground)", fontFamily: "var(--font-sans)" }}
                    width={150}
                  />
                  <Tooltip
                    cursor={{ fill: "var(--color-muted)", opacity: 0.4 }}
                    contentStyle={customTooltipStyle}
                  />
                  <Bar
                    dataKey="count"
                    radius={[0, 3, 3, 0]}
                    isAnimationActive={true}
                    animationDuration={1000}
                    animationEasing="ease-out"
                  >
                    {funnel.map((f) => (
                      <Cell
                        key={f.key}
                        fill={
                          f.key === "converted"
                            ? "var(--color-primary)"
                            : f.key === "lost"
                            ? "var(--color-rule)"
                            : "var(--color-ink)"
                        }
                      />
                    ))}
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
