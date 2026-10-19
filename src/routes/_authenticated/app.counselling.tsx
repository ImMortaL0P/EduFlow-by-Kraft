import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Panel, Empty, Tag, ExamTag } from "@/components/kraft";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fmtDateTime } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/app/counselling")({
  head: () => ({ meta: [{ title: "Counselling — KRAFT" }] }),
  component: CounsellingPage,
});

type Session = { id: string; status: string; lead_id: string | null };

function CounsellingPage() {
  const qc = useQueryClient();
  const [scheduling, setScheduling] = useState(false);
  const [recording, setRecording] = useState<Session | null>(null);
  const { data = [], isLoading } = useQuery({
    queryKey: ["sessions"],
    queryFn: async () => (await supabase.from("counselling_sessions").select("*, leads(full_name, exam), courses(name)").order("scheduled_at")).data ?? [],
  });
  const now = Date.now();
  const upcoming = data.filter((s) => s.status === "scheduled");
  const done = data.filter((s) => s.status !== "scheduled").reverse();
  const completedCount = data.filter((s) => s.status === "completed").length;
  const inPersonCount = data.filter((s) => s.mode?.toLowerCase().includes("person")).length;

  const Row = ({ s }: { s: (typeof data)[number] }) => (
    <li className="flex flex-wrap items-center justify-between gap-3 py-3.5 transition-colors hover:bg-muted/30 px-2 rounded-md">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 font-medium text-foreground">
          <span>{s.leads?.full_name ?? "—"}</span>
          {s.leads && <ExamTag exam={s.leads.exam} />}
        </div>
        <div className="mt-0.5 flex items-center gap-2 font-mono text-xs text-muted-foreground">
          <span>{fmtDateTime(s.scheduled_at)}</span>
          <span>·</span>
          <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-sans text-muted-foreground">{s.mode}</span>
        </div>
        {s.outcome && (
          <div className="mt-1.5 text-xs text-muted-foreground bg-muted/20 p-2 rounded border border-border/50">
            <span className="font-medium text-foreground">Outcome:</span> {s.outcome}
            {s.courses?.name && (
              <span className="ml-2 font-medium text-primary">→ Recommended: {s.courses.name}</span>
            )}
          </div>
        )}
      </div>
      {s.status === "scheduled" ? (
        <div className="flex items-center gap-2">
          {new Date(s.scheduled_at).getTime() < now && <Tag tone="warning">Overdue</Tag>}
          <Button size="sm" variant="outline" className="text-xs" onClick={() => setRecording(s)}>Record outcome</Button>
        </div>
      ) : (
        <Tag tone={s.status === "completed" ? "success" : "muted"}>{s.status}</Tag>
      )}
    </li>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admissions & Mentorship"
        title="Counselling"
        description="Schedule diagnostic & profile evaluation sessions, recommend target exams & courses, and record conversion outcomes."
        action={
          <Button onClick={() => setScheduling(true)} className="gap-2 shadow-sm">
            <Plus className="size-4" /> Schedule session
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi label="Upcoming sessions" value={upcoming.length} hint="Awaiting evaluation" />
        <Kpi label="Completed" value={completedCount} tone="primary" hint="Evaluations done" />
        <Kpi label="In-person sessions" value={inPersonCount} hint="Campus appointments" />
        <Kpi label="Total recorded" value={data.length} hint="All time sessions" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title={`Upcoming Sessions (${upcoming.length})`}>
          {isLoading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">Loading sessions…</div>
          ) : upcoming.length ? (
            <ul className="divide-y divide-border/50">{upcoming.map((s) => <Row key={s.id} s={s} />)}</ul>
          ) : (
            <Empty title="Nothing scheduled" hint="Use the button above to schedule your next candidate evaluation." />
          )}
        </Panel>

        <Panel title={`Completed & Past Sessions (${done.length})`}>
          {done.length ? (
            <ul className="divide-y divide-border/50">{done.map((s) => <Row key={s.id} s={s} />)}</ul>
          ) : (
            <Empty title="No sessions recorded yet" hint="Completed sessions with feedback will appear here." />
          )}
        </Panel>
      </div>

      <ScheduleDialog open={scheduling} onClose={() => setScheduling(false)} onDone={() => { setScheduling(false); qc.invalidateQueries({ queryKey: ["sessions"] }); }} />
      <OutcomeDialog session={recording} onClose={() => setRecording(null)} onDone={() => { setRecording(null); qc.invalidateQueries({ queryKey: ["sessions"] }); }} />
    </div>
  );
}

