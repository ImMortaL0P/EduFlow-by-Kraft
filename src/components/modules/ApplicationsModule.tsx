import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Kpi, Panel, Tag } from "@/components/kraft";
import { School, CheckCircle2, Clock, Award, Building2 } from "lucide-react";

export function ApplicationsModule() {
  const { data: students = [] } = useQuery({
    queryKey: ["app-students"],
    queryFn: async () => {
      const { data } = await supabase.from("students").select("*");
      return data || [];
    },
  });

  const bSchools = [
    { school: "IIM Ahmedabad", prog: "PGP (2-Year Full Time)", deadline: "Sep 2026", track: "CAT", shortlists: 14, offers: 6 },
    { school: "IIM Bangalore", prog: "PGP / PGPEM", deadline: "Sep 2026", track: "CAT / GMAT", shortlists: 16, offers: 8 },
    { school: "IIM Calcutta", prog: "MBA (PGP)", deadline: "Sep 2026", track: "CAT", shortlists: 12, offers: 5 },
    { school: "ISB (Hyderabad & Mohali)", prog: "PGP (Post Graduate Programme)", deadline: "Oct 2026 (Round 1)", track: "GMAT", shortlists: 19, offers: 11 },
    { school: "FMS Delhi", prog: "Full Time MBA", deadline: "Dec 2026", track: "CAT", shortlists: 9, offers: 4 },
    { school: "XLRI Jamshedpur", prog: "BM / HRM", deadline: "Nov 2026", track: "GMAT / XAT", shortlists: 11, offers: 5 },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Post-Exam Journey"
        title="B-School Applications & Admissions"
        description="Application cycle tracking, essay & SOP review milestones, interview shortlists, and verified institutional admission offers."
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Kpi label="Active Applicants" value={students.length} hint="CAT & GMAT cohorts" tone="primary" />
        <Kpi label="Total Applications Submitted" value="82" hint="Across top 15 B-schools" />
        <Kpi label="Interview Shortlists" value="48" hint="Verified call letters received" tone="warning" />
        <Kpi label="Final Admission Offers" value="28" hint="Verified offers accepted" tone="primary" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Panel title="Target Institutions & Application Cycles">
          <div className="divide-y text-sm">
            {bSchools.map((b) => (
              <div key={b.school} className="py-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="size-4 text-primary" />
                    <span className="font-semibold text-base">{b.school}</span>
                  </div>
                  <Tag tone="ink">{b.track}</Tag>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{b.prog}</span>
                  <span className="font-mono">Deadline: {b.deadline}</span>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono pt-1">
                  <span className="text-warning">Shortlists: {b.shortlists}</span>
                  <span className="text-success font-semibold">Final Offers: {b.offers}</span>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Application Lifecycle Stages">
          <div className="space-y-3">
            {[
              { stage: "Profile Evaluation & Target Shortlisting", status: "Active", count: 26 },
              { stage: "Resume & SOP / Essay Draft Reviews", status: "Active", count: 18 },
              { stage: "Applications Submitted & Verified", status: "Active", count: 14 },
              { stage: "GD / PI & Extempore Preparation", status: "Upcoming", count: 8 },
              { stage: "Admission Outcome Recorded & Audit", status: "Concluded", count: 4 },
            ].map((step, idx) => (
              <div key={step.stage} className="rounded border bg-background p-3.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span>{idx + 1}. {step.stage}</span>
                  <Tag tone={step.status === "Active" ? "primary" : "muted"}>{step.count} Students</Tag>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Managed by Senior Academic Mentors and Admissions Advisory Committee.
                </p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
