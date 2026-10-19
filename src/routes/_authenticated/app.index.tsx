import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Kpi, PageHeader, Panel, Empty, ExamTag, Tag } from "@/components/kraft";
import { conversionRate, fmtDate, isOverdue, LEAD_STATUS_LABEL } from "@/lib/format";
import { useMyRoles, canAccess, useSession } from "@/lib/roles";
import { TrendingUp, Users, Calendar, ArrowRight, ShieldCheck, Plus, Sparkles, BookOpen, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/app/")({
  head: () => ({ meta: [{ title: "Overview — KRAFT" }] }),
  component: Overview,
});

function Overview() {
  const { data: roles = [] } = useMyRoles();
  const showLeads = canAccess(roles, "leads");
  const { data: me } = useSession();
  const [trackFilter, setTrackFilter] = useState<"ALL" | "CAT" | "GMAT">("ALL");

  const { data, isLoading } = useQuery({
    queryKey: ["overview", me?.id],
    enabled: !!me,
    queryFn: async () => {
      const [leads, students, stages, tasks] = await Promise.all([
        supabase.from("leads").select("id, status, created_at, source, exam"),
        supabase.from("students").select("id, full_name, exam, stage_id, planned_exam_date, status, city"),
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

  const allLeads = data?.leads ?? [];
  const allStudents = data?.students ?? [];
  const stages = data?.stages ?? [];
  const tasks = data?.tasks ?? [];

  const leads = allLeads.filter((l) => trackFilter === "ALL" || l.exam === trackFilter);
  const students = allStudents.filter((s) => trackFilter === "ALL" || s.exam === trackFilter);

  const since30 = Date.now() - 30 * 864e5;
  const newLeads = leads.filter((l) => new Date(l.created_at).getTime() > since30).length;
  const overdue = tasks.filter((t) => isOverdue(t.due_date)).length;
  const active = students.filter((s) => s.status === "active").length;

  const catStudents = allStudents.filter((s) => s.exam === "CAT").length;
  const gmatStudents = allStudents.filter((s) => s.exam === "GMAT").length;

  const relevantStages = stages.filter((s) => trackFilter === "ALL" || s.exam === trackFilter);
  const stageNames = [...new Set(relevantStages.map((s) => s.name))];
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
    borderRadius: "0.375rem",
    fontFamily: "var(--font-mono)",
    fontSize: "12px",
    boxShadow: "0 6px 18px rgba(23, 23, 26, 0.08)",
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        eyebrow="Institutional Intelligence"
        title="Today at KRAFT"
        description="Unified live cockpit computed directly from MongoDB Atlas enquiry records, student journeys, and daily follow-up queues."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-lg border border-border/80 bg-muted/50 p-1">
              {(["ALL", "CAT", "GMAT"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTrackFilter(t)}
                  className={`rounded-md px-3 py-1 font-mono text-xs font-medium transition-all ${
                    trackFilter === t
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t === "ALL" ? "All Tracks" : `${t} Track`}
                </button>
              ))}
            </div>
            <div className="hidden sm:flex items-center gap-1.5 ml-2">
              <Tag tone="primary">{catStudents} CAT</Tag>
              <Tag tone="ink">{gmatStudents} GMAT</Tag>
            </div>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        {showLeads && (
          <Kpi
            label="New enquiries · 30d"
            value={newLeads}
            hint="Fresh pipeline intake"
            tone="primary"
          />
        )}
        {showLeads && (
          <Kpi
            label="Conversion rate"
            value={`${conversionRate(leads.map((l) => l.status))}%`}
            tone="warning"
            hint={`${leads.length} recorded leads`}
          />
        )}
        <Kpi label="Active students" value={active} hint={`${students.length} total enrolled`} />
        <Kpi label="Open tasks" value={tasks.length} hint="Cadence queue items" />
        <Kpi
          label="Overdue items"
          value={overdue}
          tone={overdue > 0 ? "warning" : "success"}
          hint={overdue > 0 ? "Action required" : "All queues current"}
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
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={true}
                  animationDuration={800}
                  animationEasing="ease-out"
                >
                  {stageData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.count > 3 ? "var(--color-primary)" : "var(--color-ink)"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        {/* Upcoming Exam Deadlines */}
        <Panel title="Approaching Target Exams">
          {upcoming.length === 0 ? (
            <Empty title="None scheduled" hint="All upcoming attempts are current" />
          ) : (
            <ul className="divide-y divide-border/50 text-sm">
              {upcoming.map((s) => {
                const days = Math.ceil((new Date(s.planned_exam_date!).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                const initials = s.full_name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();

                return (
                  <li key={s.id} className="flex items-center justify-between py-3 group hover:bg-muted/20 px-1 rounded-md transition-colors">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-mono text-[11px] font-semibold">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <Link
                          to="/app/students/$id"
                          params={{ id: s.id }}
                          className="font-medium text-xs text-foreground group-hover:text-primary transition-colors truncate block"
                        >
                          {s.full_name}
                        </Link>
                        <div className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                          <span>{s.city || "New Delhi"}</span>
                          <span>·</span>
                          <span className={days <= 30 ? "text-primary font-semibold" : ""}>{days}d remaining</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <ExamTag exam={s.exam} />
                      <span className="tabular font-mono text-xs text-muted-foreground">
                        {fmtDate(s.planned_exam_date)}
                      </span>
                    </div>
                  </li>
                );
              })}
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
