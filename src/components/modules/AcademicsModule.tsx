import { useState } from "react";
import { PageHeader, Kpi, Panel, Tag, ExamTag } from "@/components/kraft";
import { Button } from "@/components/ui/button";
import { GraduationCap, CheckCircle2, CircleDashed, Users, BookOpen } from "lucide-react";

export function AcademicsModule() {
  const [exam, setExam] = useState<"CAT" | "GMAT">("CAT");

  const catCurriculum = [
    {
      subject: "Quantitative Aptitude (QA)",
      progress: 68,
      topics: [
        { name: "Arithmetic (Percentages, P&L, TSD, Time & Work)", status: "Completed", faculty: "Prof. Raghav" },
        { name: "Algebra (Equations, Inequalities, Quadratics, Logarithms)", status: "In Progress", faculty: "Prof. Raghav" },
        { name: "Geometry & Mensuration (Circles, Triangles, 3D Solids)", status: "In Progress", faculty: "Prof. Sneha" },
        { name: "Number Systems (Remainders, Base Systems, Divisibility)", status: "Scheduled", faculty: "Prof. Raghav" },
        { name: "Modern Math (P&C, Probability, Set Theory)", status: "Scheduled", faculty: "Prof. Sneha" },
      ],
    },
    {
      subject: "Data Interpretation & Logical Reasoning (DILR)",
      progress: 60,
      topics: [
        { name: "Linear & Circular Arrangements", status: "Completed", faculty: "Prof. Sneha" },
        { name: "Matrix Matches & Grid Selection", status: "Completed", faculty: "Prof. Sneha" },
        { name: "Games & Tournaments (Round-Robin, Knockout)", status: "In Progress", faculty: "Prof. Sneha" },
        { name: "DI Tables, Bar, Spider & Radar Charts", status: "In Progress", faculty: "Prof. Sneha" },
        { name: "Truth & Lie / Binary Logic & Reasoning Sets", status: "Scheduled", faculty: "Prof. Sneha" },
      ],
    },
    {
      subject: "Verbal Ability & Reading Comprehension (VARC)",
      progress: 74,
      topics: [
        { name: "RC Strategy & Speed Reading Mastery", status: "Completed", faculty: "Dr. Ananya" },
        { name: "Critical Reasoning Inference & Assumptions", status: "Completed", faculty: "Dr. Ananya" },
        { name: "Para Jumbles & Sentence Restructuring", status: "In Progress", faculty: "Dr. Ananya" },
        { name: "Summary Completion & Tone Identification", status: "In Progress", faculty: "Dr. Ananya" },
        { name: "Odd Sentence Out & Paragraph Completion", status: "Scheduled", faculty: "Dr. Ananya" },
      ],
    },
  ];

  const gmatCurriculum = [
    {
      subject: "Quantitative Reasoning (QR)",
      progress: 65,
      topics: [
        { name: "Problem Solving & Word Problems", status: "Completed", faculty: "Prof. Raghav" },
        { name: "Algebraic Reasoning & Functions", status: "In Progress", faculty: "Prof. Raghav" },
        { name: "Exponents, Roots & Number Properties", status: "In Progress", faculty: "Prof. Raghav" },
        { name: "Non-calculator Computation Strategy", status: "Scheduled", faculty: "Prof. Raghav" },
      ],
    },
    {
      subject: "Verbal Reasoning (VR)",
      progress: 70,
      topics: [
        { name: "Critical Reasoning (Weaken, Strengthen, Boldface)", status: "Completed", faculty: "Dr. Ananya" },
        { name: "Long-form Complex Passage Reading Comprehension", status: "In Progress", faculty: "Dr. Ananya" },
        { name: "Argument Analysis & Flaw Identification", status: "Scheduled", faculty: "Dr. Ananya" },
      ],
    },
    {
      subject: "Data Insights (DI)",
      progress: 58,
      topics: [
        { name: "Data Sufficiency Strategy", status: "Completed", faculty: "Prof. Sneha" },
        { name: "Multi-Source Reasoning (MSR) Caselets", status: "In Progress", faculty: "Prof. Sneha" },
        { name: "Table Analysis & Two-Part Analysis", status: "In Progress", faculty: "Prof. Sneha" },
        { name: "Graphics Interpretation", status: "Scheduled", faculty: "Prof. Sneha" },
      ],
    },
  ];

  const activeCurriculum = exam === "CAT" ? catCurriculum : gmatCurriculum;
  const overallCompletion = Math.round(
    activeCurriculum.reduce((acc, s) => acc + s.progress, 0) / activeCurriculum.length
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Curriculum & Delivery"
        title="Academic Operations"
        description="Comprehensive syllabus taxonomy, topic-wise lesson progress, faculty allocation, and remedial scheduling."
        action={
          <div className="flex rounded-md border bg-muted p-0.5">
            <Button
              variant={exam === "CAT" ? "default" : "ghost"}
              size="sm"
              className="h-8 text-xs font-mono"
              onClick={() => setExam("CAT")}
            >
              CAT Syllabus
            </Button>
            <Button
              variant={exam === "GMAT" ? "default" : "ghost"}
              size="sm"
              className="h-8 text-xs font-mono"
              onClick={() => setExam("GMAT")}
            >
              GMAT Syllabus
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Kpi label={`${exam} Syllabus Coverage`} value={`${overallCompletion}%`} hint="Curriculum pacing on track" tone="primary" />
        <Kpi label="Active Subjects" value={activeCurriculum.length} hint="Core examination modules" />
        <Kpi label="Assigned Faculty" value="3 Instructors" hint="Batch instructors active" />
        <Kpi label="Remedial Sessions" value="4 Scheduled" hint="Targeted topic revisions" tone="warning" />
      </div>

      <div className="space-y-6">
        {activeCurriculum.map((sub) => (
          <Panel key={sub.subject} className="space-y-4 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="eyebrow">{exam} Subject Module</span>
                <h3 className="font-display text-2xl mt-0.5">{sub.subject}</h3>
              </div>
              <div className="text-right">
                <span className="tabular font-mono text-sm font-semibold text-primary">{sub.progress}% Covered</span>
              </div>
            </div>

            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-primary transition-all duration-500" style={{ width: `${sub.progress}%` }} />
            </div>

            <div className="divide-y rounded border text-xs">
              {sub.topics.map((t) => (
                <div key={t.name} className="flex items-center justify-between p-3 hover:bg-muted/30">
                  <div className="flex items-center gap-2.5">
                    {t.status === "Completed" ? (
                      <CheckCircle2 className="size-4 text-success" />
                    ) : (
                      <CircleDashed className="size-4 text-muted-foreground" />
                    )}
                    <span className="font-medium text-foreground">{t.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground font-mono">{t.faculty}</span>
                    <Tag
                      tone={
                        t.status === "Completed" ? "success" : t.status === "In Progress" ? "primary" : "muted"
                      }
                    >
                      {t.status}
                    </Tag>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}
