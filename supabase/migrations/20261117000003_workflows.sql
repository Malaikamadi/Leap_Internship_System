-- =============================================================================
-- Migration 3: Transactional workflow functions
-- Every state transition is validated here (never in the browser).
-- Each function: checks role + ownership, locks rows, validates the transition,
-- writes history, an audit record and notifications in a single transaction.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Small helpers
-- ---------------------------------------------------------------------------
create or replace function private.require_role(p_role public.app_role)
returns void
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not private.has_role(p_role) then
    raise exception 'Permission denied: % role required', p_role using errcode = '42501';
  end if;
end;
$$;

create or replace function private.student_user_id(p_student_id uuid)
returns uuid
language sql stable security definer set search_path = ''
as $$
  select user_id from public.student_profiles where id = p_student_id;
$$;

create or replace function private.student_name(p_student_id uuid)
returns text
language sql stable security definer set search_path = ''
as $$
  select p.full_name from public.student_profiles sp join public.profiles p on p.id = sp.user_id
  where sp.id = p_student_id;
$$;

create or replace function private.current_supervisor_user(p_placement_id uuid)
returns uuid
language sql stable security definer set search_path = ''
as $$
  select s.user_id
  from public.supervisor_assignments sa
  join public.academic_supervisors s on s.id = sa.supervisor_id
  where sa.placement_id = p_placement_id and sa.is_current;
$$;

