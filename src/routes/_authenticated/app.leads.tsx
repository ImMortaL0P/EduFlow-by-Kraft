import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { PageHeader, Panel, Empty, ExamTag, Tag, Kpi } from "@/components/kraft";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { conversionRate, fmtDate, fromNow, isOverdue, LEAD_SOURCES, LEAD_STATUS_LABEL, LEAD_STATUSES, inr } from "@/lib/format";
import { useStaffDirectory } from "@/lib/roles";

type Lead = Database["public"]["Tables"]["leads"]["Row"];
type LeadStatus = Database["public"]["Enums"]["lead_status"];

export const Route = createFileRoute("/_authenticated/app/leads")({
  validateSearch: (s: Record<string, unknown>): { new?: boolean } => ({ new: s["new"] === true || s["new"] === "true" ? true : undefined }),
  head: () => ({ meta: [{ title: "Enquiries & Leads — KRAFT" }] }),
  component: LeadsPage,
});

function statusTone(s: string) {
  return s === "converted" ? "success" : s === "lost" ? "muted" : s === "negotiation" ? "warning" : s === "new" ? "primary" : "default";
}

function LeadsPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [exam, setExam] = useState("all");
  const [selected, setSelected] = useState<Lead | null>(null);
  const creating = !!search.new;
  const { data: staff = [] } = useStaffDirectory();
  const counsellors = staff.filter((s) => s.roles.some((r) => ["counsellor", "director", "super_admin"].includes(r)));

  const { data: leads = [], isLoading, error } = useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const { data, error } = await supabase.from("leads").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = useMemo(
    () =>
      leads.filter(
        (l) =>
          (status === "all" || l.status === status) &&
          (exam === "all" || l.exam === exam) &&
          (!q || `${l.full_name} ${l.email} ${l.phone} ${l.city}`.toLowerCase().includes(q.toLowerCase())),
      ),
    [leads, q, status, exam],
  );
  const nameOf = (id?: string | null) => staff.find((s) => s.id === id)?.full_name ?? "Unassigned";

  const openCount = leads.filter((l) => !["converted", "lost"].includes(l.status)).length;
  const overdueCount = leads.filter((l) => !["converted", "lost"].includes(l.status) && isOverdue(l.next_follow_up)).length;
  const convertedCount = leads.filter((l) => l.status === "converted").length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admissions CRM"
        title="Enquiries & Leads"
        description="Capture enquiries, assign counsellors, track lead velocity and seamlessly convert into enrolled cohorts."
        action={
          <Button onClick={() => navigate({ to: "/app/leads", search: { new: true } })} className="gap-2 shadow-sm">
            <Plus className="size-4" /> New enquiry
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi label="Active pipeline" value={openCount} hint="In follow-up or counselling" />
        <Kpi label="Conversion" value={`${conversionRate(leads.map((l) => l.status))}%`} tone="primary" hint={`${convertedCount} enrolled`} />
        <Kpi label="Follow-ups overdue" value={overdueCount} tone={overdueCount > 0 ? "warning" : "default"} hint="Action needed today" />
        <Kpi label="Total archived" value={leads.filter((l) => l.status === "lost").length} hint="Lost or disqualified" />
      </div>

      <Panel>
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <Input
            placeholder="Search candidate name, email, phone, city…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="h-9 max-w-sm"
          />
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-9 w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {LEAD_STATUSES.map((s) => <SelectItem key={s} value={s}>{LEAD_STATUS_LABEL[s]}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1">
            {(["all", "CAT", "GMAT"] as const).map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => setExam(ex)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                  exam === ex
                    ? "bg-ink text-background shadow-sm"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {ex === "all" ? "All Exams" : ex}
              </button>
            ))}
          </div>
          <span className="ml-auto font-mono text-xs text-muted-foreground tabular">
            {filtered.length} of {leads.length} records
          </span>
        </div>

        {error ? (
          <Empty title="Couldn't load enquiries" hint={(error as Error).message} />
        ) : isLoading ? (
          <div className="py-16 text-center">
            <div className="inline-block size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="mt-3 text-sm text-muted-foreground">Loading pipeline records…</p>
          </div>
        ) : filtered.length === 0 ? (
          <Empty title="No enquiries match" hint="Try adjusting filters or record a new lead above." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 text-left">
                  {["Candidate", "Exam", "Status", "Source", "Counsellor", "Next Follow-up", "Age"].map((h) => (
                    <th key={h} className="eyebrow pb-3 pr-4 font-normal text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filtered.map((l) => (
                  <tr
                    key={l.id}
                    className="group cursor-pointer transition-colors hover:bg-muted/50"
                    onClick={() => setSelected(l)}
                  >
                    <td className="py-3 pr-4">
                      <div className="font-medium text-foreground transition-colors group-hover:text-primary">
                        {l.full_name}
                      </div>
                      <div className="font-mono text-xs text-muted-foreground">
                        {l.city ? `${l.city} · ` : ""}{l.phone || l.email || "No contact info"}
                      </div>
                    </td>
                    <td className="pr-4"><ExamTag exam={l.exam} /></td>
                    <td className="pr-4"><Tag tone={statusTone(l.status)}>{LEAD_STATUS_LABEL[l.status]}</Tag></td>
                    <td className="pr-4 text-xs text-muted-foreground">{l.source}</td>
                    <td className="pr-4 text-xs font-medium">{nameOf(l.assigned_to)}</td>
                    <td className={`font-mono text-xs tabular pr-4 ${!["converted", "lost"].includes(l.status) && isOverdue(l.next_follow_up) ? "font-semibold text-destructive" : "text-muted-foreground"}`}>
                      {fmtDate(l.next_follow_up)}
                    </td>
                    <td className="font-mono text-xs text-muted-foreground">{fromNow(l.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <LeadForm
        open={creating}
        counsellors={counsellors}
        onClose={() => navigate({ to: "/app/leads", search: { new: undefined } })}
        onSaved={() => { qc.invalidateQueries({ queryKey: ["leads"] }); navigate({ to: "/app/leads", search: { new: undefined } }); }}
      />
      <LeadSheet lead={selected} counsellors={counsellors} onClose={() => setSelected(null)} onChanged={(l) => { setSelected(l); qc.invalidateQueries({ queryKey: ["leads"] }); }} />
    </div>
  );
}

type Staff = { id: string; full_name: string | null };

function LeadForm({ open, onClose, onSaved, counsellors }: { open: boolean; onClose: () => void; onSaved: () => void; counsellors: Staff[] }) {
  const [f, setF] = useState({ full_name: "", email: "", phone: "", city: "", exam: "CAT", source: "Website", target_score: "", target_year: "2026", assigned_to: "", notes: "" });
  const save = useMutation({
    mutationFn: async () => {
      if (!f.full_name.trim()) throw new Error("Name is required");
      if (!f.email && !f.phone) throw new Error("Provide an email or phone");
      if (f.email) {
        const { data: dup } = await supabase.from("leads").select("id").eq("email", f.email).limit(1);
        if (dup?.length) throw new Error("An enquiry with this email already exists");
      }
      const { data: u } = await supabase.auth.getUser();
      const { data, error } = await supabase.from("leads").insert({
        full_name: f.full_name.trim(), email: f.email || null, phone: f.phone || null, city: f.city || null,
        exam: f.exam as "CAT" | "GMAT", source: f.source, target_score: f.target_score || null,
        target_year: Number(f.target_year) || null, assigned_to: f.assigned_to || null, notes: f.notes || null,
        next_follow_up: new Date(Date.now() + 864e5).toISOString().slice(0, 10),
      }).select().single();
      if (error) throw error;
      await supabase.from("tasks").insert({ title: `First call: ${data.full_name}`, lead_id: data.id, assigned_to: f.assigned_to || u.user?.id, created_by: u.user?.id, due_date: data.next_follow_up! });
    },
    onSuccess: () => { toast.success("Enquiry created"); setF({ ...f, full_name: "", email: "", phone: "", notes: "" }); onSaved(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF({ ...f, [k]: e.target.value });
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle className="font-display text-2xl font-bold tracking-tight">New enquiry</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 space-y-1"><Label>Full name *</Label><Input value={f.full_name} onChange={set("full_name")} /></div>
          <div className="space-y-1"><Label>Email</Label><Input type="email" value={f.email} onChange={set("email")} /></div>
          <div className="space-y-1"><Label>Phone</Label><Input value={f.phone} onChange={set("phone")} /></div>
          <div className="space-y-1"><Label>City</Label><Input value={f.city} onChange={set("city")} /></div>
          <div className="space-y-1"><Label>Exam</Label>
            <Select value={f.exam} onValueChange={(v) => setF({ ...f, exam: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="CAT">CAT</SelectItem><SelectItem value="GMAT">GMAT</SelectItem></SelectContent></Select>
          </div>
          <div className="space-y-1"><Label>Source</Label>
            <Select value={f.source} onValueChange={(v) => setF({ ...f, source: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{LEAD_SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
          </div>
          <div className="space-y-1"><Label>Target score</Label><Input value={f.target_score} onChange={set("target_score")} placeholder={f.exam === "CAT" ? "99 %ile" : "705+"} /></div>
          <div className="col-span-2 space-y-1"><Label>Assign counsellor</Label>
            <Select value={f.assigned_to || "none"} onValueChange={(v) => setF({ ...f, assigned_to: v === "none" ? "" : v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Unassigned</SelectItem>{counsellors.map((c) => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}</SelectContent></Select>
          </div>
          <div className="col-span-2 space-y-1"><Label>Notes</Label><Textarea value={f.notes} onChange={set("notes")} /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={() => save.mutate()} disabled={save.isPending}>Save enquiry</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LeadSheet({ lead, onClose, onChanged, counsellors }: { lead: Lead | null; onClose: () => void; onChanged: (l: Lead | null) => void; counsellors: Staff[] }) {
  const qc = useQueryClient();
  const [note, setNote] = useState("");
  const [convertOpen, setConvertOpen] = useState(false);
  const { data: events = [] } = useQuery({
    queryKey: ["lead-events", lead?.id],
    enabled: !!lead,
    queryFn: async () => (await supabase.from("journey_events").select("*").eq("lead_id", lead!.id).order("created_at", { ascending: false })).data ?? [],
  });

  async function update(patch: Partial<Lead>, eventTitle?: string) {
    if (!lead) return;
    const { data, error } = await supabase.from("leads").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", lead.id).select().single();
    if (error) return toast.error(error.message);
    if (eventTitle) {
      const { data: u } = await supabase.auth.getUser();
      await supabase.from("journey_events").insert({ lead_id: lead.id, event_type: "lead_update", title: eventTitle, actor_id: u.user?.id });
      qc.invalidateQueries({ queryKey: ["lead-events", lead.id] });
    }
    onChanged(data);
  }
  async function logNote() {
    if (!lead || !note.trim()) return;
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("journey_events").insert({ lead_id: lead.id, event_type: "note", title: "Follow-up logged", detail: note, actor_id: u.user?.id });
    if (error) return toast.error(error.message);
    setNote("");
    qc.invalidateQueries({ queryKey: ["lead-events", lead.id] });
  }

  return (
    <Sheet open={!!lead} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        {lead && (
          <div className="space-y-6 pt-2">
            <SheetHeader className="text-left">
              <div className="flex items-center gap-2">
                <ExamTag exam={lead.exam} />
                <Tag tone={statusTone(lead.status)}>{LEAD_STATUS_LABEL[lead.status]}</Tag>
                {lead.is_demo && <Tag tone="muted">Demo candidate</Tag>}
              </div>
              <SheetTitle className="font-display text-2xl font-bold tracking-tight text-ink mt-2">{lead.full_name}</SheetTitle>
              <p className="font-mono text-xs text-muted-foreground">{lead.email || "No email"} · {lead.phone || "No phone"} · {lead.city || "No city"}</p>
            </SheetHeader>

            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3 rounded-lg border border-border/70 bg-muted/30 p-3 text-xs">
                <div>
                  <span className="eyebrow block text-muted-foreground">Current score / Baseline</span>
                  <span className="font-mono text-sm font-medium">{lead.current_score ?? "Not recorded"}</span>
                </div>
                <div>
                  <span className="eyebrow block text-muted-foreground">Target score / Year</span>
                  <span className="font-mono text-sm font-medium">{lead.target_score ?? "—"} {lead.target_year ? `(${lead.target_year})` : ""}</span>
                </div>
                <div>
                  <span className="eyebrow block text-muted-foreground">Acquisition source</span>
                  <span className="font-medium text-foreground">{lead.source}</span>
                </div>
                <div>
                  <span className="eyebrow block text-muted-foreground">Prior work experience</span>
                  <span className="font-mono font-medium">{lead.work_experience_months ?? 0} months</span>
                </div>
              </div>

              {lead.status === "converted" ? (
                lead.converted_student_id && (
                  <Button asChild className="w-full shadow-sm">
                    <Link to="/app/students/$id" params={{ id: lead.converted_student_id }}>
                      View Student 360° Profile →
                    </Link>
                  </Button>
                )
              ) : (
                <div className="space-y-3 rounded-lg border border-border/70 p-3.5">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Lead status</Label>
                      <Select value={lead.status} onValueChange={(v) => update({ status: v as LeadStatus }, `Status → ${LEAD_STATUS_LABEL[v]}`)}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>{LEAD_STATUSES.filter((s) => s !== "converted").map((s) => <SelectItem key={s} value={s}>{LEAD_STATUS_LABEL[s]}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Next follow-up date</Label>
                      <Input type="date" className="h-8 text-xs font-mono" value={lead.next_follow_up ?? ""} onChange={(e) => update({ next_follow_up: e.target.value || null })} />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs">Assigned counsellor</Label>
                      <Select value={lead.assigned_to ?? "none"} onValueChange={(v) => update({ assigned_to: v === "none" ? null : v }, "Counsellor reassigned")}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Unassigned</SelectItem>
                          {counsellors.map((c) => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => setConvertOpen(true)}>
                    Convert to Enrolled Student →
                  </Button>
                </div>
              )}

              <div className="rounded-lg border border-border/70 p-3.5 space-y-2">
                <Label className="text-xs">Log interaction or follow-up note</Label>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Record summary of discussion, questions raised, scholarship intent, trial class feedback…"
                  className="min-h-[75px] text-xs resize-none"
                />
                <Button size="sm" variant="outline" className="w-full text-xs" onClick={logNote} disabled={!note.trim()}>
                  Save Note to Timeline
                </Button>
              </div>

              <div>
                <div className="eyebrow mb-2 text-muted-foreground">Activity Timeline</div>
                {events.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No logged activity yet.</p>
                ) : (
                  <ol className="space-y-3 border-l-2 border-border/60 pl-3">
                    {events.map((e) => (
                      <li key={e.id} className="text-xs">
                        <div className="font-medium text-foreground">{e.title}</div>
                        {e.detail && <div className="text-muted-foreground mt-0.5">{e.detail}</div>}
                        <div className="font-mono text-[10px] text-muted-foreground/70 mt-1">{fromNow(e.created_at)}</div>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </div>

            <ConvertDialog
              lead={lead}
              open={convertOpen}
              onClose={() => setConvertOpen(false)}
              onDone={(l) => { setConvertOpen(false); onChanged(l); qc.invalidateQueries({ queryKey: ["overview"] }); }}
            />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function ConvertDialog({ lead, open, onClose, onDone }: { lead: Lead; open: boolean; onClose: () => void; onDone: (l: Lead) => void }) {
  const { data: courses = [] } = useQuery({
    queryKey: ["courses", lead.exam],
    queryFn: async () => (await supabase.from("courses").select("*, batches(*)").eq("exam", lead.exam).eq("is_active", true)).data ?? [],
  });
  const [courseId, setCourseId] = useState("");
  const [batchId, setBatchId] = useState("");
  const [fee, setFee] = useState("");
  const course = courses.find((c) => c.id === courseId);
  const convert = useMutation({
    mutationFn: async () => {
      if (!courseId) throw new Error("Select a course");
      const { error } = await supabase.rpc("convert_lead", { _lead_id: lead.id, _course_id: courseId, _batch_id: batchId || undefined, _fee: fee ? Number(fee) : undefined });
      if (error) throw error;
      const { data } = await supabase.from("leads").select("*").eq("id", lead.id).single();
      return data!;
    },
    onSuccess: (l) => { toast.success(`${lead.full_name} enrolled`); onDone(l); },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-bold tracking-tight">Enrol {lead.full_name}</DialogTitle>
          <p className="text-xs text-muted-foreground">Creates an active student record and sets their initial onboarding stage.</p>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1">
            <Label className="text-xs">{lead.exam} Course *</Label>
            <Select value={courseId} onValueChange={(v) => { setCourseId(v); setBatchId(""); }}>
              <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
              <SelectContent>{courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.name} · {inr(Number(c.fee))}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {course && (
            <div className="space-y-1">
              <Label className="text-xs">Batch Cohort (Optional)</Label>
              <Select value={batchId} onValueChange={setBatchId}>
                <SelectTrigger><SelectValue placeholder="Assign batch now or later" /></SelectTrigger>
                <SelectContent>{course.batches.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1">
            <Label className="text-xs">Agreed Fee (₹)</Label>
            <Input type="number" min={0} value={fee} onChange={(e) => setFee(e.target.value)} placeholder={course ? String(course.fee) : "Tuition fee in INR"} className="font-mono" />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => convert.mutate()} disabled={convert.isPending}>
            {convert.isPending ? "Enrolling…" : "Confirm & Create Student Record"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
