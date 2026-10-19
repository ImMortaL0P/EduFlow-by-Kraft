import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-rule pb-6 animate-fade-in-up">
      <div>
        {eyebrow && (
          <div className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-primary" />
            <p className="eyebrow">{eyebrow}</p>
          </div>
        )}
        <h1 className="font-display mt-1.5 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action && <div className="flex items-center gap-2.5 shrink-0">{action}</div>}
    </div>
  );
}

export function Kpi({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: "primary" | "warning" | "success";
}) {
  return (
    <div className="group relative border-l border-rule pl-4 pr-2 py-2 transition-all hover:border-primary">
      <div className="eyebrow flex items-center justify-between">
        <span>{label}</span>
      </div>
      <div
        className={cn(
          "tabular mt-2 text-3xl font-medium tracking-tight transition-transform group-hover:translate-x-0.5",
          tone === "primary" && "text-primary",
          tone === "warning" && "text-warning",
          tone === "success" && "text-success"
        )}
      >
        {value}
      </div>
      {hint && <div className="mt-1 text-xs text-muted-foreground font-mono">{hint}</div>}
    </div>
  );
}

export function Panel({
  title,
  action,
  children,
  className,
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("kraft-card rounded-md border border-border bg-card", className)}>
      {title && (
        <div className="flex items-center justify-between border-b border-border/80 px-5 py-3.5">
          <h2 className="text-sm font-semibold tracking-tight text-foreground">{title}</h2>
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function Empty({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="py-14 text-center">
      <div className="font-display text-2xl font-bold tracking-tight text-foreground/90">{title}</div>
      {hint && <p className="mt-2 text-sm text-muted-foreground font-mono">{hint}</p>}
    </div>
  );
}

export function Tag({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: "default" | "primary" | "ink" | "warning" | "success" | "muted";
}) {
  const tones = {
    default: "border-rule bg-secondary text-foreground",
    primary: "border-primary/40 bg-primary/10 text-primary font-semibold",
    ink: "border-ink bg-ink text-ink-foreground",
    warning: "border-warning/40 bg-warning/15 text-foreground",
    success: "border-success/40 bg-success/10 text-success font-semibold",
    muted: "border-border bg-muted text-muted-foreground",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider transition-colors",
        tones[tone]
      )}
    >
      {children}
    </span>
  );
}

export function ExamTag({ exam }: { exam: string }) {
  return <Tag tone={exam === "CAT" ? "primary" : "ink"}>{exam}</Tag>;
}

export function Chip({
  children,
  active,
  onClick,
}: {
  children: ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "kraft-chip cursor-pointer select-none",
        active && "border-primary text-primary bg-primary/5"
      )}
    >
      {children}
    </button>
  );
}
