-- =============================================================================
-- Migration 6: Protected University Student Registry & Two-Stage Account Activation
-- Limkokwing University of Creative Technology — Sierra Leone
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Protected University Student Registry (private schema, RLS enabled)
-- ---------------------------------------------------------------------------
create table if not exists private.university_student_registry (
  id                           uuid primary key default gen_random_uuid(),
  student_number               text not null unique
    check (
      student_number = upper(trim(student_number))
      and student_number ~ '^[A-Z0-9][A-Z0-9-]{2,39}$'
    ),
  institutional_email          text not null unique
    check (
      institutional_email = lower(trim(institutional_email))
      and institutional_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    ),
  full_name                    text not null
    check (char_length(trim(full_name)) between 2 and 120),
  faculty                      text not null,
  programme                    text not null,
  year_of_study                smallint not null
    check (year_of_study between 1 and 6),
  semester                     smallint not null default 8
    check (semester between 1 and 12),
  gpa                          numeric(3, 2) not null
    check (gpa between 0.00 and 4.00),
  credits_completed            integer not null default 0
    check (credits_completed >= 0),
  enrollment_status            text not null default 'ENROLLED'
    check (enrollment_status in ('ENROLLED', 'ON_LEAVE', 'SUSPENDED', 'GRADUATED', 'WITHDRAWN')),
  academic_year                text not null default '2025/2026',
  claimed_by_user_id           uuid unique references public.profiles (id) on delete set null,
  claimed_at                   timestamptz,
  imported_by                  uuid references public.profiles (id) on delete set null,
  last_email_corrected_by      uuid references public.profiles (id) on delete set null,
  last_email_correction_reason text,
  created_at                   timestamptz not null default now(),
  updated_at                   timestamptz not null default now(),
  check (
    (claimed_by_user_id is null and claimed_at is null)
    or (claimed_by_user_id is not null and claimed_at is not null)
  )
);

create or replace function private.normalize_student_registry_row()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.student_number := upper(trim(new.student_number));
  new.institutional_email := lower(trim(new.institutional_email));
  new.full_name := trim(new.full_name);
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists university_student_registry_normalize on private.university_student_registry;
create trigger university_student_registry_normalize
  before insert or update on private.university_student_registry
  for each row execute function private.normalize_student_registry_row();

alter table private.university_student_registry enable row level security;
revoke all on table private.university_student_registry from public, anon, authenticated;

-- Harden private.staff_invitations RLS as well (Audit SEC-03)
alter table private.staff_invitations enable row level security;
revoke all on table private.staff_invitations from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. Student Identity Verification Log & Rate-Limit Ledger
-- ---------------------------------------------------------------------------
create table if not exists private.student_identity_verifications (
  id                   uuid primary key default gen_random_uuid(),
  registry_id          uuid references private.university_student_registry (id) on delete set null,
  auth_user_id         uuid references auth.users (id) on delete cascade,
  student_number_input text not null,
  email_input          text not null,
  status               text not null
    check (status in (
      'PRECHECK_PASSED',
      'PENDING_EMAIL_CONFIRMATION',
      'VERIFIED',
      'REJECTED_NOT_FOUND',
      'REJECTED_EMAIL_MISMATCH',
      'REJECTED_INELIGIBLE_STATUS',
      'REJECTED_ALREADY_CLAIMED',
      'REJECTED_RATE_LIMITED',
      'EXPIRED'
    )),
  expires_at           timestamptz not null default (now() + interval '24 hours'),
  verified_at          timestamptz,
  created_at           timestamptz not null default now()
);

create index if not exists student_identity_verifications_lookup_idx
  on private.student_identity_verifications (upper(student_number_input), lower(email_input), created_at desc);

alter table private.student_identity_verifications enable row level security;
revoke all on table private.student_identity_verifications from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- 3. Link public.student_profiles to private.university_student_registry
-- ---------------------------------------------------------------------------
alter table public.student_profiles
  add column if not exists registry_id uuid unique
    references private.university_student_registry (id) on delete restrict,
  add column if not exists registry_verified_at timestamptz;

