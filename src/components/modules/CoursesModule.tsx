import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Kpi, Panel, ExamTag, Tag } from "@/components/kraft";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, BookOpen, Users, Calendar, Clock } from "lucide-react";
import { toast } from "sonner";

export function CoursesModule() {
  const qc = useQueryClient();
  const [examFilter, setExamFilter] = useState<"ALL" | "CAT" | "GMAT">("ALL");
  const [openNewBatch, setOpenNewBatch] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [batchName, setBatchName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [mode, setMode] = useState<"Classroom" | "Online">("Classroom");

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["courses-with-batches"],
    queryFn: async () => {
      const { data } = await supabase.from("courses").select("*");
      return data || [];
    },
  });

  const { data: students = [] } = useQuery({
    queryKey: ["all-students-enrolments"],
    queryFn: async () => {
      const { data } = await supabase.from("students").select("*");
      return data || [];
    },
  });

  const createBatchMut = useMutation({
    mutationFn: async () => {
      if (!selectedCourseId || !batchName || !startDate) {
        throw new Error("Please complete all batch fields");
      }
      const course = courses.find((c: any) => c.id === selectedCourseId);
      const { error } = await supabase.from("batches").insert({
        course_id: selectedCourseId,
        name: `${course?.name} — ${batchName}`,
        start_date: startDate,
        mode,
        capacity: 40,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["courses-with-batches"] });
      toast.success("New batch created successfully");
      setOpenNewBatch(false);
      setBatchName("");
      setStartDate("");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create batch");
    },
  });

  const filteredCourses = courses.filter((c: any) =>
    examFilter === "ALL" ? true : c.exam === examFilter
  );

  const totalBatches = courses.reduce((acc: number, c: any) => acc + (c.batches?.length || 0), 0);
  const catCourses = courses.filter((c: any) => c.exam === "CAT").length;
  const gmatCourses = courses.filter((c: any) => c.exam === "GMAT").length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Academic Offerings"
        title="Courses & Batches"
        description="Structured CAT & GMAT preparation programmes, batch schedules, faculty allocations, and enrolment capacity."
        action={
          <Dialog open={openNewBatch} onOpenChange={setOpenNewBatch}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="size-4" /> New Batch
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-display text-2xl">Create Batch</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label>Parent Course</Label>
                  <select
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                  >
                    <option value="">Select course…</option>
                    {courses.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        [{c.exam}] {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Batch Label</Label>
                  <Input
                    placeholder="e.g. Nov 2026 Weekend Track"
                    value={batchName}
                    onChange={(e) => setBatchName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Delivery Mode</Label>
                  <div className="flex gap-4 pt-1">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="radio"
                        checked={mode === "Classroom"}
                        onChange={() => setMode("Classroom")}
                      />
                      Classroom
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="radio"
                        checked={mode === "Online"}
                        onChange={() => setMode("Online")}
                      />
                      Live Online
                    </label>
                  </div>
                </div>
                <Button
                  className="w-full mt-2"
                  disabled={createBatchMut.isPending}
                  onClick={() => createBatchMut.mutate()}
                >
                  {createBatchMut.isPending ? "Creating…" : "Save Batch"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Kpi label="Active Courses" value={courses.length} hint={`${catCourses} CAT · ${gmatCourses} GMAT`} tone="primary" />
        <Kpi label="Total Batches" value={totalBatches} hint="Running & upcoming cohorts" />
        <Kpi label="Enrolled Students" value={students.length} hint="Active preparation rosters" />
        <Kpi label="Avg Course Duration" value="24 wks" hint="Curriculum roadmap" />
      </div>

      <div className="flex items-center gap-2">
        <span className="eyebrow mr-2">Filter Exam:</span>
        {(["ALL", "CAT", "GMAT"] as const).map((ex) => (
          <Button
            key={ex}
            variant={examFilter === ex ? "default" : "outline"}
            size="sm"
            onClick={() => setExamFilter(ex)}
          >
            {ex}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <Panel className="p-8 text-center text-muted-foreground">Loading course records from MongoDB…</Panel>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {filteredCourses.map((course: any) => (
            <Panel key={course.id} className="space-y-4 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <ExamTag exam={course.exam} />
                    <Tag tone="muted">{course.duration_weeks} Weeks</Tag>
                  </div>
                  <h3 className="font-display mt-2 text-2xl">{course.name}</h3>
                </div>
                <div className="text-right">
                  <div className="eyebrow">Course Fee</div>
                  <div className="tabular text-lg font-semibold text-primary">
                    ₹{Number(course.fee).toLocaleString("en-IN")}
                  </div>
                </div>
              </div>

              <div className="border-t pt-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-medium uppercase tracking-wider">Scheduled Batches ({course.batches?.length || 0})</span>
                  <span>Max Capacity: 40/batch</span>
                </div>
                <div className="mt-2.5 space-y-2">
                  {(course.batches || []).map((batch: any) => (
                    <div
                      key={batch.id}
                      className="flex items-center justify-between rounded-sm border bg-background px-3 py-2 text-xs"
                    >
                      <div className="flex items-center gap-2 font-medium">
                        <BookOpen className="size-3.5 text-muted-foreground" />
                        <span>{batch.name.split("—")[1]?.trim() || batch.name}</span>
                      </div>
                      <div className="flex items-center gap-3 tabular text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="size-3" /> {batch.start_date}
                        </span>
                        <Tag tone={batch.mode === "Online" ? "primary" : "ink"}>{batch.mode}</Tag>
                      </div>
                    </div>
                  ))}
                  {(!course.batches || course.batches.length === 0) && (
                    <div className="py-2 text-center text-xs text-muted-foreground">No active batches yet.</div>
                  )}
                </div>
              </div>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}
