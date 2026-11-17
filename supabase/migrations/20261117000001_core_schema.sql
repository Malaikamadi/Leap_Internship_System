-- =============================================================================
-- Digital LEAP Internship Management System
-- Limkokwing University of Creative Technology — Sierra Leone
-- Migration 1: Core relational schema
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Enumerated types (state machines are enforced by workflow functions)
-- ---------------------------------------------------------------------------
create type public.app_role as enum (
  'student', 'coordinator', 'supervisor', 'host', 'management', 'admin'
);

create type public.application_status as enum (
  'DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'CORRECTION_REQUIRED', 'APPROVED', 'REJECTED'
);

create type public.placement_status as enum (
  'PENDING', 'AWAITING_CONFIRMATION', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED'
);

create type public.report_status as enum (
  'DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'CORRECTION_REQUIRED', 'ACCEPTED'
);

create type public.assessment_status as enum ('DRAFT', 'FINALIZED');

create type public.completion_status as enum ('IN_PROGRESS', 'COMPLETED', 'NOT_COMPLETED');

-- ---------------------------------------------------------------------------
-- Shared trigger: maintain updated_at
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Roles & permissions (reference data; assignments live in user_roles)
-- ---------------------------------------------------------------------------
create table public.roles (
  code        public.app_role primary key,
  name        text not null,
  description text not null
);

create table public.permissions (
  code        text primary key,
  module      text not null,
  description text not null
);

create table public.role_permissions (
  role       public.app_role not null references public.roles (code) on delete cascade,
  permission text            not null references public.permissions (code) on delete cascade,
  primary key (role, permission)
);

-- ---------------------------------------------------------------------------
-- Profiles (1:1 with auth.users; passwords are never stored here)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text not null unique,
  full_name  text not null check (char_length(full_name) between 2 and 120),
  phone      text check (phone is null or char_length(phone) between 6 and 30),
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

create table public.user_roles (
  user_id    uuid not null references public.profiles (id) on delete cascade,
  role       public.app_role not null references public.roles (code),
  granted_by uuid references public.profiles (id) on delete set null,
  granted_at timestamptz not null default now(),
  primary key (user_id, role)
);
create index user_roles_role_idx on public.user_roles (role);

