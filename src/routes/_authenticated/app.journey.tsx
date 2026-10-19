import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Tag, ExamTag, Chip } from "@/components/kraft";
import { Button } from "@/components/ui/button";
import { fmtDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { GripVertical, Target, Calendar, MapPin, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/journey")({
  head: () => ({ meta: [{ title: "Student Journey — KRAFT" }] }),
  component: JourneyBoard,
});

function JourneyBoard() {
  const qc = useQueryClient();
  const [exam, setExam] = useState<"CAT" | "GMAT">("CAT");
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

  const stages = (data?.stages ?? []).filter((s) => s.exam === exam);
  const students = (data?.students ?? []).filter((s) => s.exam === exam);

  async function drop(stageId: string) {
    setOver(null);
    const id = dragId;
    setDragId(null);
    if (!id) return;
    const st = students.find((s) => s.id === id);
    if (!st || st.stage_id === stageId) return;

    qc.setQueryData(["journey"], (old: typeof data) =>
      old && {
        ...old,
        students: old.students.map((s) => (s.id === id ? { ...s, stage_id: stageId } : s)),
      }
    );

    const { error } = await supabase.rpc("move_student_stage", {
      _student_id: id,
      _stage_id: stageId,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`${st.full_name} moved to new stage`);
    }
    qc.invalidateQueries({ queryKey: ["journey"] });
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        eyebrow="Lifecycle Tracking"
        title="Student Journey Engine"
        description="Drag-and-drop aspirant progression across preparation phases. Every transition is audited with timestamped timeline logs in MongoDB Atlas."
        action={
          <div className="flex items-center gap-2">
            <span className="eyebrow mr-1">Track:</span>
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
                  {e} Track ({students.length})
                </button>
              ))}
            </div>
          </div>
        }
      />

      <div className="-mx-4 overflow-x-auto px-4 pb-6 md:-mx-8 md:px-8">
        <div className="flex gap-4 min-w-max">
          {stages.map((st) => {
            const cards = students.filter((s) => s.stage_id === st.id);
            const isHovered = over === st.id;
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
                  "flex w-72 shrink-0 flex-col rounded-md border bg-card transition-all duration-200",
                  isHovered ? "border-primary ring-2 ring-primary/20 bg-primary/5" : "border-rule/80"
                )}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between border-b border-border/80 px-3.5 py-3 bg-secondary/30">
                  <div className="flex items-center gap-2">
                    <span className="tabular font-mono text-xs font-semibold text-primary">
                      {String(st.position).padStart(2, "0")}
                    </span>
                    <span className="text-sm font-semibold tracking-tight">{st.name}</span>
                  </div>
                  <Tag tone={cards.length > 0 ? "ink" : "muted"}>{cards.length}</Tag>
                </div>

                {/* Column Content */}
                <div className="min-h-[380px] space-y-2.5 p-2.5 flex-1 overflow-y-auto">
                  {cards.map((c) => (
                    <div
                      key={c.id}
                      draggable
                      onDragStart={() => setDragId(c.id)}
                      className={cn(
                        "group cursor-grab rounded border border-rule/70 bg-background p-3.5 shadow-xs transition-all hover:border-primary/60 hover:shadow-sm active:cursor-grabbing",
                        dragId === c.id && "opacity-40 scale-95"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          to="/app/students/$id"
                          params={{ id: c.id }}
                          className="font-medium text-sm text-foreground hover:text-primary transition-colors line-clamp-1"
                        >
                          {c.full_name}
                        </Link>
                        <GripVertical className="size-3.5 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>

                      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1 font-mono text-[11px]">
                          <MapPin className="size-3 text-muted-foreground/70" /> {c.city || "Delhi"}
                        </span>
                        <Tag tone="muted">{c.target_score || "99 %ile"}</Tag>
                      </div>

                      {c.planned_exam_date && (
                        <div className="mt-2 pt-2 border-t border-border/40 flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="size-3" /> Attempt
                          </span>
                          <span className="tabular">{fmtDate(c.planned_exam_date)}</span>
                        </div>
                      )}
                    </div>
                  ))}

                  {cards.length === 0 && (
                    <div className="flex h-36 items-center justify-center rounded border border-dashed border-rule/50 text-xs font-mono text-muted-foreground/60">
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
