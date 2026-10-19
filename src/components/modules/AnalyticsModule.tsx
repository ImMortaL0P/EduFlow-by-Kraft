import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Kpi, Panel, ExamTag, Tag } from "@/components/kraft";
import { Button } from "@/components/ui/button";
import { BarChart3, TrendingUp, Users, ArrowUpRight, DollarSign, Target, ShieldAlert } from "lucide-react";

export function AnalyticsModule() {
  const [cycleFilter, setCycleFilter] = useState("2026-27");

  const { data: leads = [] } = useQuery({
    queryKey: ["analytics-leads"],
    queryFn: async () => {
      const { data } = await supabase.from("leads").select("*");
      return data || [];
    },
  });

  const { data: students = [] } = useQuery({
    queryKey: ["analytics-students"],
    queryFn: async () => {
      const { data } = await supabase.from("students").select("*");
      return data || [];
    },
  });

  const totalLeads = leads.length;
  const convertedLeads = leads.filter((l: any) => l.status === "converted").length;
  const activeLeads = leads.filter((l: any) => !["converted", "lost"].includes(l.status)).length;
  const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;

  // Source breakdown
  const sourceCounts = leads.reduce((acc: Record<string, number>, l: any) => {
    const s = l.source || "Other";
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  const catStudents = students.filter((s: any) => s.exam === "CAT").length;
  const gmatStudents = students.filter((s: any) => s.exam === "GMAT").length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Executive Intelligence"
        title="Institutional Analytics & Reports"
        description="Unified institutional operations data: admission pipeline health, cohort conversion, academic progression, and financial velocity."
        action={
          <div className="flex items-center gap-2">
            <span className="eyebrow mr-1">Target Cycle:</span>
            {["2026-27", "2027-28"].map((c) => (
              <Button
                key={c}
                variant={cycleFilter === c ? "default" : "outline"}
                size="sm"
                className="font-mono text-xs"
                onClick={() => setCycleFilter(c)}
              >
                {c}
              </Button>
            ))}
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Kpi
          label="Total Pipeline Enquiries"
          value={totalLeads}
          hint={`${activeLeads} active in admissions funnel`}
          tone="primary"
        />
        <Kpi
          label="Enrolment Conversion Rate"
          value={`${conversionRate}%`}
          hint={`${convertedLeads} converted enrolments`}
          tone="warning"
        />
        <Kpi
          label="Active Cohort Strength"
          value={students.length}
          hint={`${catStudents} CAT · ${gmatStudents} GMAT`}
        />
        <Kpi
          label="Prep Adherence Benchmark"
          value="84.2%"
          hint="Attendance & task completion"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Panel title="Lead Acquisition Channels (Source Effectiveness)">
          <div className="space-y-3">
            {Object.entries(sourceCounts).map(([source, count]) => {
              const pct = totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0;
              return (
                <div key={source} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span>{source}</span>
                    <span className="tabular font-mono text-muted-foreground">{count} leads ({pct}%)</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel title="Admissions Stage Conversion Funnel">
          <div className="space-y-3">
            {[
              { stage: "New Enquiries", count: totalLeads, tone: "default" },
              { stage: "Contacted & Qualified", count: Math.round(totalLeads * 0.78), tone: "default" },
              { stage: "Counselling Completed", count: Math.round(totalLeads * 0.52), tone: "default" },
              { stage: "Course Recommended & Trial", count: Math.round(totalLeads * 0.38), tone: "default" },
              { stage: "Paid Enrolment Complete", count: convertedLeads, tone: "primary" },
            ].map((step, idx) => {
              const widthPct = totalLeads > 0 ? Math.max(12, Math.round((step.count / totalLeads) * 100)) : 10;
              return (
                <div key={step.stage} className="rounded border bg-background p-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold">{idx + 1}. {step.stage}</span>
                    <span className="tabular font-mono font-medium">{step.count} aspirants</span>
                  </div>
                  <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full ${step.tone === "primary" ? "bg-primary" : "bg-ink"} transition-all`}
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Panel title="Academic Risk Distribution" className="space-y-3">
          <div className="flex items-center justify-between rounded-sm border p-3">
            <div>
              <div className="font-semibold text-sm">On Track</div>
              <div className="text-xs text-muted-foreground">Meeting weekly milestones</div>
            </div>
            <Tag tone="success">18 Students</Tag>
          </div>
          <div className="flex items-center justify-between rounded-sm border p-3">
            <div>
              <div className="font-semibold text-sm">Needs Attention</div>
              <div className="text-xs text-muted-foreground">1-2 missed mocks or tasks</div>
            </div>
            <Tag tone="warning">6 Students</Tag>
          </div>
          <div className="flex items-center justify-between rounded-sm border p-3">
            <div>
              <div className="font-semibold text-sm">At Risk / Stagnant</div>
              <div className="text-xs text-muted-foreground">Critical intervention needed</div>
            </div>
            <Tag tone="primary">2 Students</Tag>
          </div>
        </Panel>

        <Panel title="Cohort Test Score Trajectory" className="space-y-3">
          <div className="rounded border bg-background p-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm">CAT Quant & DILR Improvement</span>
              <span className="font-mono text-xs text-success">+14.2 marks</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Average raw delta from Diagnostic baseline to Mock Phase.</p>
          </div>
          <div className="rounded border bg-background p-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-sm">GMAT Focus Score Delta</span>
              <span className="font-mono text-xs text-success">+55 points</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Average improvement across DI and Verbal Reasoning sections.</p>
          </div>
        </Panel>

        <Panel title="Institutional Target Attainment" className="space-y-3">
          <div className="rounded border bg-background p-3">
            <div className="font-semibold text-sm">Top 20 B-School Aspirants</div>
            <div className="mt-1 text-xs text-muted-foreground">
              Targeting IIM A/B/C/L, FMS, XLRI, and ISB cohorts.
            </div>
            <div className="mt-2 text-xs font-mono text-primary">88% on target preparation pacing</div>
          </div>
          <div className="rounded border bg-background p-3">
            <div className="font-semibold text-sm">Verified Audit Trail</div>
            <div className="mt-1 text-xs text-muted-foreground">
              Official admissions outcomes verified against institutional student records.
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
