import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Kpi, Panel, Tag } from "@/components/kraft";
import { Button } from "@/components/ui/button";
import { CalendarCheck, Check, X, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export function AttendanceModule() {
  const qc = useQueryClient();
  const [selectedBatch, setSelectedBatch] = useState("CAT Comprehensive Classroom — Jan 2026 Weekend");
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split("T")[0]);

  const { data: students = [], isLoading } = useQuery({
    queryKey: ["attendance-students"],
    queryFn: async () => {
      const { data } = await supabase.from("students").select("*");
      return data || [];
    },
  });

  const { data: attendanceRecords = [] } = useQuery({
    queryKey: ["attendance-records", attendanceDate, selectedBatch],
    queryFn: async () => {
      const { data } = await supabase.from("attendance").select("*").eq("date", attendanceDate).eq("batch_name", selectedBatch);
      return data || [];
    },
  });

  const recordAttendanceMut = useMutation({
    mutationFn: async ({ studentId, studentName, status }: { studentId: string; studentName: string; status: "Present" | "Absent" | "Late" }) => {
      const existing = attendanceRecords.find((r: any) => r.student_id === studentId);
      if (existing) {
        await supabase.from("attendance").update({ status }).eq("id", existing.id);
      } else {
        await supabase.from("attendance").insert({
          student_id: studentId,
          student_name: studentName,
          batch_name: selectedBatch,
          date: attendanceDate,
          status,
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attendance-records"] });
      toast.success("Attendance updated");
    },
  });

  const statusMap = new Map(attendanceRecords.map((r: any) => [r.student_id, r.status]));

  const presentCount = attendanceRecords.filter((r: any) => r.status === "Present").length;
  const absentCount = attendanceRecords.filter((r: any) => r.status === "Absent").length;
  const attendanceRate = attendanceRecords.length > 0 ? Math.round((presentCount / attendanceRecords.length) * 100) : 92;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Class Operations"
        title="Attendance & Engagement"
        description="Daily class rosters, session attendance logging, participation consistency, and missed-class intervention triggers."
        action={
          <div className="flex items-center gap-2">
            <input
              type="date"
              className="rounded-md border bg-background px-3 py-1.5 text-xs font-mono"
              value={attendanceDate}
              onChange={(e) => setAttendanceDate(e.target.value)}
            />
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Kpi label="Attendance Rate" value={`${attendanceRate}%`} hint="Cohort consistency benchmark" tone="primary" />
        <Kpi label="Total Enrolled Roster" value={students.length} hint="Across all batches" />
        <Kpi label="Logged Today" value={attendanceRecords.length} hint={`${presentCount} Present · ${absentCount} Absent`} />
        <Kpi label="Class Status" value="Conducted" hint="Scheduled session active" />
      </div>

      <Panel title="Session Roster & Attendance Check" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-3">
          <div className="space-y-1">
            <span className="eyebrow">Active Batch</span>
            <select
              className="rounded-md border bg-background px-3 py-1.5 text-xs font-medium"
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
            >
              <option value="CAT Comprehensive Classroom — Jan 2026 Weekend">CAT Comprehensive Classroom — Jan 2026 Weekend</option>
              <option value="CAT Online Live — Jun 2026 Weekday">CAT Online Live — Jun 2026 Weekday</option>
              <option value="GMAT Focus Intensive — Jan 2026 Weekend">GMAT Focus Intensive — Jan 2026 Weekend</option>
            </select>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
            <span>Session: Quantitative Aptitude Mastery</span>
            <span>Room: Lecture Hall 2 & Live Stream</span>
          </div>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Loading roster…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-xs uppercase text-muted-foreground">
                  <th className="pb-2 font-medium">Student Name</th>
                  <th className="pb-2 font-medium">Exam</th>
                  <th className="pb-2 font-medium">City</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {students.slice(0, 15).map((s: any) => {
                  const currentStatus = statusMap.get(s.id) || "Present";
                  return (
                    <tr key={s.id} className="hover:bg-muted/30">
                      <td className="py-2.5">
                        <div className="font-medium">{s.full_name}</div>
                        <div className="text-xs text-muted-foreground">{s.email}</div>
                      </td>
                      <td className="py-2.5"><Tag tone="ink">{s.exam}</Tag></td>
                      <td className="py-2.5 text-xs text-muted-foreground">{s.city}</td>
                      <td className="py-2.5">
                        <Tag tone={currentStatus === "Present" ? "success" : currentStatus === "Absent" ? "primary" : "warning"}>
                          {currentStatus}
                        </Tag>
                      </td>
                      <td className="py-2.5 text-right">
                        <div className="inline-flex rounded-md border p-0.5">
                          <Button
                            variant={currentStatus === "Present" ? "default" : "ghost"}
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => recordAttendanceMut.mutate({ studentId: s.id, studentName: s.full_name, status: "Present" })}
                          >
                            P
                          </Button>
                          <Button
                            variant={currentStatus === "Absent" ? "destructive" : "ghost"}
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => recordAttendanceMut.mutate({ studentId: s.id, studentName: s.full_name, status: "Absent" })}
                          >
                            A
                          </Button>
                          <Button
                            variant={currentStatus === "Late" ? "outline" : "ghost"}
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => recordAttendanceMut.mutate({ studentId: s.id, studentName: s.full_name, status: "Late" })}
                          >
                            L
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
