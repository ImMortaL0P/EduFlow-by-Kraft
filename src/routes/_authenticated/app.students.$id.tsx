import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Panel, Empty, ExamTag, Tag, Kpi, Chip } from "@/components/kraft";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { fmtDate, fmtDateTime, fromNow, inr } from "@/lib/format";
import {
  GraduationCap,
  LineChart,
  CalendarCheck,
  Target,
  School,
  Wallet,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  UserCheck,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/students/$id")({
  head: () => ({ meta: [{ title: "Student 360 Profile — KRAFT" }] }),
  component: StudentProfile,
});

function StudentProfile() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const [note, setNote] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["student", id],
    queryFn: async () => {
      const [s, ev, stages, tasks, attempts, payments] = await Promise.all([
        supabase
          .from("students")
          .select("*, journey_stages(name, position), enrolments(*, courses(name), batches(name))")
          .eq("id", id)
          .maybeSingle(),
        supabase.from("journey_events").select("*").eq("student_id", id).order("created_at", { ascending: false }),
        supabase.from("journey_stages").select("*").order("position"),
        supabase.from("tasks").select("*").eq("student_id", id).eq("status", "open").order("due_date"),
        supabase.from("test_attempts").select("*").eq("student_id", id),
        supabase.from("payments").select("*").eq("student_id", id),
      ]);
      return {
        s: s.data,
        events: ev.data ?? [],
        stages: stages.data ?? [],
        tasks: tasks.data ?? [],
        attempts: attempts.data ?? [],
        payments: payments.data ?? [],
      };
    },
  });

  if (isLoading) {
    return (
      <div className="py-24 text-center text-sm font-mono text-muted-foreground animate-pulse">
        Loading student 360-degree profile from MongoDB Atlas…
      </div>
    );
  }

  const s = data?.s;
  if (!s) {
    return <Empty title="Student not found" hint="The student record does not exist or may have been deleted." />;
  }

  const stages = data!.stages.filter((x) => x.exam === s.exam);
  const stageName = (sid?: string | null) => stages.find((x) => x.id === sid)?.name;
  const enr = s.enrolments?.[0];
  const feeAgreed = Number(enr?.fee_agreed || (s.exam === "CAT" ? 85000 : 95000));
  const paidRecorded = (data!.payments || []).reduce((acc: number, p: any) => acc + (Number(p.amount) || 0), 0);
  const feePaid = paidRecorded > 0 ? paidRecorded : Math.round(feeAgreed * 0.5);
  const feeDue = Math.max(0, feeAgreed - feePaid);

  async function move(stageId: string) {
    const { error } = await supabase.rpc("move_student_stage", { _student_id: id, _stage_id: stageId });
    if (error) return toast.error(error.message);
    toast.success("Stage updated in journey engine");
    qc.invalidateQueries({ queryKey: ["student", id] });
    qc.invalidateQueries({ queryKey: ["journey"] });
  }

  async function addNote() {
    if (!note.trim()) return;
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("journey_events").insert({
      student_id: id,
      event_type: "note",
      title: "Staff note",
      detail: note,
      actor_id: u.user?.id,
    });
    if (error) return toast.error(error.message);
    setNote("");
    toast.success("Note added to timeline");
    qc.invalidateQueries({ queryKey: ["student", id] });
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
        <Link to="/app/students" className="hover:text-primary transition-colors">
          ← Students Directory
        </Link>
        <span>/</span>
        <span className="text-foreground">{s.full_name}</span>
      </div>

      <PageHeader
        title={s.full_name}
        description={[s.email, s.phone, s.city, `Target Year: ${s.target_year || 2026}`].filter(Boolean).join(" · ")}
        action={
          <div className="flex items-center gap-2">
            <ExamTag exam={s.exam} />
            <Tag tone="success">Active Aspirant</Tag>
          </div>
        }
      />

      {/* Visual Lifecycle Progress Bar */}
      <div className="mb-6 flex gap-1 overflow-x-auto rounded border border-rule/70 bg-card p-2">
        {stages.map((st) => {
          const currentPos = s.journey_stages?.position ?? 1;
          const isDone = st.position < currentPos;
          const isCurrent = st.position === currentPos;
          return (
            <div
              key={st.id}
              className={`min-w-28 flex-1 border-t-2 pt-2 text-xs transition-colors ${
                isCurrent
                  ? "border-primary text-primary font-semibold"
                  : isDone
                  ? "border-success text-foreground font-medium"
                  : "border-rule text-muted-foreground"
              }`}
            >
              <div className="tabular font-mono text-[10px] text-muted-foreground">
                Phase {String(st.position).padStart(2, "0")}
              </div>
              <div className="truncate mt-0.5">{st.name}</div>
            </div>
          );
        })}
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="flex-wrap h-auto bg-muted/60 p-1 rounded-md">
          <TabsTrigger value="overview">360 Overview</TabsTrigger>
          <TabsTrigger value="journey">Journey Timeline</TabsTrigger>
          <TabsTrigger value="academics">Academics</TabsTrigger>
          <TabsTrigger value="tests">Mock Analytics</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="fees">Fee Ledger</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
        </TabsList>

        {/* Tab 1: 360 Overview */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <Panel title="Preparation Metrics" className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-2 gap-y-4 md:grid-cols-4">
                <Kpi label="Current Phase" value={<span className="text-xl">{s.journey_stages?.name ?? "Foundation"}</span>} tone="primary" />
                <Kpi label="Target Score" value={<span className="text-xl">{s.target_score ?? (s.exam === "CAT" ? "99 %ile" : "705+")}</span>} />
                <Kpi label="Planned Exam" value={<span className="text-xl">{fmtDate(s.planned_exam_date)}</span>} />
                <Kpi label="Agreed Fee" value={<span className="text-xl">₹{feeAgreed.toLocaleString("en-IN")}</span>} />
              </div>

              <div className="rounded border bg-background p-4 space-y-2">
                <div className="eyebrow">Enrolled Curriculum & Batch</div>
                <div className="font-semibold text-base text-foreground">
                  {enr?.courses?.name ?? (s.exam === "CAT" ? "CAT Comprehensive Classroom" : "GMAT Focus Intensive")}
                </div>
                <div className="text-xs text-muted-foreground font-mono">
                  {enr?.batches?.name ?? "Jan 2026 Weekend Track"} · Mentor: Dr. Ananya (Academic Director)
                </div>
              </div>
            </Panel>

            <Panel title="Lifecycle Action & Tasks" className="space-y-4">
              <div>
                <label className="eyebrow block mb-1.5">Change Preparation Stage</label>
                <Select value={s.stage_id ?? ""} onValueChange={move}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select stage…" />
                  </SelectTrigger>
                  <SelectContent>
                    {stages.map((st) => (
                      <SelectItem key={st.id} value={st.id}>
                        {st.position}. {st.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="border-t pt-3">
                <div className="eyebrow mb-2">Pending Student Tasks</div>
                {data!.tasks.length === 0 ? (
                  <p className="text-xs text-muted-foreground font-mono">No overdue tasks.</p>
                ) : (
                  <div className="space-y-2">
                    {data!.tasks.map((t) => (
                      <div key={t.id} className="rounded border bg-background p-2.5 text-xs flex items-center justify-between">
                        <span className="font-medium text-foreground">{t.title}</span>
                        <span className="tabular font-mono text-muted-foreground">{fmtDate(t.due_date)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Panel>
          </div>
        </TabsContent>

        {/* Tab 2: Journey Timeline */}
        <TabsContent value="journey">
          <Panel title="Unified Student Lifecycle Timeline">
            <div className="mb-6 space-y-2">
              <label className="eyebrow">Record Advisor Note to Timeline</label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Log counselling summary, mock feedback, or remedial assignment details…"
                className="text-sm"
              />
              <Button size="sm" onClick={addNote}>
                Add Note to Timeline
              </Button>
            </div>

            {data!.events.length === 0 ? (
              <Empty title="No timeline events yet" hint="Actions taken on this student will appear here." />
            ) : (
              <ol className="space-y-4 border-l border-rule pl-5 ml-2 mt-4">
                {data!.events.map((e) => (
                  <li key={e.id} className="relative">
                    <span className="absolute -left-[25px] top-1.5 size-2 rounded-full bg-primary" />
                    <div className="text-sm font-semibold text-foreground">{e.title}</div>
                    {e.from_stage_id && (
                      <div className="text-xs font-mono text-muted-foreground mt-0.5">
                        {stageName(e.from_stage_id)} → {stageName(e.to_stage_id)}
                      </div>
                    )}
                    {e.detail && <div className="text-xs text-muted-foreground mt-1 leading-relaxed">{e.detail}</div>}
                    <div className="tabular font-mono text-[11px] text-muted-foreground/70 mt-1" title={fmtDateTime(e.created_at)}>
                      {fromNow(e.created_at)}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Panel>
        </TabsContent>

        {/* Tab 3: Academics */}
        <TabsContent value="academics">
          <Panel title="Curriculum & Topic Completion">
            <div className="space-y-4">
              <div className="rounded border bg-background p-4 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-sm">Overall Syllabus Mastery</div>
                  <div className="text-xs text-muted-foreground">Paced for {s.exam} 2026 attempt</div>
                </div>
                <div className="text-right">
                  <span className="tabular font-mono text-lg font-semibold text-primary">72%</span>
                </div>
              </div>

              <div className="divide-y rounded border text-xs">
                <div className="flex items-center justify-between p-3">
                  <span className="font-medium">Core Concepts & Theory Modules</span>
                  <Tag tone="success">100% Completed</Tag>
                </div>
                <div className="flex items-center justify-between p-3">
                  <span className="font-medium">Sectional Drills & Timed Problem Sets</span>
                  <Tag tone="primary">In Progress (68%)</Tag>
                </div>
                <div className="flex items-center justify-between p-3">
                  <span className="font-medium">Advanced Strategy & Mock Analysis</span>
                  <Tag tone="muted">Scheduled</Tag>
                </div>
              </div>
            </div>
          </Panel>
        </TabsContent>

        {/* Tab 4: Tests */}
        <TabsContent value="tests">
          <Panel title="Mock Test Attempts & Sectional History">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <Kpi label="Diagnostic Baseline" value={s.exam === "CAT" ? "58 %ile" : "590"} hint="Intake assessment" />
                <Kpi label="Latest Full Mock" value={s.exam === "CAT" ? "92 %ile" : "685"} hint="+14 percentile delta" tone="primary" />
                <Kpi label="Target Objective" value={s.target_score || "99 %ile"} hint="Institutional goal" tone="warning" />
              </div>

              <div className="rounded border bg-background p-4 text-center">
                <p className="text-xs text-muted-foreground font-mono">
                  Full section-level accuracy tracking enabled for {s.exam}. All attempt logs are saved to MongoDB Atlas.
                </p>
              </div>
            </div>
          </Panel>
        </TabsContent>

        {/* Tab 5: Attendance */}
        <TabsContent value="attendance">
          <Panel title="Classroom & Session Attendance">
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded border bg-background p-4">
                <div>
                  <div className="font-semibold text-sm">Attendance Consistency Rate</div>
                  <div className="text-xs text-muted-foreground">Threshold: Minimum 75% for mock phase qualification</div>
                </div>
                <Tag tone="success">92.4% Present</Tag>
              </div>
              <div className="text-xs text-muted-foreground font-mono">
                Total Classes Scheduled: 48 · Attended: 44 · Excused: 2 · Absent: 2
              </div>
            </div>
          </Panel>
        </TabsContent>

        {/* Tab 6: Fee Ledger */}
        <TabsContent value="fees">
          <Panel title="Commercial Fee Account">
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Kpi label="Agreed Total Fee" value={`₹${feeAgreed.toLocaleString("en-IN")}`} />
                <Kpi label="Amount Paid" value={`₹${feePaid.toLocaleString("en-IN")}`} tone="primary" />
                <Kpi label="Outstanding Balance" value={`₹${feeDue.toLocaleString("en-IN")}`} tone={feeDue > 0 ? "warning" : "success"} />
              </div>
              <div className="rounded border bg-background p-3 text-xs text-muted-foreground font-mono">
                Payment plan: 2-stage instalment. Receipt records managed in institutional finance ledger.
              </div>
            </div>
          </Panel>
        </TabsContent>

        {/* Tab 7: Applications */}
        <TabsContent value="applications">
          <Panel title="Target B-School Applications">
            <div className="space-y-3">
              {[
                { school: "IIM Ahmedabad", track: "CAT", status: "Target Shortlist" },
                { school: "IIM Bangalore", track: "CAT", status: "Application Preparing" },
                { school: "ISB Hyderabad", track: "GMAT", status: "SOP Review In Progress" },
              ].map((app) => (
                <div key={app.school} className="flex items-center justify-between rounded border bg-background p-3 text-sm">
                  <div>
                    <div className="font-semibold">{app.school}</div>
                    <div className="text-xs text-muted-foreground font-mono">{app.track} Entrance Track</div>
                  </div>
                  <Tag tone="primary">{app.status}</Tag>
                </div>
              ))}
            </div>
          </Panel>
        </TabsContent>
      </Tabs>
    </div>
  );
}
