-- =============================================================================
-- Migration 5: Student Self-Registration, Staff Account Provisioning,
-- Demo Student Year 4 Sem 8, and Free-Text Preferred Host Organization
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Student profile semester column (Year 4, Semester 8 support)
-- ---------------------------------------------------------------------------
alter table public.student_profiles
  add column if not exists semester smallint not null default 8
  check (semester between 1 and 12);

-- ---------------------------------------------------------------------------
-- 2. Application preferred_host_organization (VARCHAR(200)) & preference_reason (TEXT)
-- ---------------------------------------------------------------------------
alter table public.internship_applications
  add column if not exists preferred_host_organization varchar(200),
  add column if not exists preference_reason text
  check (preference_reason is null or char_length(preference_reason) <= 3000);

-- Backfill preferred_host_organization from existing preferred_organization_id
-- so no existing student application data is lost.
update public.internship_applications a
set preferred_host_organization = ho.name
from public.host_organizations ho
where a.preferred_organization_id = ho.id
  and a.preferred_host_organization is null;

-- Expose public.applications as an invoker-security view over internship_applications
-- so queries referencing either applications or internship_applications work identically.
create or replace view public.applications
with (security_invoker = true)
as
select * from public.internship_applications;

grant select on public.applications to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 3. Student self-registration & duplicate Student ID prevention
-- ---------------------------------------------------------------------------
create or replace function public.check_student_id_available(p_student_number text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when p_student_number is null or char_length(trim(p_student_number)) < 3 then false
    else not exists (
      select 1
      from public.student_profiles sp
      where lower(sp.student_number) = lower(trim(p_student_number))
    )
  end;
$$;

grant execute on function public.check_student_id_available(text) to anon, authenticated, service_role;

-- Trigger on auth.users:
-- - Always creates public.profiles.
-- - When a student registers via Supabase Auth signUp (providing student_number in raw_user_meta_data),
--   validates that student_number is unique, automatically assigns ONLY the 'student' role in public.user_roles,
--   and creates the public.student_profiles record.
-- - Never trusts or grants any role passed in user_metadata.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_full_name text := coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1));
  v_phone text := nullif(trim(new.raw_user_meta_data ->> 'phone'), '');
  v_student_number text := nullif(trim(new.raw_user_meta_data ->> 'student_number'), '');
  v_faculty text := coalesce(nullif(trim(new.raw_user_meta_data ->> 'faculty'), ''), 'Faculty of Information & Communication Technology');
  v_programme text := coalesce(nullif(trim(new.raw_user_meta_data ->> 'programme'), ''), 'BSc (Hons) in Software Engineering with Multimedia');
  v_year smallint := coalesce(nullif(trim(new.raw_user_meta_data ->> 'year_of_study'), '')::smallint, 4);
  v_semester smallint := coalesce(nullif(trim(new.raw_user_meta_data ->> 'semester'), '')::smallint, 8);
  v_gpa numeric := coalesce(nullif(trim(new.raw_user_meta_data ->> 'gpa'), '')::numeric, 3.50);
  v_credits integer := coalesce(nullif(trim(new.raw_user_meta_data ->> 'credits_completed'), '')::integer, 90);
  v_skills text := coalesce(nullif(trim(new.raw_user_meta_data ->> 'skills'), ''), 'Software Engineering, Database Systems, Problem Solving');
  v_emergency text := coalesce(nullif(trim(new.raw_user_meta_data ->> 'emergency_contact'), ''), 'University Student Welfare Office (+232 76 000111)');
begin
  insert into public.profiles (id, email, full_name, phone)
  values (new.id, lower(new.email), v_full_name, v_phone)
  on conflict (id) do update
    set email = excluded.email,
        full_name = excluded.full_name,
        phone = coalesce(excluded.phone, public.profiles.phone);

  -- If student_number is provided, this is a student self-registration.
  -- Enforce unique student_number and assign ONLY the 'student' role.
  if v_student_number is not null then
    if exists (
      select 1 from public.student_profiles sp
      where lower(sp.student_number) = lower(v_student_number)
    ) then
      raise exception 'Student ID "%" is already registered.', v_student_number
        using errcode = '23505';
    end if;

    insert into public.user_roles (user_id, role)
    values (new.id, 'student')
    on conflict (user_id, role) do nothing;

    insert into public.student_profiles (
      user_id, student_number, faculty, programme, year_of_study, semester,
      gpa, credits_completed, skills, emergency_contact
    )
    values (
      new.id, v_student_number, v_faculty, v_programme, v_year, v_semester,
      v_gpa, v_credits, v_skills, v_emergency
    );

    insert into public.audit_logs (actor_id, action, entity_type, entity_id, details)
    values (
      new.id,
      'STUDENT_SELF_REGISTERED',
      'student_profiles',
      new.id::text,
      jsonb_build_object('email', lower(new.email), 'student_number', v_student_number)
    );
  end if;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. Updated student_save_application & student_submit_application