function ScheduleDialog({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: () => void }) {
  const { data: leads = [] } = useQuery({
    queryKey: ["leads-open"],
    enabled: open,
    queryFn: async () => (await supabase.from("leads").select("id, full_name, exam").not("status", "in", "(converted,lost)").order("full_name")).data ?? [],
  });
  const [leadId, setLeadId] = useState("");
  const [when, setWhen] = useState("");
  const [mode, setMode] = useState("In person");
  const m = useMutation({
    mutationFn: async () => {
      if (!leadId || !when) throw new Error("Choose an enquiry and time");
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase.from("counselling_sessions").insert({ lead_id: leadId, scheduled_at: new Date(when).toISOString(), mode, counsellor_id: u.user?.id });
      if (error) throw error;
      await supabase.from("leads").update({ status: "counselling_scheduled" }).eq("id", leadId);
      await supabase.from("journey_events").insert({ lead_id: leadId, event_type: "counselling", title: "Counselling scheduled", detail: `${mode} · ${fmtDateTime(new Date(when).toISOString())}`, actor_id: u.user?.id });
    },
    onSuccess: () => { toast.success("Session scheduled"); onDone(); },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle className="font-display text-2xl font-bold tracking-tight">Schedule counselling</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1"><Label>Enquiry</Label>
            <Select value={leadId} onValueChange={setLeadId}><SelectTrigger><SelectValue placeholder="Select enquiry" /></SelectTrigger><SelectContent>{leads.map((l) => <SelectItem key={l.id} value={l.id}>{l.full_name} · {l.exam}</SelectItem>)}</SelectContent></Select>
          </div>
          <div className="space-y-1"><Label>Date & time</Label><Input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} /></div>
          <div className="space-y-1"><Label>Mode</Label>
            <Select value={mode} onValueChange={setMode}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["In person", "Video call", "Phone"].map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select>
          </div>
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={() => m.mutate()} disabled={m.isPending}>Schedule</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function OutcomeDialog({ session, onClose, onDone }: { session: Session | null; onClose: () => void; onDone: () => void }) {
  const { data: courses = [] } = useQuery({ queryKey: ["all-courses"], queryFn: async () => (await supabase.from("courses").select("id, name, exam")).data ?? [] });
  const [outcome, setOutcome] = useState("");
  const [course, setCourse] = useState("");
  const [status, setStatus] = useState("completed");
  const m = useMutation({
    mutationFn: async () => {
      if (!session) return;
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase.from("counselling_sessions").update({ status, outcome: outcome || null, recommended_course_id: course || null }).eq("id", session.id);
      if (error) throw error;
      if (session.lead_id && status === "completed") {
        await supabase.from("leads").update({ status: "counselled", interested_course_id: course || null }).eq("id", session.lead_id);
        await supabase.from("journey_events").insert({ lead_id: session.lead_id, event_type: "counselling", title: "Counselling completed", detail: outcome, actor_id: u.user?.id });
      }
    },
    onSuccess: () => { toast.success("Outcome saved"); setOutcome(""); setCourse(""); onDone(); },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Dialog open={!!session} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle className="font-display text-2xl font-bold tracking-tight">Record outcome</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1"><Label>Status</Label>
            <Select value={status} onValueChange={setStatus}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="completed">Completed</SelectItem><SelectItem value="no_show">No-show</SelectItem><SelectItem value="cancelled">Cancelled</SelectItem></SelectContent></Select>
          </div>
          <div className="space-y-1"><Label>Recommended course</Label>
            <Select value={course} onValueChange={setCourse}><SelectTrigger><SelectValue placeholder="None" /></SelectTrigger><SelectContent>{courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.exam} · {c.name}</SelectItem>)}</SelectContent></Select>
          </div>
          <div className="space-y-1"><Label>Summary</Label><Textarea value={outcome} onChange={(e) => setOutcome(e.target.value)} /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={() => m.mutate()} disabled={m.isPending}>Save</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