-- Seed the 4 official Limkokwing development student records
insert into private.university_student_registry (
  student_number, institutional_email, full_name, faculty, programme,
  year_of_study, semester, gpa, credits_completed, enrollment_status, academic_year
)
values
  (
    'LUCT-SL-2024-0452',
    'student@limkokwing.edu.sl',
    'Madi A. Sesay',
    'Faculty of Information & Communication Technology',
    'BSc (Hons) in Software Engineering with Multimedia',
    4, 8, 3.65, 96, 'ENROLLED', '2025/2026'
  ),
  (
    'LUCT-SL-2024-0588',
    'kadiatu.bangura@student.limkokwing.edu.sl',
    'Kadiatu Bangura',
    'Faculty of Information & Communication Technology',
    'BSc (Hons) in Information Technology',
    4, 8, 3.40, 90, 'ENROLLED', '2025/2026'
  ),
  (
    'LUCT-SL-2024-0312',
    'samuel.koroma@student.limkokwing.edu.sl',
    'Samuel Koroma',
    'Faculty of Business & Globalization',
    'BSc (Hons) in Business Information Systems',
    4, 8, 3.55, 92, 'ENROLLED', '2025/2026'
  ),
  (
    'LUCT-SL-2023-0190',
    'aminata.jalloh@student.limkokwing.edu.sl',
    'Aminata Jalloh',
    'Faculty of Architecture & The Built Environment',
    'BSc (Hons) in Architectural Technology',
    4, 8, 3.78, 96, 'ENROLLED', '2025/2026'
  )
on conflict (student_number) do update
  set institutional_email = excluded.institutional_email,
      full_name           = excluded.full_name,
      faculty             = excluded.faculty,
      programme           = excluded.programme,
      year_of_study       = excluded.year_of_study,
      semester            = excluded.semester,
      gpa                 = excluded.gpa,
      credits_completed   = excluded.credits_completed;

-- Backfill any existing student_profiles rows into private.university_student_registry
insert into private.university_student_registry (
  student_number, institutional_email, full_name, faculty, programme,
  year_of_study, semester, gpa, credits_completed, enrollment_status,
  claimed_by_user_id, claimed_at
)
select
  upper(trim(sp.student_number)),
  lower(trim(p.email)),
  p.full_name,
  sp.faculty,
  sp.programme,
  sp.year_of_study,
  sp.semester,
  coalesce(sp.gpa, 3.50),
  sp.credits_completed,
  'ENROLLED',
  sp.user_id,
  sp.created_at
from public.student_profiles sp
join public.profiles p on p.id = sp.user_id
on conflict (student_number) do update
  set claimed_by_user_id = excluded.claimed_by_user_id,
      claimed_at         = coalesce(private.university_student_registry.claimed_at, excluded.claimed_at);

-- Link existing student_profiles rows to their registry_id
update public.student_profiles sp
set registry_id          = r.id,
    registry_verified_at = coalesce(sp.registry_verified_at, r.claimed_at, now()),
    student_number       = r.student_number
from private.university_student_registry r
where upper(trim(sp.student_number)) = r.student_number
  and (sp.registry_id is null or sp.registry_verified_at is null);

alter table public.student_profiles
  alter column registry_id set not null,
  alter column registry_verified_at set not null;

