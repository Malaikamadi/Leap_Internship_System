-- =============================================================================
-- Migration 2: Authorization helpers, grants and Row Level Security
-- Default-deny: every table has RLS enabled; only explicit policies grant access.
-- =============================================================================

-- Helpers live in a non-exposed schema so they cannot be called through the REST API.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Identity helpers (SECURITY DEFINER, fixed empty search_path)
-- All helpers return false/NULL for deactivated accounts, which removes all access.
-- ---------------------------------------------------------------------------
create or replace function private.is_active_user()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select coalesce((select p.is_active from public.profiles p where p.id = auth.uid()), false);
$$;

create or replace function private.has_role(p_role public.app_role)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.profiles p on p.id = ur.user_id
    where ur.user_id = auth.uid() and ur.role = p_role and p.is_active
  );
$$;

create or replace function private.is_staff()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select private.has_role('coordinator') or private.has_role('admin');
$$;

create or replace function private.current_student_id()
returns uuid
language sql stable security definer set search_path = ''
as $$
  select sp.id
  from public.student_profiles sp
  where sp.user_id = auth.uid() and private.has_role('student');
$$;

create or replace function private.current_supervisor_id()
returns uuid
language sql stable security definer set search_path = ''
as $$
  select s.id
  from public.academic_supervisors s
  where s.user_id = auth.uid() and private.has_role('supervisor');
$$;

create or replace function private.current_host_org_id()
returns uuid
language sql stable security definer set search_path = ''
as $$
  select hr.organization_id
  from public.host_representatives hr
  where hr.user_id = auth.uid() and private.has_role('host');
$$;

create or replace function private.is_placement_supervisor(p_placement_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.supervisor_assignments sa
    where sa.placement_id = p_placement_id
      and sa.is_current
      and sa.supervisor_id = private.current_supervisor_id()
  );
$$;

create or replace function private.is_placement_host(p_placement_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.placements pl
    where pl.id = p_placement_id
      and pl.organization_id = private.current_host_org_id()
  );
$$;

create or replace function private.is_placement_student(p_placement_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.placements pl
    where pl.id = p_placement_id
      and pl.student_id = private.current_student_id()
  );
$$;

create or replace function private.supervises_student(p_student_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.placements pl
    join public.supervisor_assignments sa on sa.placement_id = pl.id and sa.is_current
    where pl.student_id = p_student_id
      and sa.supervisor_id = private.current_supervisor_id()
  );
$$;

create or replace function private.hosts_student(p_student_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.placements pl
    where pl.student_id = p_student_id
      and pl.status <> 'CANCELLED'
      and pl.organization_id = private.current_host_org_id()
  );
$$;

-- A profile is visible if: it is a university staff member (directory),
-- or the caller supervises / hosts that student, or the caller is placed with that host rep's org.
create or replace function private.can_view_profile(p_profile_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select private.is_active_user() and (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = p_profile_id and ur.role in ('coordinator', 'supervisor', 'admin')
    )
    or exists (
      select 1 from public.student_profiles sp
      where sp.user_id = p_profile_id
        and (private.supervises_student(sp.id) or private.hosts_student(sp.id))
    )
    or exists (
      select 1
      from public.host_representatives hr
      join public.placements pl on pl.organization_id = hr.organization_id and pl.status <> 'CANCELLED'
      where hr.user_id = p_profile_id
        and (pl.student_id = private.current_student_id() or private.is_placement_supervisor(pl.id))
    )
  );
$$;

-- Internal audit + notification writers (only callable from other definer functions)
create or replace function private.log_audit(
  p_action text, p_entity_type text, p_entity_id text, p_details jsonb default '{}'::jsonb
)
returns void
language sql security definer set search_path = ''
as $$
  insert into public.audit_logs (actor_id, action, entity_type, entity_id, details)
  values (auth.uid(), p_action, p_entity_type, p_entity_id, coalesce(p_details, '{}'::jsonb));
$$;

create or replace function private.notify(
  p_user_id uuid, p_category text, p_title text, p_body text, p_link text default null
)
returns void
language sql security definer set search_path = ''
as $$
  insert into public.notifications (user_id, category, title, body, link)
  select p_user_id, p_category, p_title, p_body, p_link
  where p_user_id is not null;
$$;

create or replace function private.notify_role(
  p_role public.app_role, p_category text, p_title text, p_body text, p_link text default null
)
returns void
language sql security definer set search_path = ''
as $$
  insert into public.notifications (user_id, category, title, body, link)
  select ur.user_id, p_category, p_title, p_body, p_link
  from public.user_roles ur
  join public.profiles p on p.id = ur.user_id and p.is_active
  where ur.role = p_role;