-- Create a profile automatically for every new auth identity.
-- Roles are NEVER derived from user metadata; they are granted only by trusted code.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- ---------------------------------------------------------------------------
-- Academic & organisational entities
-- ---------------------------------------------------------------------------
create table public.student_profiles (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null unique references public.profiles (id) on delete cascade,
  student_number    text not null unique,
  faculty           text not null,
  programme         text not null,
  year_of_study     smallint not null check (year_of_study between 1 and 6),
  gpa               numeric(3, 2) check (gpa between 0 and 4),
  credits_completed integer not null default 0 check (credits_completed >= 0),
  skills            text check (skills is null or char_length(skills) <= 1000),
  emergency_contact text check (emergency_contact is null or char_length(emergency_contact) <= 200),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create trigger student_profiles_updated_at before update on public.student_profiles
  for each row execute function public.set_updated_at();

create table public.academic_supervisors (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null unique references public.profiles (id) on delete cascade,
  staff_number text not null unique,
  title        text,
  faculty      text not null,
  department   text not null,
  max_students integer not null default 8 check (max_students between 1 and 50),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create trigger academic_supervisors_updated_at before update on public.academic_supervisors
  for each row execute function public.set_updated_at();

create table public.host_organizations (
  id            uuid primary key default gen_random_uuid(),
  name          text not null unique check (char_length(name) between 2 and 150),
  industry      text not null,
  address       text,
  city          text not null default 'Freetown',
  contact_email text check (contact_email is null or contact_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  contact_phone text,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create trigger host_organizations_updated_at before update on public.host_organizations
  for each row execute function public.set_updated_at();

create table public.host_representatives (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null unique references public.profiles (id) on delete cascade,
  organization_id uuid not null references public.host_organizations (id) on delete restrict,
  job_title       text,
  created_at      timestamptz not null default now()
);
create index host_representatives_org_idx on public.host_representatives (organization_id);

create table public.placement_opportunities (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.host_organizations (id) on delete restrict,
  title           text not null check (char_length(title) between 3 and 150),
  department      text,
  description     text not null check (char_length(description) >= 10),
  requirements    text,
  location        text,
  capacity        integer not null check (capacity between 1 and 100),
  start_date      date,
  end_date        date,
  status          text not null default 'OPEN' check (status in ('OPEN', 'CLOSED')),
  created_by      uuid references public.profiles (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  check (start_date is null or end_date is null or end_date > start_date)
);
create index placement_opportunities_org_idx on public.placement_opportunities (organization_id);
create trigger placement_opportunities_updated_at before update on public.placement_opportunities
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Applications
-- ---------------------------------------------------------------------------
create table public.internship_applications (
  id                        uuid primary key default gen_random_uuid(),
  student_id                uuid not null references public.student_profiles (id) on delete cascade,
  academic_year             text not null check (academic_year ~ '^[0-9]{4}/[0-9]{4}$'),
  preferred_industry        text,
  preferred_organization_id uuid references public.host_organizations (id) on delete set null,
  motivation                text check (motivation is null or char_length(motivation) <= 4000),
  relevant_skills           text check (relevant_skills is null or char_length(relevant_skills) <= 2000),
  preferred_start_date      date,
  preferred_end_date        date,
  status                    public.application_status not null default 'DRAFT',
  submitted_at              timestamptz,
  decided_at                timestamptz,
  decided_by                uuid references public.profiles (id) on delete set null,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  check (preferred_start_date is null or preferred_end_date is null or preferred_end_date > preferred_start_date)
);
-- A student may hold only one non-rejected application per academic year.
create unique index internship_applications_one_open_per_year
  on public.internship_applications (student_id, academic_year)
  where status <> 'REJECTED';
create index internship_applications_status_idx on public.internship_applications (status);
create trigger internship_applications_updated_at before update on public.internship_applications
  for each row execute function public.set_updated_at();

-- Immutable decision/status history
create table public.application_reviews (
  id             uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.internship_applications (id) on delete cascade,
  actor_id       uuid references public.profiles (id) on delete set null,
  from_status    public.application_status,
  to_status      public.application_status not null,
  comment        text,
  created_at     timestamptz not null default now()
);
create index application_reviews_app_idx on public.application_reviews (application_id, created_at);

-- ---------------------------------------------------------------------------
-- Placements & supervision
-- ---------------------------------------------------------------------------
create table public.placements (
  id                  uuid primary key default gen_random_uuid(),
  application_id      uuid not null references public.internship_applications (id) on delete restrict,
  student_id          uuid not null references public.student_profiles (id) on delete restrict,
  opportunity_id      uuid not null references public.placement_opportunities (id) on delete restrict,
  organization_id     uuid not null references public.host_organizations (id) on delete restrict,
  status              public.placement_status not null default 'PENDING',
  start_date          date not null,
  end_date            date not null,
  host_response_note  text,
  host_responded_at   timestamptz,
  host_responded_by   uuid references public.profiles (id) on delete set null,
  cancellation_reason text,
  created_by          uuid references public.profiles (id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  check (end_date > start_date)
);
-- Prevent conflicting live assignments for the same student.
create unique index placements_one_live_per_student
  on public.placements (student_id)
  where status in ('PENDING', 'AWAITING_CONFIRMATION', 'CONFIRMED', 'ACTIVE');
create index placements_opportunity_idx on public.placements (opportunity_id);
create index placements_org_idx on public.placements (organization_id);
create index placements_status_idx on public.placements (status);
create trigger placements_updated_at before update on public.placements
  for each row execute function public.set_updated_at();

create table public.supervisor_assignments (
  id            uuid primary key default gen_random_uuid(),
  placement_id  uuid not null references public.placements (id) on delete cascade,
  supervisor_id uuid not null references public.academic_supervisors (id) on delete restrict,
  assigned_by   uuid references public.profiles (id) on delete set null,
  assigned_at   timestamptz not null default now(),
  is_current    boolean not null default true,
  ended_at      timestamptz
);
create unique index supervisor_assignments_one_current
  on public.supervisor_assignments (placement_id) where is_current;
create index supervisor_assignments_supervisor_idx on public.supervisor_assignments (supervisor_id) where is_current;

-- ---------------------------------------------------------------------------
-- Progress reporting
-- ---------------------------------------------------------------------------
create table public.progress_reports (
  id                uuid primary key default gen_random_uuid(),
  placement_id      uuid not null references public.placements (id) on delete cascade,
  student_id        uuid not null references public.student_profiles (id) on delete cascade,
  report_number     integer not null check (report_number > 0),
  period_start      date not null,
  period_end        date not null,
  hours_worked      integer not null check (hours_worked between 0 and 200),
  activities        text not null check (char_length(activities) <= 5000),
  learning_outcomes text not null check (char_length(learning_outcomes) <= 5000),
  challenges        text check (challenges is null or char_length(challenges) <= 3000),
  next_steps        text check (next_steps is null or char_length(next_steps) <= 3000),
  status            public.report_status not null default 'DRAFT',
  version           integer not null default 0,
  submitted_at      timestamptz,
  reviewed_at       timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (placement_id, report_number),
  check (period_end >= period_start)
);
create index progress_reports_student_idx on public.progress_reports (student_id);
create index progress_reports_status_idx on public.progress_reports (status);
create trigger progress_reports_updated_at before update on public.progress_reports
  for each row execute function public.set_updated_at();

-- Accepted reports must never be silently overwritten or removed by any user.
create or replace function public.protect_accepted_reports()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status = 'ACCEPTED' and auth.uid() is not null then
    raise exception 'Accepted progress reports are locked and cannot be modified or deleted'
      using errcode = 'P0001';
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;
create trigger progress_reports_lock_accepted
  before update or delete on public.progress_reports
  for each row execute function public.protect_accepted_reports();

-- Snapshot of each submitted version
create table public.report_revisions (
  id         uuid primary key default gen_random_uuid(),
  report_id  uuid not null references public.progress_reports (id) on delete cascade,
  version    integer not null,
  snapshot   jsonb not null,
  created_at timestamptz not null default now(),
  unique (report_id, version)
);

create table public.report_feedback (
  id          uuid primary key default gen_random_uuid(),
  report_id   uuid not null references public.progress_reports (id) on delete cascade,
  reviewer_id uuid references public.profiles (id) on delete set null,
  decision    public.report_status not null check (decision in ('ACCEPTED', 'CORRECTION_REQUIRED')),
  comments    text not null check (char_length(comments) between 5 and 3000),
  created_at  timestamptz not null default now()
);
create index report_feedback_report_idx on public.report_feedback (report_id, created_at);

-- ---------------------------------------------------------------------------
-- Host evaluation, concerns, assessment, completion
-- ---------------------------------------------------------------------------
create table public.host_evaluations (
  id                       uuid primary key default gen_random_uuid(),
  placement_id             uuid not null unique references public.placements (id) on delete cascade,
  submitted_by             uuid references public.profiles (id) on delete set null,
  punctuality              smallint not null check (punctuality between 1 and 5),
  professionalism          smallint not null check (professionalism between 1 and 5),
  technical_skills         smallint not null check (technical_skills between 1 and 5),
  communication            smallint not null check (communication between 1 and 5),
  teamwork                 smallint not null check (teamwork between 1 and 5),
  initiative               smallint not null check (initiative between 1 and 5),
  overall_rating           numeric(3, 2) generated always as (
    round((punctuality + professionalism + technical_skills + communication + teamwork + initiative)::numeric / 6, 2)
  ) stored,
  strengths                text check (strengths is null or char_length(strengths) <= 3000),
  improvements             text check (improvements is null or char_length(improvements) <= 3000),
  recommend_for_employment boolean not null default false,
  submitted_at             timestamptz not null default now()
);

create table public.placement_concerns (
  id              uuid primary key default gen_random_uuid(),
  placement_id    uuid not null references public.placements (id) on delete cascade,
  raised_by       uuid references public.profiles (id) on delete set null,
  message         text not null check (char_length(message) between 10 and 2000),
  status          text not null default 'OPEN' check (status in ('OPEN', 'RESOLVED')),
  resolution_note text,
  resolved_by     uuid references public.profiles (id) on delete set null,
  resolved_at     timestamptz,
  created_at      timestamptz not null default now()
);
create index placement_concerns_placement_idx on public.placement_concerns (placement_id);

create table public.assessments (
  id               uuid primary key default gen_random_uuid(),
  placement_id     uuid not null unique references public.placements (id) on delete cascade,
  recorded_by      uuid references public.profiles (id) on delete set null,
  supervisor_score numeric(5, 2) not null check (supervisor_score between 0 and 100),
  report_score     numeric(5, 2) not null check (report_score between 0 and 100),
  host_score       numeric(5, 2) check (host_score between 0 and 100),
  final_score      numeric(5, 2) check (final_score between 0 and 100),
  comments         text check (comments is null or char_length(comments) <= 3000),
  status           public.assessment_status not null default 'DRAFT',
  finalized_by     uuid references public.profiles (id) on delete set null,
  finalized_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create trigger assessments_updated_at before update on public.assessments
  for each row execute function public.set_updated_at();

create table public.completion_records (
  id                       uuid primary key default gen_random_uuid(),
  placement_id             uuid not null unique references public.placements (id) on delete cascade,
  student_id               uuid not null references public.student_profiles (id) on delete cascade,
  status                   public.completion_status not null default 'IN_PROGRESS',
  accepted_reports         integer not null default 0,
  total_hours              integer not null default 0,
  host_evaluation_received boolean not null default false,
  final_score              numeric(5, 2),
  requirements_snapshot    jsonb,
  decided_by               uuid references public.profiles (id) on delete set null,
  decided_at               timestamptz,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);
create index completion_records_student_idx on public.completion_records (student_id);
create trigger completion_records_updated_at before update on public.completion_records
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Configurable policy values (pending university confirmation)
-- ---------------------------------------------------------------------------
create table public.system_settings (
  key              text primary key,
  value            jsonb not null,
  description      text not null,
  policy_confirmed boolean not null default false,
  updated_by       uuid references public.profiles (id) on delete set null,
  updated_at       timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Notifications & audit
-- ---------------------------------------------------------------------------
create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  category   text not null,
  title      text not null,
  body       text not null,
  link       text,
  is_read    boolean not null default false,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, is_read, created_at desc);

create table public.audit_logs (
  id          bigint generated always as identity primary key,
  actor_id    uuid references public.profiles (id) on delete set null,
  action      text not null,
  entity_type text not null,
  entity_id   text,
  details     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index audit_logs_created_idx on public.audit_logs (created_at desc);
create index audit_logs_action_idx on public.audit_logs (action);

