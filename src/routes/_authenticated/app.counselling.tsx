import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Calendar, Clock, Video, MapPin, Phone, UserCheck, Sparkles, CheckCircle2, AlertCircle, FileText, Target, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Panel, Empty, Tag, ExamTag, Kpi } from "@/components/kraft";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fmtDate, fmtDateTime, isOverdue } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/app/counselling")({
  head: () => ({ meta: [{ title: "Counselling & Profile Evaluation — KRAFT" }] }),
  component: CounsellingPage,
});

type Session = {
  id: string;
  status?: string | null;
  lead_id?: string | null;
  scheduled_at?: string | null;
  mode?: string | null;
  outcome?: string | null;
  notes?: string | null;
  leads?: {
    id: string;
    full_name: string;
    email?: string | null;
    phone?: string | null;
    city?: string | null;
    exam: string;
    target_year?: number | null;
    target_score?: string | null;
    work_experience_months?: number | null;
  } | null;
  courses?: {
    id: string;
    name: string;
  } | null;
};

function CounsellingPage() {
  const qc = useQueryClient();
  const [scheduling, setScheduling] = useState(false);
  const [recording, setRecording] = useState<Session | null>(null);
  const [examFilter, setExamFilter] = useState<"ALL" | "CAT" | "GMAT">("ALL");

  const { data: rawData, isLoading, error } = useQuery({
    queryKey: ["counselling-sessions"],
    queryFn: async () => {
      const res = await supabase
        .from("counselling_sessions")
        .select("*, leads(full_name, email, phone, city, exam, target_year, target_score, work_experience_months), courses(name)")
        .order("scheduled_at");
      return Array.isArray(res.data) ? res.data : [];
    },
  });

  const sessions: Session[] = Array.isArray(rawData) ? rawData : [];

  const filteredSessions = sessions.filter((s) => {
    if (examFilter === "ALL") return true;
    return s.leads?.exam === examFilter;
  });

  const upcoming = filteredSessions.filter((s) => s.status === "scheduled");
  const completed = filteredSessions.filter((s) => s.status !== "scheduled").reverse();
  const completedCount = sessions.filter((s) => s.status === "completed").length;
  const inPersonCount = sessions.filter((s) => s.mode?.toLowerCase().includes("person")).length;

  const renderSessionCard = (s: Session) => {
    const isPast = s.scheduled_at ? new Date(s.scheduled_at).getTime() < Date.now() : false;
    const isDueOverdue = s.status === "scheduled" && isPast;

    return (
      <li
        key={s.id}
        className="flex flex-col gap-3 rounded-lg border border-rule/70 bg-card p-4 transition-all duration-150 hover:border-primary/50 hover:shadow-xs"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-base text-foreground">
                {s.leads?.full_name ?? "Candidate Evaluation"}
              </span>
              {s.leads?.exam && <ExamTag exam={s.leads.exam} />}
              {isDueOverdue ? (
                <Tag tone="warning">Overdue Session</Tag>
              ) : s.status === "scheduled" ? (
                <Tag tone="primary">Upcoming</Tag>
              ) : (
                <Tag tone={s.status === "completed" ? "success" : "muted"}>{s.status || "Completed"}</Tag>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground font-mono">
              <span className="flex items-center gap-1">
                <Calendar className="size-3.5" /> {fmtDateTime(s.scheduled_at)}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                {s.mode?.toLowerCase().includes("video") ? (
                  <Video className="size-3.5 text-primary" />
                ) : (
                  <MapPin className="size-3.5 text-accent" />
                )}
                {s.mode || "Campus 1-on-1"}
              </span>
              {s.leads?.city && (
                <>
                  <span>·</span>
                  <span>{s.leads.city}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {s.status === "scheduled" ? (
              <Button
                size="sm"
                variant="outline"
                className="text-xs font-mono h-8 border-primary/40 text-primary hover:bg-primary/10"
                onClick={() => setRecording(s)}
              >
                Record Evaluation Outcome
              </Button>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                className="text-xs font-mono h-8 text-muted-foreground"
                onClick={() => setRecording(s)}
              >
                Update Outcome
              </Button>
            )}
          </div>
        </div>

        {/* Aspirant Evaluation Context */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 rounded-md bg-muted/40 p-2.5 text-xs font-mono">
          <div>
            <span className="text-[10px] uppercase text-muted-foreground block">Target Exam / Year</span>
            <span className="font-semibold text-foreground">
              {s.leads?.exam || "CAT"} {s.leads?.target_year || 2026}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase text-muted-foreground block">Target Objective</span>
            <span className="font-semibold text-primary">
              {s.leads?.target_score || (s.leads?.exam === "CAT" ? "99.5 %ile Target" : "715+ Target")}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase text-muted-foreground block">Work Experience</span>
            <span className="font-medium text-foreground">
              {s.leads?.work_experience_months ? `${s.leads.work_experience_months} months` : "Fresher"}
            </span>
          </div>
        </div>

        {s.outcome && (
          <div className="rounded-md border border-rule/60 bg-background p-3 text-xs space-y-1">
            <div className="font-semibold text-foreground flex items-center gap-1.5">
              <CheckCircle2 className="size-3.5 text-success" /> Academic Evaluation Summary:
            </div>
            <p className="text-muted-foreground leading-relaxed">{s.outcome}</p>
            {s.courses?.name && (
              <div className="mt-1.5 pt-1.5 border-t border-rule/50 flex items-center gap-1 text-primary font-medium">
                <BookOpen className="size-3.5" /> Recommended Curriculum: {s.courses.name}
              </div>
            )}
          </div>
        )}
      </li>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        eyebrow="Admissions & Academic Assessment"
        title="Candidate Counselling & Profile Evaluation"
        description="Conduct 1-on-1 profile evaluations, analyze intake diagnostic baseline results, review academic background, and guide aspirants into tailored CAT or GMAT batches."
        action={
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex rounded-lg border border-rule/70 bg-muted/50 p-0.5">
              {(["ALL", "CAT", "GMAT"] as const).map((track) => (
                <button
                  key={track}
                  type="button"
                  onClick={() => setExamFilter(track)}
                  className={`rounded-md px-3 py-1 font-mono text-xs font-medium transition-all ${
                    examFilter === track
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {track}
                </button>
              ))}
            </div>

            <Button onClick={() => setScheduling(true)} className="gap-2 shadow-sm h-8 text-xs font-mono">
              <Plus className="size-3.5" /> Schedule Profile Evaluation
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi
          label="Pending Evaluations"
          value={upcoming.length}
          hint="Scheduled consultations"
          tone={upcoming.length > 0 ? "primary" : undefined}
        />
        <Kpi label="Evaluations Completed" value={completedCount} tone="success" hint="Advising finished" />
        <Kpi label="Campus / In-Person" value={inPersonCount} hint="Face-to-face sessions" />
        <Kpi label="Total Pipeline Evaluated" value={sessions.length} hint="All records in MongoDB" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel
          title={`Scheduled Evaluations (${upcoming.length})`}
          className="space-y-4"
        >
          {isLoading ? (
            <div className="py-12 text-center text-xs font-mono text-muted-foreground animate-pulse">
              Loading counselling sessions from MongoDB Atlas…
            </div>
          ) : upcoming.length > 0 ? (
            <ul className="space-y-3">{upcoming.map(renderSessionCard)}</ul>
          ) : (
            <Empty
              title="No upcoming evaluations"
              hint="Schedule a new profile review session with fresh enquiries using the button above."
            />
          )}
        </Panel>

        <Panel
          title={`Completed Consultations & Recommendations (${completed.length})`}
          className="space-y-4"
        >
          {isLoading ? (
            <div className="py-12 text-center text-xs font-mono text-muted-foreground animate-pulse">
              Loading past evaluations…
            </div>
          ) : completed.length > 0 ? (
            <ul className="space-y-3">{completed.map(renderSessionCard)}</ul>
          ) : (
            <Empty
              title="No completed sessions yet"
              hint="Recorded outcomes, curriculum recommendations, and diagnostic reviews will appear here."
            />
          )}
        </Panel>
      </div>

      <ScheduleDialog
        open={scheduling}
        onClose={() => setScheduling(false)}
        onDone={() => {
          setScheduling(false);
          qc.invalidateQueries({ queryKey: ["counselling-sessions"] });
        }}
      />

      <OutcomeDialog
        session={recording}
        onClose={() => setRecording(null)}
        onDone={() => {
          setRecording(null);
          qc.invalidateQueries({ queryKey: ["counselling-sessions"] });
        }}
      />
    </div>
  );
}

function ScheduleDialog({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: () => void }) {
  const { data: rawLeads = [] } = useQuery({
    queryKey: ["leads-open-for-counselling"],
    enabled: open,
    queryFn: async () => {
      const res = await supabase
        .from("leads")
        .select("id, full_name, exam, target_year, target_score")
        .not("status", "in", "(converted,lost)")
        .order("full_name");
      return Array.isArray(res.data) ? res.data : [];
    },
  });

  const validLeads = rawLeads.filter((l: any) => Boolean(l?.id && l?.full_name));

  const [leadId, setLeadId] = useState("");
  const [when, setWhen] = useState("");
  const [mode, setMode] = useState("Campus 1-on-1");
  const [notes, setNotes] = useState("");

  const m = useMutation({
    mutationFn: async () => {
      if (!leadId || !when) throw new Error("Please select a candidate enquiry and date/time");
      const { data: u } = await supabase.auth.getUser();
      const scheduledIso = new Date(when).toISOString();

      const { error } = await supabase.from("counselling_sessions").insert({
        lead_id: leadId,
        scheduled_at: scheduledIso,
        mode,
        notes: notes || "Diagnostic review and B-school profile evaluation",
        status: "scheduled",
        counsellor_id: u?.user?.id,
      });
      if (error) throw error;

      await supabase.from("leads").update({ status: "counselling_scheduled" }).eq("id", leadId);

      await supabase.from("journey_events").insert({
        lead_id: leadId,
        event_type: "counselling",
        title: "Profile evaluation session scheduled",
        detail: `Mode: ${mode} · Scheduled for ${fmtDateTime(scheduledIso)}`,
        actor_id: u?.user?.id,
      });
    },
    onSuccess: () => {
      toast.success("Counselling session scheduled successfully");
      onDone();
    },
    onError: (e: Error) => toast.error(e.message || "Failed to schedule session"),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-bold tracking-tight">
            Schedule Profile Evaluation
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>Candidate Enquiry</Label>
            {validLeads.length === 0 ? (
              <p className="text-xs text-muted-foreground font-mono">No open enquiries awaiting counselling.</p>
            ) : (
              <Select value={leadId} onValueChange={setLeadId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose candidate…" />
                </SelectTrigger>
                <SelectContent>
                  {validLeads.map((l: any) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.full_name} · [{l.exam || "CAT"}] Target: {l.target_score || "99 %ile"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Date & Time</Label>
            <Input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>Consultation Mode</Label>
            <Select value={mode} onValueChange={setMode}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Campus 1-on-1">Campus 1-on-1 (Classroom Centre)</SelectItem>
                <SelectItem value="Video Call">Video Call (Zoom / Google Meet)</SelectItem>
                <SelectItem value="Telephonic Consultation">Telephonic Consultation</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Session Focus / Intake Notes</Label>
            <Input
              placeholder="e.g. DILR weakness; targeting IIM Ahmedabad / ISB PGP"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => m.mutate()} disabled={m.isPending || !leadId || !when}>
            {m.isPending ? "Scheduling…" : "Confirm Appointment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function OutcomeDialog({ session, onClose, onDone }: { session: Session | null; onClose: () => void; onDone: () => void }) {
  const { data: rawCourses = [] } = useQuery({
    queryKey: ["all-courses-for-outcome"],
    queryFn: async () => {
      const res = await supabase.from("courses").select("id, name, exam");
      return Array.isArray(res.data) ? res.data : [];
    },
  });

  const validCourses = rawCourses.filter((c: any) => Boolean(c?.id && c?.name));

  const [outcome, setOutcome] = useState("");
  const [course, setCourse] = useState("");
  const [status, setStatus] = useState("completed");

  const m = useMutation({
    mutationFn: async () => {
      if (!session) return;
      const { data: u } = await supabase.auth.getUser();

      const { error } = await supabase
        .from("counselling_sessions")
        .update({
          status,
          outcome: outcome || "Profile evaluated. Candidate recommended for flagship batch intake.",
          recommended_course_id: course || null,
        })
        .eq("id", session.id);

      if (error) throw error;

      if (session.lead_id && status === "completed") {
        await supabase
          .from("leads")
          .update({
            status: "counselled",
            interested_course_id: course || null,
          })
          .eq("id", session.lead_id);

        await supabase.from("journey_events").insert({
          lead_id: session.lead_id,
          event_type: "counselling",
          title: "Profile evaluation concluded",
          detail: outcome || "Candidate evaluated and course recommendation provided.",
          actor_id: u?.user?.id,
        });
      }
    },
    onSuccess: () => {
      toast.success("Consultation outcome and course recommendation saved");
      setOutcome("");
      setCourse("");
      onDone();
    },
    onError: (e: Error) => toast.error(e.message || "Failed to save outcome"),
  });

  return (
    <Dialog open={!!session} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-bold tracking-tight">
            Record Evaluation Outcome
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>Consultation Result</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="completed">Completed (Evaluation & Roadmap Ready)</SelectItem>
                <SelectItem value="no_show">Candidate No-show (Reschedule Required)</SelectItem>
                <SelectItem value="cancelled">Session Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Recommended Curriculum / Batch Programme</Label>
            <Select value={course} onValueChange={setCourse}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select recommended programme…" />
              </SelectTrigger>
              <SelectContent>
                {validCourses.map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>
                    [{c.exam}] {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Mentor Review & Roadmap Summary</Label>
            <Textarea
              rows={3}
              placeholder="Record quantitative baseline, DILR strategy, target IIM/ISB ambition, and trial class schedule…"
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => m.mutate()} disabled={m.isPending}>
            {m.isPending ? "Saving…" : "Save Consultation Record"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
