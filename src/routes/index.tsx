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
        <div className="mt-20 grid gap-8 md:grid-cols-2">
          {/* CAT Box */}
          <div className="kraft-card rounded-md border border-rule bg-card p-8 space-y-5">
            <div className="flex items-center justify-between">
              <ExamTag exam="CAT" />
              <span className="font-mono text-xs text-muted-foreground">Target Exam: Nov 2026</span>
            </div>
            <h3 className="font-display text-2xl font-bold tracking-tight">Common Admission Test (CAT)</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Full lifecycle tracking for Indian IIMs, FMS, SPJIMR, and MDI aspirants. Rigorous section-level analytics across VARC, DILR, and Quantitative Aptitude with raw score to percentile benchmark projections.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <Chip>VARC (24 Qs)</Chip>
              <Chip>DILR (20 Qs)</Chip>
              <Chip>QA (22 Qs)</Chip>
              <Chip>198 Raw Marks Scale</Chip>
            </div>
          </div>

          {/* GMAT Box */}
          <div className="kraft-card rounded-md border border-rule bg-card p-8 space-y-5">
            <div className="flex items-center justify-between">
              <ExamTag exam="GMAT" />
              <span className="font-mono text-xs text-muted-foreground">Focus Edition: 205-805 Scale</span>
            </div>
            <h3 className="font-display text-2xl font-bold tracking-tight">GMAT Focus Edition</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Tailored preparation workflows for ISB, INSEAD, and global business schools. Separate scaled score interpretations for Quantitative Reasoning, Verbal Reasoning, and Data Insights without mixing scoring standards.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <Chip>Quantitative (21 Qs)</Chip>
              <Chip>Verbal (23 Qs)</Chip>
              <Chip>Data Insights (20 Qs)</Chip>
              <Chip>Equal Section Weighting</Chip>
            </div>
          </div>
        </div>

        {/* Live Operational Metrics Showcase */}
        <div className="mt-16 rounded-md border border-rule bg-card p-8">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-rule pb-5">
            <div>
              <p className="eyebrow">Institutional Source of Truth</p>
              <h3 className="font-display text-2xl font-bold tracking-tight mt-1">Operational Metrics Calculated Live</h3>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link to="/app">Explore Live Overview</Link>
            </Button>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
            <div className="border-l border-rule pl-4">
              <div className="eyebrow">Enquiry Pipeline</div>
              <div className="tabular mt-2 text-3xl font-medium text-primary">40+ Records</div>
              <div className="mt-1 text-xs text-muted-foreground font-mono">Real MongoDB persistence</div>
            </div>
            <div className="border-l border-rule pl-4">
              <div className="eyebrow">Enrolled Cohort</div>
              <div className="tabular mt-2 text-3xl font-medium">26 Students</div>
              <div className="mt-1 text-xs text-muted-foreground font-mono">CAT & GMAT batches</div>
            </div>
            <div className="border-l border-rule pl-4">
              <div className="eyebrow">Avg Mock Accuracy</div>
              <div className="tabular mt-2 text-3xl font-medium text-success">84.2%</div>
              <div className="mt-1 text-xs text-muted-foreground font-mono">Proctored assessments</div>
            </div>
            <div className="border-l border-rule pl-4">
              <div className="eyebrow">IIM Shortlists</div>
              <div className="tabular mt-2 text-3xl font-medium text-warning">48 Verified</div>
              <div className="mt-1 text-xs text-muted-foreground font-mono">Call letters logged</div>
            </div>
          </div>
        </div>
      </main>

      {/* Kraft Footer */}
      <footer className="border-t border-rule bg-ink text-ink-foreground py-12">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-6 px-6">
          <div>
            <div className="font-mono text-sm tracking-[0.2em] font-medium">KRAFT</div>
            <p className="mt-1 text-xs text-ink-foreground/60 font-mono">
              Engineered Aesthetics · Student Journey Manager
            </p>
          </div>
          <div className="flex items-center gap-6 text-xs text-ink-foreground/70 font-mono">
            <span>CAT · GMAT Operations</span>
            <span>Asia/Kolkata (IST)</span>
            <span>INR (₹) Ledger</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
