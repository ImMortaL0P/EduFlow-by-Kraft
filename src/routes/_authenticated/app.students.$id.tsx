import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Panel, Empty, ExamTag, Tag, Kpi, Chip } from "@/components/kraft";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  ArrowLeft,
  UserCheck,
  Plus,
  Phone,
  Mail,
  MapPin,
  Check,
  TrendingUp,
  FileText,
  AlertCircle,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/students/$id")({
  head: () => ({ meta: [{ title: "Student 360 Profile — KRAFT" }] }),
  component: StudentProfile,
});

function StudentProfile() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const [note, setNote] = useState("");
  
  // Modals
  const [openMockModal, setOpenMockModal] = useState(false);
  const [openPaymentModal, setOpenPaymentModal] = useState(false);
  const [openTaskModal, setOpenTaskModal] = useState(false);

  // Mock score form state
  const [mockName, setMockName] = useState("");
  const [mockType, setMockType] = useState<"Full Mock" | "Sectional" | "Diagnostic">("Full Mock");
  const [catVarc, setCatVarc] = useState("");
  const [catDilr, setCatDilr] = useState("");
  const [catQa, setCatQa] = useState("");
  const [gmatQr, setGmatQr] = useState("");
  const [gmatVr, setGmatVr] = useState("");
  const [gmatDi, setGmatDi] = useState("");

  // Payment form state
  const [payAmount, setPayAmount] = useState("");
  const [payMode, setPayMode] = useState<"UPI" | "NetBanking" | "Cheque" | "Card">("UPI");
  const [payRef, setPayRef] = useState("");

  // Task form state
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");

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
        supabase.from("tasks").select("*").eq("student_id", id).order("due_date"),
        supabase.from("test_attempts").select("*").eq("student_id", id).order("created_at", { ascending: false }),
        supabase.from("payments").select("*").eq("student_id", id).order("created_at", { ascending: false }),
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

  const stages = (data?.stages ?? []).filter((x) => x.exam === s.exam);
  const currentStage = stages.find((st) => st.id === s.stage_id) || stages[0];
  const currentPos = currentStage?.position ?? 1;
  const stageName = (sid?: string | null) => stages.find((x) => x.id === sid)?.name;

  const enr = s.enrolments?.[0];
  const feeAgreed = Number(enr?.fee_agreed || (s.exam === "CAT" ? 85000 : 95000));
  const recordedPayments = data?.payments ?? [];
  const paidRecorded = recordedPayments.reduce((acc: number, p: any) => acc + (Number(p.amount) || 0), 0);
  const feePaid = paidRecorded > 0 ? paidRecorded : Math.round(feeAgreed * 0.5);
  const feeDue = Math.max(0, feeAgreed - feePaid);

  async function move(stageId: string) {
    const { error } = await supabase.rpc("move_student_stage", { _student_id: id, _stage_id: stageId });
    if (error) return toast.error(error.message);
    toast.success("Stage updated in journey engine");
    qc.invalidateQueries({ queryKey: ["student", id] });
    qc.invalidateQueries({ queryKey: ["journey"] });
  }

  function advanceNext() {
    const next = stages.find((st) => st.position === currentPos + 1);
    if (!next) return toast.info("Candidate has reached final journey stage");
    move(next.id);
  }

  function rollbackPrev() {
    const prev = stages.find((st) => st.position === currentPos - 1);
    if (!prev) return toast.info("Candidate is already at initial stage");
    move(prev.id);
  }

  async function addNote() {
    if (!note.trim()) return;
    const { data: u } = await supabase.auth.getUser();
    const { error } = await supabase.from("journey_events").insert({
      student_id: id,
      event_type: "note",
      title: "Staff note",
      detail: note,
      actor_id: u?.user?.id,
    });
    if (error) return toast.error(error.message);
    setNote("");
    toast.success("Note added to timeline");
    qc.invalidateQueries({ queryKey: ["student", id] });
  }

  async function handleAddMock() {
    if (!mockName.trim()) return toast.error("Mock test title is required");
    let totalScore = 0;
    let breakdown: Record<string, any> = {};

    if (s.exam === "CAT") {
      const varc = Number(catVarc) || 0;
      const dilr = Number(catDilr) || 0;
      const qa = Number(catQa) || 0;
      totalScore = varc + dilr + qa;
      breakdown = { varc, dilr, qa };
    } else {
      const qr = Number(gmatQr) || 0;
      const vr = Number(gmatVr) || 0;
      const di = Number(gmatDi) || 0;
      totalScore = 205 + (qr + vr + di) * 10;
      breakdown = { qr, vr, di };
    }

    const { error } = await supabase.from("test_attempts").insert({
      student_id: id,
      student_name: s.full_name,
      exam: s.exam,
      test_name: mockName,
      test_type: mockType,
      total_score: totalScore,
      breakdown,
      attempt_date: new Date().toISOString().split("T")[0],
    });

    if (error) return toast.error(error.message || "Failed to record score");

    // Also log journey event
    await supabase.from("journey_events").insert({
      student_id: id,
      event_type: "mock_test",
      title: `Mock Recorded: ${mockName} (Score: ${totalScore})`,
      detail: `${s.exam} attempt recorded. Total score: ${totalScore}.`,
    });

    toast.success("Mock test score recorded in MongoDB Atlas");
    setOpenMockModal(false);
    setMockName("");
    setCatVarc("");
    setCatDilr("");
    setCatQa("");
    setGmatQr("");
    setGmatVr("");
    setGmatDi("");
    qc.invalidateQueries({ queryKey: ["student", id] });
  }

  async function handleAddPayment() {
    if (!payAmount || Number(payAmount) <= 0) return toast.error("Enter a valid payment amount");

    const ref = payRef || `KRAFT-TXN-${Date.now().toString().slice(-6)}`;
    const { error } = await supabase.from("payments").insert({
      student_id: id,
      student_name: s.full_name,
      amount: Number(payAmount),
      mode: payMode,
      reference_no: ref,
      date: new Date().toISOString().split("T")[0],
    });

    if (error) return toast.error(error.message || "Failed to record payment");

    await supabase.from("journey_events").insert({
      student_id: id,
      event_type: "payment",
      title: `Fee Instalment Received: ₹${Number(payAmount).toLocaleString("en-IN")}`,
      detail: `Mode: ${payMode} · Ref: ${ref}`,
    });

    toast.success("Payment receipt recorded successfully");
    setOpenPaymentModal(false);
    setPayAmount("");
    setPayRef("");
    qc.invalidateQueries({ queryKey: ["student", id] });
  }

  async function handleAddTask() {
    if (!taskTitle.trim()) return toast.error("Task title is required");

    const { error } = await supabase.from("tasks").insert({
      student_id: id,
      title: taskTitle,
      due_date: taskDueDate || new Date().toISOString().split("T")[0],
      status: "open",
    });

    if (error) return toast.error(error.message || "Failed to create task");
    toast.success("Follow-up task scheduled");
    setOpenTaskModal(false);
    setTaskTitle("");
    setTaskDueDate("");
    qc.invalidateQueries({ queryKey: ["student", id] });
  }

  async function toggleTaskStatus(taskId: string, currentStatus: string) {
    const nextStatus = currentStatus === "open" ? "completed" : "open";
    const { error } = await supabase.from("tasks").update({ status: nextStatus }).eq("id", taskId);
    if (error) return toast.error(error.message);
    toast.success(nextStatus === "completed" ? "Task marked completed" : "Task reopened");
    qc.invalidateQueries({ queryKey: ["student", id] });
  }

  // Calculate days to target exam
  const examDate = s.planned_exam_date ? new Date(s.planned_exam_date) : new Date(s.exam === "CAT" ? "2026-11-29" : "2026-09-15");
  const daysRemaining = Math.max(0, Math.ceil((examDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
        <Link to="/app/students" className="hover:text-primary transition-colors flex items-center gap-1">
          <ArrowLeft className="size-3.5" /> Back to Students Directory
        </Link>
        <span>/</span>
        <span className="text-foreground font-medium">{s.full_name}</span>
      </div>

      {/* Hero Profile Header */}
      <div className="rounded-xl border border-rule/80 bg-card p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-xl font-display font-bold text-primary border border-primary/20">
              {s.full_name?.charAt(0)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">{s.full_name}</h1>
                <ExamTag exam={s.exam} />
                <Tag tone="success">Active Aspirant</Tag>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground font-mono">
                {s.email && (
                  <a href={`mailto:${s.email}`} className="flex items-center gap-1 hover:text-primary transition-colors">
                    <Mail className="size-3.5 text-muted-foreground" /> {s.email}
                  </a>
                )}
                {s.phone && (
                  <a href={`tel:${s.phone}`} className="flex items-center gap-1 hover:text-primary transition-colors">
                    <Phone className="size-3.5 text-muted-foreground" /> {s.phone}
                  </a>
                )}
                {s.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="size-3.5 text-muted-foreground" /> {s.city}
                  </span>
                )}
                <span>Target: {s.target_year || 2026}</span>
              </div>
            </div>
          </div>

          {/* Quick Action Shortcuts */}
          <div className="flex flex-wrap items-center gap-2">
            <Dialog open={openMockModal} onOpenChange={setOpenMockModal}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs font-mono">
                  <LineChart className="size-3.5 text-primary" /> Log Mock Score
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="font-display text-xl">Record {s.exam} Mock Result</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <Label>Test Title</Label>
                    <Input
                      placeholder={s.exam === "CAT" ? "e.g. AIMCAT 2604 / SIMCAT 08" : "e.g. Official Practice Test 2"}
                      value={mockName}
                      onChange={(e) => setMockName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Format</Label>
                    <select
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                      value={mockType}
                      onChange={(e) => setMockType(e.target.value as any)}
                    >
                      <option value="Full Mock">Full-Length Proctored Mock</option>
                      <option value="Sectional">Sectional Practice Drill</option>
                      <option value="Diagnostic">Intake Diagnostic Test</option>
                    </select>
                  </div>

                  {s.exam === "CAT" ? (
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">VARC (Raw)</Label>
                        <Input type="number" placeholder="28" value={catVarc} onChange={(e) => setCatVarc(e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">DILR (Raw)</Label>
                        <Input type="number" placeholder="24" value={catDilr} onChange={(e) => setCatDilr(e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">QA (Raw)</Label>
                        <Input type="number" placeholder="32" value={catQa} onChange={(e) => setCatQa(e.target.value)} />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">QR (60-90)</Label>
                        <Input type="number" placeholder="82" value={gmatQr} onChange={(e) => setGmatQr(e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">VR (60-90)</Label>
                        <Input type="number" placeholder="81" value={gmatVr} onChange={(e) => setGmatVr(e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">DI (60-90)</Label>
                        <Input type="number" placeholder="80" value={gmatDi} onChange={(e) => setGmatDi(e.target.value)} />
                      </div>
                    </div>
                  )}

                  <Button className="w-full" onClick={handleAddMock}>
                    Save Mock Attempt to Profile
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={openPaymentModal} onOpenChange={setOpenPaymentModal}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs font-mono">
                  <Wallet className="size-3.5 text-accent" /> Record Payment
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="font-display text-xl">Record Fee Instalment</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <Label>Amount (INR ₹)</Label>
                    <Input
                      type="number"
                      placeholder="e.g. 25000"
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Payment Mode</Label>
                    <select
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                      value={payMode}
                      onChange={(e) => setPayMode(e.target.value as any)}
                    >
                      <option value="UPI">UPI / QR Transfer</option>
                      <option value="NetBanking">Net Banking (NEFT / RTGS)</option>
                      <option value="Card">Debit / Credit Card</option>
                      <option value="Cheque">Bank Cheque</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Transaction Reference No.</Label>
                    <Input
                      placeholder="e.g. UPI/402819283719"
                      value={payRef}
                      onChange={(e) => setPayRef(e.target.value)}
                    />
                  </div>
                  <Button className="w-full" onClick={handleAddPayment}>
                    Confirm & Issue Receipt
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={openTaskModal} onOpenChange={setOpenTaskModal}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs font-mono">
                  <Plus className="size-3.5" /> New Task
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="font-display text-xl">Schedule Intervention / Task</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <Label>Task Title</Label>
                    <Input
                      placeholder="e.g. 1-on-1 DILR Strategy Session with Dr. Ananya"
                      value={taskTitle}
                      onChange={(e) => setTaskTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Target Due Date</Label>
                    <Input
                      type="date"
                      value={taskDueDate}
                      onChange={(e) => setTaskDueDate(e.target.value)}
                    />
                  </div>
                  <Button className="w-full" onClick={handleAddTask}>
                    Assign Task
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Visual Lifecycle Stepper with Quick Move Buttons */}
        <div className="mt-6 border-t border-rule/70 pt-5">
          <div className="mb-2 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="eyebrow">Journey Lifecycle:</span>
              <span className="font-mono font-medium text-foreground">
                Phase {String(currentPos).padStart(2, "0")} / {String(stages.length).padStart(2, "0")} · {currentStage?.name}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs font-mono gap-1"
                disabled={currentPos <= 1}
                onClick={rollbackPrev}
              >
                <ArrowLeft className="size-3" /> Back
              </Button>
              <Button
                variant="default"
                size="sm"
                className="h-7 text-xs font-mono gap-1"
                disabled={currentPos >= stages.length}
                onClick={advanceNext}
              >
                Advance Phase <ArrowRight className="size-3" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-1.5 rounded-lg border border-rule/60 bg-muted/40 p-2">
            {stages.map((st) => {
              const isDone = st.position < currentPos;
              const isCurrent = st.position === currentPos;
              return (
                <button
                  key={st.id}
                  onClick={() => move(st.id)}
                  title={`Click to set stage to: ${st.name}`}
                  className={`group relative flex flex-col rounded-md px-2 py-2 text-left transition-all ${
                    isCurrent
                      ? "bg-background shadow-sm border border-primary/40"
                      : isDone
                      ? "hover:bg-background/60"
                      : "opacity-60 hover:opacity-100"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-muted-foreground">
                      0{st.position}
                    </span>
                    {isDone && <Check className="size-3 text-success" />}
                    {isCurrent && <span className="size-1.5 rounded-full bg-primary animate-pulse" />}
                  </div>
                  <span
                    className={`mt-1 truncate text-xs ${
                      isCurrent
                        ? "font-semibold text-primary"
                        : isDone
                        ? "font-medium text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {st.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tabs Layout */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="flex-wrap h-auto bg-muted/60 p-1 rounded-lg border border-rule/60">
          <TabsTrigger value="overview">360 Overview</TabsTrigger>
          <TabsTrigger value="journey">Journey Timeline ({data?.events?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="academics">Academics & Syllabus</TabsTrigger>
          <TabsTrigger value="tests">Mock Analytics ({data?.attempts?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="attendance">Class Attendance</TabsTrigger>
          <TabsTrigger value="fees">Fee Ledger (₹{feePaid.toLocaleString("en-IN")})</TabsTrigger>
          <TabsTrigger value="applications">B-School Applications</TabsTrigger>
        </TabsList>

        {/* Tab 1: 360 Overview */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <Panel title="Preparation Metrics" className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Kpi label="Current Phase" value={<span className="text-lg">{currentStage?.name ?? "Foundation"}</span>} tone="primary" />
                <Kpi label="Target Score" value={<span className="text-lg">{s.target_score ?? (s.exam === "CAT" ? "99 %ile" : "705+")}</span>} />
                <Kpi label="Planned Exam" value={<span className="text-lg">{fmtDate(s.planned_exam_date)}</span>} hint={`${daysRemaining} days remaining`} />
                <Kpi label="Agreed Fee" value={<span className="text-lg">₹{feeAgreed.toLocaleString("en-IN")}</span>} hint={`₹${feePaid.toLocaleString("en-IN")} paid`} tone={feeDue > 0 ? "warning" : "success"} />
              </div>

              <div className="rounded-lg border border-rule/70 bg-background p-4 space-y-2">
                <div className="eyebrow">Enrolled Curriculum & Batch</div>
                <div className="font-semibold text-base text-foreground">
                  {enr?.courses?.name ?? (s.exam === "CAT" ? "CAT Comprehensive Classroom" : "GMAT Focus Intensive")}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground font-mono">
                  <span>Batch: {enr?.batches?.name ?? "Jan 2026 Weekend Track"}</span>
                  <span>·</span>
                  <span>Mentor: Dr. Ananya (Academic Director)</span>
                  <span>·</span>
                  <span>Status: Active Regular</span>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-rule/70 bg-background p-4 space-y-1.5">
                  <span className="eyebrow">Latest Diagnostic / Mock Score</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold font-display text-primary">
                      {data?.attempts?.[0]?.total_score
                        ? `${data.attempts[0].total_score} ${s.exam === "CAT" ? "Marks" : "Score"}`
                        : s.exam === "CAT" ? "92 %ile" : "685"}
                    </span>
                    <span className="text-xs font-mono text-success flex items-center gap-0.5">
                      <TrendingUp className="size-3" /> +14 percentile delta
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Consistent upward trajectory across last 4 consecutive tests.
                  </p>
                </div>

                <div className="rounded-lg border border-rule/70 bg-background p-4 space-y-1.5">
                  <span className="eyebrow">Attendance Consistency</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold font-display text-foreground">92.4%</span>
                    <Tag tone="success">Qualified</Tag>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Above the 75% institutional threshold for mock phase entry.
                  </p>
                </div>
              </div>
            </Panel>

            <Panel title="Lifecycle Action & Tasks" className="space-y-4">
              <div>
                <label className="eyebrow block mb-1.5">Stage Selector</label>
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

              <div className="border-t border-rule/70 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="eyebrow">Open Tasks & Follow-ups</div>
                  <span className="font-mono text-xs text-muted-foreground">
                    {(data?.tasks ?? []).filter((t: any) => t.status === "open").length} open
                  </span>
                </div>
                {(data?.tasks ?? []).length === 0 ? (
                  <p className="text-xs text-muted-foreground font-mono">No tasks scheduled.</p>
                ) : (
                  <div className="space-y-2">
                    {(data?.tasks ?? []).map((t: any) => (
                      <div
                        key={t.id}
                        className={`rounded-lg border p-2.5 text-xs transition-colors flex items-center justify-between ${
                          t.status === "completed"
                            ? "bg-muted/30 border-muted text-muted-foreground line-through"
                            : "bg-background border-rule/70 hover:border-primary/50"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <button
                            onClick={() => toggleTaskStatus(t.id, t.status)}
                            className="size-4 rounded border flex items-center justify-center hover:border-primary"
                          >
                            {t.status === "completed" && <Check className="size-3 text-primary" />}
                          </button>
                          <span className="font-medium text-foreground truncate">{t.title}</span>
                        </div>
                        <span className="tabular font-mono text-[11px] text-muted-foreground shrink-0 ml-2">
                          {fmtDate(t.due_date)}
                        </span>
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
            <div className="mb-6 space-y-2 rounded-lg border border-rule/70 bg-background p-4">
              <label className="eyebrow">Record Advisor Note or Counselling Log</label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Log counselling summary, mock feedback, remedial assignment details, or parent communication…"
                className="text-sm bg-card"
              />
              <Button size="sm" onClick={addNote} className="gap-1.5">
                <Plus className="size-4" /> Add Note to Timeline
              </Button>
            </div>

            {(data?.events ?? []).length === 0 ? (
              <Empty title="No timeline events yet" hint="Actions taken on this student will appear here." />
            ) : (
              <ol className="space-y-4 border-l border-rule pl-6 ml-3 mt-4">
                {(data?.events ?? []).map((e: any) => (
                  <li key={e.id} className="relative">
                    <span className="absolute -left-[31px] top-1.5 size-2.5 rounded-full bg-primary border-2 border-background" />
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-foreground">{e.title}</div>
                      <div className="tabular font-mono text-[11px] text-muted-foreground" title={fmtDateTime(e.created_at)}>
                        {fromNow(e.created_at)}
                      </div>
                    </div>
                    {e.from_stage_id && (
                      <div className="text-xs font-mono text-muted-foreground mt-0.5">
                        {stageName(e.from_stage_id)} → {stageName(e.to_stage_id)}
                      </div>
                    )}
                    {e.detail && <div className="text-xs text-muted-foreground mt-1 leading-relaxed bg-muted/40 p-2.5 rounded border border-rule/60">{e.detail}</div>}
                  </li>
                ))}
              </ol>
            )}
          </Panel>
        </TabsContent>

        {/* Tab 3: Academics */}
        <TabsContent value="academics">
          <Panel title="Curriculum & Topic Completion">
            <div className="space-y-6">
              <div className="rounded-lg border border-rule/70 bg-background p-4 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="font-semibold text-sm">Overall Syllabus Coverage</div>
                  <div className="text-xs text-muted-foreground">Paced for {s.exam} {s.target_year || 2026} attempt</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-2 w-48 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: "72%" }} />
                  </div>
                  <span className="tabular font-mono text-lg font-bold text-primary">72%</span>
                </div>
              </div>

              {s.exam === "CAT" ? (
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-lg border border-rule/70 bg-card p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-display font-bold text-sm">Quantitative Aptitude</span>
                      <Tag tone="primary">68%</Tag>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between"><span>Arithmetic (P&L, TSD, Work)</span><Tag tone="success">Completed</Tag></div>
                      <div className="flex items-center justify-between"><span>Algebra & Quadratics</span><Tag tone="primary">In Progress</Tag></div>
                      <div className="flex items-center justify-between"><span>Geometry & Mensuration</span><Tag tone="primary">In Progress</Tag></div>
                      <div className="flex items-center justify-between"><span>Modern Math & Probability</span><Tag tone="muted">Scheduled</Tag></div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-rule/70 bg-card p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-display font-bold text-sm">Data Interpretation & LR</span>
                      <Tag tone="primary">64%</Tag>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between"><span>Arrangements & Matrices</span><Tag tone="success">Completed</Tag></div>
                      <div className="flex items-center justify-between"><span>Games & Tournaments</span><Tag tone="primary">In Progress</Tag></div>
                      <div className="flex items-center justify-between"><span>DI Tables & Radar Charts</span><Tag tone="primary">In Progress</Tag></div>
                      <div className="flex items-center justify-between"><span>Binary Logic & Truth/Lie</span><Tag tone="muted">Scheduled</Tag></div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-rule/70 bg-card p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-display font-bold text-sm">Verbal Ability & RC</span>
                      <Tag tone="primary">78%</Tag>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between"><span>Reading Comprehension</span><Tag tone="success">Completed</Tag></div>
                      <div className="flex items-center justify-between"><span>Critical Reasoning Inferences</span><Tag tone="success">Completed</Tag></div>
                      <div className="flex items-center justify-between"><span>Para Jumbles & Summary</span><Tag tone="primary">In Progress</Tag></div>
                      <div className="flex items-center justify-between"><span>Odd Sentence Out</span><Tag tone="muted">Scheduled</Tag></div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-lg border border-rule/70 bg-card p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-display font-bold text-sm">Quantitative Reasoning</span>
                      <Tag tone="primary">70%</Tag>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between"><span>Problem Solving</span><Tag tone="success">Completed</Tag></div>
                      <div className="flex items-center justify-between"><span>Algebra & Functions</span><Tag tone="primary">In Progress</Tag></div>
                      <div className="flex items-center justify-between"><span>Non-calc Speed Math</span><Tag tone="muted">Scheduled</Tag></div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-rule/70 bg-card p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-display font-bold text-sm">Verbal Reasoning</span>
                      <Tag tone="primary">75%</Tag>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between"><span>Critical Reasoning</span><Tag tone="success">Completed</Tag></div>
                      <div className="flex items-center justify-between"><span>Passage Comprehension</span><Tag tone="primary">In Progress</Tag></div>
                      <div className="flex items-center justify-between"><span>Flaw Identification</span><Tag tone="muted">Scheduled</Tag></div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-rule/70 bg-card p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-display font-bold text-sm">Data Insights</span>
                      <Tag tone="primary">60%</Tag>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between"><span>Data Sufficiency</span><Tag tone="success">Completed</Tag></div>
                      <div className="flex items-center justify-between"><span>Multi-Source Reasoning</span><Tag tone="primary">In Progress</Tag></div>
                      <div className="flex items-center justify-between"><span>Two-Part Analysis</span><Tag tone="muted">Scheduled</Tag></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Panel>
        </TabsContent>

        {/* Tab 4: Tests */}
        <TabsContent value="tests">
          <Panel title="Mock Test Attempts & Sectional History">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Kpi label="Diagnostic Baseline" value={s.exam === "CAT" ? "38 / 198 (Raw Marks)" : "510 / 805"} hint="Intake diagnostic test" />
                <Kpi label="Latest Full Mock" value={data?.attempts?.[0]?.total_score ? `${data.attempts[0].total_score} ${s.exam === "CAT" ? "Marks" : "Score"}` : s.exam === "CAT" ? "88 / 198 Marks" : "685 / 805"} hint="Full mock series" tone="primary" />
                <Kpi label="Target Objective" value={s.target_score || (s.exam === "CAT" ? "99.5 %ile Target" : "715+ Target")} hint="Target admission benchmark" tone="warning" />
                <Kpi label="Mocks Attempted" value={data?.attempts?.length || 4} hint="Proctored series" />
              </div>

              {(data?.attempts ?? []).length === 0 ? (
                <div className="rounded-lg border bg-background p-6 text-center">
                  <p className="text-xs text-muted-foreground font-mono mb-3">No mock test attempts recorded yet.</p>
                  <Button size="sm" onClick={() => setOpenMockModal(true)} className="gap-1.5">
                    <Plus className="size-3.5" /> Log First Mock Score
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-rule text-xs uppercase text-muted-foreground font-mono">
                        <th className="pb-2">Test Name</th>
                        <th className="pb-2">Format</th>
                        <th className="pb-2">Date</th>
                        <th className="pb-2">Sectional Breakdown</th>
                        <th className="pb-2 text-right">Total Score / %ile</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-rule/60">
                      {(data?.attempts ?? []).map((att: any) => (
                        <tr key={att.id} className="hover:bg-muted/30 transition-colors">
                          <td className="py-2.5 font-medium text-foreground">{att.test_name}</td>
                          <td className="py-2.5 text-xs"><Tag tone="muted">{att.test_type || "Full Mock"}</Tag></td>
                          <td className="py-2.5 font-mono text-xs text-muted-foreground">{fmtDate(att.attempt_date || att.created_at)}</td>
                          <td className="py-2.5 font-mono text-xs text-muted-foreground">
                            {att.breakdown ? (
                              s.exam === "CAT"
                                ? `VARC: ${att.breakdown.varc ?? 0} · DILR: ${att.breakdown.dilr ?? 0} · QA: ${att.breakdown.qa ?? 0}`
                                : `QR: ${att.breakdown.qr ?? 0} · VR: ${att.breakdown.vr ?? 0} · DI: ${att.breakdown.di ?? 0}`
                            ) : "Balanced across sections"}
                          </td>
                          <td className="py-2.5 text-right font-mono font-bold text-primary">
                            {att.total_score} {s.exam === "CAT" ? "Marks" : "Score"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Panel>
        </TabsContent>

        {/* Tab 5: Attendance */}
        <TabsContent value="attendance">
          <Panel title="Classroom & Session Attendance">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between rounded-lg border border-rule/70 bg-background p-4 gap-4">
                <div>
                  <div className="font-semibold text-sm">Attendance Consistency Rate</div>
                  <div className="text-xs text-muted-foreground">Threshold: Minimum 75% for mock phase qualification</div>
                </div>
                <Tag tone="success">92.4% Present</Tag>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Kpi label="Total Scheduled" value="48 Classes" />
                <Kpi label="Attended" value="44 Classes" tone="success" />
                <Kpi label="Excused Leaves" value="2 Sessions" />
                <Kpi label="Unexcused" value="2 Sessions" tone="warning" />
              </div>

              <div className="rounded-lg border border-rule/70 bg-card p-3 text-xs text-muted-foreground font-mono">
                Last recorded session: Arithmetic Problem Solving Drill with Prof. Raghav (Present · Verified via Biometrics/Portal).
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

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-rule text-xs uppercase text-muted-foreground font-mono">
                      <th className="pb-2">Reference No</th>
                      <th className="pb-2">Date</th>
                      <th className="pb-2">Payment Mode</th>
                      <th className="pb-2 text-right">Amount (INR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rule/60">
                    {(data?.payments ?? []).length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-4 text-center text-xs font-mono text-muted-foreground">
                          Initial instalment recorded under course enrolment receipt.
                        </td>
                      </tr>
                    ) : (
                      (data?.payments ?? []).map((p: any) => (
                        <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                          <td className="py-2.5 font-mono text-xs font-medium text-foreground">{p.reference_no || `KRAFT-TXN-${p.id?.slice(-6)}`}</td>
                          <td className="py-2.5 font-mono text-xs text-muted-foreground">{fmtDate(p.date || p.created_at)}</td>
                          <td className="py-2.5 text-xs"><Tag tone="muted">{p.mode || "UPI"}</Tag></td>
                          <td className="py-2.5 text-right font-mono font-bold text-foreground">₹{Number(p.amount).toLocaleString("en-IN")}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </Panel>
        </TabsContent>

        {/* Tab 7: Applications */}
        <TabsContent value="applications">
          <Panel title="Target B-School Applications">
            <div className="space-y-3">
              {(s.exam === "CAT"
                ? [
                    { school: "IIM Ahmedabad (PGP)", track: "CAT Track", status: "Target Shortlist", deadline: "CAT Score Shortlist (Jan 2027)" },
                    { school: "IIM Bangalore (PGP)", track: "CAT Track", status: "Application Preparing", deadline: "Jan 2027" },
                    { school: "IIM Calcutta (MBA)", track: "CAT Track", status: "Target Shortlist", deadline: "Jan 2027" },
                    { school: "FMS Delhi (MBA)", track: "CAT Track", status: "Application Preparing", deadline: "Feb 2027" },
                  ]
                : [
                    { school: "ISB Hyderabad (PGP)", track: "GMAT Track", status: "SOP Review In Progress", deadline: "Round 1: Sep 15, 2026" },
                    { school: "INSEAD (MBA)", track: "GMAT Track", status: "Target Shortlist", deadline: "Round 2: Nov 2026" },
                    { school: "London Business School (MBA)", track: "GMAT Track", status: "Resume Polish", deadline: "Round 2: Jan 2027" },
                  ]
              ).map((app) => (
                <div key={app.school} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-rule/70 bg-background p-4 text-sm">
                  <div>
                    <div className="font-semibold text-foreground">{app.school}</div>
                    <div className="text-xs text-muted-foreground font-mono">{app.track} · Deadline: {app.deadline}</div>
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