-- Eligibility evaluation against configurable (unconfirmed) thresholds.
create or replace function private.evaluate_eligibility(p_student_id uuid)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_sp public.student_profiles;
  v_min_gpa numeric := (private.setting('eligibility_min_gpa') #>> '{}')::numeric;
  v_min_credits integer := (private.setting('eligibility_min_credits') #>> '{}')::integer;
  v_min_year integer := (private.setting('eligibility_min_year') #>> '{}')::integer;
  v_checks jsonb := '[]'::jsonb;
  v_ok boolean := true;
  v_pass boolean;
begin
  select * into v_sp from public.student_profiles where id = p_student_id;
  if not found then
    return jsonb_build_object('eligible', false, 'checks', '[]'::jsonb);
  end if;

  if v_min_gpa is not null then
    v_pass := coalesce(v_sp.gpa, 0) >= v_min_gpa;
    v_ok := v_ok and v_pass;
    v_checks := v_checks || jsonb_build_object('rule', 'Minimum GPA', 'required', v_min_gpa, 'actual', v_sp.gpa, 'passed', v_pass);
  end if;
  if v_min_credits is not null then
    v_pass := v_sp.credits_completed >= v_min_credits;
    v_ok := v_ok and v_pass;
    v_checks := v_checks || jsonb_build_object('rule', 'Minimum credits completed', 'required', v_min_credits, 'actual', v_sp.credits_completed, 'passed', v_pass);
  end if;
  if v_min_year is not null then
    v_pass := v_sp.year_of_study >= v_min_year;
    v_ok := v_ok and v_pass;
    v_checks := v_checks || jsonb_build_object('rule', 'Minimum year of study', 'required', v_min_year, 'actual', v_sp.year_of_study, 'passed', v_pass);
  end if;

  return jsonb_build_object('eligible', v_ok, 'checks', v_checks);
end;
$$;

-- Recalculate completion-record counters for a placement.
create or replace function private.refresh_completion(p_placement_id uuid)
returns void
language sql security definer set search_path = ''
as $$
  update public.completion_records cr
  set accepted_reports = (select count(*) from public.progress_reports r
                          where r.placement_id = p_placement_id and r.status = 'ACCEPTED'),
      total_hours = (select coalesce(sum(r.hours_worked), 0) from public.progress_reports r
                     where r.placement_id = p_placement_id and r.status = 'ACCEPTED'),
      host_evaluation_received = exists (select 1 from public.host_evaluations e where e.placement_id = p_placement_id),
      final_score = (select a.final_score from public.assessments a where a.placement_id = p_placement_id)
  where cr.placement_id = p_placement_id and cr.status = 'IN_PROGRESS';
$$;

-- Requirement checklist (configurable; values pending university confirmation).
create or replace function private.completion_check(p_placement_id uuid)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_min_reports integer := coalesce((private.setting('completion_min_accepted_reports') #>> '{}')::integer, 0);
  v_min_hours integer := coalesce((private.setting('completion_min_hours') #>> '{}')::integer, 0);
  v_need_eval boolean := coalesce((private.setting('completion_requires_host_evaluation') #>> '{}')::boolean, true);
  v_pass_mark numeric := coalesce((private.setting('completion_pass_mark') #>> '{}')::numeric, 0);
  v_reports integer;
  v_hours integer;
  v_has_eval boolean;
  v_assessment public.assessments;
  v_items jsonb := '[]'::jsonb;
  v_met boolean := true;
begin
  select count(*), coalesce(sum(hours_worked), 0) into v_reports, v_hours
  from public.progress_reports where placement_id = p_placement_id and status = 'ACCEPTED';
  select exists (select 1 from public.host_evaluations where placement_id = p_placement_id) into v_has_eval;
  select * into v_assessment from public.assessments where placement_id = p_placement_id;

  v_items := v_items || jsonb_build_object('requirement', 'Accepted progress reports', 'required', v_min_reports, 'actual', v_reports, 'met', v_reports >= v_min_reports);
  v_met := v_met and v_reports >= v_min_reports;

  v_items := v_items || jsonb_build_object('requirement', 'Verified hours (accepted reports)', 'required', v_min_hours, 'actual', v_hours, 'met', v_hours >= v_min_hours);
  v_met := v_met and v_hours >= v_min_hours;

  if v_need_eval then
    v_items := v_items || jsonb_build_object('requirement', 'Host organisation evaluation', 'required', true, 'actual', v_has_eval, 'met', v_has_eval);
    v_met := v_met and v_has_eval;
  end if;

  v_items := v_items || jsonb_build_object('requirement', 'Assessment recorded', 'required', true, 'actual', v_assessment.id is not null, 'met', v_assessment.id is not null);
  v_met := v_met and v_assessment.id is not null;

  return jsonb_build_object(
    'requirements_met', v_met,
    'items', v_items,
    'pass_mark', v_pass_mark,
    'final_score', v_assessment.final_score,
    'assessment_status', v_assessment.status
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Session helpers exposed to clients
-- ---------------------------------------------------------------------------
create or replace function public.current_user_has_role(p_role public.app_role)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select private.has_role(p_role);
$$;

-- Records a sign-in event and returns whether the account may use the system.
create or replace function public.record_sign_in()
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  v_active boolean := private.is_active_user();
begin
  if auth.uid() is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;
  perform private.log_audit(case when v_active then 'SIGN_IN' else 'SIGN_IN_BLOCKED_INACTIVE' end, 'auth', auth.uid()::text);
  return v_active;
end;
$$;

-- ---------------------------------------------------------------------------
-- STUDENT: applications
-- ---------------------------------------------------------------------------
create or replace function public.student_save_application(
  p_application_id uuid,
  p_academic_year text,
  p_preferred_industry text,
  p_preferred_organization_id uuid,
  p_motivation text,
  p_relevant_skills text,
  p_preferred_start_date date,
  p_preferred_end_date date
)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_student uuid := private.current_student_id();
  v_app public.internship_applications;
begin
  if v_student is null then
    raise exception 'Only active students can create applications' using errcode = '42501';
  end if;

  if p_application_id is null then
    begin
      insert into public.internship_applications (
        student_id, academic_year, preferred_industry, preferred_organization_id,
        motivation, relevant_skills, preferred_start_date, preferred_end_date
      ) values (
        v_student, p_academic_year, nullif(trim(p_preferred_industry), ''), p_preferred_organization_id,
        nullif(trim(p_motivation), ''), nullif(trim(p_relevant_skills), ''), p_preferred_start_date, p_preferred_end_date
      ) returning * into v_app;
    exception when unique_violation then
      raise exception 'You already have an active application for academic year %', p_academic_year using errcode = 'P0001';
    end;
    insert into public.application_reviews (application_id, actor_id, from_status, to_status, comment)
    values (v_app.id, auth.uid(), null, 'DRAFT', 'Draft created');
    perform private.log_audit('APPLICATION_DRAFT_CREATED', 'internship_applications', v_app.id::text);
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
    motivation = nullif(trim(p_motivation), ''),
    relevant_skills = nullif(trim(p_relevant_skills), ''),
    preferred_start_date = p_preferred_start_date,
    preferred_end_date = p_preferred_end_date
  where id = p_application_id;

  perform private.log_audit('APPLICATION_DRAFT_SAVED', 'internship_applications', p_application_id::text);
  return p_application_id;
end;
$$;

create or replace function public.student_submit_application(p_application_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_student uuid := private.current_student_id();
  v_app public.internship_applications;
  v_sp public.student_profiles;
  v_phone text;
  v_missing text[] := '{}';
begin
  if v_student is null then
    raise exception 'Only active students can submit applications' using errcode = '42501';
  end if;
  select * into v_app from public.internship_applications where id = p_application_id for update;
  if not found or v_app.student_id <> v_student then
    raise exception 'Application not found' using errcode = 'P0002';
  end if;
  if v_app.status not in ('DRAFT', 'CORRECTION_REQUIRED') then
    raise exception 'Invalid transition: % -> SUBMITTED', v_app.status using errcode = 'P0001';
  end if;

  -- Required profile details
  select * into v_sp from public.student_profiles where id = v_student;
  select phone into v_phone from public.profiles where id = auth.uid();
  if v_phone is null then v_missing := v_missing || 'profile: phone number'; end if;
  if v_sp.emergency_contact is null then v_missing := v_missing || 'profile: emergency contact'; end if;
  if v_sp.skills is null then v_missing := v_missing || 'profile: skills'; end if;

  -- Required application fields
  if v_app.preferred_industry is null then v_missing := v_missing || 'preferred industry'; end if;
  if v_app.motivation is null or char_length(v_app.motivation) < 100 then
    v_missing := v_missing || 'motivation statement (minimum 100 characters)';
  end if;
  if v_app.relevant_skills is null then v_missing := v_missing || 'relevant skills'; end if;
  if v_app.preferred_start_date is null or v_app.preferred_end_date is null then
    v_missing := v_missing || 'preferred start and end dates';
  end if;

  if array_length(v_missing, 1) > 0 then
    raise exception 'Application incomplete. Missing: %', array_to_string(v_missing, '; ') using errcode = 'P0001';
  end if;

  update public.internship_applications
  set status = 'SUBMITTED', submitted_at = now()
  where id = p_application_id;

  insert into public.application_reviews (application_id, actor_id, from_status, to_status, comment)
  values (p_application_id, auth.uid(), v_app.status, 'SUBMITTED',
          case when v_app.status = 'CORRECTION_REQUIRED' then 'Resubmitted after corrections' else 'Submitted for review' end);

  perform private.log_audit('APPLICATION_SUBMITTED', 'internship_applications', p_application_id::text,
                            jsonb_build_object('from', v_app.status));
  perform private.notify(auth.uid(), 'application', 'Application submitted',
    'Your LEAP application for ' || v_app.academic_year || ' was submitted and is awaiting coordinator review.',
    '/app/student/application');
  perform private.notify_role('coordinator', 'application', 'New application submitted',
    coalesce(private.student_name(v_student), 'A student') || ' submitted a LEAP application for ' || v_app.academic_year || '.',
    '/app/coordinator/applications');
end;
$$;

-- ---------------------------------------------------------------------------
-- COORDINATOR: application review
-- ---------------------------------------------------------------------------
create or replace function public.get_application_eligibility(p_application_id uuid)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_app public.internship_applications;
begin
  select * into v_app from public.internship_applications where id = p_application_id;
  if not found then
    raise exception 'Application not found' using errcode = 'P0002';
  end if;
  if not (private.is_staff() or v_app.student_id = private.current_student_id()) then
    raise exception 'Permission denied' using errcode = '42501';
  end if;
  return private.evaluate_eligibility(v_app.student_id);
end;
$$;

create or replace function public.coordinator_start_review(p_application_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_app public.internship_applications;
begin
  perform private.require_role('coordinator');
  select * into v_app from public.internship_applications where id = p_application_id for update;
  if not found then
    raise exception 'Application not found' using errcode = 'P0002';
  end if;
  if v_app.status <> 'SUBMITTED' then
    raise exception 'Invalid transition: % -> UNDER_REVIEW', v_app.status using errcode = 'P0001';
  end if;

  update public.internship_applications set status = 'UNDER_REVIEW' where id = p_application_id;
  insert into public.application_reviews (application_id, actor_id, from_status, to_status, comment)
  values (p_application_id, auth.uid(), 'SUBMITTED', 'UNDER_REVIEW', 'Review started');
  perform private.log_audit('APPLICATION_REVIEW_STARTED', 'internship_applications', p_application_id::text);
  perform private.notify(private.student_user_id(v_app.student_id), 'application', 'Application under review',
    'A LEAP coordinator has started reviewing your application.', '/app/student/application');
end;
$$;

create or replace function public.coordinator_decide_application(
  p_application_id uuid,
  p_decision public.application_status,
  p_comment text
)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_app public.internship_applications;
  v_elig jsonb;
  v_comment text := nullif(trim(p_comment), '');
  v_title text;
begin
  perform private.require_role('coordinator');
  if p_decision not in ('APPROVED', 'REJECTED', 'CORRECTION_REQUIRED') then
    raise exception 'Invalid decision %', p_decision using errcode = 'P0001';
  end if;

  select * into v_app from public.internship_applications where id = p_application_id for update;
  if not found then
    raise exception 'Application not found' using errcode = 'P0002';
  end if;
  if private.student_user_id(v_app.student_id) = auth.uid() then
    raise exception 'You cannot decide on your own application' using errcode = '42501';
  end if;
  if v_app.status <> 'UNDER_REVIEW' then
    raise exception 'Invalid transition: % -> %', v_app.status, p_decision using errcode = 'P0001';
  end if;
  if p_decision in ('REJECTED', 'CORRECTION_REQUIRED') and (v_comment is null or char_length(v_comment) < 5) then
    raise exception 'A comment (minimum 5 characters) is required when rejecting or requesting corrections' using errcode = 'P0001';
  end if;

  if p_decision = 'APPROVED' then
    v_elig := private.evaluate_eligibility(v_app.student_id);
    if not (v_elig ->> 'eligible')::boolean then
      raise exception 'Student does not meet the configured eligibility rules: %', v_elig -> 'checks' using errcode = 'P0001';
    end if;
  end if;

  update public.internship_applications
  set status = p_decision,
      decided_at = case when p_decision in ('APPROVED', 'REJECTED') then now() else decided_at end,
      decided_by = case when p_decision in ('APPROVED', 'REJECTED') then auth.uid() else decided_by end
  where id = p_application_id;

  insert into public.application_reviews (application_id, actor_id, from_status, to_status, comment)
  values (p_application_id, auth.uid(), 'UNDER_REVIEW', p_decision, v_comment);

  perform private.log_audit('APPLICATION_' || p_decision::text, 'internship_applications', p_application_id::text,
                            jsonb_build_object('comment', v_comment));

  v_title := case p_decision
    when 'APPROVED' then 'Application approved'
    when 'REJECTED' then 'Application rejected'
    else 'Corrections requested' end;
  perform private.notify(private.student_user_id(v_app.student_id),
    case when p_decision = 'CORRECTION_REQUIRED' then 'correction' else 'decision' end,
    v_title,
    case p_decision
      when 'APPROVED' then 'Your application was approved. You are now eligible for placement.'
      when 'REJECTED' then 'Your application was not approved. Reason: ' || v_comment
      else 'Please update your application: ' || v_comment end,
    '/app/student/application');
end;
$$;

-- ---------------------------------------------------------------------------
-- COORDINATOR / HOST: placements
-- ---------------------------------------------------------------------------
create or replace function public.coordinator_create_placement(
  p_application_id uuid,
  p_opportunity_id uuid,
  p_start_date date,
  p_end_date date
)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_app public.internship_applications;
  v_opp public.placement_opportunities;
  v_org public.host_organizations;
  v_filled integer;
  v_status public.placement_status;
  v_id uuid;
begin
  perform private.require_role('coordinator');
  if p_start_date is null or p_end_date is null or p_end_date <= p_start_date then
    raise exception 'A valid start date and a later end date are required' using errcode = 'P0001';
  end if;

  select * into v_app from public.internship_applications where id = p_application_id for update;
  if not found then
    raise exception 'Application not found' using errcode = 'P0002';
  end if;
  if v_app.status <> 'APPROVED' then
    raise exception 'Only approved applications can be placed (current: %)', v_app.status using errcode = 'P0001';
  end if;

  -- Lock the opportunity so concurrent assignments cannot exceed capacity.
  select * into v_opp from public.placement_opportunities where id = p_opportunity_id for update;
  if not found then
    raise exception 'Placement opportunity not found' using errcode = 'P0002';
  end if;
  if v_opp.status <> 'OPEN' then
    raise exception 'This placement opportunity is closed' using errcode = 'P0001';
  end if;
  select * into v_org from public.host_organizations where id = v_opp.organization_id;
  if not v_org.is_active then
    raise exception 'The host organisation is inactive' using errcode = 'P0001';
  end if;

  select count(*) into v_filled from public.placements
  where opportunity_id = p_opportunity_id and status <> 'CANCELLED';
  if v_filled >= v_opp.capacity then
    raise exception 'No remaining capacity: % of % places filled', v_filled, v_opp.capacity using errcode = 'P0001';
  end if;

  if exists (select 1 from public.placements where student_id = v_app.student_id
             and status in ('PENDING', 'AWAITING_CONFIRMATION', 'CONFIRMED', 'ACTIVE')) then
    raise exception 'This student already has a live placement' using errcode = 'P0001';
  end if;

  v_status := case when coalesce((private.setting('placement_requires_host_confirmation') #>> '{}')::boolean, true)
                   then 'AWAITING_CONFIRMATION'::public.placement_status
                   else 'CONFIRMED'::public.placement_status end;

  insert into public.placements (application_id, student_id, opportunity_id, organization_id, status, start_date, end_date, created_by)
  values (p_application_id, v_app.student_id, p_opportunity_id, v_opp.organization_id, v_status, p_start_date, p_end_date, auth.uid())
  returning id into v_id;

  perform private.log_audit('PLACEMENT_CREATED', 'placements', v_id::text,
    jsonb_build_object('opportunity', v_opp.title, 'organization', v_org.name, 'status', v_status));
  perform private.notify(private.student_user_id(v_app.student_id), 'placement', 'Placement assigned',
    'You have been nominated for "' || v_opp.title || '" at ' || v_org.name ||
    case when v_status = 'AWAITING_CONFIRMATION' then '. Awaiting host confirmation.' else '.' end,
    '/app/student/placement');
  if v_status = 'AWAITING_CONFIRMATION' then
    perform private.notify_org(v_opp.organization_id, 'placement', 'Placement awaiting your confirmation',
      coalesce(private.student_name(v_app.student_id), 'A student') || ' has been nominated for "' || v_opp.title || '".',
      '/app/host/interns');
  end if;
  return v_id;
exception when unique_violation then
  raise exception 'This student already has a live placement' using errcode = 'P0001';
end;
$$;

create or replace function public.host_respond_placement(
  p_placement_id uuid,
  p_accept boolean,
  p_note text
)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_pl public.placements;
  v_note text := nullif(trim(p_note), '');
begin
  perform private.require_role('host');
  select * into v_pl from public.placements where id = p_placement_id for update;
  if not found or v_pl.organization_id is distinct from private.current_host_org_id() then
    raise exception 'Placement not found' using errcode = 'P0002';
  end if;
  if v_pl.status <> 'AWAITING_CONFIRMATION' then
    raise exception 'Invalid transition: % -> %', v_pl.status, case when p_accept then 'CONFIRMED' else 'CANCELLED' end
      using errcode = 'P0001';
  end if;
  if not p_accept and (v_note is null or char_length(v_note) < 5) then
    raise exception 'Please give a reason (minimum 5 characters) when declining' using errcode = 'P0001';
  end if;

  update public.placements set
    status = case when p_accept then 'CONFIRMED'::public.placement_status else 'CANCELLED'::public.placement_status end,
    host_response_note = v_note,
    host_responded_at = now(),
    host_responded_by = auth.uid(),
    cancellation_reason = case when p_accept then null else 'Declined by host: ' || v_note end
  where id = p_placement_id;

  update public.supervisor_assignments set is_current = false, ended_at = now()
  where placement_id = p_placement_id and is_current and not p_accept;

  perform private.log_audit(case when p_accept then 'PLACEMENT_CONFIRMED_BY_HOST' else 'PLACEMENT_DECLINED_BY_HOST' end,
                            'placements', p_placement_id::text, jsonb_build_object('note', v_note));
  perform private.notify(private.student_user_id(v_pl.student_id), 'placement',
    case when p_accept then 'Placement confirmed by host' else 'Placement declined by host' end,
    case when p_accept then 'The host organisation confirmed your placement.'
         else 'The host organisation declined the placement. The LEAP office will arrange an alternative.' end,
    '/app/student/placement');
  perform private.notify_role('coordinator', 'placement',
    case when p_accept then 'Host confirmed a placement' else 'Host declined a placement' end,
    coalesce(private.student_name(v_pl.student_id), 'Student') || ': ' || coalesce(v_note, 'no note'),
    '/app/coordinator/placements');
end;
$$;

create or replace function public.coordinator_assign_supervisor(
  p_placement_id uuid,
  p_supervisor_id uuid
)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_pl public.placements;
  v_sup public.academic_supervisors;
  v_load integer;
  v_current uuid;
begin
  perform private.require_role('coordinator');
  select * into v_pl from public.placements where id = p_placement_id for update;
  if not found then
    raise exception 'Placement not found' using errcode = 'P0002';
  end if;
  if v_pl.status not in ('PENDING', 'AWAITING_CONFIRMATION', 'CONFIRMED', 'ACTIVE') then
    raise exception 'Supervisors cannot be assigned to a % placement', v_pl.status using errcode = 'P0001';
  end if;

  select * into v_sup from public.academic_supervisors where id = p_supervisor_id for update;
  if not found then
    raise exception 'Supervisor not found' using errcode = 'P0002';
  end if;
  if not exists (
    select 1 from public.user_roles ur join public.profiles p on p.id = ur.user_id
    where ur.user_id = v_sup.user_id and ur.role = 'supervisor' and p.is_active
  ) then
    raise exception 'Selected staff member is not an active academic supervisor' using errcode = 'P0001';
  end if;
  if v_sup.user_id = private.student_user_id(v_pl.student_id) then
    raise exception 'A student cannot supervise themselves' using errcode = 'P0001';
  end if;

  select supervisor_id into v_current from public.supervisor_assignments
  where placement_id = p_placement_id and is_current;
  if v_current = p_supervisor_id then
    raise exception 'This supervisor is already assigned to the placement' using errcode = 'P0001';
  end if;

  select count(*) into v_load
  from public.supervisor_assignments sa
  join public.placements pl on pl.id = sa.placement_id
  where sa.supervisor_id = p_supervisor_id and sa.is_current
    and pl.status in ('PENDING', 'AWAITING_CONFIRMATION', 'CONFIRMED', 'ACTIVE');
  if v_load >= v_sup.max_students then
    raise exception 'Supervisor is at full capacity (% of % students)', v_load, v_sup.max_students using errcode = 'P0001';
  end if;

  update public.supervisor_assignments set is_current = false, ended_at = now()
  where placement_id = p_placement_id and is_current;
  insert into public.supervisor_assignments (placement_id, supervisor_id, assigned_by)
  values (p_placement_id, p_supervisor_id, auth.uid());

  perform private.log_audit('SUPERVISOR_ASSIGNED', 'placements', p_placement_id::text,
    jsonb_build_object('supervisor_id', p_supervisor_id, 'previous_supervisor_id', v_current));
  perform private.notify(private.student_user_id(v_pl.student_id), 'supervisor', 'Academic supervisor assigned',
    (select full_name from public.profiles where id = v_sup.user_id) || ' is now your academic supervisor.',
    '/app/student/placement');
  perform private.notify(v_sup.user_id, 'supervisor', 'New student assigned',
    'You have been assigned to supervise ' || coalesce(private.student_name(v_pl.student_id), 'a student') || '.',
    '/app/supervisor/students');
end;
$$;

create or replace function public.coordinator_activate_placement(p_placement_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_pl public.placements;
  v_sup_user uuid;
begin
  perform private.require_role('coordinator');
  select * into v_pl from public.placements where id = p_placement_id for update;
  if not found then
    raise exception 'Placement not found' using errcode = 'P0002';
  end if;
  if v_pl.status <> 'CONFIRMED' then
    raise exception 'Invalid transition: % -> ACTIVE (placement must be CONFIRMED)', v_pl.status using errcode = 'P0001';
  end if;
  v_sup_user := private.current_supervisor_user(p_placement_id);
  if v_sup_user is null then
    raise exception 'Assign an academic supervisor before activating the placement' using errcode = 'P0001';
  end if;

  update public.placements set status = 'ACTIVE' where id = p_placement_id;
  insert into public.completion_records (placement_id, student_id) values (p_placement_id, v_pl.student_id)
  on conflict (placement_id) do nothing;

  perform private.log_audit('PLACEMENT_ACTIVATED', 'placements', p_placement_id::text);
  perform private.notify(private.student_user_id(v_pl.student_id), 'placement', 'Internship started',
    'Your placement is now active. Progress reporting is open.', '/app/student/reports');
  perform private.notify(v_sup_user, 'placement', 'Supervised internship started',
    coalesce(private.student_name(v_pl.student_id), 'Your student') || ' has started their internship.', '/app/supervisor/students');
  perform private.notify_org(v_pl.organization_id, 'placement', 'Internship started',
    coalesce(private.student_name(v_pl.student_id), 'Your intern') || ' has started their internship.', '/app/host/interns');
end;
$$;

create or replace function public.coordinator_cancel_placement(p_placement_id uuid, p_reason text)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_pl public.placements;
  v_reason text := nullif(trim(p_reason), '');
  v_sup_user uuid;
begin
  perform private.require_role('coordinator');
  if v_reason is null or char_length(v_reason) < 5 then
    raise exception 'A cancellation reason (minimum 5 characters) is required' using errcode = 'P0001';
  end if;
  select * into v_pl from public.placements where id = p_placement_id for update;
  if not found then
    raise exception 'Placement not found' using errcode = 'P0002';
  end if;
  if v_pl.status in ('COMPLETED', 'CANCELLED') then
    raise exception 'Invalid transition: % -> CANCELLED', v_pl.status using errcode = 'P0001';
  end if;

  v_sup_user := private.current_supervisor_user(p_placement_id);
  update public.placements set status = 'CANCELLED', cancellation_reason = v_reason where id = p_placement_id;
  update public.supervisor_assignments set is_current = false, ended_at = now()
  where placement_id = p_placement_id and is_current;
  update public.completion_records set status = 'NOT_COMPLETED', decided_by = auth.uid(), decided_at = now(),
    requirements_snapshot = jsonb_build_object('cancelled', true, 'reason', v_reason)
  where placement_id = p_placement_id and status = 'IN_PROGRESS';

  perform private.log_audit('PLACEMENT_CANCELLED', 'placements', p_placement_id::text, jsonb_build_object('reason', v_reason));
  perform private.notify(private.student_user_id(v_pl.student_id), 'placement', 'Placement cancelled',
    'Your placement was cancelled: ' || v_reason, '/app/student/placement');
  perform private.notify(v_sup_user, 'placement', 'Placement cancelled',
    'A supervised placement was cancelled: ' || v_reason, '/app/supervisor/students');
  perform private.notify_org(v_pl.organization_id, 'placement', 'Placement cancelled',
    'A placement at your organisation was cancelled: ' || v_reason, '/app/host/interns');
end;
$$;

-- ---------------------------------------------------------------------------
-- STUDENT / SUPERVISOR: progress reports
-- ---------------------------------------------------------------------------
create or replace function public.student_save_report(
  p_report_id uuid,
  p_period_start date,
  p_period_end date,
  p_hours_worked integer,
  p_activities text,
  p_learning_outcomes text,
  p_challenges text,
  p_next_steps text
)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_student uuid := private.current_student_id();
  v_pl public.placements;
  v_rep public.progress_reports;
  v_number integer;
  v_id uuid;
begin
  if v_student is null then
    raise exception 'Only active students can write progress reports' using errcode = '42501';
  end if;
  if p_period_start is null or p_period_end is null or p_period_end < p_period_start then
    raise exception 'A valid reporting period is required' using errcode = 'P0001';
  end if;

  if p_report_id is null then
    select * into v_pl from public.placements
    where student_id = v_student and status = 'ACTIVE' for update;
    if not found then
      raise exception 'Progress reports can only be created for an ACTIVE placement' using errcode = 'P0001';
    end if;
  else
    select * into v_rep from public.progress_reports where id = p_report_id for update;
    if not found or v_rep.student_id <> v_student then
      raise exception 'Report not found' using errcode = 'P0002';
    end if;
    if v_rep.status not in ('DRAFT', 'CORRECTION_REQUIRED') then
      raise exception 'Report cannot be edited in status %', v_rep.status using errcode = 'P0001';
    end if;
    select * into v_pl from public.placements where id = v_rep.placement_id;
    if v_pl.status <> 'ACTIVE' then
      raise exception 'Placement is no longer active' using errcode = 'P0001';
    end if;
  end if;

  if p_period_start < v_pl.start_date or p_period_end > v_pl.end_date then
    raise exception 'Reporting period must fall within the placement dates (% to %)', v_pl.start_date, v_pl.end_date
      using errcode = 'P0001';
  end if;

  if p_report_id is null then
    select coalesce(max(report_number), 0) + 1 into v_number from public.progress_reports where placement_id = v_pl.id;
    insert into public.progress_reports (placement_id, student_id, report_number, period_start, period_end,
      hours_worked, activities, learning_outcomes, challenges, next_steps)
    values (v_pl.id, v_student, v_number, p_period_start, p_period_end, coalesce(p_hours_worked, 0),
      coalesce(trim(p_activities), ''), coalesce(trim(p_learning_outcomes), ''),
      nullif(trim(p_challenges), ''), nullif(trim(p_next_steps), ''))
    returning id into v_id;
    perform private.log_audit('REPORT_DRAFT_CREATED', 'progress_reports', v_id::text);
    return v_id;
  end if;

  update public.progress_reports set
    period_start = p_period_start, period_end = p_period_end, hours_worked = coalesce(p_hours_worked, 0),
    activities = coalesce(trim(p_activities), ''), learning_outcomes = coalesce(trim(p_learning_outcomes), ''),
    challenges = nullif(trim(p_challenges), ''), next_steps = nullif(trim(p_next_steps), '')
  where id = p_report_id;
  perform private.log_audit('REPORT_DRAFT_SAVED', 'progress_reports', p_report_id::text);
  return p_report_id;
end;
$$;

create or replace function public.student_submit_report(p_report_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_student uuid := private.current_student_id();
  v_rep public.progress_reports;
  v_sup_user uuid;
begin
  if v_student is null then
    raise exception 'Only active students can submit progress reports' using errcode = '42501';
  end if;
  select * into v_rep from public.progress_reports where id = p_report_id for update;
  if not found or v_rep.student_id <> v_student then
    raise exception 'Report not found' using errcode = 'P0002';
  end if;
  if v_rep.status not in ('DRAFT', 'CORRECTION_REQUIRED') then
    raise exception 'Invalid transition: % -> SUBMITTED', v_rep.status using errcode = 'P0001';
  end if;
  if char_length(v_rep.activities) < 50 then
    raise exception 'Activities must be at least 50 characters' using errcode = 'P0001';
  end if;
  if char_length(v_rep.learning_outcomes) < 30 then
    raise exception 'Learning outcomes must be at least 30 characters' using errcode = 'P0001';
  end if;
  if v_rep.hours_worked <= 0 then
    raise exception 'Hours worked must be greater than zero' using errcode = 'P0001';
  end if;
  if not exists (select 1 from public.placements where id = v_rep.placement_id and status = 'ACTIVE') then
    raise exception 'Placement is no longer active' using errcode = 'P0001';
  end if;

  update public.progress_reports
  set status = 'SUBMITTED', submitted_at = now(), version = version + 1
  where id = p_report_id
  returning * into v_rep;

  insert into public.report_revisions (report_id, version, snapshot)
  values (p_report_id, v_rep.version, jsonb_build_object(
    'period_start', v_rep.period_start, 'period_end', v_rep.period_end, 'hours_worked', v_rep.hours_worked,
    'activities', v_rep.activities, 'learning_outcomes', v_rep.learning_outcomes,
    'challenges', v_rep.challenges, 'next_steps', v_rep.next_steps));

  v_sup_user := private.current_supervisor_user(v_rep.placement_id);
  perform private.log_audit('REPORT_SUBMITTED', 'progress_reports', p_report_id::text, jsonb_build_object('version', v_rep.version));
  perform private.notify(v_sup_user, 'report', 'Progress report submitted',
    coalesce(private.student_name(v_student), 'A student') || ' submitted progress report #' || v_rep.report_number ||
    case when v_rep.version > 1 then ' (revision ' || v_rep.version || ')' else '' end || '.',
    '/app/supervisor/reports');
end;
$$;

create or replace function public.supervisor_start_report_review(p_report_id uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_rep public.progress_reports;
begin
  perform private.require_role('supervisor');
  select * into v_rep from public.progress_reports where id = p_report_id for update;
  if not found or not private.is_placement_supervisor(v_rep.placement_id) then
    raise exception 'Report not found' using errcode = 'P0002';
  end if;
  if v_rep.status <> 'SUBMITTED' then
    raise exception 'Invalid transition: % -> UNDER_REVIEW', v_rep.status using errcode = 'P0001';
  end if;
  update public.progress_reports set status = 'UNDER_REVIEW' where id = p_report_id;
  perform private.log_audit('REPORT_REVIEW_STARTED', 'progress_reports', p_report_id::text);
end;
$$;

create or replace function public.supervisor_review_report(
  p_report_id uuid,
  p_decision public.report_status,
  p_comments text
)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_rep public.progress_reports;
  v_comments text := nullif(trim(p_comments), '');
begin
  perform private.require_role('supervisor');
  if p_decision not in ('ACCEPTED', 'CORRECTION_REQUIRED') then
    raise exception 'Invalid decision %', p_decision using errcode = 'P0001';
  end if;
  if v_comments is null or char_length(v_comments) < 5 then
    raise exception 'Feedback comments (minimum 5 characters) are required' using errcode = 'P0001';
  end if;
  select * into v_rep from public.progress_reports where id = p_report_id for update;
  if not found or not private.is_placement_supervisor(v_rep.placement_id) then
    raise exception 'Report not found' using errcode = 'P0002';
  end if;
  if v_rep.status not in ('SUBMITTED', 'UNDER_REVIEW') then
    raise exception 'Invalid transition: % -> %', v_rep.status, p_decision using errcode = 'P0001';
  end if;

  update public.progress_reports set status = p_decision, reviewed_at = now() where id = p_report_id;
  insert into public.report_feedback (report_id, reviewer_id, decision, comments)
  values (p_report_id, auth.uid(), p_decision, v_comments);
  perform private.refresh_completion(v_rep.placement_id);

  perform private.log_audit('REPORT_' || p_decision::text, 'progress_reports', p_report_id::text,
                            jsonb_build_object('comments', v_comments));
  perform private.notify(private.student_user_id(v_rep.student_id), 'feedback',
    case when p_decision = 'ACCEPTED' then 'Progress report accepted' else 'Report corrections requested' end,
    'Report #' || v_rep.report_number || ': ' || v_comments, '/app/student/reports');
end;
$$;

-- ---------------------------------------------------------------------------
-- HOST: evaluation and concerns
-- ---------------------------------------------------------------------------
create or replace function public.host_submit_evaluation(
  p_placement_id uuid,
  p_punctuality smallint,
  p_professionalism smallint,
  p_technical_skills smallint,
  p_communication smallint,
  p_teamwork smallint,
  p_initiative smallint,
  p_strengths text,
  p_improvements text,
  p_recommend boolean
)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_pl public.placements;
  v_id uuid;
begin
  perform private.require_role('host');
  select * into v_pl from public.placements where id = p_placement_id for update;
  if not found or v_pl.organization_id is distinct from private.current_host_org_id() then
    raise exception 'Placement not found' using errcode = 'P0002';
  end if;
  if v_pl.status <> 'ACTIVE' then
    raise exception 'Evaluations can only be submitted for ACTIVE placements (current: %)', v_pl.status using errcode = 'P0001';
  end if;

  begin
    insert into public.host_evaluations (placement_id, submitted_by, punctuality, professionalism, technical_skills,
      communication, teamwork, initiative, strengths, improvements, recommend_for_employment)
    values (p_placement_id, auth.uid(), p_punctuality, p_professionalism, p_technical_skills,
      p_communication, p_teamwork, p_initiative, nullif(trim(p_strengths), ''), nullif(trim(p_improvements), ''),
      coalesce(p_recommend, false))
    returning id into v_id;
  exception
    when unique_violation then
      raise exception 'An evaluation has already been submitted for this placement' using errcode = 'P0001';
    when check_violation then
      raise exception 'All ratings must be between 1 and 5' using errcode = 'P0001';
    when not_null_violation then
      raise exception 'All six ratings are required' using errcode = 'P0001';
  end;

  perform private.refresh_completion(p_placement_id);
  perform private.log_audit('HOST_EVALUATION_SUBMITTED', 'host_evaluations', v_id::text,
                            jsonb_build_object('placement_id', p_placement_id));
  perform private.notify(private.current_supervisor_user(p_placement_id), 'evaluation', 'Host evaluation received',
    'The host organisation submitted an evaluation for ' || coalesce(private.student_name(v_pl.student_id), 'your student') || '.',
    '/app/supervisor/assessments');
  perform private.notify_role('coordinator', 'evaluation', 'Host evaluation received',
    'Evaluation received for ' || coalesce(private.student_name(v_pl.student_id), 'a student') || '.',
    '/app/coordinator/monitoring');
  return v_id;
end;
$$;

create or replace function public.host_report_concern(p_placement_id uuid, p_message text)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_pl public.placements;
  v_id uuid;
  v_msg text := nullif(trim(p_message), '');
begin
  perform private.require_role('host');
  select * into v_pl from public.placements where id = p_placement_id;
  if not found or v_pl.organization_id is distinct from private.current_host_org_id() then
    raise exception 'Placement not found' using errcode = 'P0002';
  end if;
  if v_pl.status not in ('AWAITING_CONFIRMATION', 'CONFIRMED', 'ACTIVE') then
    raise exception 'Concerns can only be raised for live placements' using errcode = 'P0001';
  end if;
  if v_msg is null or char_length(v_msg) < 10 then
    raise exception 'Please describe the concern (minimum 10 characters)' using errcode = 'P0001';
  end if;

  insert into public.placement_concerns (placement_id, raised_by, message)
  values (p_placement_id, auth.uid(), v_msg) returning id into v_id;

  perform private.log_audit('PLACEMENT_CONCERN_RAISED', 'placement_concerns', v_id::text);
  perform private.notify_role('coordinator', 'concern', 'Placement concern reported',
    'Host reported a concern about ' || coalesce(private.student_name(v_pl.student_id), 'a student') || '.',
    '/app/coordinator/monitoring');
  perform private.notify(private.current_supervisor_user(p_placement_id), 'concern', 'Placement concern reported',
    'Host reported a concern about ' || coalesce(private.student_name(v_pl.student_id), 'your student') || '.',
    '/app/supervisor/students');
  return v_id;
end;
$$;

create or replace function public.coordinator_resolve_concern(p_concern_id uuid, p_note text)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_c public.placement_concerns;
  v_note text := nullif(trim(p_note), '');
begin
  perform private.require_role('coordinator');
  if v_note is null or char_length(v_note) < 5 then
    raise exception 'A resolution note (minimum 5 characters) is required' using errcode = 'P0001';
  end if;
  select * into v_c from public.placement_concerns where id = p_concern_id for update;
  if not found then
    raise exception 'Concern not found' using errcode = 'P0002';
  end if;
  if v_c.status <> 'OPEN' then
    raise exception 'Concern is already resolved' using errcode = 'P0001';
  end if;
  update public.placement_concerns
  set status = 'RESOLVED', resolution_note = v_note, resolved_by = auth.uid(), resolved_at = now()
  where id = p_concern_id;
  perform private.log_audit('PLACEMENT_CONCERN_RESOLVED', 'placement_concerns', p_concern_id::text);
  perform private.notify(v_c.raised_by, 'concern', 'Concern resolved', 'The LEAP office resolved your concern: ' || v_note,
    '/app/host/interns');
end;
$$;

-- ---------------------------------------------------------------------------
-- ACADEMIC STAFF: assessment & completion
-- ---------------------------------------------------------------------------
create or replace function private.require_assessor(p_placement_id uuid)
returns void
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not (private.is_placement_supervisor(p_placement_id) or private.has_role('coordinator')) then
    raise exception 'Only the assigned academic supervisor or a LEAP coordinator may assess this placement'
      using errcode = '42501';
  end if;
end;
$$;

create or replace function private.compute_final_score(p_supervisor numeric, p_report numeric, p_host numeric)
returns numeric
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_w jsonb := coalesce(private.setting('assessment_weights'), '{"supervisor":40,"reports":30,"host":30}'::jsonb);
  v_ws numeric := coalesce((v_w ->> 'supervisor')::numeric, 0);
  v_wr numeric := coalesce((v_w ->> 'reports')::numeric, 0);
  v_wh numeric := coalesce((v_w ->> 'host')::numeric, 0);
begin
  if v_ws + v_wr + v_wh <= 0 then
    return null;
  end if;
  if p_host is null and v_wh > 0 then
    return null; -- cannot compute until the host evaluation exists
  end if;
  return round((p_supervisor * v_ws + p_report * v_wr + coalesce(p_host, 0) * v_wh) / (v_ws + v_wr + v_wh), 2);
end;
$$;

create or replace function public.get_completion_status(p_placement_id uuid)
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not (private.is_staff() or private.is_placement_supervisor(p_placement_id) or private.is_placement_student(p_placement_id)) then
    raise exception 'Permission denied' using errcode = '42501';
  end if;
  return private.completion_check(p_placement_id);
end;
$$;

create or replace function public.staff_record_assessment(
  p_placement_id uuid,
  p_supervisor_score numeric,
  p_report_score numeric,
  p_comments text
)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  v_pl public.placements;
  v_existing public.assessments;
  v_host numeric;
  v_final numeric;
  v_id uuid;
begin
  perform private.require_assessor(p_placement_id);
  if p_supervisor_score is null or p_supervisor_score < 0 or p_supervisor_score > 100
     or p_report_score is null or p_report_score < 0 or p_report_score > 100 then
    raise exception 'Scores must be between 0 and 100' using errcode = 'P0001';
  end if;
  select * into v_pl from public.placements where id = p_placement_id for update;
  if not found then
    raise exception 'Placement not found' using errcode = 'P0002';
  end if;
  if v_pl.status <> 'ACTIVE' then
    raise exception 'Assessments can only be recorded for ACTIVE placements (current: %)', v_pl.status using errcode = 'P0001';
  end if;
  select * into v_existing from public.assessments where placement_id = p_placement_id for update;
  if found and v_existing.status = 'FINALIZED' then
    raise exception 'This assessment has been finalized and is locked' using errcode = 'P0001';
  end if;

  select round(overall_rating / 5 * 100, 2) into v_host from public.host_evaluations where placement_id = p_placement_id;
  v_final := private.compute_final_score(p_supervisor_score, p_report_score, v_host);

  insert into public.assessments (placement_id, recorded_by, supervisor_score, report_score, host_score, final_score, comments)
  values (p_placement_id, auth.uid(), p_supervisor_score, p_report_score, v_host, v_final, nullif(trim(p_comments), ''))
  on conflict (placement_id) do update set
    recorded_by = excluded.recorded_by, supervisor_score = excluded.supervisor_score,
    report_score = excluded.report_score, host_score = excluded.host_score,
    final_score = excluded.final_score, comments = excluded.comments
  returning id into v_id;

  perform private.refresh_completion(p_placement_id);
  perform private.log_audit('ASSESSMENT_RECORDED', 'assessments', v_id::text,
    jsonb_build_object('supervisor_score', p_supervisor_score, 'report_score', p_report_score, 'host_score', v_host, 'final_score', v_final));
  return v_id;
end;
$$;

create or replace function public.staff_finalize_assessment(p_placement_id uuid)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_pl public.placements;
  v_a public.assessments;
  v_host numeric;
  v_final numeric;
  v_check jsonb;
  v_outcome public.completion_status;
  v_unmet text;
begin
  perform private.require_assessor(p_placement_id);
  select * into v_pl from public.placements where id = p_placement_id for update;
  if not found then
    raise exception 'Placement not found' using errcode = 'P0002';
  end if;
  if private.student_user_id(v_pl.student_id) = auth.uid() then
    raise exception 'You cannot finalize your own assessment' using errcode = '42501';
  end if;
  if v_pl.status <> 'ACTIVE' then
    raise exception 'Only ACTIVE placements can be finalized (current: %)', v_pl.status using errcode = 'P0001';
  end if;
  select * into v_a from public.assessments where placement_id = p_placement_id for update;
  if not found then
    raise exception 'Record an assessment before finalizing' using errcode = 'P0001';
  end if;
  if v_a.status = 'FINALIZED' then
    raise exception 'Assessment already finalized' using errcode = 'P0001';
  end if;

  -- Recalculate with the latest host evaluation.
  select round(overall_rating / 5 * 100, 2) into v_host from public.host_evaluations where placement_id = p_placement_id;
  v_final := private.compute_final_score(v_a.supervisor_score, v_a.report_score, v_host);
  update public.assessments set host_score = v_host, final_score = v_final where id = v_a.id;

  v_check := private.completion_check(p_placement_id);
  if not (v_check ->> 'requirements_met')::boolean then
    select string_agg(i ->> 'requirement' || ' (' || (i ->> 'actual') || '/' || (i ->> 'required') || ')', '; ')
    into v_unmet
    from jsonb_array_elements(v_check -> 'items') i
    where not (i ->> 'met')::boolean;
    raise exception 'Completion requirements not met: %', v_unmet using errcode = 'P0001';
  end if;
  if v_final is null then
    raise exception 'Final score cannot be computed (host evaluation missing)' using errcode = 'P0001';
  end if;

  v_outcome := case when v_final >= (v_check ->> 'pass_mark')::numeric
                    then 'COMPLETED'::public.completion_status
                    else 'NOT_COMPLETED'::public.completion_status end;

  update public.assessments set status = 'FINALIZED', finalized_by = auth.uid(), finalized_at = now() where id = v_a.id;
  update public.placements set status = 'COMPLETED' where id = p_placement_id;

  insert into public.completion_records (placement_id, student_id) values (p_placement_id, v_pl.student_id)
  on conflict (placement_id) do nothing;
  perform private.refresh_completion(p_placement_id);
  update public.completion_records set
    status = v_outcome, final_score = v_final, requirements_snapshot = v_check,
    decided_by = auth.uid(), decided_at = now()
  where placement_id = p_placement_id;

  perform private.log_audit('ASSESSMENT_FINALIZED', 'assessments', v_a.id::text,
    jsonb_build_object('final_score', v_final, 'outcome', v_outcome));
  perform private.log_audit('COMPLETION_' || v_outcome::text, 'completion_records', p_placement_id::text,
    jsonb_build_object('final_score', v_final));
  perform private.notify(private.student_user_id(v_pl.student_id), 'completion',
    case when v_outcome = 'COMPLETED' then 'Internship completed' else 'Internship not completed' end,
    'Your assessment was finalized with a final score of ' || v_final || '%. Status: ' || v_outcome || '.',
    '/app/student/completion');
  perform private.notify_role('coordinator', 'completion', 'Assessment finalized',
    coalesce(private.student_name(v_pl.student_id), 'A student') || ': ' || v_outcome || ' (' || v_final || '%).',
    '/app/coordinator/monitoring');

  return jsonb_build_object('outcome', v_outcome, 'final_score', v_final);
end;
$$;

-- ---------------------------------------------------------------------------
-- Notifications
-- ---------------------------------------------------------------------------
create or replace function public.mark_all_notifications_read()
returns void
language sql security definer set search_path = ''
as $$
  update public.notifications set is_read = true where user_id = auth.uid() and not is_read;
$$;