$$;

create or replace function private.notify_org(
  p_org_id uuid, p_category text, p_title text, p_body text, p_link text default null
)
returns void
language sql security definer set search_path = ''
as $$
  insert into public.notifications (user_id, category, title, body, link)
  select hr.user_id, p_category, p_title, p_body, p_link
  from public.host_representatives hr
  join public.profiles p on p.id = hr.user_id and p.is_active
  where hr.organization_id = p_org_id;
$$;

create or replace function private.setting(p_key text)
returns jsonb
language sql stable security definer set search_path = ''
as $$
  select value from public.system_settings where key = p_key;
$$;

revoke all on all functions in schema private from public;
grant execute on all functions in schema private to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Generic audit trigger for directly-editable reference tables
-- ---------------------------------------------------------------------------
create or replace function private.audit_row_change()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_id text;
begin
  if tg_op = 'DELETE' then
    v_id := (to_jsonb(old) ->> 'id');
  else
    v_id := coalesce(to_jsonb(new) ->> 'id', to_jsonb(new) ->> 'key');
  end if;
  insert into public.audit_logs (actor_id, action, entity_type, entity_id, details)
  values (
    auth.uid(),
    upper(tg_table_name) || '_' || tg_op,
    tg_table_name,
    v_id,
    jsonb_build_object(
      'old', case when tg_op <> 'INSERT' then to_jsonb(old) end,
      'new', case when tg_op <> 'DELETE' then to_jsonb(new) end
    )
  );
  return coalesce(new, old);
end;
$$;

create trigger host_organizations_audit after insert or update or delete on public.host_organizations
  for each row execute function private.audit_row_change();
create trigger placement_opportunities_audit after insert or update or delete on public.placement_opportunities
  for each row execute function private.audit_row_change();

-- ---------------------------------------------------------------------------
-- Enable RLS everywhere
-- ---------------------------------------------------------------------------
alter table public.roles                   enable row level security;
alter table public.permissions             enable row level security;
alter table public.role_permissions        enable row level security;
alter table public.profiles                enable row level security;
alter table public.user_roles              enable row level security;
alter table public.student_profiles        enable row level security;
alter table public.academic_supervisors    enable row level security;
alter table public.host_organizations      enable row level security;
alter table public.host_representatives    enable row level security;
alter table public.placement_opportunities enable row level security;
alter table public.internship_applications enable row level security;
alter table public.application_reviews     enable row level security;
alter table public.placements              enable row level security;
alter table public.supervisor_assignments  enable row level security;
alter table public.progress_reports        enable row level security;
alter table public.report_revisions        enable row level security;
alter table public.report_feedback         enable row level security;
alter table public.host_evaluations        enable row level security;
alter table public.placement_concerns      enable row level security;
alter table public.assessments             enable row level security;
alter table public.completion_records      enable row level security;
alter table public.system_settings         enable row level security;
alter table public.notifications           enable row level security;
alter table public.audit_logs              enable row level security;

-- ---------------------------------------------------------------------------
-- Table privileges: strip the platform defaults, then grant the minimum.
-- All workflow state changes go through SECURITY DEFINER functions (migration 3).
-- ---------------------------------------------------------------------------
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public revoke execute on functions from anon, public;

grant select on all tables in schema public to authenticated;
grant update (full_name, phone) on public.profiles to authenticated;
grant update (skills, emergency_contact) on public.student_profiles to authenticated;
grant insert, update on public.host_organizations to authenticated;
grant insert, update on public.placement_opportunities to authenticated;
grant update (is_read) on public.notifications to authenticated;

-- ---------------------------------------------------------------------------
-- Policies
-- ---------------------------------------------------------------------------
-- Reference data
create policy roles_read on public.roles for select to authenticated
  using ((select private.is_active_user()));
create policy permissions_read on public.permissions for select to authenticated
  using ((select private.is_active_user()));
create policy role_permissions_read on public.role_permissions for select to authenticated
  using ((select private.is_active_user()));
create policy settings_read on public.system_settings for select to authenticated
  using ((select private.is_active_user()));

-- Profiles
create policy profiles_select on public.profiles for select to authenticated
  using (
    id = (select auth.uid())
    or (select private.is_staff())
    or private.can_view_profile(id)
  );
create policy profiles_update_self on public.profiles for update to authenticated
  using (id = (select auth.uid()) and (select private.is_active_user()))
  with check (id = (select auth.uid()));