-- Prevent non-admin / non-trigger tampering with authoritative academic columns on student_profiles
-- and automatically resolve registry_id on service-role/trusted INSERT if omitted.
create or replace function private.lock_authoritative_student_columns()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_reg private.university_student_registry;
begin
  if tg_op = 'INSERT' then
    new.student_number := upper(trim(new.student_number));
    if new.registry_id is null then
      select * into v_reg
      from private.university_student_registry r
      where r.student_number = new.student_number
      for update;

      if not found then
        raise exception 'Student ID "%" does not exist in the University Student Registry.', new.student_number
          using errcode = 'P0001';
      end if;

      update private.university_student_registry
      set claimed_by_user_id = new.user_id,
          claimed_at         = coalesce(claimed_at, now())
      where id = v_reg.id;

      new.registry_id := v_reg.id;
      new.registry_verified_at := coalesce(new.registry_verified_at, now());
    end if;
    return new;
  end if;

  if tg_op = 'UPDATE' and auth.uid() is not null and not private.has_role('admin') then
    if new.student_number is distinct from old.student_number
       or new.registry_id is distinct from old.registry_id
       or new.registry_verified_at is distinct from old.registry_verified_at
       or new.faculty is distinct from old.faculty
       or new.programme is distinct from old.programme
       or new.year_of_study is distinct from old.year_of_study
       or new.semester is distinct from old.semester
       or new.gpa is distinct from old.gpa
       or new.credits_completed is distinct from old.credits_completed then
      raise exception 'Academic standing and registry identity fields are managed by the University Registrar and cannot be modified by students.'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists student_profiles_lock_registry_columns on public.student_profiles;
create trigger student_profiles_lock_registry_columns
  before insert or update on public.student_profiles
  for each row execute function private.lock_authoritative_student_columns();

-- ---------------------------------------------------------------------------
-- 4. Harden Authorization Helpers (private.is_active_user, has_role, current_student_id)
-- ---------------------------------------------------------------------------
create or replace function private.is_active_user()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    join auth.users u on u.id = p.id
    where p.id = auth.uid()
      and p.is_active
      and u.email_confirmed_at is not null
  );
$$;

create or replace function private.has_role(p_role public.app_role)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.profiles p on p.id = ur.user_id
    join auth.users u on u.id = p.id
    where ur.user_id = auth.uid()
      and ur.role = p_role
      and p.is_active
      and u.email_confirmed_at is not null
  );
$$;

create or replace function private.current_student_id()
returns uuid
language sql stable security definer set search_path = ''
as $$
  select sp.id
  from public.student_profiles sp
  join private.university_student_registry r on r.id = sp.registry_id
  where sp.user_id = auth.uid()
    and sp.registry_verified_at is not null
    and r.claimed_by_user_id = auth.uid()
    and r.enrollment_status = 'ENROLLED'
    and private.has_role('student');
$$;

