import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Tag } from "@/components/kraft";
import { Button } from "@/components/ui/button";
import { fmtDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/app/journey")({
  head: () => ({ meta: [{ title: "Student Journey — KRAFT" }] }),
  component: JourneyBoard,
});

function JourneyBoard() {
  const qc = useQueryClient();
  const [exam, setExam] = useState<"CAT" | "GMAT">("CAT");
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const { data } = useQuery({
    queryKey: ["journey"],
    queryFn: async () => {
      const [stages, students] = await Promise.all([
        supabase.from("journey_stages").select("*").order("position"),
        supabase.from("students").select("id, full_name, exam, stage_id, planned_exam_date, target_score, city, updated_at"),
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
    qc.setQueryData(["journey"], (old: typeof data) => old && { ...old, students: old.students.map((s) => (s.id === id ? { ...s, stage_id: stageId } : s)) });
    const { error } = await supabase.rpc("move_student_stage", { _student_id: id, _stage_id: stageId });
    if (error) toast.error(error.message);
    else toast.success(`${st.full_name} moved`);
    qc.invalidateQueries({ queryKey: ["journey"] });
  }

  return (
    <div>
      <PageHeader
        eyebrow="Lifecycle"
        title="Student Journey"
        description="Drag students between stages. Every move is recorded on their timeline."
        action={
          <div className="flex rounded-md border p-0.5">
            {(["CAT", "GMAT"] as const).map((e) => (
              <Button key={e} size="sm" variant={exam === e ? "default" : "ghost"} onClick={() => setExam(e)}>{e}</Button>
            ))}
          </div>
        }
      />
      <div className="-mx-4 overflow-x-auto px-4 pb-4 md:-mx-8 md:px-8">
        <div className="flex gap-3">
          {stages.map((st) => {
            const cards = students.filter((s) => s.stage_id === st.id);
            return (
              <div
                key={st.id}
                onDragOver={(e) => { e.preventDefault(); setOver(st.id); }}
                onDragLeave={() => setOver(null)}
                onDrop={() => drop(st.id)}
                className={cn("flex w-64 shrink-0 flex-col rounded-md border bg-secondary/50 transition-colors", over === st.id && "border-primary bg-primary/5")}
              >
                <div className="flex items-center justify-between border-b px-3 py-2">
                  <span className="text-sm font-medium"><span className="tabular mr-1.5 text-xs text-muted-foreground">{String(st.position).padStart(2, "0")}</span>{st.name}</span>
                  <span className="tabular text-xs text-muted-foreground">{cards.length}</span>
                </div>
                <div className="min-h-32 space-y-2 p-2">
                  {cards.map((c) => (
                    <div
                      key={c.id}
                      draggable
                      onDragStart={() => setDragId(c.id)}
                      className={cn("cursor-grab rounded-sm border bg-card p-3 shadow-sm active:cursor-grabbing", dragId === c.id && "opacity-50")}
                    >
                      <Link to="/app/students/$id" params={{ id: c.id }} className="text-sm font-medium hover:text-primary">{c.full_name}</Link>
                      <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                        <span>{c.city}</span>
                        <Tag tone="muted">{c.target_score}</Tag>
                      </div>
                      {c.planned_exam_date && <div className="tabular mt-1 text-[11px] text-muted-foreground">Exam {fmtDate(c.planned_exam_date)}</div>}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
