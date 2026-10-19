import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Panel, Empty, ExamTag, Tag } from "@/components/kraft";
import { Input } from "@/components/ui/input";
import { fmtDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/app/students/")({
  validateSearch: (s: Record<string, unknown>): { q?: string } => ({ q: typeof s["q"] === "string" ? s["q"] : undefined }),
  head: () => ({ meta: [{ title: "Students — KRAFT" }] }),
  component: StudentsPage,
});

function StudentsPage() {
  const search = Route.useSearch();
  const [q, setQ] = useState(search.q ?? "");
  const { data = [], isLoading } = useQuery({
    queryKey: ["students"],
    queryFn: async () => (await supabase.from("students").select("*, journey_stages(name), enrolments(courses(name))").order("full_name")).data ?? [],
  });
  const rows = data.filter((s) => !q || `${s.full_name} ${s.email} ${s.city}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <PageHeader eyebrow="Directory" title="Students" description="Every enrolled aspirant with current stage, course and planned exam date." />
      <Panel>
        <Input className="mb-4 max-w-xs" placeholder="Search students" value={q} onChange={(e) => setQ(e.target.value)} />
        {isLoading ? <div className="py-12 text-center text-sm text-muted-foreground">Loading…</div> : rows.length === 0 ? <Empty title="No students found" /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left">{["Student", "Exam", "Stage", "Course", "Target", "Exam date"].map((h) => <th key={h} className="eyebrow py-2 pr-4 font-normal">{h}</th>)}</tr></thead>
              <tbody>
                {rows.map((s) => (
                  <tr key={s.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="py-2.5 pr-4"><Link to="/app/students/$id" params={{ id: s.id }} className="font-medium hover:text-primary">{s.full_name}</Link><div className="text-xs text-muted-foreground">{s.city}</div></td>
                    <td className="pr-4"><ExamTag exam={s.exam} /></td>
                    <td className="pr-4"><Tag>{s.journey_stages?.name ?? "—"}</Tag></td>
                    <td className="pr-4">{s.enrolments?.[0]?.courses?.name ?? "—"}</td>
                    <td className="pr-4">{s.target_score}</td>
                    <td className="tabular text-xs">{fmtDate(s.planned_exam_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
