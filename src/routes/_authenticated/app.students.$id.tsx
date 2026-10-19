import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Panel, Empty, ExamTag, Tag, Kpi } from "@/components/kraft";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { fmtDate, fmtDateTime, fromNow, inr } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/app/students/$id")({
  head: () => ({ meta: [{ title: "Student profile — KRAFT" }] }),
  component: StudentProfile,
});

const LATER_TABS = ["Academics", "Tests", "Attendance", "Study Plan", "Mentoring", "Fees", "Examinations", "Applications"];

function StudentProfile() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const [note, setNote] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["student", id],
    queryFn: async () => {
      const [s, ev, stages, tasks] = await Promise.all([
        supabase.from("students").select("*, journey_stages(name, position), enrolments(*, courses(name), batches(name))").eq("id", id).maybeSingle(),
        supabase.from("journey_events").select("*").eq("student_id", id).order("created_at", { ascending: false }),
        supabase.from("journey_stages").select("*").order("position"),
        supabase.from("tasks").select("*").eq("student_id", id).eq("status", "open").order("due_date"),
      ]);
      return { s: s.data, events: ev.data ?? [], stages: stages.data ?? [], tasks: tasks.data ?? [] };
    },
  });
  if (isLoading) return <div className="py-24 text-center text-sm text-muted-foreground">Loading…</div>;
  const s = data?.s;
  if (!s) return <Empty title="Student not found" hint="It may not exist or you may not have access." />;
  const stages = data!.stages.filter((x) => x.exam === s.exam);
  const stageName = (sid?: string | null) => stages.find((x) => x.id === sid)?.name;
  const enr = s.enrolments?.[0];

  async function move(stageId: string) {
    const { error } = await supabase.rpc("move_student_stage", { _student_id: id, _stage_id: stageId });
    if (error) return toast.error(error.message);
    toast.success("Stage updated");
    qc.invalidateQueries({ queryKey: ["student", id] });
  }
  async function addNote() {
    if (!note.trim()) return;
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("journey_events").insert({ student_id: id, event_type: "note", title: "Staff note", detail: note, actor_id: u.user?.id });
    if (error) return toast.error(error.message);
    setNote("");
    qc.invalidateQueries({ queryKey: ["student", id] });
  }

  return (
    <div>
      <Link to="/app/students" className="eyebrow hover:text-primary">← Students</Link>
      <PageHeader
        title={s.full_name}
        description={[s.email, s.phone, s.city].filter(Boolean).join(" · ")}
        action={<div className="flex items-center gap-2"><ExamTag exam={s.exam} />{s.is_demo && <Tag tone="muted">Demo record</Tag>}</div>}
      />
      <div className="mb-6 flex gap-1 overflow-x-auto">
        {stages.map((st) => {
          const pos = s.journey_stages?.position ?? 0;
          return <div key={st.id} className={`min-w-24 flex-1 border-t-2 pt-2 text-xs ${st.position <= pos ? "border-primary text-foreground" : "border-rule text-muted-foreground"}`}>{st.name}</div>;
        })}
      </div>
      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="journey">Journey</TabsTrigger>
          {LATER_TABS.map((t) => <TabsTrigger key={t} value={t}>{t}</TabsTrigger>)}
        </TabsList>
        <TabsContent value="overview" className="mt-6 grid gap-6 lg:grid-cols-3">
          <Panel title="Preparation summary" className="lg:col-span-2">
            <div className="grid grid-cols-2 gap-y-4 md:grid-cols-4">
              <Kpi label="Stage" value={<span className="text-xl">{s.journey_stages?.name ?? "—"}</span>} />
              <Kpi label="Target" value={<span className="text-xl">{s.target_score ?? "—"}</span>} />
              <Kpi label="Exam date" value={<span className="text-xl">{fmtDate(s.planned_exam_date)}</span>} />
              <Kpi label="Fee agreed" value={<span className="text-xl">{inr(enr?.fee_agreed ? Number(enr.fee_agreed) : null)}</span>} />
            </div>
            <div className="mt-6 text-sm"><span className="eyebrow">Course</span><div>{enr?.courses?.name ?? "—"} {enr?.batches?.name && <span className="text-muted-foreground">· {enr.batches.name}</span>}</div></div>
          </Panel>
          <Panel title="Move stage">
            <Select value={s.stage_id ?? ""} onValueChange={move}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{stages.map((st) => <SelectItem key={st.id} value={st.id}>{st.position}. {st.name}</SelectItem>)}</SelectContent>
            </Select>
            <div className="eyebrow mt-6 mb-2">Open tasks</div>
            {data!.tasks.length === 0 ? <p className="text-sm text-muted-foreground">Nothing pending.</p> : data!.tasks.map((t) => <div key={t.id} className="text-sm">{t.title} <span className="tabular text-xs text-muted-foreground">{fmtDate(t.due_date)}</span></div>)}
          </Panel>
        </TabsContent>
        <TabsContent value="journey" className="mt-6">
          <Panel title="Unified timeline">
            <div className="mb-6">
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a staff note to the timeline" />
              <Button size="sm" variant="outline" className="mt-2" onClick={addNote}>Add note</Button>
            </div>
            {data!.events.length === 0 ? <Empty title="No events yet" /> : (
              <ol className="space-y-4 border-l border-rule pl-5">
                {data!.events.map((e) => (
                  <li key={e.id} className="relative">
                    <span className="absolute -left-[25px] top-1.5 size-2 rounded-full bg-primary" />
                    <div className="text-sm font-medium">{e.title}</div>
                    {e.from_stage_id && <div className="text-xs text-muted-foreground">{stageName(e.from_stage_id)} → {stageName(e.to_stage_id)}</div>}
                    {e.detail && <div className="text-sm text-muted-foreground">{e.detail}</div>}
                    <div className="tabular text-xs text-muted-foreground" title={fmtDateTime(e.created_at)}>{fromNow(e.created_at)}</div>
                  </li>
                ))}
              </ol>
            )}
          </Panel>
        </TabsContent>
        {LATER_TABS.map((t) => (
          <TabsContent key={t} value={t} className="mt-6"><Panel><Empty title={`${t} — coming next`} hint="This module is scheduled for an upcoming build phase." /></Panel></TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
