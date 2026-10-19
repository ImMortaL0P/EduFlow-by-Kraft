
-- ROLES
create type public.app_role as enum ('super_admin','director','counsellor','academic_manager','faculty','mentor','finance','student');
create type public.exam_type as enum ('CAT','GMAT');
create type public.lead_status as enum ('new','contacted','counselling_scheduled','counselled','assessment','negotiation','converted','lost');
create type public.task_status as enum ('open','done','cancelled');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select, insert, delete on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;
create or replace function public.has_any_role(_user_id uuid, _roles app_role[])
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = any(_roles))
$$;
create or replace function public.is_staff(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role <> 'student')
$$;
create or replace function public.is_leader(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_any_role(_user_id, array['super_admin','director']::app_role[])
$$;

create policy "own profile or staff read" on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_staff(auth.uid()));
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid());
create policy "own profile insert" on public.profiles for insert to authenticated with check (id = auth.uid());

create policy "read own roles or leader" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.is_staff(auth.uid()));
create policy "super admin grants roles" on public.user_roles for insert to authenticated
  with check (public.has_role(auth.uid(),'super_admin'));
create policy "super admin revokes roles" on public.user_roles for delete to authenticated
  using (public.has_role(auth.uid(),'super_admin'));

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email,'@',1)), new.email);
  if not exists (select 1 from public.user_roles where role = 'super_admin') then
    insert into public.user_roles (user_id, role) values (new.id, 'super_admin');
  end if;
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- ACADEMIC STRUCTURE
create table public.courses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  exam exam_type not null,
  duration_weeks int not null default 24,
  fee numeric(12,2) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.batches (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  name text not null,
  start_date date,
  mode text not null default 'Classroom',
  capacity int not null default 40,
  created_at timestamptz not null default now()
);

-- JOURNEY
create table public.journey_stages (
  id uuid primary key default gen_random_uuid(),
  exam exam_type not null,
  name text not null,
  position int not null,
  is_terminal boolean not null default false,
  unique (exam, position)
);

-- CRM
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text,
  phone text,
  city text,
  exam exam_type not null,
  target_year int,
  source text not null default 'Website',
  status lead_status not null default 'new',
  current_score text,
  target_score text,
  work_experience_months int,
  interested_course_id uuid references public.courses(id) on delete set null,
  assigned_to uuid,
  next_follow_up date,
  lost_reason text,
  notes text,
  converted_student_id uuid,
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.leads(status);
create index on public.leads(assigned_to);
create index on public.leads(created_at);

create table public.students (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  lead_id uuid references public.leads(id) on delete set null,
  full_name text not null,
  email text,
  phone text,
  city text,
  exam exam_type not null,
  target_year int,
  target_score text,
  planned_exam_date date,
  stage_id uuid references public.journey_stages(id),
  mentor_id uuid,
  counsellor_id uuid,
  status text not null default 'active',
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.students(stage_id);
create index on public.students(exam);
alter table public.leads add constraint leads_converted_fk foreign key (converted_student_id) references public.students(id) on delete set null;

create table public.enrolments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  course_id uuid not null references public.courses(id),
  batch_id uuid references public.batches(id) on delete set null,
  enrolled_on date not null default current_date,
  fee_agreed numeric(12,2),
  created_at timestamptz not null default now()
);

