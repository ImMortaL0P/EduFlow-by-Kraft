import crypto from "node:crypto";
import { getDb } from "./db";
import type { AuthUser } from "./auth";

export async function moveStudentStage(
  params: { _student_id: string; _stage_id: string; _note?: string | null },
  user: AuthUser | null
) {
  const db = await getDb();
  const student = await db.collection("students").findOne({ id: params._student_id });
  if (!student) {
    throw new Error("Student not found");
  }

  const stage = await db.collection("journey_stages").findOne({ id: params._stage_id });
  if (!stage) {
    throw new Error("Target stage not found");
  }

  const fromStageId = student.stage_id;
  if (fromStageId === params._stage_id) return { success: true };

  await db.collection("students").updateOne(
    { id: params._student_id },
    { $set: { stage_id: params._stage_id, updated_at: new Date().toISOString() } }
  );

  await db.collection("journey_events").insertOne({
    id: crypto.randomUUID(),
    student_id: params._student_id,
    event_type: "stage_change",
    title: `Moved to ${stage.name}`,
    detail: params._note || null,
    from_stage_id: fromStageId,
    to_stage_id: params._stage_id,
    actor_id: user?.id || null,
    visibility: "student",
    created_at: new Date().toISOString(),
  });

  return { success: true };
}

export async function convertLead(
  params: { _lead_id: string; _course_id: string; _batch_id?: string | null; _fee?: number | null },
  user: AuthUser | null
) {
  const db = await getDb();
  const lead = await db.collection("leads").findOne({ id: params._lead_id });
  if (!lead) throw new Error("Lead not found");
  if (lead.status === "converted") throw new Error("Lead already converted");

  const course = await db.collection("courses").findOne({ id: params._course_id });
  if (!course) throw new Error("Course not found");

  const firstStage = await db
    .collection("journey_stages")
    .find({ exam: lead.exam })
    .sort({ position: 1 })
    .limit(1)
    .next();

  if (!firstStage) throw new Error("Journey stage not configured for exam " + lead.exam);

  const studentId = crypto.randomUUID();
  const now = new Date().toISOString();

  await db.collection("students").insertOne({
    id: studentId,
    lead_id: lead.id,
    full_name: lead.full_name,
    email: lead.email,
    phone: lead.phone,
    city: lead.city,
    exam: lead.exam,
    target_year: lead.target_year,
    target_score: lead.target_score,
    stage_id: firstStage.id,
    counsellor_id: lead.assigned_to || user?.id || null,
    status: "active",
    is_demo: false,
    created_at: now,
    updated_at: now,
  });

  await db.collection("enrolments").insertOne({
    id: crypto.randomUUID(),
    student_id: studentId,
    course_id: params._course_id,
    batch_id: params._batch_id || null,
    fee_agreed: params._fee ?? course.fee,
    enrolled_on: now.split("T")[0],
    created_at: now,
  });

  await db.collection("leads").updateOne(
    { id: lead.id },
    { $set: { status: "converted", converted_student_id: studentId, updated_at: now } }
  );

  await db.collection("journey_events").insertOne({
    id: crypto.randomUUID(),
    student_id: studentId,
    lead_id: lead.id,
    event_type: "enrolled",
    title: "Enrolled",
    detail: "Converted from enquiry",
    to_stage_id: firstStage.id,
    actor_id: user?.id || null,
    visibility: "student",
    created_at: now,
  });

  return studentId;
}
