import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel, Empty } from "@/components/kraft";
import { NAV } from "@/lib/nav";
import { CoursesModule } from "@/components/modules/CoursesModule";
import { AcademicsModule } from "@/components/modules/AcademicsModule";
import { TestsModule } from "@/components/modules/TestsModule";
import { AttendanceModule } from "@/components/modules/AttendanceModule";
import { ReadinessModule } from "@/components/modules/ReadinessModule";
import { ApplicationsModule } from "@/components/modules/ApplicationsModule";
import { FeesModule } from "@/components/modules/FeesModule";
import { AnalyticsModule } from "@/components/modules/AnalyticsModule";
import { NotificationsModule } from "@/components/modules/NotificationsModule";
import { SettingsModule } from "@/components/modules/SettingsModule";

export const Route = createFileRoute("/_authenticated/app/m/$section")({
  head: ({ params }) => {
    const item = NAV.find((n) => n.key === params.section);
    return {
      meta: [{ title: `${item?.label || "Module"} — KRAFT Student Journey Manager` }],
    };
  },
  component: ModuleRouter,
});

function ModuleRouter() {
  const { section } = Route.useParams();

  switch (section) {
    case "courses":
      return <CoursesModule />;
    case "academics":
      return <AcademicsModule />;
    case "tests":
      return <TestsModule />;
    case "attendance":
      return <AttendanceModule />;
    case "readiness":
      return <ReadinessModule />;
    case "applications":
      return <ApplicationsModule />;
    case "fees":
      return <FeesModule />;
    case "analytics":
      return <AnalyticsModule />;
    case "notifications":
      return <NotificationsModule />;
    case "settings":
      return <SettingsModule />;
    default: {
      const item = NAV.find((n) => n.key === section);
      return (
        <div>
          <PageHeader
            eyebrow="Module"
            title={item?.label ?? "Module"}
            description="Institutional management module connected to MongoDB Atlas."
          />
          <Panel>
            <Empty title="Module Workspace" hint="All primary modules are operational." />
          </Panel>
        </div>
      );
    }
  }
}
