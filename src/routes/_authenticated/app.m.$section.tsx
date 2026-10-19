import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, Empty } from "@/components/kraft";
import { NAV } from "./app";

export const Route = createFileRoute("/_authenticated/app/m/$section")({
  head: () => ({ meta: [{ title: "Module — KRAFT" }] }),
  component: ModulePlaceholder,
});

function ModulePlaceholder() {
  const { section } = Route.useParams();
  const item = NAV.find((n) => n.key === section);
  return (
    <div>
      <PageHeader eyebrow="Coming next" title={item?.label ?? "Module"} description="This module connects to the same student records and is scheduled for an upcoming build phase." />
      <Panel><Empty title="In the roadmap" hint="Courses, academics, tests, fees, applications and analytics are built in the next rounds." /></Panel>
    </div>
  );
}