-- Roles: users see their own; admins see all. No direct writes (admin RPCs only).
create policy user_roles_select on public.user_roles for select to authenticated
  using (user_id = (select auth.uid()) or (select private.has_role('admin')));

-- Student profiles
create policy student_profiles_select on public.student_profiles for select to authenticated
  using (
    (user_id = (select auth.uid()) and (select private.is_active_user()))
    or (select private.is_staff())
    or private.supervises_student(id)
    or private.hosts_student(id)
  );
create policy student_profiles_update_self on public.student_profiles for update to authenticated
  using (user_id = (select auth.uid()) and (select private.has_role('student')))
  with check (user_id = (select auth.uid()));

-- Supervisor directory (needed for allocation and for students to see their supervisor)
create policy academic_supervisors_select on public.academic_supervisors for select to authenticated
  using ((select private.is_active_user()));

-- Host organizations & opportunities: readable by any active user; managed by coordinators/admins
create policy host_organizations_select on public.host_organizations for select to authenticated
  using ((select private.is_active_user()));
create policy host_organizations_insert on public.host_organizations for insert to authenticated
  with check ((select private.is_staff()));
create policy host_organizations_update on public.host_organizations for update to authenticated
  using ((select private.is_staff())) with check ((select private.is_staff()));

create policy host_representatives_select on public.host_representatives for select to authenticated
  using (
    user_id = (select auth.uid())
    or (select private.is_staff())
    or organization_id = (select private.current_host_org_id())
  );

create policy opportunities_select on public.placement_opportunities for select to authenticated
  using ((select private.is_active_user()));
create policy opportunities_insert on public.placement_opportunities for insert to authenticated
  with check ((select private.is_staff()));
create policy opportunities_update on public.placement_opportunities for update to authenticated
  using ((select private.is_staff())) with check ((select private.is_staff()));

-- Applications
create policy applications_select on public.internship_applications for select to authenticated
  using (
    student_id = (select private.current_student_id())
    or (select private.is_staff())
    or private.supervises_student(student_id)
  );
create policy application_reviews_select on public.application_reviews for select to authenticated
  using (application_id in (select a.id from public.internship_applications a));

-- Placements
create policy placements_select on public.placements for select to authenticated
  using (
    student_id = (select private.current_student_id())
    or (select private.is_staff())
    or private.is_placement_supervisor(id)
    or organization_id = (select private.current_host_org_id())
  );
create policy supervisor_assignments_select on public.supervisor_assignments for select to authenticated
  using (placement_id in (select p.id from public.placements p));

-- Progress reports (academic records: not visible to host organisations)
create policy progress_reports_select on public.progress_reports for select to authenticated
  using (
    student_id = (select private.current_student_id())
    or (select private.is_staff())
    or private.is_placement_supervisor(placement_id)
  );
create policy report_revisions_select on public.report_revisions for select to authenticated
  using (report_id in (select r.id from public.progress_reports r));
create policy report_feedback_select on public.report_feedback for select to authenticated
  using (report_id in (select r.id from public.progress_reports r));

-- Host evaluations: host org, assigned supervisor, coordinators/admins.
-- (Student visibility of raw host ratings is a pending university policy decision.)
create policy host_evaluations_select on public.host_evaluations for select to authenticated
  using (
    (select private.is_staff())
    or private.is_placement_supervisor(placement_id)
    or private.is_placement_host(placement_id)
  );

create policy placement_concerns_select on public.placement_concerns for select to authenticated
  using (
    raised_by = (select auth.uid())
    or (select private.is_staff())
    or private.is_placement_supervisor(placement_id)
    or private.is_placement_host(placement_id)
  );

-- Assessments: students only see their own once finalized
create policy assessments_select on public.assessments for select to authenticated
  using (
    (select private.is_staff())
    or private.is_placement_supervisor(placement_id)
    or (status = 'FINALIZED' and private.is_placement_student(placement_id))
  );

create policy completion_records_select on public.completion_records for select to authenticated
  using (
    student_id = (select private.current_student_id())
    or (select private.is_staff())
    or private.is_placement_supervisor(placement_id)
  );

-- Notifications: strictly owner-only
create policy notifications_select on public.notifications for select to authenticated
  using (user_id = (select auth.uid()));
create policy notifications_update on public.notifications for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Audit log: administrators only
create policy audit_logs_select on public.audit_logs for select to authenticated
  using ((select private.has_role('admin')));

-- Realtime notifications
alter publication supabase_realtime add table public.notifications;

