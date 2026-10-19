import crypto from "node:crypto";
import { getDb } from "./db";
import {
  hashPassword,
  comparePassword,
  generateToken,
  verifyToken,
  type AuthUser,
} from "./auth";
import { moveStudentStage, convertLead } from "./rpc";

export async function handleApiRequest(
  url: URL,
  method: string,
  headers: Headers,
  bodyText?: string
): Promise<Response> {
  const pathname = url.pathname;

  // Extract auth token
  const authHeader = headers.get("authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  const user = token ? verifyToken(token) : null;

  try {
    const body = bodyText ? JSON.parse(bodyText) : {};

    // 1. AUTH ROUTES
    if (pathname === "/api/auth/signup" && method === "POST") {
      const { email, password, full_name } = body;
      if (!email || !password) {
        return jsonResponse({ error: { message: "Email and password are required" } }, 400);
      }
      const db = await getDb();
      const existing = await db.collection("users").findOne({ email: email.toLowerCase() });
      if (existing) {
        return jsonResponse({ error: { message: "User already registered" } }, 400);
      }

      const userId = crypto.randomUUID();
      const passwordHash = await hashPassword(password);
      const name = full_name || email.split("@")[0];
      const now = new Date().toISOString();

      const newUser = {
        id: userId,
        email: email.toLowerCase(),
        password_hash: passwordHash,
        full_name: name,
        created_at: now,
      };
      await db.collection("users").insertOne(newUser);

      // First user becomes super_admin
      const rolesCount = await db.collection("user_roles").countDocuments();
      if (rolesCount === 0) {
        await db.collection("user_roles").insertOne({
          id: crypto.randomUUID(),
          user_id: userId,
          role: "super_admin",
          created_at: now,
        });
      }

      await db.collection("profiles").insertOne({
        id: userId,
        full_name: name,
        email: email.toLowerCase(),
        created_at: now,
      });

      const authUser: AuthUser = {
        id: userId,
        email: email.toLowerCase(),
        full_name: name,
        user_metadata: { full_name: name },
      };
      const jwtToken = generateToken(authUser);

      return jsonResponse({
        data: {
          user: authUser,
          session: { access_token: jwtToken, user: authUser },
        },
      });
    }

    if (pathname === "/api/auth/signin" && method === "POST") {
      const { email, password } = body;
      const db = await getDb();
      const userDoc = await db.collection("users").findOne({ email: email?.toLowerCase() });
      if (!userDoc) {
        return jsonResponse({ error: { message: "Invalid login credentials" } }, 400);
      }

      const valid = await comparePassword(password, userDoc.password_hash);
      if (!valid) {
        return jsonResponse({ error: { message: "Invalid login credentials" } }, 400);
      }

      const roles = await db
        .collection("user_roles")
        .find({ user_id: userDoc.id })
        .toArray();

      const authUser: AuthUser = {
        id: userDoc.id,
        email: userDoc.email,
        full_name: userDoc.full_name,
        user_metadata: { full_name: userDoc.full_name },
        roles: roles.map((r) => r.role),
      };
      const jwtToken = generateToken(authUser);

      return jsonResponse({
        data: {
          user: authUser,
          session: { access_token: jwtToken, user: authUser },
        },
      });
    }

    if (pathname === "/api/auth/user" && method === "GET") {
      if (!user) {
        return jsonResponse({ data: { user: null } });
      }
      const db = await getDb();
      const userDoc = await db.collection("users").findOne({ id: user.id });
      if (!userDoc) {
        return jsonResponse({ data: { user: null } });
      }
      const roles = await db
        .collection("user_roles")
        .find({ user_id: user.id })
        .toArray();

      return jsonResponse({
        data: {
          user: {
            ...user,
            roles: roles.map((r) => r.role),
          },
        },
      });
    }

    // 2. RPC FUNCTIONS
    if (pathname.startsWith("/api/rpc/")) {
      const fnName = pathname.replace("/api/rpc/", "");
      if (fnName === "move_student_stage") {
        const res = await moveStudentStage(body, user);
        return jsonResponse({ data: res });
      }
      if (fnName === "convert_lead") {
        const studentId = await convertLead(body, user);
        return jsonResponse({ data: studentId });
      }
      return jsonResponse({ error: { message: `Unknown RPC function ${fnName}` } }, 404);
    }

    // 3. DATABASE QUERY HANDLER
    if (pathname === "/api/db/query" && method === "POST") {
      const { collection, action, filter = {}, sort, limit, single, maybeSingle, data } = body;
      const db = await getDb();
      const col = db.collection(collection);

      // Clean filter: map id lookups properly
      const mongoFilter = buildMongoFilter(filter);

      if (action === "select") {
        let cursor = col.find(mongoFilter, { projection: { _id: 0 } });
        if (sort && Object.keys(sort).length > 0) {
          cursor = cursor.sort(sort);
        }
        if (limit) {
          cursor = cursor.limit(limit);
        }

        let items = await cursor.toArray();

        // Populate embedded relations
        items = await populateRelations(db, collection, items);

        if (single) {
          if (!items.length) {
            return jsonResponse({ error: { message: "No rows found" }, data: null });
          }
          return jsonResponse({ data: items[0] });
        }
        if (maybeSingle) {
          return jsonResponse({ data: items.length > 0 ? items[0] : null });
        }

        return jsonResponse({ data: items });
      }

      if (action === "insert") {
        const records = Array.isArray(data) ? data : [data];
        const now = new Date().toISOString();
        const docs = records.map((r) => ({
          id: r.id || crypto.randomUUID(),
          ...r,
          created_at: r.created_at || now,
          updated_at: r.updated_at || now,
        }));

        await col.insertMany(docs);
        const inserted = docs.map((d) => {
          const { _id, ...rest } = d as any;
          return rest;
        });

        return jsonResponse({ data: Array.isArray(data) ? inserted : inserted[0] });
      }

      if (action === "update") {
        const now = new Date().toISOString();
        const updateDoc = { ...data, updated_at: now };
        await col.updateMany(mongoFilter, { $set: updateDoc });

        const updatedItems = await col.find(mongoFilter, { projection: { _id: 0 } }).toArray();
        return jsonResponse({
          data: single || maybeSingle ? (updatedItems[0] || null) : updatedItems,
        });
      }

      if (action === "delete") {
        await col.deleteMany(mongoFilter);
        return jsonResponse({ data: true });
      }
    }

    return jsonResponse({ error: { message: "Not found" } }, 404);
  } catch (err: any) {
    console.error("API error:", err);
    return jsonResponse({ error: { message: err.message || "Internal server error" } }, 500);
  }
}

function buildMongoFilter(filter: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, val] of Object.entries(filter)) {
    if (val && typeof val === "object" && !Array.isArray(val)) {
      if ("$in" in val) {
        result[key] = { $in: val.$in };
      } else if ("$nin" in val) {
        result[key] = { $nin: val.$nin };
      } else if ("$ne" in val) {
        result[key] = { $ne: val.$ne };
      } else {
        result[key] = val;
      }
    } else {
      result[key] = val;
    }
  }
  return result;
}