--    Supports free-text preferred_host_organization (VARCHAR(200)) and optional preference_reason
-- ---------------------------------------------------------------------------
drop function if exists public.student_save_application(uuid, text, text, uuid, text, text, date, date);

create or replace function public.student_save_application(
  p_application_id uuid,
  p_academic_year text,
  p_preferred_industry text,
  p_preferred_organization_id uuid default null,
  p_motivation text default null,
  p_relevant_skills text default null,
  p_preferred_start_date date default null,
  p_preferred_end_date date default null,
  p_preferred_host_organization text default null,
  p_preference_reason text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_student uuid := private.current_student_id();
  v_app public.internship_applications;
  v_pref_org text := nullif(trim(p_preferred_host_organization), '');
  v_pref_reason text := nullif(trim(p_preference_reason), '');
begin
  if v_student is null then
    raise exception 'Only active students can create applications' using errcode = '42501';
  end if;

  if v_pref_org is not null and char_length(v_pref_org) > 200 then
    raise exception 'Preferred host organization must be 200 characters or fewer' using errcode = 'P0001';
  end if;

  -- If caller passed preferred_organization_id without free-text name, look up the name
  if v_pref_org is null and p_preferred_organization_id is not null then
    select name into v_pref_org from public.host_organizations where id = p_preferred_organization_id;
  end if;

  if p_application_id is null then
    begin
      insert into public.internship_applications (
        student_id, academic_year, preferred_industry, preferred_organization_id,
        preferred_host_organization, preference_reason,
        motivation, relevant_skills, preferred_start_date, preferred_end_date
      ) values (
        v_student, p_academic_year, nullif(trim(p_preferred_industry), ''), p_preferred_organization_id,
        v_pref_org, v_pref_reason,
        nullif(trim(p_motivation), ''), nullif(trim(p_relevant_skills), ''),
        p_preferred_start_date, p_preferred_end_date
      ) returning * into v_app;
    exception when unique_violation then
      raise exception 'You already have an active application for academic year %', p_academic_year using errcode = 'P0001';
    end;
    insert into public.application_reviews (application_id, actor_id, from_status, to_status, comment)
    values (v_app.id, auth.uid(), null, 'DRAFT', 'Draft created');
    perform private.log_audit('APPLICATION_DRAFT_CREATED', 'internship_applications', v_app.id::text,
      jsonb_build_object('preferred_host_organization', v_pref_org));
    return v_app.id;
  end if;

  select * into v_app from public.internship_applications where id = p_application_id for update;
  if not found or v_app.student_id <> v_student then
    raise exception 'Application not found' using errcode = 'P0002';
  end if;
  if v_app.status not in ('DRAFT', 'CORRECTION_REQUIRED') then
    raise exception 'Application cannot be edited in status %', v_app.status using errcode = 'P0001';
  end if;

  update public.internship_applications set
    academic_year = p_academic_year,
    preferred_industry = nullif(trim(p_preferred_industry), ''),
    preferred_organization_id = p_preferred_organization_id,
    preferred_host_organization = v_pref_org,
    preference_reason = v_pref_reason,
    motivation = nullif(trim(p_motivation), ''),
    relevant_skills = nullif(trim(p_relevant_skills), ''),
    preferred_start_date = p_preferred_start_date,
    preferred_end_date = p_preferred_end_date
  where id = p_application_id;

  perform private.log_audit('APPLICATION_DRAFT_SAVED', 'internship_applications', p_application_id::text,
    jsonb_build_object('preferred_host_organization', v_pref_org));
  return p_application_id;
end;
$$;

grant execute on function public.student_save_application(
  uuid, text, text, uuid, text, text, date, date, text, text
) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 5. Staff Account Provisioning & Invitation / Password-Setup Flow
-- ---------------------------------------------------------------------------
create table if not exists private.staff_invitations (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  email      text not null,
  role       public.app_role not null,
  token_hash text not null unique,
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create or replace function public.admin_provision_staff_account(
  p_email text,
  p_full_name text,
  p_role public.app_role,
  p_phone text default null,
  p_staff_number text default null,
  p_title text default null,
  p_faculty text default null,
  p_department text default null,
  p_max_students integer default 8,
  p_organization_id uuid default null,
  p_job_title text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := lower(nullif(trim(p_email), ''));
  v_name text := nullif(trim(p_full_name), '');
  v_user_id uuid := gen_random_uuid();
  v_raw_token text := encode(extensions.gen_random_bytes(24), 'hex');
  v_token_hash text := encode(extensions.digest(v_raw_token, 'sha256'), 'hex');
  v_random_pw_hash text := extensions.crypt(encode(extensions.gen_random_bytes(32), 'hex'), extensions.gen_salt('bf'));
begin
  perform private.require_role('admin');

  if p_role = 'student' then
    raise exception 'Students self-register at /register. Staff provisioning is only for coordinator, supervisor, host, management, or admin roles.'
      using errcode = 'P0001';
  end if;

  if v_email is null or v_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'A valid email address is required' using errcode = 'P0001';
  end if;

  if v_name is null or char_length(v_name) < 2 then
    raise exception 'Full name (minimum 2 characters) is required' using errcode = 'P0001';
  end if;

  if exists (select 1 from auth.users where lower(email) = v_email) then
    raise exception 'An account with email % already exists', v_email using errcode = '23505';
  end if;

  if p_role = 'supervisor' then
    if nullif(trim(p_staff_number), '') is null or nullif(trim(p_faculty), '') is null or nullif(trim(p_department), '') is null then
      raise exception 'Academic Supervisors require a staff number, faculty, and department' using errcode = 'P0001';
    end if;
    if exists (select 1 from public.academic_supervisors where lower(staff_number) = lower(trim(p_staff_number))) then
      raise exception 'Staff number % is already assigned to another supervisor', trim(p_staff_number) using errcode = '23505';
    end if;
  end if;

  if p_role = 'host' then
    if p_organization_id is null or not exists (select 1 from public.host_organizations where id = p_organization_id) then
      raise exception 'Host representatives must be linked to an existing host organization' using errcode = 'P0001';
    end if;
  end if;

  -- Create Supabase Auth identity with an unguessable initial hash (no plaintext password distributed)
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000',
    v_user_id,
    'authenticated',
    'authenticated',
    v_email,
    v_random_pw_hash,
    now(),
    jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email'), 'provisioned_by_admin', true),
    jsonb_build_object('full_name', v_name),
    now(),
    now(),
    '', '', '', ''
  );

  insert into auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
  ) values (
    gen_random_uuid(),
    v_user_id,
    jsonb_build_object('sub', v_user_id::text, 'email', v_email, 'email_verified', true, 'phone_verified', false),
    'email',
    v_user_id::text,
    now(),
    now(),
    now()
  );

  -- Update profile phone and assign authorized role
  update public.profiles
  set full_name = v_name,
      phone = nullif(trim(p_phone), ''),
      is_active = true
  where id = v_user_id;

  insert into public.user_roles (user_id, role, granted_by)
  values (v_user_id, p_role, auth.uid())
  on conflict (user_id, role) do nothing;

  if p_role = 'supervisor' then
    insert into public.academic_supervisors (
      user_id, staff_number, title, faculty, department, max_students
    ) values (
      v_user_id,
      trim(p_staff_number),
      nullif(trim(p_title), ''),
      trim(p_faculty),
      trim(p_department),
      coalesce(p_max_students, 8)
    );
  elsif p_role = 'host' then
    insert into public.host_representatives (
      user_id, organization_id, job_title
    ) values (
      v_user_id,
      p_organization_id,
      nullif(trim(p_job_title), '')
    );
  end if;

  insert into private.staff_invitations (user_id, email, role, token_hash, created_by)
  values (v_user_id, v_email, p_role, v_token_hash, auth.uid());

  perform private.log_audit(
    'STAFF_ACCOUNT_PROVISIONED',
    'profiles',
    v_user_id::text,
    jsonb_build_object('email', v_email, 'role', p_role)
  );

  return jsonb_build_object(
    'user_id', v_user_id,
    'email', v_email,
    'full_name', v_name,
    'role', p_role,
    'invitation_token', v_raw_token,
    'setup_path', '/setup-password?token=' || v_raw_token
  );
end;
$$;

create or replace function public.complete_staff_password_setup(
  p_token text,
  p_password text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_hash text;
  v_inv private.staff_invitations;
begin
  if p_token is null or char_length(trim(p_token)) < 16 then
    raise exception 'Invalid or expired account setup token' using errcode = 'P0001';
  end if;
  if p_password is null or char_length(p_password) < 8 then
    raise exception 'Password must be at least 8 characters' using errcode = 'P0001';
  end if;

  v_hash := encode(extensions.digest(trim(p_token), 'sha256'), 'hex');

  select * into v_inv
  from private.staff_invitations
  where token_hash = v_hash
    and accepted_at is null
    and expires_at > now()
  for update;

  if not found then
    raise exception 'This account setup link is invalid or has already been used' using errcode = 'P0001';
  end if;

  update auth.users
  set encrypted_password = extensions.crypt(p_password, extensions.gen_salt('bf')),
      email_confirmed_at = coalesce(email_confirmed_at, now()),
      updated_at = now()
  where id = v_inv.user_id;

  update private.staff_invitations
  set accepted_at = now()
  where id = v_inv.id;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, details)
  values (
    v_inv.user_id,
    'STAFF_PASSWORD_SETUP_COMPLETED',
    'profiles',
    v_inv.user_id::text,
    jsonb_build_object('email', v_inv.email, 'role', v_inv.role)
  );

  return jsonb_build_object(
    'user_id', v_inv.user_id,
    'email', v_inv.email,
    'role', v_inv.role
  );
end;
$$;

grant execute on function public.admin_provision_staff_account(
  text, text, public.app_role, text, text, text, text, text, integer, uuid, text
) to authenticated, service_role;

grant execute on function public.complete_staff_password_setup(text, text) to anon, authenticated, service_role;