-- ---------------------------------------------------------------------------
-- 5. Pre-Signup Registry Candidate Verification (Rate-Limited, Non-Enumerating)
--    Returns structured JSONB so failed verification attempts commit to the
--    rate-limit and audit ledger (private.student_identity_verifications).
-- ---------------------------------------------------------------------------
create or replace function public.verify_student_registration_candidate(
  p_student_number text,
  p_email text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_norm_id text := upper(trim(coalesce(p_student_number, '')));
  v_norm_email text := lower(trim(coalesce(p_email, '')));
  v_recent_failures integer;
  v_reg private.university_student_registry;
  v_generic_error constant text :=
    'We could not verify that Student ID and university email combination against active Limkokwing enrollment records, or an account has already been activated for this Student ID.';
begin
  if v_norm_id = '' or v_norm_email = '' then
    return jsonb_build_object(
      'ok', false,
      'error', v_generic_error
    );
  end if;

  -- Rate-limit check: max 5 rejected attempts per Student ID or email in 15 minutes
  select count(*) into v_recent_failures
  from private.student_identity_verifications siv
  where (upper(siv.student_number_input) = v_norm_id or lower(siv.email_input) = v_norm_email)
    and siv.status like 'REJECTED_%'
    and siv.created_at > (now() - interval '15 minutes');

  if v_recent_failures >= 5 then
    insert into private.student_identity_verifications (
      student_number_input, email_input, status
    ) values (v_norm_id, v_norm_email, 'REJECTED_RATE_LIMITED');

    return jsonb_build_object(
      'ok', false,
      'rate_limited', true,
      'error', 'Too many unsuccessful verification attempts. Please wait 15 minutes or contact the LEAP Coordinator.'
    );
  end if;

  select * into v_reg
  from private.university_student_registry r
  where r.student_number = v_norm_id;

  if not found then
    insert into private.student_identity_verifications (
      student_number_input, email_input, status
    ) values (v_norm_id, v_norm_email, 'REJECTED_NOT_FOUND');

    return jsonb_build_object(
      'ok', false,
      'error', v_generic_error
    );
  end if;

  if v_reg.institutional_email <> v_norm_email then
    insert into private.student_identity_verifications (
      registry_id, student_number_input, email_input, status
    ) values (v_reg.id, v_norm_id, v_norm_email, 'REJECTED_EMAIL_MISMATCH');

    return jsonb_build_object(
      'ok', false,
      'error', v_generic_error
    );
  end if;

  if v_reg.enrollment_status <> 'ENROLLED' then
    insert into private.student_identity_verifications (
      registry_id, student_number_input, email_input, status
    ) values (v_reg.id, v_norm_id, v_norm_email, 'REJECTED_INELIGIBLE_STATUS');

    return jsonb_build_object(
      'ok', false,
      'error', v_generic_error
    );
  end if;

  if v_reg.claimed_by_user_id is not null then
    insert into private.student_identity_verifications (
      registry_id, student_number_input, email_input, status
    ) values (v_reg.id, v_norm_id, v_norm_email, 'REJECTED_ALREADY_CLAIMED');

    return jsonb_build_object(
      'ok', false,
      'error', v_generic_error
    );
  end if;

  insert into private.student_identity_verifications (
    registry_id, student_number_input, email_input, status
  ) values (v_reg.id, v_norm_id, v_norm_email, 'PRECHECK_PASSED');

  -- Return zero private student attributes to unauthenticated caller
  return jsonb_build_object(
    'ok', true,
    'verified_candidate', true,
    'student_number', v_reg.student_number
  );
end;
$$;

-- Helper to refresh an expired pending email verification window when a student requests a resend
create or replace function public.refresh_student_verification_expiry(p_email text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_norm_email text := lower(trim(coalesce(p_email, '')));
begin
  if v_norm_email <> '' then
    update private.student_identity_verifications siv
    set status     = 'PENDING_EMAIL_CONFIRMATION',
        expires_at = now() + interval '24 hours'
    where lower(siv.email_input) = v_norm_email
      and siv.status in ('PENDING_EMAIL_CONFIRMATION', 'EXPIRED')
      and exists (
        select 1
        from private.university_student_registry r
        where r.id = siv.registry_id
          and r.claimed_by_user_id is null
          and r.enrollment_status = 'ENROLLED'
      );
  end if;

  return jsonb_build_object('refreshed', true);
end;
$$;

-- Revoke the legacy single-parameter Student ID availability oracle from anon/authenticated
revoke all on function public.check_student_id_available(text) from public, anon, authenticated;
grant execute on function public.verify_student_registration_candidate(text, text) to anon, authenticated, service_role;
grant execute on function public.refresh_student_verification_expiry(text) to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 6. Two-Stage Student Account Activation Helper & Auth Triggers
-- ---------------------------------------------------------------------------
create or replace function private.activate_verified_student_account(
  p_user_id uuid,
  p_email text,
  p_student_number text,
  p_phone text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_norm_id text := upper(trim(p_student_number));
  v_norm_email text := lower(trim(p_email));
  v_reg private.university_student_registry;
begin
  -- Lock registry row to prevent concurrent race conditions
  select * into v_reg
  from private.university_student_registry r
  where r.student_number = v_norm_id
  for update;

  if not found then
    raise exception 'Student ID could not be verified against the University Student Registry.'
      using errcode = 'P0001';
  end if;

  if v_reg.institutional_email <> v_norm_email then
    raise exception 'Email address does not match the registered university email for this Student ID.'
      using errcode = 'P0001';
  end if;

  if v_reg.enrollment_status <> 'ENROLLED' then
    raise exception 'Student record is not currently in ENROLLED status.'
      using errcode = 'P0001';
  end if;

  if v_reg.claimed_by_user_id is not null and v_reg.claimed_by_user_id <> p_user_id then
    raise exception 'This Student ID has already been claimed by an active account.'
      using errcode = '23505';
  end if;

  -- Mark registry row claimed
  update private.university_student_registry
  set claimed_by_user_id = p_user_id,
      claimed_at         = coalesce(claimed_at, now())
  where id = v_reg.id;

  -- Activate profile using authoritative full_name from registry
  insert into public.profiles (id, email, full_name, phone, is_active)
  values (p_user_id, v_norm_email, v_reg.full_name, p_phone, true)
  on conflict (id) do update
    set email     = excluded.email,
        full_name = v_reg.full_name,
        phone     = coalesce(excluded.phone, public.profiles.phone),
        is_active = true;

  -- Grant strictly the 'student' role
  insert into public.user_roles (user_id, role)
  values (p_user_id, 'student')
  on conflict (user_id, role) do nothing;

  -- Upsert student_profiles strictly from authoritative registry attributes
  insert into public.student_profiles (
    user_id, registry_id, registry_verified_at,
    student_number, faculty, programme, year_of_study, semester,
    gpa, credits_completed
  )
  values (
    p_user_id, v_reg.id, now(),
    v_reg.student_number, v_reg.faculty, v_reg.programme, v_reg.year_of_study, v_reg.semester,
    v_reg.gpa, v_reg.credits_completed
  )
  on conflict (user_id) do update
    set registry_id          = excluded.registry_id,
        registry_verified_at = coalesce(public.student_profiles.registry_verified_at, excluded.registry_verified_at),
        student_number       = excluded.student_number,
        faculty              = excluded.faculty,
        programme            = excluded.programme,
        year_of_study        = excluded.year_of_study,
        semester             = excluded.semester,
        gpa                  = excluded.gpa,
        credits_completed    = excluded.credits_completed;

  update private.student_identity_verifications
  set status      = 'VERIFIED',
      verified_at = now()
  where (auth_user_id = p_user_id or registry_id = v_reg.id)
    and status in ('PRECHECK_PASSED', 'PENDING_EMAIL_CONFIRMATION');

  if not exists (
    select 1 from private.student_identity_verifications siv
    where siv.auth_user_id = p_user_id and siv.status = 'VERIFIED'
  ) then
    insert into private.student_identity_verifications (
      registry_id, auth_user_id, student_number_input, email_input, status, verified_at
    ) values (
      v_reg.id, p_user_id, v_reg.student_number, v_norm_email, 'VERIFIED', now()
    );
  end if;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, details)
  values (
    p_user_id,
    'STUDENT_REGISTRY_ACCOUNT_ACTIVATED',
    'student_profiles',
    p_user_id::text,
    jsonb_build_object(
      'email', v_norm_email,
      'student_number', v_reg.student_number,
      'registry_id', v_reg.id,
      'faculty', v_reg.faculty,
      'programme', v_reg.programme
    )
  );
end;
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_full_name text := coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(new.email, '@', 1));
  v_phone text := nullif(trim(new.raw_user_meta_data ->> 'phone'), '');
  v_student_number text := nullif(upper(trim(new.raw_user_meta_data ->> 'student_number')), '');
  v_norm_email text := lower(trim(new.email));
  v_recent_failures integer;
  v_reg private.university_student_registry;
  v_generic_error constant text :=
    'We could not verify that Student ID and university email combination against active Limkokwing enrollment records, or an account has already been activated for this Student ID.';
begin
  -- Case A: Staff or service-role user creation (no student_number in metadata)
  if v_student_number is null then
    insert into public.profiles (id, email, full_name, phone, is_active)
    values (new.id, v_norm_email, v_full_name, v_phone, (new.email_confirmed_at is not null))
    on conflict (id) do update
      set email     = excluded.email,
          full_name = excluded.full_name,
          phone     = coalesce(excluded.phone, public.profiles.phone);
    return new;
  end if;

  -- Case B: Student self-registration (student_number provided)
  select count(*) into v_recent_failures
  from private.student_identity_verifications siv
  where (upper(siv.student_number_input) = v_student_number or lower(siv.email_input) = v_norm_email)
    and siv.status like 'REJECTED_%'
    and siv.created_at > (now() - interval '15 minutes');

  if v_recent_failures >= 5 then
    raise exception 'Too many unsuccessful verification attempts. Please wait 15 minutes or contact the LEAP Coordinator.'
      using errcode = 'P0001';
  end if;

  -- Lock registry row FOR UPDATE and validate against official registry
  select * into v_reg
  from private.university_student_registry r
  where r.student_number = v_student_number
  for update;

  if not found
     or v_reg.institutional_email <> v_norm_email
     or v_reg.enrollment_status <> 'ENROLLED' then
    raise exception '%', v_generic_error using errcode = 'P0001';
  end if;

  if v_reg.claimed_by_user_id is not null and v_reg.claimed_by_user_id <> new.id then
    raise exception '%', v_generic_error using errcode = '23505';
  end if;

  -- Stage 1 (Email not yet confirmed): Create inactive profile & pending verification record ONLY
  if new.email_confirmed_at is null then
    insert into public.profiles (id, email, full_name, phone, is_active)
    values (new.id, v_norm_email, v_reg.full_name, v_phone, false)
    on conflict (id) do update
      set email     = excluded.email,
          full_name = v_reg.full_name,
          is_active = false;

    insert into private.student_identity_verifications (
      registry_id, auth_user_id, student_number_input, email_input,
      status, expires_at
    ) values (
      v_reg.id, new.id, v_reg.student_number, v_norm_email,
      'PENDING_EMAIL_CONFIRMATION', now() + interval '24 hours'
    );

    insert into public.audit_logs (actor_id, action, entity_type, entity_id, details)
    values (
      new.id,
      'STUDENT_REGISTRATION_PENDING_EMAIL',
      'profiles',
      new.id::text,
      jsonb_build_object('email', v_norm_email, 'student_number', v_reg.student_number, 'registry_id', v_reg.id)
    );
  else
    -- Stage 2 (Email confirmed): Activate immediately from registry
    perform private.activate_verified_student_account(new.id, v_norm_email, v_student_number, v_phone);
  end if;

  return new;
end;
$$;

create or replace function public.handle_auth_user_email_confirmed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_student_number text := nullif(upper(trim(new.raw_user_meta_data ->> 'student_number')), '');
  v_phone text := nullif(trim(new.raw_user_meta_data ->> 'phone'), '');
  v_pending private.student_identity_verifications;
begin
  if old.email_confirmed_at is null and new.email_confirmed_at is not null and v_student_number is not null then
    select * into v_pending
    from private.student_identity_verifications siv
    where siv.auth_user_id = new.id
      and siv.status in ('PENDING_EMAIL_CONFIRMATION', 'EXPIRED')
    order by siv.created_at desc
    limit 1
    for update;

    if found and (v_pending.status = 'EXPIRED' or v_pending.expires_at < now()) then
      update private.student_identity_verifications
      set status = 'EXPIRED'
      where id = v_pending.id;

      raise exception 'Email verification link has expired. Please request a new verification email.'
        using errcode = 'P0001';
    end if;

    perform private.activate_verified_student_account(new.id, new.email, v_student_number, v_phone);
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_confirmed on auth.users;
create trigger on_auth_user_email_confirmed
  after update of email_confirmed_at on auth.users
  for each row
  when (old.email_confirmed_at is null and new.email_confirmed_at is not null)
  execute function public.handle_auth_user_email_confirmed();

-- ---------------------------------------------------------------------------
-- 7. Protected Admin & Coordinator Registry Management RPCs
-- ---------------------------------------------------------------------------
create or replace function public.admin_list_student_registry(p_search text default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_term text := nullif(lower(trim(coalesce(p_search, ''))), '');
  v_result jsonb;
begin
  if not private.is_staff() then
    raise exception 'Permission denied: coordinator or admin role required' using errcode = '42501';
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', r.id,
        'student_number', r.student_number,
        'institutional_email', r.institutional_email,
        'full_name', r.full_name,
        'faculty', r.faculty,
        'programme', r.programme,
        'year_of_study', r.year_of_study,
        'semester', r.semester,
        'gpa', r.gpa,
        'credits_completed', r.credits_completed,
        'enrollment_status', r.enrollment_status,
        'academic_year', r.academic_year,
        'claimed_by_user_id', r.claimed_by_user_id,
        'claimed_at', r.claimed_at,
        'last_email_correction_reason', r.last_email_correction_reason,
        'verification_state', case
          when r.claimed_by_user_id is not null then 'CLAIMED'
          when exists (
            select 1 from private.student_identity_verifications siv
            where siv.registry_id = r.id
              and siv.status = 'PENDING_EMAIL_CONFIRMATION'
              and siv.expires_at > now()
          ) then 'PENDING_EMAIL_CONFIRMATION'
          else 'UNCLAIMED'
        end
      )
      order by r.student_number asc
    ),
    '[]'::jsonb
  )
  into v_result
  from private.university_student_registry r
  where v_term is null
     or lower(r.student_number) like '%' || v_term || '%'
     or lower(r.institutional_email) like '%' || v_term || '%'
     or lower(r.full_name) like '%' || v_term || '%'
     or lower(r.programme) like '%' || v_term || '%';

  return v_result;
