import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Panel, Empty, ExamTag, Tag, Kpi } from "@/components/kraft";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { fmtDate } from "@/lib/format";
import { Search, UserCheck, Calendar, MapPin } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/students/")({
  validateSearch: (s: Record<string, unknown>): { q?: string } => ({
    q: typeof s["q"] === "string" ? s["q"] : undefined,
  }),
  head: () => ({ meta: [{ title: "Students Directory — TrajectX" }] }),
  component: StudentsPage,
});

function StudentsPage() {
  const search = Route.useSearch();
  const [q, setQ] = useState(search.q ?? "");
  const [examFilter, setExamFilter] = useState<"ALL" | "CAT" | "GMAT">("ALL");

  const { data = [], isLoading } = useQuery({
    queryKey: ["students"],
    queryFn: async () =>
      (
        await supabase
          .from("students")
          .select("*, journey_stages(name), enrolments(courses(name))")
          .order("full_name")
      ).data ?? [],
  });

  const catCount = data.filter((s: any) => s.exam === "CAT").length;
  const gmatCount = data.filter((s: any) => s.exam === "GMAT").length;

  const rows = data.filter((s: any) => {
    const matchesExam = examFilter === "ALL" ? true : s.exam === examFilter;
    const matchesQ =
      !q || `${s.full_name} ${s.email} ${s.city} ${s.phone}`.toLowerCase().includes(q.toLowerCase());
    return matchesExam && matchesQ;
  });

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        eyebrow="Directory & Rosters"
        title="Enrolled Students"
        description="Comprehensive 360-degree roster of every active aspirant, their preparation stage, assigned courses, and target examination dates."
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Kpi label="Total Enrolled" value={data.length} hint="Active prep cohort" tone="primary" />
        <Kpi label="CAT Cohort" value={catCount} hint="Target exam: Nov 2026" />
        <Kpi label="GMAT Cohort" value={gmatCount} hint="Rolling application cycle" />
        <Kpi label="Target Percentile Median" value="99 %ile / 715" hint="Institutional aspirational benchmark" tone="warning" />
      </div>

      <Panel>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input
              className="pl-9 h-9"
              placeholder="Search by name, email, city, phone…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="eyebrow mr-1">Filter Track:</span>
            <div className="flex rounded-md border bg-muted p-0.5">
              {(["ALL", "CAT", "GMAT"] as const).map((ex) => (
                <button
                  key={ex}
                  className={`rounded px-2.5 py-1 text-xs font-mono font-medium transition-all ${
                    examFilter === ex
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  onClick={() => setExamFilter(ex)}
                >
                  {ex}
                </button>
              ))}
            </div>
            <span className="tabular font-mono text-xs text-muted-foreground ml-2">
              {rows.length} students
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="py-14 text-center text-sm font-mono text-muted-foreground">
            Loading student records from MongoDB Atlas…
          </div>
        ) : rows.length === 0 ? (
          <Empty title="No students found" hint="Try adjusting your search criteria or exam filter." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border/80 text-xs uppercase text-muted-foreground">
                  <th className="pb-3 font-medium">Student Name</th>
                  <th className="pb-3 font-medium">Exam</th>
                  <th className="pb-3 font-medium">Stage</th>
                  <th className="pb-3 font-medium">Enrolled Course</th>
                  <th className="pb-3 font-medium">Target Score</th>
                  <th className="pb-3 text-right font-medium">Planned Attempt</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((s: any) => (
                  <tr key={s.id} className="hover:bg-muted/40 transition-colors">
                    <td className="py-3">
                      <Link
                        to="/app/students/$id"
                        params={{ id: s.id }}
                        className="font-medium text-foreground hover:text-primary transition-colors flex items-center gap-2"
                      >
                        <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-xs font-mono font-semibold text-primary">
                          {s.full_name?.charAt(0)}
                        </span>
                        <span>{s.full_name}</span>
                      </Link>
                      <div className="text-xs text-muted-foreground pl-9 font-mono">
                        {s.email} · {s.city}
                      </div>
                    </td>
                    <td className="py-3">
                      <ExamTag exam={s.exam} />
                    </td>
                    <td className="py-3">
                      <Tag tone="muted">{s.journey_stages?.name ?? "Foundation"}</Tag>
                    </td>
                    <td className="py-3 text-xs text-muted-foreground max-w-xs truncate">
                      {s.enrolments?.[0]?.courses?.name ?? (s.exam === "CAT" ? "CAT Comprehensive Classroom" : "GMAT Focus Intensive")}
                    </td>
                    <td className="py-3 font-mono text-xs tabular font-medium text-foreground">
                      {s.target_score ? `Target: ${s.target_score}` : (s.exam === "CAT" ? "Target: 99.5 %ile" : "Target: 715+")}
                    </td>
                    <td className="py-3 text-right tabular font-mono text-xs text-muted-foreground">
                      {fmtDate(s.planned_exam_date)}
                    </td>
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
