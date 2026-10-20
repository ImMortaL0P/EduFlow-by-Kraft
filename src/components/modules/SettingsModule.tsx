import { useState } from "react";
import { PageHeader, Kpi, Panel, Tag } from "@/components/kraft";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, ShieldCheck, Database, Globe, Sliders } from "lucide-react";
import { toast } from "sonner";

export function SettingsModule() {
  const [instName, setInstName] = useState("TrajectX Student Journey Manager");
  const [timezone, setTimezone] = useState("Asia/Kolkata (IST)");
  const [currency, setCurrency] = useState("INR — Indian Rupee (₹)");
  const [academicCycle, setAcademicCycle] = useState("2026-2027");
  const [riskMockThreshold, setRiskMockThreshold] = useState("2");
  const [attendanceThreshold, setAttendanceThreshold] = useState("75%");

  const saveSettings = () => {
    toast.success("Institutional configurations saved successfully");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Configuration"
        title="Institution Settings"
        description="Global parameters, academic cycle definitions, risk thresholds, database connection, and localized regional standards."
        action={
          <Button size="sm" onClick={saveSettings}>
            Save Changes
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Kpi label="Database Host" value="MongoDB Atlas" hint="Cluster: brushbackend (trajectx)" tone="primary" />
        <Kpi label="System Timezone" value="Asia/Kolkata" hint="Indian Standard Time (UTC+5:30)" />
        <Kpi label="Primary Currency" value="INR (₹)" hint="Standard fee ledger format" />
        <Kpi label="Active Cycle" value={academicCycle} hint="Admissions & batch intake" tone="warning" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Panel title="Institution Profile & Identity">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Institution / Brand Name</Label>
              <Input value={instName} onChange={(e) => setInstName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>System Timezone</Label>
                <Input value={timezone} disabled className="bg-muted text-muted-foreground font-mono text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label>Billing Currency</Label>
                <Input value={currency} disabled className="bg-muted text-muted-foreground font-mono text-xs" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Current Intake Academic Cycle</Label>
              <select
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                value={academicCycle}
                onChange={(e) => setAcademicCycle(e.target.value)}
              >
                <option value="2026-2027">2026 - 2027 (CAT 2026 / GMAT Focus 2026)</option>
                <option value="2027-2028">2027 - 2028 (Next Intake Cycle)</option>
              </select>
            </div>
          </div>
        </Panel>

        <Panel title="Academic Risk & Intervention Thresholds">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Consecutive Missed Mocks for Risk Alert</Label>
              <Input
                type="number"
                value={riskMockThreshold}
                onChange={(e) => setRiskMockThreshold(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Flags student as "Needs Attention" when unattempted mocks reach this limit.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label>Minimum Acceptable Batch Attendance</Label>
              <Input
                value={attendanceThreshold}
                onChange={(e) => setAttendanceThreshold(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Triggers mentor review if student attendance drops below this percentage.
              </p>
            </div>

            <div className="rounded border bg-primary/5 p-3 space-y-1 text-xs text-primary">
              <div className="font-semibold">Explainable Risk Detection Active</div>
              <p className="text-muted-foreground">
                Student risk status is evaluated from persisted test records, attendance logs, and weekly study plan adherence.
              </p>
            </div>
          </div>
        </Panel>
      </div>

      <Panel title="Database & System Environment Status">
        <div className="divide-y text-sm">
          <div className="flex items-center justify-between py-2.5">
            <div>
              <div className="font-medium">Primary Persistence</div>
              <div className="text-xs text-muted-foreground">MongoDB Atlas Multi-Cloud Cluster</div>
            </div>
            <Tag tone="success">Connected & Healthy</Tag>
          </div>
          <div className="flex items-center justify-between py-2.5">
            <div>
              <div className="font-medium">Database Name</div>
              <div className="text-xs font-mono text-muted-foreground">trajectx</div>
            </div>
            <Tag tone="ink">Dedicated Collection Set</Tag>
          </div>
          <div className="flex items-center justify-between py-2.5">
            <div>
              <div className="font-medium">Design & Motion Engine</div>
              <div className="text-xs text-muted-foreground">Lenis Smooth Scroll & Kraft Studios Aesthetics</div>
            </div>
            <Tag tone="primary">Enabled</Tag>
          </div>
          <div className="flex items-center justify-between py-2.5">
            <div>
              <div className="font-medium">Independent Cloud Architecture</div>
              <div className="text-xs text-muted-foreground">Pure independent Vite / TanStack Start / Node / MongoDB Atlas runtime</div>
            </div>
            <Tag tone="success">100% Independent</Tag>
          </div>
        </div>
      </Panel>
    </div>
  );
}
