import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-rule pb-6">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="font-display mt-1 text-4xl md:text-5xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Kpi({ label, value, hint, tone }: { label: string; value: ReactNode; hint?: string; tone?: "primary" | "warning" }) {
  return (
    <div className="border-l border-rule px-4 py-2">
      <div className="eyebrow">{label}</div>
      <div className={cn("tabular mt-2 text-3xl", tone === "primary" && "text-primary", tone === "warning" && "text-warning")}>{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

export function Panel({ title, action, children, className }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-md border bg-card", className)}>
      {title && (
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h2 className="text-sm font-semibold">{title}</h2>
          {action}
        </div>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

export function Empty({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="py-12 text-center">
      <div className="font-display text-2xl">{title}</div>
      {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function Tag({ children, tone = "default" }: { children: ReactNode; tone?: "default" | "primary" | "ink" | "warning" | "success" | "muted" }) {
  const tones = {
    default: "border-rule bg-secondary text-foreground",
    primary: "border-primary/30 bg-primary/10 text-primary",
    ink: "border-ink bg-ink text-ink-foreground",
    warning: "border-warning/40 bg-warning/15 text-foreground",
    success: "border-success/30 bg-success/10 text-success",
    muted: "border-border bg-muted text-muted-foreground",
  };
  return <span className={cn("inline-flex items-center rounded-sm border px-1.5 py-0.5 font-mono text-[11px] uppercase tracking-wide", tones[tone])}>{children}</span>;
}

export function ExamTag({ exam }: { exam: string }) {
  return <Tag tone={exam === "CAT" ? "primary" : "ink"}>{exam}</Tag>;
}
