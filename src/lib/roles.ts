import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type AppRole = Database["public"]["Enums"]["app_role"];

export const ROLE_LABELS: Record<AppRole, string> = {
  super_admin: "Super Administrator",
  director: "Institution Director",
  counsellor: "Admissions Counsellor",
  academic_manager: "Academic Manager",
  faculty: "Faculty",
  mentor: "Student Success Mentor",
  finance: "Finance & Accounts",
  student: "Student",
};

export const ALL_ROLES = Object.keys(ROLE_LABELS) as AppRole[];

const LEAD = ["super_admin", "director"] as AppRole[];
const STAFF = ALL_ROLES.filter((r) => r !== "student");

/** Which roles see which section. UI only — the database enforces access. */
export const SECTION_ACCESS: Record<string, AppRole[]> = {
  overview: ALL_ROLES,
  leads: [...LEAD, "counsellor"],
  journey: [...LEAD, "counsellor", "academic_manager", "mentor"],
  students: STAFF,
  counselling: [...LEAD, "counsellor", "mentor", "academic_manager"],
  courses: [...LEAD, "academic_manager", "faculty"],
  academics: [...LEAD, "academic_manager", "faculty"],
  tests: ALL_ROLES,
  attendance: [...LEAD, "academic_manager", "faculty", "mentor"],
  tasks: STAFF,
  readiness: [...LEAD, "academic_manager", "mentor", "student"],
  applications: [...LEAD, "mentor", "student"],
  fees: [...LEAD, "finance", "student"],
  analytics: [...LEAD, "academic_manager", "finance"],
  team: LEAD,
  notifications: ALL_ROLES,
  settings: LEAD,
};

export function canAccess(roles: AppRole[], section: string) {
  const allowed = SECTION_ACCESS[section] ?? [];
  return roles.some((r) => allowed.includes(r));
}

export function useSession() {
  return useQuery({
    queryKey: ["session-user"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user;
    },
  });
}

export function useMyRoles() {
  const { data: user } = useSession();
  return useQuery({
    queryKey: ["my-roles", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", user!.id);
      if (error) throw error;
      return (data ?? []).map((r) => r.role) as AppRole[];
    },
  });
}

export function useStaffDirectory() {
  return useQuery({
    queryKey: ["staff-directory"],
    queryFn: async () => {
      const [{ data: profiles }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, email"),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      return (profiles ?? []).map((p) => ({
        ...p,
        roles: (roles ?? []).filter((r) => r.user_id === p.id).map((r) => r.role as AppRole),
      }));
    },
  });
}
