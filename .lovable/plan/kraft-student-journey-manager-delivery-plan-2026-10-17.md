# KRAFT Student Journey Manager — Delivery Plan

The brief describes 7 phases. Building all of it in one pass would produce a shallow result, so this plan delivers **Phase 1 (Foundation) and Phase 2 (CRM & Student Journeys)** fully working now, with every later module wired to the same data model and built in follow-up rounds.

## This round

**1. Design system (from kraftstudios.site)**
- Inspect the live site, carry over its fonts, palette (warm sand / vermilion / ink if present), radii, button and form styles.
- Dense, professional workspace layout: collapsible left sidebar (role-aware), top bar with breadcrumbs, global search, quick-create, notifications, profile menu.

**2. Sign-in and roles (Lovable Cloud)**
- Email sign-in, a separate roles table, and permission checks enforced in the database (not just hidden buttons).
- Roles: Super Admin, Director, Counsellor, Academic Manager, Faculty, Mentor, Finance, Student.
- Each role lands on its own overview; sidebar shows only allowed sections.

**3. Data model (full schema, so later phases plug in)**
- Leads, lead sources, counselling sessions, follow-ups/tasks.
- Students, journey stages (configurable, separate CAT and GMAT tracks), stage history/timeline events.
- Courses, batches, enrolments (tables created now; screens later).
- Clearly-labelled demo data: ~40 leads, ~25 students across CAT and GMAT.

**4. Working screens**
- **Overview**: KPIs computed from records (new enquiries, conversion rate, active students, overdue follow-ups, stage distribution chart).
- **Enquiries & Leads**: searchable/filterable table, create/edit lead, assign counsellor, log follow-ups, convert lead to student.
- **Counselling**: schedule and record sessions with outcome and recommended course.
- **Student Journey**: kanban board by stage with drag-to-move (logged to history), CAT/GMAT filter.
- **Students**: directory plus 360 profile with Overview, Journey timeline, and Activity tabs (other tabs show "coming in next phase").
- **Tasks & Follow-ups**: my tasks, overdue, complete/reschedule.
- Remaining sidebar sections appear as placeholders to authorised roles.

## Next rounds (in order)
3. Courses, batches, curriculum, attendance, study plans.
4. Tests & mock analytics (CAT sectional/percentile vs GMAT focus-edition scoring), risk detection, interventions.
5. Fees & payments, exam readiness, B-school applications and outcomes.
6. Institutional analytics, automations, notifications centre.
7. Security review and end-to-end acceptance tests from the brief.

## Technical details
- TanStack Start, app under protected `/app/*` routes (`_authenticated` layout), `/` becomes a branded sign-in landing.
- Lovable Cloud: Postgres + RLS, `user_roles` table with `has_role()` security-definer function, server functions for lead conversion and stage moves.
- Recharts for charts, shadcn components restyled via tokens in `src/styles.css`.
