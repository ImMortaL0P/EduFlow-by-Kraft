import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Panel, Empty } from "@/components/kraft";
import { Checkbox } from "@/components/ui/checkbox";
import { ALL_ROLES, ROLE_LABELS, useMyRoles, useStaffDirectory, type AppRole } from "@/lib/roles";

export const Route = createFileRoute("/_authenticated/app/team")({
  head: () => ({ meta: [{ title: "Team — KRAFT" }] }),
  component: TeamPage,
});

function TeamPage() {
  const qc = useQueryClient();
  const { data: myRoles = [] } = useMyRoles();
  const { data: staff = [], isLoading } = useStaffDirectory();
  const isSuper = myRoles.includes("super_admin");

  async function toggle(userId: string, role: AppRole, on: boolean) {
    const { error } = on
      ? await supabase.from("user_roles").insert({ user_id: userId, role })
      : await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["staff-directory"] });
    qc.invalidateQueries({ queryKey: ["my-roles"] });
  }

  return (
    <div>
      <PageHeader eyebrow="Access control" title="Team" description={isSuper ? "Assign roles. New sign-ups appear here with no access until you grant a role." : "Only the Super Administrator can change roles."} />
      <Panel>
        {isLoading ? null : staff.length === 0 ? <Empty title="No team members yet" /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left"><th className="eyebrow py-2 pr-4 font-normal">Member</th>{ALL_ROLES.map((r) => <th key={r} className="eyebrow px-2 py-2 text-center font-normal">{ROLE_LABELS[r].split(" ")[0]}</th>)}</tr></thead>
              <tbody>
                {staff.map((p) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="py-2.5 pr-4"><div className="font-medium">{p.full_name}</div><div className="text-xs text-muted-foreground">{p.email}</div></td>
                    {ALL_ROLES.map((r) => (
                      <td key={r} className="px-2 text-center">
                        <Checkbox checked={p.roles.includes(r)} disabled={!isSuper} onCheckedChange={(v) => toggle(p.id, r, !!v)} aria-label={`${ROLE_LABELS[r]} for ${p.full_name}`} />
                      </td>
                    ))}
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