async function populateRelations(db: any, collection: string, items: any[]): Promise<any[]> {
  if (!items.length) return items;

  if (collection === "students") {
    // Populate journey_stages and enrolments (with course and batch)
    const stageIds = [...new Set(items.map((s) => s.stage_id).filter(Boolean))];
    const stages = await db
      .collection("journey_stages")
      .find({ id: { $in: stageIds } }, { projection: { _id: 0 } })
      .toArray();
    const stageMap = new Map(stages.map((s: any) => [s.id, s]));

    const studentIds = items.map((s) => s.id);
    const enrolments = await db
      .collection("enrolments")
      .find({ student_id: { $in: studentIds } }, { projection: { _id: 0 } })
      .toArray();

    const courseIds = [...new Set(enrolments.map((e: any) => e.course_id).filter(Boolean))];
    const batchIds = [...new Set(enrolments.map((e: any) => e.batch_id).filter(Boolean))];

    const courses = await db
      .collection("courses")
      .find({ id: { $in: courseIds } }, { projection: { _id: 0 } })
      .toArray();
    const batches = await db
      .collection("batches")
      .find({ id: { $in: batchIds } }, { projection: { _id: 0 } })
      .toArray();

    const courseMap = new Map(courses.map((c: any) => [c.id, c]));
    const batchMap = new Map(batches.map((b: any) => [b.id, b]));

    const enrolmentsByStudent = new Map<string, any[]>();
    for (const e of enrolments) {
      const enriched = {
        ...e,
        courses: courseMap.get(e.course_id) || null,
        batches: batchMap.get(e.batch_id) || null,
      };
      const list = enrolmentsByStudent.get(e.student_id) || [];
      list.push(enriched);
      enrolmentsByStudent.set(e.student_id, list);
    }

    return items.map((s) => ({
      ...s,
      journey_stages: stageMap.get(s.stage_id) || null,
      enrolments: enrolmentsByStudent.get(s.id) || [],
    }));
  }

  if (collection === "courses") {
    const courseIds = items.map((c) => c.id);
    const batches = await db
      .collection("batches")
      .find({ course_id: { $in: courseIds } }, { projection: { _id: 0 } })
      .toArray();

    const batchesByCourse = new Map<string, any[]>();
    for (const b of batches) {
      const list = batchesByCourse.get(b.course_id) || [];
      list.push(b);
      batchesByCourse.set(b.course_id, list);
    }

    return items.map((c) => ({
      ...c,
      batches: batchesByCourse.get(c.id) || [],
    }));
  }

  if (collection === "counselling_sessions") {
    const leadIds = [...new Set(items.map((cs) => cs.lead_id).filter(Boolean))];
    const courseIds = [...new Set(items.map((cs) => cs.recommended_course_id).filter(Boolean))];

    const leads = await db
      .collection("leads")
      .find({ id: { $in: leadIds } }, { projection: { _id: 0 } })
      .toArray();
    const courses = await db
      .collection("courses")
      .find({ id: { $in: courseIds } }, { projection: { _id: 0 } })
      .toArray();

    const leadMap = new Map(leads.map((l: any) => [l.id, l]));
    const courseMap = new Map(courses.map((c: any) => [c.id, c]));

    return items.map((cs) => ({
      ...cs,
      leads: leadMap.get(cs.lead_id) || null,
      courses: courseMap.get(cs.recommended_course_id) || null,
    }));
  }

  return items;
}

function jsonResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
