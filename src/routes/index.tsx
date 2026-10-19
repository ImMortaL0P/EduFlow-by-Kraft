import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "KRAFT Student Journey Manager — CAT & GMAT coaching OS" },
      { name: "description", content: "Run admissions, counselling, preparation and outcomes for CAT and GMAT aspirants in one place." },
      { property: "og:title", content: "KRAFT Student Journey Manager" },
      { property: "og:description", content: "Admissions CRM, student journeys and institutional analytics for CAT & GMAT coaching." },
    ],
  }),
  component: Landing,
});

const STAGES = ["Enquiry", "Counselling", "Enrolment", "Foundation", "Mocks", "Exam", "Applications", "Admission", "Alumni"];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <span className="font-mono text-sm font-medium tracking-[0.2em]">KRAFT</span>
        <Button asChild variant="outline" size="sm">
          <Link to="/auth">Sign in</Link>
        </Button>
      </header>
      <main className="mx-auto max-w-6xl px-6 pb-24 pt-16">
        <p className="eyebrow">Student Journey Manager · CAT & GMAT</p>
        <h1 className="font-display mt-6 max-w-4xl text-6xl leading-[1.02] md:text-8xl">
          Every aspirant, <em className="text-primary">from first call</em> to final admit.
        </h1>
        <p className="mt-8 max-w-xl text-lg text-muted-foreground">
          Admissions, counselling, preparation, mocks and B-school outcomes on one shared record — for counsellors, faculty, mentors and leadership.
        </p>
        <div className="mt-10 flex gap-3">
          <Button asChild size="lg">
            <Link to="/auth">
              Open workspace <ArrowRight />
            </Link>
          </Button>
        </div>
        <div className="mt-24 border-t border-rule pt-6">
          <ol className="grid grid-cols-3 gap-y-4 md:grid-cols-9">
            {STAGES.map((s, i) => (
              <li key={s} className="border-l border-rule pl-3">
                <div className="tabular text-xs text-muted-foreground">{String(i + 1).padStart(2, "0")}</div>
                <div className="mt-1 text-sm font-medium">{s}</div>
              </li>
            ))}
          </ol>
        </div>
      </main>
    </div>
  );
}
