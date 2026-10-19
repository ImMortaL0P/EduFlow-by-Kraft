import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Tag, ExamTag, Chip } from "@/components/kraft";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fmtDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { GripVertical, Target, Calendar, MapPin, Sparkles, ChevronLeft, ChevronRight, Search } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/journey")({
  head: () => ({ meta: [{ title: "Student Journey — KRAFT" }] }),
  component: JourneyBoard,
});

function JourneyBoard() {
  const qc = useQueryClient();
  const [exam, setExam] = useState<"CAT" | "GMAT">("CAT");
  const [q, setQ] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["journey"],
    queryFn: async () => {
      const [stages, students] = await Promise.all([
        supabase.from("journey_stages").select("*").order("position"),
        supabase
          .from("students")
          .select("id, full_name, exam, stage_id, planned_exam_date, target_score, city, updated_at"),
      ]);
      return { stages: stages.data ?? [], students: students.data ?? [] };
    },
  });

  const stages = useMemo(() => (data?.stages ?? []).filter((s) => s.exam === exam), [data, exam]);
  const allStudents = useMemo(() => (data?.students ?? []).filter((s) => s.exam === exam), [data, exam]);
  const students = useMemo(
    () =>
      allStudents.filter((s) =>
        !q.trim() ? true : s.full_name.toLowerCase().includes(q.toLowerCase()) || (s.city && s.city.toLowerCase().includes(q.toLowerCase()))
      ),
    [allStudents, q]
  );

  async function moveToStage(studentId: string, stageId: string) {
    const st = allStudents.find((s) => s.id === studentId);
    if (!st || st.stage_id === stageId) return;
    const targetStage = stages.find((s) => s.id === stageId);

    qc.setQueryData(["journey"], (old: typeof data) =>
      old && {
        ...old,
        students: old.students.map((s) => (s.id === studentId ? { ...s, stage_id: stageId } : s)),
      }
    );

    const { error } = await supabase.rpc("move_student_stage", {
      _student_id: studentId,
      _stage_id: stageId,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`${st.full_name} moved to ${targetStage?.name || "stage"}`);
    }
    qc.invalidateQueries({ queryKey: ["journey"] });
  }

  async function drop(stageId: string) {
    setOver(null);
    const id = dragId;
    setDragId(null);
    if (!id) return;
    moveToStage(id, stageId);
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        eyebrow="Lifecycle Tracking"
        title="Student Journey Engine"
        description="Drag-and-drop or single-click aspirant progression across preparation phases. Every transition is audited with timestamped timeline logs in MongoDB Atlas."
        action={
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Filter candidates…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="h-8 pl-8 text-xs w-44 bg-muted/40"
              />
            </div>
            <div className="flex rounded-md border bg-muted p-0.5">
              {(["CAT", "GMAT"] as const).map((e) => (
                <button
                  key={e}
                  className={cn(
                    "rounded px-3 py-1 font-mono text-xs font-medium transition-all",
                    exam === e ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                  onClick={() => setExam(e)}
                >
                  {e} Track ({allStudents.length})
                </button>
              ))}
            </div>
          </div>
        }
      />

      <div className="-mx-4 overflow-x-auto px-4 pb-6 md:-mx-8 md:px-8">
        <div className="flex gap-4 min-w-max">
          {stages.map((st, sIdx) => {
            const cards = students.filter((s) => s.stage_id === st.id);
            const isHovered = over === st.id;
            const prevStage = sIdx > 0 ? stages[sIdx - 1] : null;
            const nextStage = sIdx < stages.length - 1 ? stages[sIdx + 1] : null;

            return (
              <div
                key={st.id}
                onDragOver={(e) => {
                  e.preventDefault();
                  setOver(st.id);
                }}
                onDragLeave={() => setOver(null)}
                onDrop={() => drop(st.id)}
                className={cn(
                  "flex w-72 shrink-0 flex-col rounded-lg border bg-card transition-all duration-200",
                  isHovered ? "border-primary ring-2 ring-primary/20 bg-primary/5" : "border-rule/80 shadow-xs"
                )}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between border-b border-border/80 px-3.5 py-3 bg-secondary/30 rounded-t-lg">
                  <div className="flex items-center gap-2">
                    <span className="tabular font-mono text-xs font-semibold text-primary">
                      {String(st.position).padStart(2, "0")}
                    </span>
                    <span className="text-sm font-semibold tracking-tight">{st.name}</span>
                  </div>
                  <Tag tone={cards.length > 0 ? "ink" : "muted"}>{cards.length}</Tag>
                </div>

                {/* Column Content */}
                <div className="min-h-[380px] space-y-2.5 p-2.5 flex-1 overflow-y-auto max-h-[calc(100vh-250px)]">
                  {cards.map((c) => {
                    const initials = c.full_name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase();

                    const progressPct = Math.round((st.position / stages.length) * 100);

                    return (
                      <div
                        key={c.id}
                        draggable
                        onDragStart={() => setDragId(c.id)}
                        className={cn(
                          "group cursor-grab rounded-md border border-rule/70 bg-background p-3.5 shadow-xs transition-all hover:border-primary/60 hover:shadow-sm active:cursor-grabbing",
                          dragId === c.id && "opacity-40 scale-95"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-mono text-[10px] font-semibold">
                              {initials}
                            </span>
                            <Link
                              to="/app/students/$id"
                              params={{ id: c.id }}
                              className="font-medium text-xs text-foreground hover:text-primary transition-colors truncate"
                            >
                              {c.full_name}
                            </Link>
                          </div>
                          <GripVertical className="size-3.5 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>

                        {/* Stage Progress Bar */}
                        <div className="mt-2.5">
                          <div className="flex items-center justify-between font-mono text-[10px] text-muted-foreground mb-1">
                            <span>Stage {st.position}/{stages.length}</span>
                            <span>{progressPct}%</span>
                          </div>
                          <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all duration-300"
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>

                        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1 font-mono text-[10px]">
                            <MapPin className="size-3 text-muted-foreground/70" /> {c.city || "Delhi"}
                          </span>
                          <Tag tone="muted">{c.target_score || "99 %ile"}</Tag>
                        </div>

                        {c.planned_exam_date && (
                          <div className="mt-2 pt-2 border-t border-border/40 flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="size-3" /> Attempt
                            </span>
                            <span className="tabular">{fmtDate(c.planned_exam_date)}</span>
                          </div>
                        )}

                        {/* Quick Stepper Controls */}
                        <div className="mt-2.5 pt-2 border-t border-border/40 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                          {prevStage ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                moveToStage(c.id, prevStage.id);
                              }}
                              className="flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                              title={`Move back to ${prevStage.name}`}
                            >
                              <ChevronLeft className="size-3" /> Back
                            </button>
                          ) : <span />}

                          {nextStage && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                moveToStage(c.id, nextStage.id);
                              }}
                              className="flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-mono text-primary font-medium hover:bg-primary/10 transition-colors ml-auto"
                              title={`Advance to ${nextStage.name}`}
                            >
                              Next <ChevronRight className="size-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {cards.length === 0 && (
                    <div className="flex h-32 items-center justify-center rounded border border-dashed border-rule/50 text-xs font-mono text-muted-foreground/60">
                      Drop student here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