create table public.counselling_sessions (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete cascade,
  student_id uuid references public.students(id) on delete cascade,
  counsellor_id uuid,
  scheduled_at timestamptz not null,
  mode text not null default 'In person',
  status text not null default 'scheduled',
  outcome text,
  recommended_course_id uuid references public.courses(id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);
create index on public.counselling_sessions(scheduled_at);

create table public.journey_events (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.students(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete cascade,
  event_type text not null,
  title text not null,
  detail text,
  from_stage_id uuid references public.journey_stages(id),
  to_stage_id uuid references public.journey_stages(id),
  actor_id uuid,
  visibility text not null default 'staff',
  created_at timestamptz not null default now()
);
create index on public.journey_events(student_id, created_at desc);
create index on public.journey_events(lead_id, created_at desc);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  task_type text not null default 'Follow-up',
  due_date date not null default current_date,
  status task_status not null default 'open',
  priority text not null default 'normal',
  assigned_to uuid,
  lead_id uuid references public.leads(id) on delete cascade,
  student_id uuid references public.students(id) on delete cascade,
  created_by uuid,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);
create index on public.tasks(assigned_to, status, due_date);

-- GRANTS
grant select, insert, update, delete on public.courses, public.batches, public.journey_stages, public.leads, public.students, public.enrolments, public.counselling_sessions, public.journey_events, public.tasks to authenticated;
grant all on public.courses, public.batches, public.journey_stages, public.leads, public.students, public.enrolments, public.counselling_sessions, public.journey_events, public.tasks to service_role;

alter table public.courses enable row level security;
alter table public.batches enable row level security;
alter table public.journey_stages enable row level security;
alter table public.leads enable row level security;
alter table public.students enable row level security;
alter table public.enrolments enable row level security;
alter table public.counselling_sessions enable row level security;
alter table public.journey_events enable row level security;
alter table public.tasks enable row level security;

-- Reference data: all signed-in users read; leaders/academic manage
create policy "read courses" on public.courses for select to authenticated using (true);
create policy "manage courses" on public.courses for all to authenticated
  using (public.has_any_role(auth.uid(), array['super_admin','director','academic_manager']::app_role[]))
  with check (public.has_any_role(auth.uid(), array['super_admin','director','academic_manager']::app_role[]));
create policy "read batches" on public.batches for select to authenticated using (true);
create policy "manage batches" on public.batches for all to authenticated
  using (public.has_any_role(auth.uid(), array['super_admin','director','academic_manager']::app_role[]))
  with check (public.has_any_role(auth.uid(), array['super_admin','director','academic_manager']::app_role[]));
create policy "read stages" on public.journey_stages for select to authenticated using (true);
create policy "manage stages" on public.journey_stages for all to authenticated
  using (public.is_leader(auth.uid())) with check (public.is_leader(auth.uid()));

-- Leads: leaders all; counsellors assigned or unassigned
create policy "leads read" on public.leads for select to authenticated using (
  public.is_leader(auth.uid())
  or (public.has_role(auth.uid(),'counsellor') and (assigned_to = auth.uid() or assigned_to is null)));
create policy "leads insert" on public.leads for insert to authenticated with check (
  public.has_any_role(auth.uid(), array['super_admin','director','counsellor']::app_role[]));
create policy "leads update" on public.leads for update to authenticated using (
  public.is_leader(auth.uid())
  or (public.has_role(auth.uid(),'counsellor') and (assigned_to = auth.uid() or assigned_to is null)));
create policy "leads delete" on public.leads for delete to authenticated using (public.is_leader(auth.uid()));

-- Students: staff (except finance sees too for fees later) read; student reads self
create policy "students read" on public.students for select to authenticated using (
  public.is_staff(auth.uid()) or user_id = auth.uid());
create policy "students write" on public.students for insert to authenticated with check (
  public.has_any_role(auth.uid(), array['super_admin','director','counsellor','academic_manager']::app_role[]));
create policy "students update" on public.students for update to authenticated using (
  public.has_any_role(auth.uid(), array['super_admin','director','counsellor','academic_manager','mentor']::app_role[]));
create policy "students delete" on public.students for delete to authenticated using (public.is_leader(auth.uid()));

create policy "enrolments read" on public.enrolments for select to authenticated using (
  public.is_staff(auth.uid()) or exists (select 1 from public.students s where s.id = student_id and s.user_id = auth.uid()));
create policy "enrolments write" on public.enrolments for all to authenticated
  using (public.has_any_role(auth.uid(), array['super_admin','director','counsellor']::app_role[]))
  with check (public.has_any_role(auth.uid(), array['super_admin','director','counsellor']::app_role[]));

create policy "sessions read" on public.counselling_sessions for select to authenticated using (
  public.is_leader(auth.uid()) or public.has_any_role(auth.uid(), array['counsellor','mentor','academic_manager']::app_role[]));
create policy "sessions write" on public.counselling_sessions for all to authenticated
  using (public.has_any_role(auth.uid(), array['super_admin','director','counsellor']::app_role[]))
  with check (public.has_any_role(auth.uid(), array['super_admin','director','counsellor']::app_role[]));

create policy "events read" on public.journey_events for select to authenticated using (
  public.is_staff(auth.uid())
  or (visibility = 'student' and exists (select 1 from public.students s where s.id = student_id and s.user_id = auth.uid())));
create policy "events insert" on public.journey_events for insert to authenticated with check (public.is_staff(auth.uid()));

create policy "tasks read" on public.tasks for select to authenticated using (
  assigned_to = auth.uid() or created_by = auth.uid() or public.is_leader(auth.uid()) or (assigned_to is null and public.is_staff(auth.uid())));
create policy "tasks insert" on public.tasks for insert to authenticated with check (public.is_staff(auth.uid()));
create policy "tasks update" on public.tasks for update to authenticated using (
  assigned_to = auth.uid() or created_by = auth.uid() or public.is_leader(auth.uid()) or (assigned_to is null and public.is_staff(auth.uid())));
create policy "tasks delete" on public.tasks for delete to authenticated using (created_by = auth.uid() or public.is_leader(auth.uid()));

-- BUSINESS OPERATIONS (server-side, role-checked)
create or replace function public.move_student_stage(_student_id uuid, _stage_id uuid, _note text default null)
returns void language plpgsql security definer set search_path = public as $$
declare v_from uuid; v_exam exam_type; v_stage_exam exam_type; v_name text;
begin
  if not public.has_any_role(auth.uid(), array['super_admin','director','counsellor','academic_manager','mentor']::app_role[]) then
    raise exception 'Not authorised to move students';
  end if;
  select stage_id, exam into v_from, v_exam from students where id = _student_id;
  if not found then raise exception 'Student not found'; end if;
  select exam, name into v_stage_exam, v_name from journey_stages where id = _stage_id;
  if v_stage_exam is distinct from v_exam then raise exception 'Stage belongs to a different exam track'; end if;
  if v_from = _stage_id then return; end if;
  update students set stage_id = _stage_id, updated_at = now() where id = _student_id;
  insert into journey_events (student_id, event_type, title, detail, from_stage_id, to_stage_id, actor_id, visibility)
  values (_student_id, 'stage_change', 'Moved to ' || v_name, _note, v_from, _stage_id, auth.uid(), 'student');
end; $$;

create or replace function public.convert_lead(_lead_id uuid, _course_id uuid, _batch_id uuid default null, _fee numeric default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare l leads%rowtype; v_student uuid; v_stage uuid; v_course_exam exam_type;
begin
  if not public.has_any_role(auth.uid(), array['super_admin','director','counsellor']::app_role[]) then
    raise exception 'Not authorised to convert leads';
  end if;
  select * into l from leads where id = _lead_id for update;
  if not found then raise exception 'Lead not found'; end if;
  if l.status = 'converted' then raise exception 'Lead already converted'; end if;
  if public.has_role(auth.uid(),'counsellor') and not public.is_leader(auth.uid())
     and l.assigned_to is not null and l.assigned_to <> auth.uid() then
    raise exception 'Lead is assigned to another counsellor';
  end if;
  select exam into v_course_exam from courses where id = _course_id;
  if v_course_exam is distinct from l.exam then raise exception 'Course exam does not match lead exam'; end if;
  select id into v_stage from journey_stages where exam = l.exam order by position limit 1;
  insert into students (lead_id, full_name, email, phone, city, exam, target_year, target_score, stage_id, counsellor_id)
  values (l.id, l.full_name, l.email, l.phone, l.city, l.exam, l.target_year, l.target_score, v_stage, coalesce(l.assigned_to, auth.uid()))
  returning id into v_student;
  insert into enrolments (student_id, course_id, batch_id, fee_agreed)
  values (v_student, _course_id, _batch_id, coalesce(_fee, (select fee from courses where id = _course_id)));
  update leads set status = 'converted', converted_student_id = v_student, updated_at = now() where id = l.id;
  insert into journey_events (student_id, lead_id, event_type, title, detail, to_stage_id, actor_id, visibility)
  values (v_student, l.id, 'enrolled', 'Enrolled', 'Converted from enquiry', v_stage, auth.uid(), 'student');
  return v_student;
end; $$;

grant execute on function public.move_student_stage(uuid,uuid,text) to authenticated;
grant execute on function public.convert_lead(uuid,uuid,uuid,numeric) to authenticated;

-- SEED: stages
insert into public.journey_stages (exam, name, position, is_terminal)
select e::exam_type, s.name, s.pos, s.term from unnest(array['CAT','GMAT']) e
cross join (values
 (1,'Onboarding',false),(2,'Foundation',false),(3,'Practice & Sectionals',false),(4,'Mock Phase',false),
 (5,'Exam Registered',false),(6,'Exam Taken',false),(7,'Applications',false),(8,'Interviews',false),
 (9,'Admitted',true),(10,'Alumni',true)) as s(pos,name,term);

-- SEED: courses & batches (demo)
insert into public.courses (name, exam, duration_weeks, fee) values
 ('CAT Comprehensive Classroom', 'CAT', 40, 85000),
 ('CAT Online Live', 'CAT', 32, 55000),
 ('CAT Test Series Plus', 'CAT', 16, 15000),
 ('GMAT Focus Intensive', 'GMAT', 12, 95000),
 ('GMAT Online Self-paced + Mentoring', 'GMAT', 16, 60000);
insert into public.batches (course_id, name, start_date, mode, capacity)
select id, name || ' — ' || b.label, b.d::date, case when name ilike '%online%' then 'Online' else 'Classroom' end, 40
from public.courses cross join (values ('Jan 2026 Weekend','2026-01-10'),('Jun 2026 Weekday','2026-06-08')) b(label,d);

-- SEED: leads (demo, 40)
insert into public.leads (full_name, email, phone, city, exam, target_year, source, status, current_score, target_score, work_experience_months, interested_course_id, next_follow_up, notes, is_demo, created_at)
select
  n.fn || ' ' || n.ln,
  lower(n.fn) || '.' || lower(n.ln) || i || '@example.com',
  '+91 98' || lpad((10000000 + i*7919 % 89999999)::text, 8, '0'),
  (array['Delhi','Mumbai','Bengaluru','Pune','Hyderabad','Kolkata','Chennai','Jaipur'])[1 + i % 8],
  case when i % 3 = 0 then 'GMAT'::exam_type else 'CAT'::exam_type end,
  2026 + (i % 2),
  (array['Website','Instagram','Referral','Walk-in','Google Ads','Webinar','Alumni','Seminar'])[1 + i % 8],
  (array['new','contacted','counselling_scheduled','counselled','assessment','negotiation','lost','new','contacted','counselled'])[1 + i % 10]::lead_status,
  case when i % 3 = 0 then (515 + (i*13 % 120))::text else (55 + (i*7 % 35))::text || ' %ile' end,
  case when i % 3 = 0 then '705+' else '99 %ile' end,
  (i * 5) % 48,
  (select id from public.courses c where c.exam = (case when i % 3 = 0 then 'GMAT' else 'CAT' end)::exam_type order by c.fee desc limit 1),
  current_date + ((i % 9) - 3),
  'Demo enquiry record',
  true,
  now() - ((i * 37 % 120) || ' days')::interval
from generate_series(1,40) i
cross join lateral (select
  (array['Aarav','Ishita','Rohan','Meera','Kabir','Ananya','Vikram','Sanya','Arjun','Priya','Dev','Nisha','Karan','Tara','Neil','Riya','Aditya','Kavya','Siddharth','Pooja'])[1 + i % 20] fn,
  (array['Sharma','Iyer','Mehta','Nair','Kapoor','Reddy','Banerjee','Gupta','Rao','Singh','Joshi','Menon'])[1 + (i*3) % 12] ln) n;

-- SEED: students (demo, 26)
insert into public.students (full_name, email, phone, city, exam, target_year, target_score, planned_exam_date, stage_id, is_demo, created_at)
select
  n.fn || ' ' || n.ln,
  lower(n.fn) || '.' || lower(n.ln) || '.s' || i || '@example.com',
  '+91 97' || lpad((20000000 + i*6271 % 79999999)::text, 8, '0'),
  (array['Delhi','Mumbai','Bengaluru','Pune','Hyderabad','Kolkata'])[1 + i % 6],
  ex.e,
  2026,
  case when ex.e = 'GMAT' then '705+' else '99 %ile' end,
  case when ex.e = 'GMAT' then current_date + (20 + i*6) else date '2026-11-29' end,
  (select id from public.journey_stages js where js.exam = ex.e and js.position = 1 + (i % 8)),
  true,
  now() - ((60 + i*9) || ' days')::interval
from generate_series(1,26) i
cross join lateral (select case when i % 3 = 0 then 'GMAT'::exam_type else 'CAT'::exam_type end e) ex
cross join lateral (select
  (array['Aditi','Harsh','Ira','Manav','Zoya','Rahul','Simran','Varun','Lavanya','Yash','Esha','Omkar','Tanvi'])[1 + i % 13] fn,
  (array['Verma','Pillai','Chopra','Das','Kulkarni','Bhat','Saxena','Agarwal'])[1 + (i*5) % 8] ln) n;

insert into public.enrolments (student_id, course_id, batch_id, enrolled_on, fee_agreed)
select s.id, c.id, (select b.id from public.batches b where b.course_id = c.id order by b.start_date limit 1), s.created_at::date, c.fee
from public.students s
cross join lateral (select id, fee from public.courses c where c.exam = s.exam order by c.fee desc limit 1) c;

insert into public.journey_events (student_id, event_type, title, detail, to_stage_id, visibility, created_at)
select id, 'enrolled', 'Enrolled', 'Demo enrolment record', (select id from public.journey_stages js where js.exam = s.exam and js.position = 1), 'student', created_at
from public.students s;
insert into public.journey_events (student_id, event_type, title, from_stage_id, to_stage_id, visibility, created_at)
select s.id, 'stage_change', 'Moved to ' || js.name, (select id from public.journey_stages x where x.exam = s.exam and x.position = 1), s.stage_id, 'student', s.created_at + interval '21 days'
from public.students s join public.journey_stages js on js.id = s.stage_id where js.position > 1;

insert into public.counselling_sessions (lead_id, scheduled_at, mode, status, outcome, notes)
select id, now() + (((row_number() over ()) % 10) - 4 || ' days')::interval + interval '11 hours',
  case when random() > 0.5 then 'Video call' else 'In person' end,
  case when status in ('counselled','assessment','negotiation') then 'completed' else 'scheduled' end,
  case when status in ('counselled','assessment','negotiation') then 'Recommended flagship programme' end,
  'Demo session'
from public.leads where status in ('counselling_scheduled','counselled','assessment','negotiation');

insert into public.tasks (title, task_type, due_date, priority, lead_id)
select 'Follow up with ' || full_name, 'Follow-up', next_follow_up, case when status = 'negotiation' then 'high' else 'normal' end, id
from public.leads where status not in ('converted','lost');
