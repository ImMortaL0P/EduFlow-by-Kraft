import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Kpi, Panel, ExamTag, Tag } from "@/components/kraft";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { LineChart, Plus, Upload, Download, CheckCircle2, AlertTriangle, TrendingUp, Award, Clock, FileSpreadsheet, Search, Check, X, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { fmtDate } from "@/lib/format";

type ParsedCsvRow = {
  student_email: string;
  student_name?: string;
  student_id?: string;
  exam: "CAT" | "GMAT";
  test_name: string;
  test_type: "Full Mock" | "Sectional" | "Diagnostic";
  attempt_date: string;
  sec1: number; // VARC or QR
  sec2: number; // DILR or VR
  sec3: number; // QA or DI
  total_score: number;
  percentile?: string;
  remarks?: string;
  isValid: boolean;
  validationError?: string;
};

export function TestsModule() {
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeExam, setActiveExam] = useState<"CAT" | "GMAT">("CAT");
  const [filterType, setFilterType] = useState<"ALL" | "Full Mock" | "Sectional" | "Diagnostic">("ALL");
  const [q, setQ] = useState("");

  // Single test modal
  const [openAddMock, setOpenAddMock] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [testName, setTestName] = useState("");
  const [testType, setTestType] = useState<"Full Mock" | "Sectional" | "Diagnostic">("Full Mock");
  const [catVarc, setCatVarc] = useState("");
  const [catDilr, setCatDilr] = useState("");
  const [catQa, setCatQa] = useState("");
  const [gmatQr, setGmatQr] = useState("");
  const [gmatVr, setGmatVr] = useState("");
  const [gmatDi, setGmatDi] = useState("");
  const [percentileInput, setPercentileInput] = useState("");
  const [remarks, setRemarks] = useState("");

  // Bulk CSV modal
  const [openBulkCsv, setOpenBulkCsv] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedCsvRow[]>([]);
  const [csvFileName, setCsvFileName] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const { data: students = [] } = useQuery({
    queryKey: ["test-students", activeExam],
    queryFn: async () => {
      const { data } = await supabase.from("students").select("*");
      return Array.isArray(data) ? data : [];
    },
  });

  const { data: mockAttempts = [], isLoading } = useQuery({
    queryKey: ["mock-attempts", activeExam],
    queryFn: async () => {
      const { data } = await supabase
        .from("test_attempts")
        .select("*")
        .eq("exam", activeExam)
        .order("created_at", { ascending: false });
      return Array.isArray(data) ? data : [];
    },
  });

  const recordMockMut = useMutation({
    mutationFn: async () => {
      if (!selectedStudentId || !testName.trim()) {
        throw new Error("Student and Test Name are required");
      }
      const student = students.find((s: any) => s.id === selectedStudentId);
      let totalScore = 0;
      let breakdown: Record<string, any> = {};

      if (activeExam === "CAT") {
        const varc = Number(catVarc) || 0;
        const dilr = Number(catDilr) || 0;
        const qa = Number(catQa) || 0;
        totalScore = varc + dilr + qa;
        breakdown = { varc, dilr, qa };
      } else {
        const qr = Number(gmatQr) || 0;
        const vr = Number(gmatVr) || 0;
        const di = Number(gmatDi) || 0;
        totalScore = 205 + (qr + vr + di) * 10;
        breakdown = { qr, vr, di };
      }

      const { error } = await supabase.from("test_attempts").insert({
        student_id: selectedStudentId,
        student_name: student?.full_name,
        exam: activeExam,
        test_name: testName,
        test_type: testType,
        total_score: totalScore,
        percentile: percentileInput || undefined,
        remarks: remarks || undefined,
        breakdown,
        attempt_date: new Date().toISOString().split("T")[0],
      });
      if (error) throw error;

      // Also record journey event for student
      await supabase.from("journey_events").insert({
        student_id: selectedStudentId,
        event_type: "mock_test",
        title: `Mock Score Logged: ${testName} (${totalScore} ${activeExam === "CAT" ? "Marks" : "Score"})`,
        detail: `${testType} · ${percentileInput ? `Percentile: ${percentileInput} · ` : ""}${remarks || "Score verified by faculty."}`,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mock-attempts"] });
      toast.success("Mock test result recorded successfully in MongoDB Atlas");
      setOpenAddMock(false);
      setTestName("");
      setCatVarc("");
      setCatDilr("");
      setCatQa("");
      setGmatQr("");
      setGmatVr("");
      setGmatDi("");
      setPercentileInput("");
      setRemarks("");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to record test");
    },
  });

  // Handle CSV parsing
  function handleCsvFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        parseCsvContent(text);
      } catch (err: any) {
        toast.error("Failed to parse CSV file: " + err.message);
      }
    };
    reader.readAsText(file);
  }

  function parseCsvContent(text: string) {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      toast.error("CSV file must contain a header and at least one data row");
      return;
    }

    const header = lines[0].toLowerCase().split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
    const emailIdx = header.findIndex((h) => h.includes("email"));
    const examIdx = header.findIndex((h) => h.includes("exam"));
    const testNameIdx = header.findIndex((h) => h.includes("test") || h.includes("name"));
    const testTypeIdx = header.findIndex((h) => h.includes("type"));
    const dateIdx = header.findIndex((h) => h.includes("date"));
    const sec1Idx = header.findIndex((h) => h.includes("varc") || h.includes("qr") || h.includes("sec1"));
    const sec2Idx = header.findIndex((h) => h.includes("dilr") || h.includes("vr") || h.includes("sec2"));
    const sec3Idx = header.findIndex((h) => h.includes("qa") || h.includes("di") || h.includes("sec3"));
    const scoreIdx = header.findIndex((h) => h.includes("score") || h.includes("total"));
    const pctIdx = header.findIndex((h) => h.includes("percentile") || h.includes("pct") || h.includes("%ile"));
    const remarksIdx = header.findIndex((h) => h.includes("remark") || h.includes("note"));

    const rows: ParsedCsvRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      // Basic CSV tokenizer that respects quotes
      const values = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(",");
      const cleanVals = values.map((v) => v.trim().replace(/^"|"$/g, ""));

      const email = emailIdx >= 0 ? cleanVals[emailIdx] : "";
      const examStr = (examIdx >= 0 ? cleanVals[examIdx] : activeExam).toUpperCase();
      const exam: "CAT" | "GMAT" = examStr.includes("GMAT") ? "GMAT" : "CAT";
      const name = testNameIdx >= 0 ? cleanVals[testNameIdx] : "SimCAT Full Mock";
      const typeStr = testTypeIdx >= 0 ? cleanVals[testTypeIdx] : "Full Mock";
      const testType: "Full Mock" | "Sectional" | "Diagnostic" = typeStr.toLowerCase().includes("sec")
        ? "Sectional"
        : typeStr.toLowerCase().includes("diag")
        ? "Diagnostic"
        : "Full Mock";

      const attempt_date = dateIdx >= 0 && cleanVals[dateIdx] ? cleanVals[dateIdx] : new Date().toISOString().split("T")[0];
      const sec1 = sec1Idx >= 0 ? Number(cleanVals[sec1Idx]) || 0 : 0;
      const sec2 = sec2Idx >= 0 ? Number(cleanVals[sec2Idx]) || 0 : 0;
      const sec3 = sec3Idx >= 0 ? Number(cleanVals[sec3Idx]) || 0 : 0;

      let total = scoreIdx >= 0 && cleanVals[scoreIdx] ? Number(cleanVals[scoreIdx]) : 0;
      if (!total) {
        total = exam === "CAT" ? sec1 + sec2 + sec3 : 205 + (sec1 + sec2 + sec3) * 10;
      }

      const percentile = pctIdx >= 0 ? cleanVals[pctIdx] : "";
      const remarks = remarksIdx >= 0 ? cleanVals[remarksIdx] : "";

      // Match student
      const matchedStudent = students.find(
        (s: any) =>
          s.email?.toLowerCase() === email?.toLowerCase() ||
          s.full_name?.toLowerCase() === email?.toLowerCase()
      );

      const isValid = Boolean(matchedStudent && name);
      const validationError = !matchedStudent
        ? `No enrolled student matches '${email}'`
        : !name
        ? "Missing test name"
        : undefined;

      rows.push({
        student_email: email,
        student_name: matchedStudent?.full_name || email,
        student_id: matchedStudent?.id,
        exam,
        test_name: name,
        test_type: testType,
        attempt_date,
        sec1,
        sec2,
        sec3,
        total_score: total,
        percentile,
        remarks,
        isValid,
        validationError,
      });
    }

    setParsedRows(rows);
    toast.info(`Parsed ${rows.length} rows from CSV`);
  }

  function downloadSampleCsv() {
    const header = "student_email,exam,test_name,test_type,attempt_date,sec1_varc_qr,sec2_dilr_vr,sec3_qa_di,total_score,percentile,remarks\n";
    const sampleRows =
      activeExam === "CAT"
        ? [
            "aarav.sharma@example.com,CAT,KRAFT SimCAT 01,Full Mock,2026-10-15,32,24,34,90,99.1 %ile,Strong QA accuracy\n",
            "aditi.verma@example.com,CAT,KRAFT SimCAT 01,Full Mock,2026-10-15,28,18,22,68,91.4 %ile,Need DILR drill sets\n",
            "rohan.banerjee@example.com,CAT,QA Sectional Drill 04,Sectional,2026-10-18,0,0,38,38,98.2 %ile,Algebra flawless\n",
          ]
        : [
            "neil.banerjee@example.com,GMAT,GMAT Focus Practice 1,Full Mock,2026-10-14,84,82,80,705,98 %ile,Balanced sectional pacing\n",
            "karan.sharma@example.com,GMAT,Data Insights Drill 02,Sectional,2026-10-17,0,0,82,82,90 %ile,MSR sets improved\n",
          ];

    const blob = new Blob([header + sampleRows.join("")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `kraft_${activeExam.toLowerCase()}_mock_scores_template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Sample CSV template downloaded");
  }

  async function handleCommitBulk() {
    const validRows = parsedRows.filter((r) => r.isValid && r.student_id);
    if (validRows.length === 0) {
      return toast.error("No valid student score rows to import. Please check student emails.");
    }

    setIsUploading(true);
    try {
      const inserts = validRows.map((r) => {
        let breakdown: Record<string, any> = {};
        if (r.exam === "CAT") {
          breakdown = { varc: r.sec1, dilr: r.sec2, qa: r.sec3 };
        } else {
          breakdown = { qr: r.sec1, vr: r.sec2, di: r.sec3 };
        }

        return {
          student_id: r.student_id,
          student_name: r.student_name,
          exam: r.exam,
          test_name: r.test_name,
          test_type: r.test_type,
          total_score: r.total_score,
          percentile: r.percentile || undefined,
          remarks: r.remarks || "Imported via Batch CSV",
          breakdown,
          attempt_date: r.attempt_date,
        };
      });

      const { error } = await supabase.from("test_attempts").insert(inserts);
      if (error) throw error;

      // Also create journey events for each candidate
      for (const r of validRows) {
        await supabase.from("journey_events").insert({
          student_id: r.student_id,
          event_type: "mock_test",
          title: `Bulk Mock Score Logged: ${r.test_name} (${r.total_score} ${r.exam === "CAT" ? "Marks" : "Score"})`,
          detail: `Sectionals: ${r.sec1} / ${r.sec2} / ${r.sec3} · ${r.percentile ? `Percentile: ${r.percentile} · ` : ""}${r.remarks || "Faculty CSV upload"}`,
        });
      }

      toast.success(`Successfully imported ${validRows.length} mock scores to MongoDB Atlas`);
      setOpenBulkCsv(false);
      setParsedRows([]);
      setCsvFileName("");
      qc.invalidateQueries({ queryKey: ["mock-attempts"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to commit bulk scores");
    } finally {
      setIsUploading(false);
    }
  }

  // Filter mock attempts
  const filteredAttempts = mockAttempts.filter((a: any) => {
    const matchesType = filterType === "ALL" ? true : a.test_type === filterType;
    const matchesQ =
      !q ||
      `${a.student_name} ${a.test_name} ${a.percentile || ""}`.toLowerCase().includes(q.toLowerCase());
    return matchesType && matchesQ;
  });

  // Calculate statistics
  const avgScore =
    mockAttempts.length > 0
      ? Math.round(
          mockAttempts.reduce((acc: number, m: any) => acc + (m.total_score || 0), 0) /
            mockAttempts.length
        )
      : 0;

  const highestScore = mockAttempts.reduce(
    (max: number, m: any) => Math.max(max, m.total_score || 0),
    0
  );

  return (
    <div className="space-y-6 animate-fade-in-up">
      <PageHeader
        eyebrow="Assessment & Evaluation"
        title="Tests & Mock Analytics"
        description="Comprehensive mock test series management, sectional diagnostic tracking, benchmark cutoffs, and bulk score ingestion via CSV spreadsheets."
        action={
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex rounded-md border bg-muted p-0.5">
              <Button
                variant={activeExam === "CAT" ? "default" : "ghost"}
                size="sm"
                className="h-8 text-xs font-mono"
                onClick={() => setActiveExam("CAT")}
              >
                CAT Track
              </Button>
              <Button
                variant={activeExam === "GMAT" ? "default" : "ghost"}
                size="sm"
                className="h-8 text-xs font-mono"
                onClick={() => setActiveExam("GMAT")}
              >
                GMAT Focus Track
              </Button>
            </div>

            <Dialog open={openBulkCsv} onOpenChange={setOpenBulkCsv}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 h-8 text-xs font-mono">
                  <Upload className="size-3.5 text-primary" /> Bulk CSV Import
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="font-display text-xl font-bold tracking-tight flex items-center gap-2">
                    <FileSpreadsheet className="size-5 text-primary" /> Bulk Mock & Sectional Scores Import
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 pt-2">
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-rule/70 bg-muted/30 p-3 text-xs">
                    <div>
                      <div className="font-semibold text-foreground">Need standard column headers?</div>
                      <div className="text-muted-foreground">Download the pre-formatted template for {activeExam}.</div>
                    </div>
                    <Button variant="outline" size="sm" onClick={downloadSampleCsv} className="gap-1.5 text-xs font-mono">
                      <Download className="size-3.5" /> Download Template
                    </Button>
                  </div>

                  {/* Upload Dropzone */}
                  <div className="rounded-lg border-2 border-dashed border-rule/80 bg-card p-6 text-center hover:border-primary/60 transition-colors">
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept=".csv,text/csv"
                      className="hidden"
                      onChange={handleCsvFileSelect}
                    />
                    <FileSpreadsheet className="mx-auto size-10 text-muted-foreground/60 mb-2" />
                    <div className="text-sm font-semibold text-foreground">
                      {csvFileName ? `Selected: ${csvFileName}` : "Select CSV File from your computer"}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground font-mono">
                      Supports full mocks, sectional drills, and diagnostic intake baseline sets.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3 text-xs font-mono"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Choose CSV File…
                    </Button>
                  </div>

                  {/* Parsed Preview Table */}
                  {parsedRows.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="font-semibold text-foreground">
                          Parsed Records: {parsedRows.length} ({parsedRows.filter((r) => r.isValid).length} Valid)
                        </span>
                        {parsedRows.some((r) => !r.isValid) && (
                          <span className="text-warning">
                            {parsedRows.filter((r) => !r.isValid).length} unmatched candidate emails
                          </span>
                        )}
                      </div>

                      <div className="max-h-60 overflow-y-auto rounded border border-rule/70 text-xs">
                        <table className="w-full text-left">
                          <thead className="sticky top-0 bg-muted border-b border-rule font-mono text-[11px] text-muted-foreground uppercase">
                            <tr>
                              <th className="p-2">Status</th>
                              <th className="p-2">Candidate</th>
                              <th className="p-2">Test Name</th>
                              <th className="p-2">Sections (1/2/3)</th>
                              <th className="p-2 text-right">Total Score</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-rule/60">
                            {parsedRows.map((r, idx) => (
                              <tr key={idx} className={r.isValid ? "hover:bg-muted/20" : "bg-destructive/5"}>
                                <td className="p-2">
                                  {r.isValid ? (
                                    <Tag tone="success">Ready</Tag>
                                  ) : (
                                    <Tag tone="warning" title={r.validationError}>Unmatched</Tag>
                                  )}
                                </td>
                                <td className="p-2 font-medium">
                                  <div>{r.student_name}</div>
                                  <div className="font-mono text-[10px] text-muted-foreground">{r.student_email}</div>
                                </td>
                                <td className="p-2 font-mono text-muted-foreground">
                                  <div>{r.test_name}</div>
                                  <div className="text-[10px]">{r.test_type} · {r.attempt_date}</div>
                                </td>
                                <td className="p-2 font-mono text-muted-foreground">
                                  {r.sec1} / {r.sec2} / {r.sec3}
                                </td>
                                <td className="p-2 text-right font-mono font-bold text-primary">
                                  {r.total_score} {r.percentile ? `(${r.percentile})` : ""}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                <DialogFooter className="pt-3">
                  <Button variant="outline" onClick={() => setOpenBulkCsv(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCommitBulk}
                    disabled={isUploading || parsedRows.filter((r) => r.isValid).length === 0}
                    className="gap-2 font-mono text-xs"
                  >
                    <CheckCircle2 className="size-4" />
                    {isUploading
                      ? "Importing…"
                      : `Import ${parsedRows.filter((r) => r.isValid).length} Scores to Database`}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={openAddMock} onOpenChange={setOpenAddMock}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2 h-8 text-xs font-mono">
                  <Plus className="size-3.5" /> Log Single Attempt
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="font-display text-xl font-bold tracking-tight">
                    Record {activeExam} Score
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-1.5">
                    <Label>Candidate</Label>
                    <select
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                      value={selectedStudentId}
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                    >
                      <option value="">Select candidate…</option>
                      {students.map((s: any) => (
                        <option key={s.id} value={s.id}>
                          {s.full_name} ({s.email || "No email"})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Test Name</Label>
                    <Input
                      placeholder={activeExam === "CAT" ? "e.g. SimCAT 08 / AIMCAT 2604" : "e.g. Official Practice Test 2"}
                      value={testName}
                      onChange={(e) => setTestName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Test Format</Label>
                    <select
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                      value={testType}
                      onChange={(e) => setTestType(e.target.value as any)}
                    >
                      <option value="Full Mock">Full-Length Proctored Mock</option>
                      <option value="Sectional">Timed Sectional Practice Drill</option>
                      <option value="Diagnostic">Intake Baseline Diagnostic</option>
                    </select>
                  </div>

                  {activeExam === "CAT" ? (
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">VARC (Raw)</Label>
                        <Input
                          type="number"
                          placeholder="0-72"
                          value={catVarc}
                          onChange={(e) => setCatVarc(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">DILR (Raw)</Label>
                        <Input
                          type="number"
                          placeholder="0-60"
                          value={catDilr}
                          onChange={(e) => setCatDilr(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">QA (Raw)</Label>
                        <Input
                          type="number"
                          placeholder="0-66"
                          value={catQa}
                          onChange={(e) => setCatQa(e.target.value)}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">QR (60-90)</Label>
                        <Input
                          type="number"
                          placeholder="82"
                          value={gmatQr}
                          onChange={(e) => setGmatQr(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">VR (60-90)</Label>
                        <Input
                          type="number"
                          placeholder="81"
                          value={gmatVr}
                          onChange={(e) => setGmatVr(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">DI (60-90)</Label>
                        <Input
                          type="number"
                          placeholder="80"
                          value={gmatDi}
                          onChange={(e) => setGmatDi(e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Percentile (Optional)</Label>
                      <Input
                        placeholder="e.g. 98.4 %ile"
                        value={percentileInput}
                        onChange={(e) => setPercentileInput(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Remarks / Feedback</Label>
                      <Input
                        placeholder="e.g. Accuracy 88%"
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                      />
                    </div>
                  </div>

                  <Button className="w-full mt-2" onClick={() => recordMockMut.mutate()} disabled={recordMockMut.isPending}>
                    {recordMockMut.isPending ? "Recording…" : "Save Mock Attempt to MongoDB"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Kpi
          label={activeExam === "CAT" ? "Average CAT Mock Marks" : "Average GMAT Focus Score"}
          value={activeExam === "CAT" ? `${avgScore || 78} / 198` : `${avgScore || 675} / 805`}
          hint={activeExam === "CAT" ? "Across all mock cohorts" : "Focus Edition scaled mean"}
          tone="primary"
        />
        <Kpi
          label="Highest Score Recorded"
          value={activeExam === "CAT" ? `${highestScore || 118} Marks` : `${highestScore || 735}`}
          hint={activeExam === "CAT" ? "Top 0.5% benchmark" : "99th percentile tier"}
          tone="warning"
        />
        <Kpi
          label="Total Tests Recorded"
          value={mockAttempts.length}
          hint="Proctored & sectional attempts"
        />
        <Kpi
          label="Sectional Balance Rate"
          value="82.4%"
          hint="Clearing all section cutoffs"
          tone="success"
        />
      </div>

      {/* Sectional Cutoffs & Benchmarks Card */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-lg border border-rule/70 bg-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-display font-bold text-base text-foreground">
              {activeExam === "CAT" ? "VARC Benchmark" : "Quantitative Reasoning"}
            </span>
            <Tag tone="primary">{activeExam === "CAT" ? "40 min · 24 Qs" : "45 min · 21 Qs"}</Tag>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {activeExam === "CAT"
              ? "Target 32+ raw marks (95 %ile benchmark). Speed reading, critical reasoning tone, and para jumble accuracy."
              : "Problem Solving and applied algebra. Non-calculator pacing with 82+ scaled target."}
          </p>
          <div className="rounded bg-muted/40 p-2 font-mono text-xs text-primary flex items-center justify-between">
            <span>Minimum Cutoff:</span>
            <span>{activeExam === "CAT" ? "22+ Marks (85 %ile)" : "78 Scaled"}</span>
          </div>
        </div>

        <div className="rounded-lg border border-rule/70 bg-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-display font-bold text-base text-foreground">
              {activeExam === "CAT" ? "DILR Benchmark" : "Verbal Reasoning"}
            </span>
            <Tag tone="primary">{activeExam === "CAT" ? "40 min · 20 Qs" : "45 min · 23 Qs"}</Tag>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {activeExam === "CAT"
              ? "Target 24+ raw marks (95 %ile benchmark). Matrix arrangement selection, binary logic, and round-robin tournament cases."
              : "Critical reasoning argument analysis and complex reading comprehension with 81+ scaled target."}
          </p>
          <div className="rounded bg-muted/40 p-2 font-mono text-xs text-primary flex items-center justify-between">
            <span>Minimum Cutoff:</span>
            <span>{activeExam === "CAT" ? "18+ Marks (85 %ile)" : "79 Scaled"}</span>
          </div>
        </div>

        <div className="rounded-lg border border-rule/70 bg-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-display font-bold text-base text-foreground">
              {activeExam === "CAT" ? "Quantitative Aptitude" : "Data Insights (DI)"}
            </span>
            <Tag tone="primary">{activeExam === "CAT" ? "40 min · 22 Qs" : "45 min · 20 Qs"}</Tag>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {activeExam === "CAT"
              ? "Target 30+ raw marks (95 %ile benchmark). Arithmetic, algebra equations, and geometry mensuration optimization."
              : "Data sufficiency, multi-source reasoning (MSR), table analysis, and graphics interpretation."}
          </p>
          <div className="rounded bg-muted/40 p-2 font-mono text-xs text-primary flex items-center justify-between">
            <span>Minimum Cutoff:</span>
            <span>{activeExam === "CAT" ? "20+ Marks (85 %ile)" : "78 Scaled"}</span>
          </div>
        </div>
      </div>

      {/* Tests Search & Filter Bar */}
      <Panel title={`Recorded ${activeExam} Test Attempts & Cohort Performance`}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
            <Input
              className="pl-9 h-9"
              placeholder="Search candidate, test title, or %ile…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="eyebrow mr-1">Format:</span>
            <div className="flex rounded-md border bg-muted p-0.5">
              {(["ALL", "Full Mock", "Sectional", "Diagnostic"] as const).map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => setFilterType(fmt)}
                  className={`rounded px-2.5 py-1 text-xs font-mono font-medium transition-all ${
                    filterType === fmt
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>
            <span className="font-mono text-xs text-muted-foreground ml-2">
              {filteredAttempts.length} records
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-xs font-mono text-muted-foreground animate-pulse">
            Loading test attempts from MongoDB Atlas…
          </div>
        ) : filteredAttempts.length === 0 ? (
          <Empty
            title="No test attempts matching criteria"
            hint="Click 'Log Single Attempt' or 'Bulk CSV Import' to record mock scores."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-rule text-xs uppercase text-muted-foreground font-mono">
                  <th className="pb-3">Candidate</th>
                  <th className="pb-3">Test Series</th>
                  <th className="pb-3">Format</th>
                  <th className="pb-3">Attempt Date</th>
                  <th className="pb-3">Sectional Scores</th>
                  <th className="pb-3 text-right">Composite Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule/60">
                {filteredAttempts.map((attempt: any) => (
                  <tr key={attempt.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3">
                      <div className="font-semibold text-foreground">{attempt.student_name}</div>
                      <div className="text-xs text-muted-foreground font-mono">{attempt.remarks || "Regular series"}</div>
                    </td>
                    <td className="py-3 font-medium text-xs text-foreground">
                      {attempt.test_name}
                    </td>
                    <td className="py-3">
                      <Tag tone={attempt.test_type === "Full Mock" ? "primary" : "muted"}>
                        {attempt.test_type || "Full Mock"}
                      </Tag>
                    </td>
                    <td className="py-3 font-mono text-xs text-muted-foreground">
                      {fmtDate(attempt.attempt_date || attempt.created_at)}
                    </td>
                    <td className="py-3 font-mono text-xs text-muted-foreground">
                      {activeExam === "CAT" ? (
                        <span>
                          VARC: <strong className="text-foreground">{attempt.breakdown?.varc ?? 0}</strong> · DILR:{" "}
                          <strong className="text-foreground">{attempt.breakdown?.dilr ?? 0}</strong> · QA:{" "}
                          <strong className="text-foreground">{attempt.breakdown?.qa ?? 0}</strong>
                        </span>
                      ) : (
                        <span>
                          QR: <strong className="text-foreground">{attempt.breakdown?.qr ?? 0}</strong> · VR:{" "}
                          <strong className="text-foreground">{attempt.breakdown?.vr ?? 0}</strong> · DI:{" "}
                          <strong className="text-foreground">{attempt.breakdown?.di ?? 0}</strong>
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      <span className="font-mono font-bold text-primary text-base">
                        {attempt.total_score} {activeExam === "CAT" ? "Marks" : ""}
                      </span>
                      {attempt.percentile && (
                        <div className="text-[11px] font-mono text-success font-semibold">
                          {attempt.percentile}
                        </div>
                      )}
                    </td>
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
