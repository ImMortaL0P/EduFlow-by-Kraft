import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ShieldCheck, UserCheck, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Panel, Empty, Kpi, Tag } from "@/components/kraft";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ALL_ROLES, ROLE_LABELS, useMyRoles, useStaffDirectory, type AppRole } from "@/lib/roles";

export const Route = createFileRoute("/_authenticated/app/team")({
  head: () => ({ meta: [{ title: "Team & Permissions — TrajectX" }] }),
  component: TeamPage,
});

function TeamPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const { data: myRoles = [] } = useMyRoles();
  const { data: staff = [], isLoading } = useStaffDirectory();
  const isSuper = myRoles.includes("super_admin");

  const filtered = useMemo(() => {
    if (!q.trim()) return staff;
    const s = q.toLowerCase();
    return staff.filter((p) => p.full_name?.toLowerCase().includes(s) || p.email?.toLowerCase().includes(s));
  }, [staff, q]);

  const superCount = staff.filter((s) => s.roles.includes("super_admin")).length;
  const counsellorCount = staff.filter((s) => s.roles.includes("counsellor")).length;
  const facultyCount = staff.filter((s) => s.roles.includes("faculty")).length;

  async function toggle(userId: string, role: AppRole, on: boolean) {
    const { error } = on
      ? await supabase.from("user_roles").insert({ user_id: userId, role })
      : await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["staff-directory"] });
    qc.invalidateQueries({ queryKey: ["my-roles"] });
    toast.success(`Role updated for team member`);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Access Control & RBAC"
        title="Team Directory"
        description={
          isSuper
            ? "Configure operational access across Admissions, Academics, Mentorship, and Finance."
            : "View active institution staff. Only Super Administrators can grant or revoke system capabilities."
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi label="Active staff" value={staff.length} hint="Registered users" />
        <Kpi label="Super admins" value={superCount} tone="primary" hint="Full system privileges" />
        <Kpi label="Counsellors" value={counsellorCount} hint="Admissions & sales" />
        <Kpi label="Faculty / Mentors" value={facultyCount} hint="Batch instructors" />
      </div>

      <Panel>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Input
            placeholder="Search team member by name or email…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="h-9 max-w-sm"
          />
          <div className="flex items-center gap-2">
            {!isSuper && (
              <Tag tone="muted">
                <Lock className="mr-1 inline-block size-3" /> Read-only mode
              </Tag>
            )}
            <span className="font-mono text-xs text-muted-foreground tabular">
              {filtered.length} members
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-sm text-muted-foreground">Loading team directory…</div>
        ) : filtered.length === 0 ? (
          <Empty title="No team members match" hint="Try adjusting your search query." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 text-left">
                  <th className="eyebrow pb-3 pr-4 font-normal text-muted-foreground">Team Member</th>
                  {ALL_ROLES.map((r) => (
                    <th key={r} className="eyebrow px-3 pb-3 text-center font-normal text-muted-foreground">
                      {ROLE_LABELS[r]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filtered.map((p) => (
                  <tr key={p.id} className="transition-colors hover:bg-muted/30">
                    <td className="py-3 pr-4">
                      <div className="font-medium text-foreground">{p.full_name || "Staff Member"}</div>
                      <div className="font-mono text-xs text-muted-foreground">{p.email}</div>
                    </td>
                    {ALL_ROLES.map((r) => {
                      const hasRole = p.roles.includes(r);
                      return (
                        <td key={r} className="px-3 text-center">
                          <Checkbox
                            checked={hasRole}
                            disabled={!isSuper}
                            onCheckedChange={(v) => toggle(p.id, r, !!v)}
                            aria-label={`${ROLE_LABELS[r]} for ${p.full_name}`}
                            className={hasRole ? "border-primary bg-primary text-primary-foreground" : ""}
                          />
                        </td>
                      );
                    })}
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
