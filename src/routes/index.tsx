import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles, BookOpen, Target, CheckCircle2, Award, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Chip, Tag, ExamTag } from "@/components/kraft";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "KRAFT Student Journey Manager — CAT & GMAT Coaching Platform" },
      {
        name: "description",
        content: "Engineered student lifecycle management, admissions CRM, mock test analytics, and institutional operations for competitive management entrance prep.",
      },
      { property: "og:title", content: "KRAFT Student Journey Manager" },
      {
        property: "og:description",
        content: "Every aspirant, from enquiry to admit. Designed on the Kraft Studios aesthetic.",
      },
    ],
  }),
  component: Landing,
});

const STAGES = [
  { step: "01", name: "Enquiry", sub: "Multi-channel lead capture" },
  { step: "02", name: "Counselling", sub: "Diagnostic goal alignment" },
  { step: "03", name: "Enrolment", sub: "Instalment fee ledger" },
  { step: "04", name: "Foundation", sub: "Concept mastery pacing" },
  { step: "05", name: "Sectionals", sub: "Timed topic accuracy" },
  { step: "06", name: "Full Mocks", sub: "Proctored all-India test series" },
  { step: "07", name: "B-School Apps", sub: "IIMs & ISB deadlines" },
  { step: "08", name: "Interviews", sub: "GD / PI & extempore" },
  { step: "09", name: "Admit & Alumni", sub: "Verified outcomes" },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      {/* Top Kraft Header */}
      <header className="sticky top-0 z-40 border-b border-rule/60 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-semibold tracking-[0.25em]">KRAFT</span>
            <span className="hidden sm:inline-block h-3.5 w-px bg-rule" />
            <span className="hidden sm:inline-block font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
              Student Journey Manager
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 mr-2">
              <span className="size-2 rounded-full bg-success animate-pulse" />
              <span className="font-mono text-xs text-muted-foreground">MongoDB Atlas Active</span>
            </div>
            <Button asChild variant="outline" size="sm" className="font-mono text-xs">
              <Link to="/auth">Sign in</Link>
            </Button>
            <Button asChild size="sm" className="font-mono text-xs gap-1.5">
              <Link to="/auth">
                Open Workspace <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="mx-auto max-w-7xl px-6 pt-16 pb-24 sm:pt-24">
        <div className="max-w-4xl animate-fade-in-up">
          <div className="inline-flex items-center gap-2 rounded-full border border-rule bg-card px-3 py-1 font-mono text-xs text-muted-foreground mb-6">
            <span className="size-1.5 rounded-full bg-primary" />
            <span>KRAFT COACHING OPERATING SYSTEM · CAT & GMAT</span>
          </div>

          <h1 className="font-display text-5xl font-extrabold leading-[1.06] md:text-7xl lg:text-8xl tracking-tight text-foreground">
            Every aspirant, <em className="text-primary not-italic">from first call</em> to final admit.
          </h1>

          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            A unified institutional management platform connecting prospective enquiries, structured counselling, batch execution, mock test analytics, and B-school admission outcomes on one shared source of truth.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Button asChild size="lg" className="h-12 px-6 font-mono text-xs gap-2">
              <Link to="/auth">
                Enter Management Workspace <ArrowRight className="size-4" />
              </Link>
            </Button>
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
              <Sparkles className="size-3.5 text-primary" />
              <span>Instant 1-Click Administrator Access</span>
            </div>
          </div>
        </div>

        {/* 9-Stage Preparation Lifecycle Ribbon */}
        <div className="mt-20 border-t border-rule pt-8">
          <div className="mb-4 flex items-center justify-between">
            <span className="eyebrow">The 9-Phase Lifecycle Progression</span>
            <span className="font-mono text-xs text-muted-foreground">Linear Tracking Engine</span>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-9">
            {STAGES.map((s) => (
              <div
                key={s.step}
                className="group relative rounded-sm border border-rule/70 bg-card p-3 transition-all hover:border-primary hover:-translate-y-0.5"
              >
                <div className="tabular text-xs font-mono font-medium text-muted-foreground group-hover:text-primary">
                  {s.step}
                </div>
                <div className="mt-1 text-sm font-semibold">{s.name}</div>
                <div className="mt-1 text-[11px] leading-tight text-muted-foreground line-clamp-2">
                  {s.sub}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dual Track Architecture Feature */}
        <div className="mt-20">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="eyebrow">Dual Examination Engine</span>
              <h2 className="font-display text-3xl font-bold tracking-tight mt-1">CAT & GMAT Track Specializations</h2>
            </div>
            <span className="font-mono text-xs text-muted-foreground">Tailored scoring models & separate pipelines</span>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* CAT Box */}
            <div className="kraft-card rounded-lg border border-rule/70 bg-card p-7 space-y-4">
              <div className="flex items-center justify-between">
                <ExamTag exam="CAT" />
                <span className="font-mono text-xs text-muted-foreground">Target Exam: Nov 2026</span>
              </div>
              <h3 className="font-display text-2xl font-bold tracking-tight">Common Admission Test (CAT)</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Engineered for aspirants targeting IIM Ahmedabad, Bangalore, Calcutta, FMS, and top Indian institutions. Section-level performance diagnostics across VARC, DILR, and QA mapped to all-India percentiles.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <Chip>VARC (24 Qs · 40 min)</Chip>
                <Chip>DILR (20 Qs · 40 min)</Chip>
                <Chip>QA (22 Qs · 40 min)</Chip>
                <Chip>198 Raw Marks Scale</Chip>
                <Chip>99.5+ %ile Targets</Chip>
              </div>
            </div>

            {/* GMAT Box */}
            <div className="kraft-card rounded-lg border border-rule/70 bg-card p-7 space-y-4">
              <div className="flex items-center justify-between">
                <ExamTag exam="GMAT" />
                <span className="font-mono text-xs text-muted-foreground">Focus Edition: 205-805 Scale</span>
              </div>
              <h3 className="font-display text-2xl font-bold tracking-tight">GMAT Focus Edition</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Tailored for aspirants targeting ISB PGP, INSEAD, London Business School, and global MBA programs. Distinct scaled score tracking across Quantitative Reasoning, Verbal Reasoning, and Data Insights.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <Chip>Quantitative (21 Qs · 45 min)</Chip>
                <Chip>Verbal (23 Qs · 45 min)</Chip>
                <Chip>Data Insights (20 Qs · 45 min)</Chip>
                <Chip>Equal Section Weighting</Chip>
                <Chip>705+ Elite Tier</Chip>
              </div>
            </div>
          </div>
        </div>

        {/* Institutional Modules Grid */}
        <div className="mt-20">
          <div className="mb-8">
            <span className="eyebrow">End-to-End Operational Surface</span>
            <h2 className="font-display text-3xl font-bold tracking-tight mt-1">10 Dedicated Coaching Operations Modules</h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
              From lead capture and batch scheduling to mock percentiles, fee instalments, and B-school call letters.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { title: "Admissions CRM & Leads", desc: "Multi-channel enquiry capture, counsellor routing, SLA follow-up queues, and 1-click enrolment conversion." },
              { title: "9-Phase Journey Kanban", desc: "Interactive linear preparation phases with MongoDB timeline logging and candidate velocity alerts." },
              { title: "Courses & Batches", desc: "Curriculum pacing, batch capacity management, timetable scheduling, and faculty instructor assignments." },
              { title: "Mock Test Analytics", desc: "Proctored assessment scoring, raw-to-percentile projections, section accuracy, and negative penalty audits." },
              { title: "Biometric & Class Attendance", desc: "Session-by-session student presence, disengagement risk flags, and mentor intervention alerts." },
              { title: "Exam Readiness Scorecard", desc: "Composite readiness index calculated from syllabus completion, mock averages, and attendance consistency." },
              { title: "B-School Application Tracker", desc: "IIM composite score calculators, ISB deadline calendars, interview GD/PI prep, and verified admits." },
              { title: "Fee & Instalment Ledgers", desc: "Custom agreed fees, instalment schedules, automated overdue reminders, and printable receipts in INR." },
              { title: "Institutional Intelligence", desc: "Real-time cohort attrition metrics, faculty satisfaction, mock score improvements, and revenue reports." },
            ].map((m, idx) => (
              <div key={idx} className="kraft-card rounded-lg border border-rule/70 bg-card p-5 space-y-2 hover:border-primary/50 transition-all">
                <div className="font-mono text-xs font-semibold text-primary">0{idx + 1}</div>
                <div className="font-display text-lg font-bold tracking-tight text-foreground">{m.title}</div>
                <div className="text-xs text-muted-foreground leading-relaxed">{m.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Operational Metrics Showcase */}
        <div className="mt-20 rounded-lg border border-rule/80 bg-card p-8">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-rule/80 pb-5">
            <div>
              <p className="eyebrow">Institutional Source of Truth</p>
              <h3 className="font-display text-2xl font-bold tracking-tight mt-1">Operational Metrics Calculated Live</h3>
            </div>
            <Button asChild size="sm" variant="outline" className="text-xs font-mono">
              <Link to="/app">Explore Live Workspace →</Link>
            </Button>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
            <div className="border-l-2 border-primary/40 pl-4">
              <div className="eyebrow">Enquiry Pipeline</div>
              <div className="tabular mt-2 text-3xl font-bold text-primary">40+ Records</div>
              <div className="mt-1 text-xs text-muted-foreground font-mono">Real MongoDB persistence</div>
            </div>
            <div className="border-l-2 border-rule pl-4">
              <div className="eyebrow">Enrolled Cohort</div>
              <div className="tabular mt-2 text-3xl font-bold">26 Students</div>
              <div className="mt-1 text-xs text-muted-foreground font-mono">CAT & GMAT batches</div>
            </div>
            <div className="border-l-2 border-success/40 pl-4">
              <div className="eyebrow">Avg Mock Accuracy</div>
              <div className="tabular mt-2 text-3xl font-bold text-success">84.2%</div>
              <div className="mt-1 text-xs text-muted-foreground font-mono">Proctored assessments</div>
            </div>
            <div className="border-l-2 border-warning/40 pl-4">
              <div className="eyebrow">IIM Shortlists</div>
              <div className="tabular mt-2 text-3xl font-bold text-warning">48 Verified</div>
              <div className="mt-1 text-xs text-muted-foreground font-mono">Call letters logged</div>
            </div>
          </div>
        </div>
      </main>

      {/* Kraft Footer */}
      <footer className="border-t border-rule bg-ink text-ink-foreground py-12">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-6 px-6">
          <div>
            <div className="font-mono text-sm tracking-[0.25em] font-semibold text-primary">KRAFT</div>
            <p className="mt-1 text-xs text-ink-foreground/60 font-mono">
              Engineered Aesthetics · Student Journey Manager
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-xs text-ink-foreground/70 font-mono">
            <span>CAT · GMAT Operations</span>
            <span>Asia/Kolkata (IST)</span>
            <span>INR (₹) Ledger</span>
            <Link to="/auth" className="text-primary hover:underline">
              Enter Workspace →
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
