import { MongoClient } from 'mongodb';
import fs from 'node:fs';
import dns from 'node:dns';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

const env = fs.readFileSync('.env', 'utf-8');
const match = env.match(/MONGODB_URI=["']?([^"'\r\n]+)/);
if (!match) {
  console.error("No MONGODB_URI found in .env");
  process.exit(1);
}

// Target database "eduflow"
const rawUri = match[1];
const client = new MongoClient(rawUri, { serverSelectionTimeoutMS: 10000 });

async function seed() {
  try {
    await client.connect();
    console.log("Connected to MongoDB Atlas!");
    const db = client.db('eduflow');

    // Check if stages already exist
    const stageCount = await db.collection('journey_stages').countDocuments();
    if (stageCount > 0) {
      console.log("Database 'eduflow' already seeded (found " + stageCount + " stages). Skipping seed or refreshing indexes.");
    } else {
      console.log("Seeding 'eduflow' database with initial academic structure, stages, demo leads, and students...");

      // 1. STAGES
      const stageNames = [
        { pos: 1, name: 'Onboarding', term: false },
        { pos: 2, name: 'Foundation', term: false },
        { pos: 3, name: 'Practice & Sectionals', term: false },
        { pos: 4, name: 'Mock Phase', term: false },
        { pos: 5, name: 'Exam Registered', term: false },
        { pos: 6, name: 'Exam Taken', term: false },
        { pos: 7, name: 'Applications', term: false },
        { pos: 8, name: 'Interviews', term: false },
        { pos: 9, name: 'Admitted', term: true },
        { pos: 10, name: 'Alumni', term: true },
      ];

      const stages = [];
      for (const exam of ['CAT', 'GMAT']) {
        for (const s of stageNames) {
          stages.push({
            id: crypto.randomUUID(),
            exam,
            name: s.name,
            position: s.pos,
            is_terminal: s.term,
            created_at: new Date().toISOString(),
          });
        }
      }
      await db.collection('journey_stages').insertMany(stages);
      console.log(`Seeded ${stages.length} journey stages.`);

      // 2. COURSES & BATCHES
      const courseDefs = [
        { name: 'CAT Comprehensive Classroom', exam: 'CAT', duration_weeks: 40, fee: 85000 },
        { name: 'CAT Online Live', exam: 'CAT', duration_weeks: 32, fee: 55000 },
        { name: 'CAT Test Series Plus', exam: 'CAT', duration_weeks: 16, fee: 15000 },
        { name: 'GMAT Focus Intensive', exam: 'GMAT', duration_weeks: 12, fee: 95000 },
        { name: 'GMAT Online Self-paced + Mentoring', exam: 'GMAT', duration_weeks: 16, fee: 60000 },
      ];

      const courses = [];
      const batches = [];
      for (const c of courseDefs) {
        const courseId = crypto.randomUUID();
        courses.push({
          id: courseId,
          name: c.name,
          exam: c.exam,
          duration_weeks: c.duration_weeks,
          fee: c.fee,
          is_active: true,
          created_at: new Date().toISOString(),
        });

        const isOnline = c.name.toLowerCase().includes('online');
        batches.push({
          id: crypto.randomUUID(),
          course_id: courseId,
          name: `${c.name} — Jan 2026 Weekend`,
          start_date: '2026-01-10',
          mode: isOnline ? 'Online' : 'Classroom',
          capacity: 40,
          created_at: new Date().toISOString(),
        });
        batches.push({
          id: crypto.randomUUID(),
          course_id: courseId,
          name: `${c.name} — Jun 2026 Weekday`,
          start_date: '2026-06-08',
          mode: isOnline ? 'Online' : 'Classroom',
          capacity: 40,
          created_at: new Date().toISOString(),
        });
      }
      await db.collection('courses').insertMany(courses);
      await db.collection('batches').insertMany(batches);
      console.log(`Seeded ${courses.length} courses and ${batches.length} batches.`);

      // 3. DEMO LEADS
      const firstNames = ['Aarav','Ishita','Rohan','Meera','Kabir','Ananya','Vikram','Sanya','Arjun','Priya','Dev','Nisha','Karan','Tara','Neil','Riya','Aditya','Kavya','Siddharth','Pooja'];
      const lastNames = ['Sharma','Iyer','Mehta','Nair','Kapoor','Reddy','Banerjee','Gupta','Rao','Singh','Joshi','Menon'];
      const cities = ['Delhi','Mumbai','Bengaluru','Pune','Hyderabad','Kolkata','Chennai','Jaipur'];
      const sources = ['Website','Instagram','Referral','Walk-in','Google Ads','Webinar','Alumni','Seminar'];
      const statuses = ['new','contacted','counselling_scheduled','counselled','assessment','negotiation','lost','new','contacted','counselled'];

      const leads = [];
      for (let i = 1; i <= 40; i++) {
        const fn = firstNames[(i - 1) % firstNames.length];
        const ln = lastNames[((i - 1) * 3) % lastNames.length];
        const exam = i % 3 === 0 ? 'GMAT' : 'CAT';
        const matchCourse = courses.filter(c => c.exam === exam).sort((a,b) => b.fee - a.fee)[0];
        const createdDate = new Date(Date.now() - ((i * 37 % 120) * 86400000));
        const nextFollowUp = new Date(Date.now() + (((i % 9) - 3) * 86400000)).toISOString().split('T')[0];

        leads.push({
          id: crypto.randomUUID(),
          full_name: `${fn} ${ln}`,
          email: `${fn.toLowerCase()}.${ln.toLowerCase()}${i}@example.com`,
          phone: `+91 98${String(10000000 + (i * 7919 % 89999999)).slice(0, 8)}`,
          city: cities[(i - 1) % cities.length],
          exam,
          target_year: 2026 + (i % 2),
          source: sources[(i - 1) % sources.length],
          status: statuses[(i - 1) % statuses.length],
          current_score: exam === 'GMAT' ? String(515 + (i * 13 % 120)) : `${55 + (i * 7 % 35)} %ile`,
          target_score: exam === 'GMAT' ? '705+' : '99 %ile',
          work_experience_months: (i * 5) % 48,
          interested_course_id: matchCourse ? matchCourse.id : null,
          next_follow_up: nextFollowUp,
          notes: 'Demo enquiry record',
          is_demo: true,
          created_at: createdDate.toISOString(),
          updated_at: createdDate.toISOString(),
        });
      }
      await db.collection('leads').insertMany(leads);
      console.log(`Seeded ${leads.length} demo leads.`);

      // 4. DEMO STUDENTS & ENROLMENTS
      const studentFn = ['Aditi','Harsh','Ira','Manav','Zoya','Rahul','Simran','Varun','Lavanya','Yash','Esha','Omkar','Tanvi'];
      const studentLn = ['Verma','Pillai','Chopra','Das','Kulkarni','Bhat','Saxena','Agarwal'];
      const students = [];
      const enrolments = [];
      const journeyEvents = [];

      for (let i = 1; i <= 26; i++) {
        const fn = studentFn[(i - 1) % studentFn.length];
        const ln = studentLn[((i - 1) * 5) % studentLn.length];
        const exam = i % 3 === 0 ? 'GMAT' : 'CAT';
        const stagePos = 1 + (i % 8);
        const stage = stages.find(s => s.exam === exam && s.position === stagePos) || stages[0];
        const stage1 = stages.find(s => s.exam === exam && s.position === 1) || stages[0];
        const studentId = crypto.randomUUID();
        const createdDate = new Date(Date.now() - ((60 + i * 9) * 86400000));
        const plannedExamDate = exam === 'GMAT'
          ? new Date(Date.now() + ((20 + i * 6) * 86400000)).toISOString().split('T')[0]
          : '2026-11-29';

        students.push({
          id: studentId,
          full_name: `${fn} ${ln}`,
          email: `${fn.toLowerCase()}.${ln.toLowerCase()}.s${i}@example.com`,
          phone: `+91 97${String(20000000 + (i * 6271 % 79999999)).slice(0, 8)}`,
          city: cities[(i - 1) % 6],
          exam,
          target_year: 2026,
          target_score: exam === 'GMAT' ? '705+' : '99 %ile',
          planned_exam_date: plannedExamDate,
          stage_id: stage.id,
          status: 'active',
          is_demo: true,
          created_at: createdDate.toISOString(),
          updated_at: createdDate.toISOString(),
        });

        // Enrolment
        const course = courses.filter(c => c.exam === exam).sort((a,b) => b.fee - a.fee)[0];
        const batch = batches.find(b => b.course_id === course.id);
        enrolments.push({
          id: crypto.randomUUID(),
          student_id: studentId,
          course_id: course.id,
          batch_id: batch ? batch.id : null,
          enrolled_on: createdDate.toISOString().split('T')[0],
          fee_agreed: course.fee,
          created_at: createdDate.toISOString(),
        });

        // Journey events
        journeyEvents.push({
          id: crypto.randomUUID(),
          student_id: studentId,
          event_type: 'enrolled',
          title: 'Enrolled',
          detail: 'Demo enrolment record',
          to_stage_id: stage1.id,
          visibility: 'student',
          created_at: createdDate.toISOString(),
        });

        if (stage.position > 1) {
          journeyEvents.push({
            id: crypto.randomUUID(),
            student_id: studentId,
            event_type: 'stage_change',
            title: `Moved to ${stage.name}`,
            from_stage_id: stage1.id,
            to_stage_id: stage.id,
            visibility: 'student',
            created_at: new Date(createdDate.getTime() + 21 * 86400000).toISOString(),
          });
        }
      }
      await db.collection('students').insertMany(students);
      await db.collection('enrolments').insertMany(enrolments);
      console.log(`Seeded ${students.length} demo students and enrolments.`);

      // 5. COUNSELLING SESSIONS
      const sessions = [];
      const sessionLeads = leads.filter(l => ['counselling_scheduled','counselled','assessment','negotiation'].includes(l.status));
      for (let idx = 0; idx < sessionLeads.length; idx++) {
        const lead = sessionLeads[idx];
        const isDone = ['counselled','assessment','negotiation'].includes(lead.status);
        sessions.push({
          id: crypto.randomUUID(),
          lead_id: lead.id,
          scheduled_at: new Date(Date.now() + ((idx % 10) - 4) * 86400000 + 11 * 3600000).toISOString(),
          mode: idx % 2 === 0 ? 'Video call' : 'In person',
          status: isDone ? 'completed' : 'scheduled',
          outcome: isDone ? 'Recommended flagship programme' : null,
          notes: 'Demo session',
          created_at: new Date().toISOString(),
        });
      }
      if (sessions.length > 0) {
        await db.collection('counselling_sessions').insertMany(sessions);
        console.log(`Seeded ${sessions.length} counselling sessions.`);
      }

      // 6. TASKS
      const tasks = [];
      const taskLeads = leads.filter(l => !['converted','lost'].includes(l.status));
      for (const lead of taskLeads) {
        tasks.push({
          id: crypto.randomUUID(),
          title: `Follow up with ${lead.full_name}`,
          task_type: 'Follow-up',
          due_date: lead.next_follow_up,
          status: 'open',
          priority: lead.status === 'negotiation' ? 'high' : 'normal',
          lead_id: lead.id,
          created_at: new Date().toISOString(),
        });
      }
      if (tasks.length > 0) {
        await db.collection('tasks').insertMany(tasks);
        console.log(`Seeded ${tasks.length} tasks.`);
      }

      if (journeyEvents.length > 0) {
        await db.collection('journey_events').insertMany(journeyEvents);
        console.log(`Seeded ${journeyEvents.length} journey events.`);
      }
    }

    // 7. DEFAULT ADMIN USER (if no user exists)
    const userCount = await db.collection('users').countDocuments();
    if (userCount === 0) {
      const adminId = crypto.randomUUID();
      const passwordHash = await bcrypt.hash('Admin@123456', 10);
      await db.collection('users').insertOne({
        id: adminId,
        email: 'admin@kraft.edu',
        password_hash: passwordHash,
        full_name: 'Super Administrator',
        created_at: new Date().toISOString(),
      });
      await db.collection('user_roles').insertOne({
        id: crypto.randomUUID(),
        user_id: adminId,
        role: 'super_admin',
        created_at: new Date().toISOString(),
      });
      await db.collection('profiles').insertOne({
        id: adminId,
        full_name: 'Super Administrator',
        email: 'admin@kraft.edu',
        created_at: new Date().toISOString(),
      });
      console.log("Created default admin user: admin@kraft.edu / Admin@123456");
    }

    // Create Indexes
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('user_roles').createIndex({ user_id: 1, role: 1 });
    await db.collection('leads').createIndex({ status: 1 });
    await db.collection('leads').createIndex({ email: 1 });
    await db.collection('students').createIndex({ stage_id: 1 });
    await db.collection('students').createIndex({ exam: 1 });
    await db.collection('tasks').createIndex({ status: 1, due_date: 1 });
    await db.collection('journey_events').createIndex({ student_id: 1, created_at: -1 });
    await db.collection('journey_events').createIndex({ lead_id: 1, created_at: -1 });
    console.log("Indexes verified.");

    console.log("MongoDB 'eduflow' setup complete!");
  } catch (err) {
    console.error("Seed error:", err);
  } finally {
    await client.close();
  }
}

seed();