end;
$$;

create or replace function public.admin_upsert_student_registry_batch(p_records jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item jsonb;
  v_count integer := 0;
  v_student_number text;
  v_email text;
  v_full_name text;
  v_faculty text;
  v_programme text;
  v_year smallint;
  v_semester smallint;
  v_gpa numeric(3, 2);
  v_credits integer;
  v_status text;
  v_academic_year text;
  v_reg private.university_student_registry;
begin
  perform private.require_role('admin'::public.app_role);

  if p_records is null or jsonb_typeof(p_records) <> 'array' then
    raise exception 'p_records must be a JSON array of registry objects' using errcode = 'P0001';
  end if;

  for v_item in select * from jsonb_array_elements(p_records)
  loop
    v_student_number := upper(trim(coalesce(v_item ->> 'student_number', '')));
    v_email          := lower(trim(coalesce(v_item ->> 'institutional_email', '')));
    v_full_name      := trim(coalesce(v_item ->> 'full_name', ''));
    v_faculty        := trim(coalesce(v_item ->> 'faculty', 'Faculty of Information & Communication Technology'));
    v_programme      := trim(coalesce(v_item ->> 'programme', 'BSc (Hons) in Software Engineering with Multimedia'));
    v_year           := coalesce((v_item ->> 'year_of_study')::smallint, 4);
    v_semester       := coalesce((v_item ->> 'semester')::smallint, 8);
    v_gpa            := coalesce((v_item ->> 'gpa')::numeric(3, 2), 3.50);
    v_credits        := coalesce((v_item ->> 'credits_completed')::integer, 90);
    v_status         := upper(trim(coalesce(v_item ->> 'enrollment_status', 'ENROLLED')));
    v_academic_year  := trim(coalesce(v_item ->> 'academic_year', '2025/2026'));

    insert into private.university_student_registry (
      student_number, institutional_email, full_name, faculty, programme,
      year_of_study, semester, gpa, credits_completed, enrollment_status,
      academic_year, imported_by
    )
    values (
      v_student_number, v_email, v_full_name, v_faculty, v_programme,
      v_year, v_semester, v_gpa, v_credits, v_status,
      v_academic_year, auth.uid()
    )
    on conflict (student_number) do update
      set institutional_email = case
            when private.university_student_registry.claimed_by_user_id is null then excluded.institutional_email
            else private.university_student_registry.institutional_email
          end,
          full_name           = excluded.full_name,
          faculty             = excluded.faculty,
          programme           = excluded.programme,
          year_of_study       = excluded.year_of_study,
          semester            = excluded.semester,
          gpa                 = excluded.gpa,
          credits_completed   = excluded.credits_completed,
          enrollment_status   = excluded.enrollment_status,
          academic_year       = excluded.academic_year,
          imported_by         = auth.uid()
    returning * into v_reg;

    -- If already claimed, synchronize authoritative academic attributes to student_profiles & profiles
    if v_reg.claimed_by_user_id is not null then
      update public.student_profiles
      set faculty           = v_reg.faculty,
          programme         = v_reg.programme,
          year_of_study     = v_reg.year_of_study,
          semester          = v_reg.semester,
          gpa               = v_reg.gpa,
          credits_completed = v_reg.credits_completed
      where registry_id = v_reg.id;

      update public.profiles
      set full_name = v_reg.full_name
      where id = v_reg.claimed_by_user_id;
    end if;

    v_count := v_count + 1;
  end loop;

  perform private.log_audit(
    'STUDENT_REGISTRY_BATCH_UPSERTED',
    'university_student_registry',
    auth.uid()::text,
    jsonb_build_object('upserted_count', v_count)
  );

  return jsonb_build_object('upserted_count', v_count);
end;
$$;

create or replace function public.admin_correct_registry_student_email(
  p_student_number text,
  p_new_email text,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_norm_id text := upper(trim(coalesce(p_student_number, '')));
  v_norm_email text := lower(trim(coalesce(p_new_email, '')));
  v_reason text := trim(coalesce(p_reason, ''));
  v_old_email text;
  v_reg private.university_student_registry;
begin
  perform private.require_role('admin'::public.app_role);

  if char_length(v_reason) < 5 then
    raise exception 'Please provide an audit reason of at least 5 characters for the registry email correction.'
      using errcode = 'P0001';
  end if;

  if v_norm_email !~* '^[^@\s]+@(student\.)?limkokwing\.edu\.sl$' then
    raise exception 'New email must be a valid @limkokwing.edu.sl or @student.limkokwing.edu.sl address.'
      using errcode = 'P0001';
  end if;

  select * into v_reg
  from private.university_student_registry r
  where r.student_number = v_norm_id
  for update;

  if not found then
    raise exception 'Student ID % was not found in the University Student Registry.', v_norm_id
      using errcode = 'P0002';
  end if;

  if v_reg.claimed_by_user_id is not null then
    raise exception 'Student ID % has already been claimed and confirmed by an active student account.', v_norm_id
      using errcode = 'P0001';
  end if;

  v_old_email := v_reg.institutional_email;

  -- Expire any pending verification attempts and remove any unconfirmed auth.users row for the old email
  update private.student_identity_verifications
  set status = 'EXPIRED'
  where registry_id = v_reg.id
    and status = 'PENDING_EMAIL_CONFIRMATION';

  delete from auth.users u
  where lower(u.email) = v_old_email
    and u.email_confirmed_at is null;

  update private.university_student_registry
  set institutional_email          = v_norm_email,
      last_email_corrected_by      = auth.uid(),
      last_email_correction_reason = v_reason
  where id = v_reg.id
  returning * into v_reg;

  perform private.log_audit(
    'STUDENT_REGISTRY_EMAIL_CORRECTED',
    'university_student_registry',
    v_reg.id::text,
    jsonb_build_object(
      'student_number', v_reg.student_number,
      'old_email', v_old_email,
      'new_email', v_norm_email,
      'reason', v_reason
    )
  );

  return jsonb_build_object(
    'id', v_reg.id,
    'student_number', v_reg.student_number,
    'old_email', v_old_email,
    'institutional_email', v_reg.institutional_email,
    'reason', v_reason
  );
end;
$$;

grant execute on function public.admin_list_student_registry(text) to authenticated, service_role;
grant execute on function public.admin_upsert_student_registry_batch(jsonb) to authenticated, service_role;
grant execute on function public.admin_correct_registry_student_email(text, text, text) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 8. Defense-in-Depth Function ACL Hardening (Audit Findings SEC-01 & SEC-02)
-- ---------------------------------------------------------------------------
revoke execute on function private.log_audit(text, text, text, jsonb) from public, anon, authenticated;
revoke execute on function private.notify(uuid, text, text, text, text) from public, anon, authenticated;
revoke execute on function private.notify_role(public.app_role, text, text, text, text) from public, anon, authenticated;
revoke execute on function private.notify_org(uuid, text, text, text, text) from public, anon, authenticated;
revoke execute on function private.refresh_completion(uuid) from public, anon, authenticated;
revoke execute on function private.activate_verified_student_account(uuid, text, text, text) from public, anon, authenticated;
