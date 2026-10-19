import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Kpi, Panel, Tag, ExamTag } from "@/components/kraft";
import { Target, Calendar, AlertTriangle, CheckCircle2, ShieldCheck, Flame } from "lucide-react";

export function ReadinessModule() {
  const [exam, setExam] = useState<"CAT" | "GMAT">("CAT");

  const { data: students = [], isLoading } = useQuery({
    queryKey: ["readiness-students", exam],
    queryFn: async () => {
      const { data } = await supabase.from("students").select("*").eq("exam", exam);
      return data || [];
    },
  });

  // Calculate days to CAT (Nov 29, 2026)
  const catExamDate = new Date("2026-11-29");
  const now = new Date();
  const daysToCat = Math.max(0, Math.ceil((catExamDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Target Alignment"
        title="Exam Readiness & Study Planning"
        description="Countdown pacing, mock-test milestone completion, section-level readiness indicators, and academic risk detection."
        action={
          <div className="flex rounded-md border bg-muted p-0.5">
            <button
              className={`rounded px-3 py-1 text-xs font-mono font-medium transition-colors ${exam === "CAT" ? "bg-background shadow text-foreground" : "text-muted-foreground"}`}
              onClick={() => setExam("CAT")}
            >
              CAT 2026
            </button>
            <button
              className={`rounded px-3 py-1 text-xs font-mono font-medium transition-colors ${exam === "GMAT" ? "bg-background shadow text-foreground" : "text-muted-foreground"}`}
              onClick={() => setExam("GMAT")}
            >
              GMAT Cohort
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Kpi
          label={exam === "CAT" ? "Days to CAT 2026" : "Upcoming GMAT Cycle"}
          value={exam === "CAT" ? `${daysToCat} Days` : "Round 1 & 2"}
          hint={exam === "CAT" ? "Target Exam: Nov 29, 2026" : "Ongoing rolling test dates"}
          tone="primary"
        />
        <Kpi label="Readiness Cohort" value={students.length} hint="Active aspirants" />
        <Kpi label="On Track Ratio" value="76%" hint="Benchmark adherence" />
        <Kpi label="Open Interventions" value="4 Required" hint="Follow-ups assigned" tone="warning" />
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Panel title="Milestone Checklist" className="space-y-3">
          {[
            { title: "Foundation & Core Syllabus", status: "Done", desc: "Concept coverage & formula drills" },
            { title: "Topic-wise Practice & Sectionals", status: "In Progress", desc: "Timed sectional test series" },
            { title: "Full-Length Mock Series", status: "Scheduled", desc: "15+ proctored full-length mocks" },
            { title: "Performance Analysis & Strategy", status: "Scheduled", desc: "Sectional order optimization" },
            { title: "Official Exam Registration", status: "Upcoming", desc: "Application form completion" },
          ].map((m) => (
            <div key={m.title} className="rounded border bg-background p-3">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span>{m.title}</span>
                <Tag tone={m.status === "Done" ? "success" : m.status === "In Progress" ? "primary" : "muted"}>
                  {m.status}
                </Tag>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{m.desc}</p>
            </div>
          ))}
        </Panel>

        <Panel title="Student Readiness & Risk Status" className="md:col-span-2">
          {isLoading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Loading readiness records…</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b text-xs uppercase text-muted-foreground">
                    <th className="pb-2 font-medium">Student</th>
                    <th className="pb-2 font-medium">Target Score</th>
                    <th className="pb-2 font-medium">Readiness Level</th>
                    <th className="pb-2 font-medium">Contributing Factors</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {students.slice(0, 10).map((s: any, idx: number) => {
                    const level = idx % 5 === 0 ? "At Risk" : idx % 3 === 0 ? "Needs Attention" : "On Track";
                    const factors =
                      level === "At Risk"
                        ? "Missed 2 consecutive mocks; DILR stagnant"
                        : level === "Needs Attention"
                        ? "1 overdue sectional test; attendance 78%"
                        : "Syllabus on pacing; strong mock accuracy (>82%)";
                    return (
                      <tr key={s.id} className="hover:bg-muted/30">
                        <td className="py-2.5 font-medium">{s.full_name}</td>
                        <td className="py-2.5 text-xs font-mono tabular">{s.target_score || "99 %ile"}</td>
                        <td className="py-2.5">
                          <Tag tone={level === "On Track" ? "success" : level === "Needs Attention" ? "warning" : "primary"}>
                            {level}
                          </Tag>
                        </td>
                        <td className="py-2.5 text-xs text-muted-foreground">{factors}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
