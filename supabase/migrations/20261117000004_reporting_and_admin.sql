-- =============================================================================
-- Migration 4: Institutional reporting, profile self-service & admin controls
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Student / user profile self-service update
-- ---------------------------------------------------------------------------
create or replace function public.update_my_profile(
  p_full_name text,
  p_phone text,
  p_skills text default null,
  p_emergency_contact text default null
)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if not private.is_active_user() then
    raise exception 'Permission denied' using errcode = '42501';
  end if;
  if p_full_name is null or char_length(trim(p_full_name)) < 2 then
    raise exception 'Full name must be at least 2 characters' using errcode = 'P0001';
  end if;

  update public.profiles
  set full_name = trim(p_full_name),
      phone = nullif(trim(p_phone), '')
  where id = v_uid;

  if private.has_role('student') then
    update public.student_profiles
    set skills = nullif(trim(p_skills), ''),
        emergency_contact = nullif(trim(p_emergency_contact), '')
    where user_id = v_uid;
  end if;

  perform private.log_audit('PROFILE_UPDATED', 'profiles', v_uid::text);
end;
$$;

-- ---------------------------------------------------------------------------
-- Coordinator operational summary (real PostgreSQL counts)
-- ---------------------------------------------------------------------------
create or replace function public.get_coordinator_summary()
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not (private.has_role('coordinator') or private.has_role('admin')) then
    raise exception 'Permission denied: coordinator or admin role required' using errcode = '42501';
  end if;

  return jsonb_build_object(
    'total_applications', (select count(*) from public.internship_applications),
    'pending_reviews', (select count(*) from public.internship_applications where status in ('SUBMITTED', 'UNDER_REVIEW')),
    'approved_applications', (select count(*) from public.internship_applications where status = 'APPROVED'),
    'rejected_applications', (select count(*) from public.internship_applications where status = 'REJECTED'),
    'correction_required', (select count(*) from public.internship_applications where status = 'CORRECTION_REQUIRED'),
    'awaiting_placement', (
      select count(*) from public.internship_applications a
      where a.status = 'APPROVED'
        and not exists (
          select 1 from public.placements p
          where p.application_id = a.id and p.status <> 'CANCELLED'
        )
    ),
    'active_placements', (select count(*) from public.placements where status = 'ACTIVE'),
    'awaiting_confirmation', (select count(*) from public.placements where status = 'AWAITING_CONFIRMATION'),
    'completed_placements', (select count(*) from public.placements where status = 'COMPLETED'),
    'unassigned_supervisors', (
      select count(*) from public.placements p
      where p.status in ('PENDING', 'AWAITING_CONFIRMATION', 'CONFIRMED', 'ACTIVE')
        and not exists (
          select 1 from public.supervisor_assignments sa
          where sa.placement_id = p.id and sa.is_current
        )
    ),
    'outstanding_reports', (select count(*) from public.progress_reports where status in ('SUBMITTED', 'UNDER_REVIEW')),
    'open_concerns', (select count(*) from public.placement_concerns where status = 'OPEN')
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- University Management aggregate statistics
-- Management receives institutional aggregates without unrestricted raw access
-- to confidential individual student records.
-- ---------------------------------------------------------------------------
create or replace function public.get_management_statistics()
returns jsonb
language plpgsql stable security definer set search_path = ''
as $$
declare
  v_total_placements integer;
  v_completed_placements integer;
begin
  if not (private.has_role('management') or private.has_role('coordinator') or private.has_role('admin')) then
    raise exception 'Permission denied: management, coordinator or admin role required' using errcode = '42501';
  end if;

  select count(*) filter (where status <> 'CANCELLED'),
         count(*) filter (where status = 'COMPLETED')
  into v_total_placements, v_completed_placements
  from public.placements;

  return jsonb_build_object(
    'total_participating_students', (select count(*) from public.student_profiles),
    'total_applications', (select count(*) from public.internship_applications where status <> 'DRAFT'),
    'approved_applications', (select count(*) from public.internship_applications where status = 'APPROVED'),
    'active_internships', (select count(*) from public.placements where status = 'ACTIVE'),
    'completed_internships', v_completed_placements,
    'total_placements', v_total_placements,
    'completion_rate', case when v_total_placements > 0
      then round((v_completed_placements::numeric / v_total_placements::numeric) * 100, 1)
      else 0 end,
    'average_final_score', (
      select round(avg(final_score), 1) from public.assessments where status = 'FINALIZED' and final_score is not null
    ),
    'average_host_rating', (
      select round(avg(overall_rating), 2) from public.host_evaluations
    ),
    'total_verified_hours', (
      select coalesce(sum(hours_worked), 0) from public.progress_reports where status = 'ACCEPTED'
    ),
    'partner_organizations', (
      select count(*) from public.host_organizations where is_active
    ),
    'by_faculty', coalesce((
      select jsonb_agg(row_to_json(f))
      from (
        select
          sp.faculty,
          count(distinct sp.id) as students,
          count(distinct a.id) filter (where a.status <> 'DRAFT') as applications,
          count(distinct p.id) filter (where p.status = 'ACTIVE') as active_placements,
          count(distinct p.id) filter (where p.status = 'COMPLETED') as completed_placements,
          round(avg(ass.final_score) filter (where ass.status = 'FINALIZED'), 1) as avg_score
        from public.student_profiles sp
        left join public.internship_applications a on a.student_id = sp.id
        left join public.placements p on p.student_id = sp.id and p.status <> 'CANCELLED'
        left join public.assessments ass on ass.placement_id = p.id
        group by sp.faculty
        order by students desc, sp.faculty
      ) f
    ), '[]'::jsonb),
    'by_industry', coalesce((
      select jsonb_agg(row_to_json(ind))
      from (
        select
          ho.industry,
          count(distinct ho.id) as organizations,
          count(distinct p.id) filter (where p.status <> 'CANCELLED') as placements,
          count(distinct p.id) filter (where p.status = 'ACTIVE') as active,
          count(distinct p.id) filter (where p.status = 'COMPLETED') as completed
        from public.host_organizations ho
        left join public.placements p on p.organization_id = ho.id
        where ho.is_active
        group by ho.industry
        order by placements desc, ho.industry
      ) ind
    ), '[]'::jsonb),
    'placement_status_breakdown', coalesce((
      select jsonb_agg(row_to_json(s))
      from (
        select status::text as status, count(*) as count
        from public.placements
        group by status
        order by status
      ) s
    ), '[]'::jsonb),
    'application_status_breakdown', coalesce((
      select jsonb_agg(row_to_json(s))
      from (
        select status::text as status, count(*) as count
        from public.internship_applications
        group by status
        order by status
      ) s
    ), '[]'::jsonb),
    'assessment_summaries', coalesce((
      select jsonb_agg(row_to_json(t))
      from (
        select
          sp.faculty,
          sp.programme,
          ho.name as organization_name,
          cr.status::text as completion_status,
          cr.accepted_reports,
          cr.total_hours,
          cr.host_evaluation_received,
          cr.final_score,
          cr.decided_at
        from public.completion_records cr
        join public.student_profiles sp on sp.id = cr.student_id
        join public.placements pl on pl.id = cr.placement_id
        join public.host_organizations ho on ho.id = pl.organization_id
        order by cr.updated_at desc
      ) t
    ), '[]'::jsonb)
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Administrator privileged operations
-- ---------------------------------------------------------------------------
create or replace function public.admin_set_user_active(
  p_user_id uuid,
  p_is_active boolean
)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  perform private.require_role('admin');
  if p_user_id = auth.uid() and not p_is_active then
    raise exception 'You cannot deactivate your own administrator account' using errcode = 'P0001';
  end if;

  update public.profiles set is_active = p_is_active where id = p_user_id;
  if not found then
    raise exception 'User profile not found' using errcode = 'P0002';
  end if;

  perform private.log_audit(
    case when p_is_active then 'USER_ACTIVATED' else 'USER_DEACTIVATED' end,
    'profiles',
    p_user_id::text,
    jsonb_build_object('is_active', p_is_active)
  );
end;
$$;

create or replace function public.admin_grant_role(
  p_user_id uuid,
  p_role public.app_role
)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  perform private.require_role('admin');
  if not exists (select 1 from public.profiles where id = p_user_id) then
    raise exception 'User profile not found' using errcode = 'P0002';
  end if;

  insert into public.user_roles (user_id, role, granted_by)
  values (p_user_id, p_role, auth.uid())
  on conflict (user_id, role) do nothing;

  perform private.log_audit('ROLE_GRANTED', 'user_roles', p_user_id::text,
    jsonb_build_object('role', p_role));
  perform private.notify(p_user_id, 'account', 'Role assigned',
    'An administrator granted you the "' || p_role || '" role.', '/app');
end;
$$;

create or replace function public.admin_revoke_role(
  p_user_id uuid,
  p_role public.app_role
)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_remaining integer;
begin
  perform private.require_role('admin');
  if p_user_id = auth.uid() and p_role = 'admin' then
    raise exception 'You cannot revoke your own admin role' using errcode = 'P0001';
  end if;

  select count(*) into v_remaining from public.user_roles where user_id = p_user_id and role <> p_role;
  if v_remaining = 0 then
    raise exception 'Every user must retain at least one role' using errcode = 'P0001';
  end if;

  delete from public.user_roles where user_id = p_user_id and role = p_role;
  perform private.log_audit('ROLE_REVOKED', 'user_roles', p_user_id::text,
    jsonb_build_object('role', p_role));
end;
$$;

create or replace function public.admin_update_setting(
  p_key text,
  p_value jsonb,
  p_policy_confirmed boolean default false
)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  perform private.require_role('admin');
  update public.system_settings
  set value = p_value,
      policy_confirmed = coalesce(p_policy_confirmed, policy_confirmed),
      updated_by = auth.uid(),
      updated_at = now()
  where key = p_key;
  if not found then
    raise exception 'Setting % not found', p_key using errcode = 'P0002';
  end if;

  perform private.log_audit('SETTING_UPDATED', 'system_settings', p_key,
    jsonb_build_object('value', p_value, 'policy_confirmed', p_policy_confirmed));
end;
$$;

-- ---------------------------------------------------------------------------
-- Grant execute on public RPC functions to authenticated users
-- ---------------------------------------------------------------------------
grant execute on function
  public.current_user_has_role(public.app_role),
  public.record_sign_in(),
  public.update_my_profile(text, text, text, text),
  public.student_save_application(uuid, text, text, uuid, text, text, date, date),
  public.student_submit_application(uuid),
  public.get_application_eligibility(uuid),
  public.coordinator_start_review(uuid),
  public.coordinator_decide_application(uuid, public.application_status, text),
  public.coordinator_create_placement(uuid, uuid, date, date),
  public.host_respond_placement(uuid, boolean, text),
  public.coordinator_assign_supervisor(uuid, uuid),
  public.coordinator_activate_placement(uuid),
  public.coordinator_cancel_placement(uuid, text),
  public.student_save_report(uuid, date, date, integer, text, text, text, text),
  public.student_submit_report(uuid),
  public.supervisor_start_report_review(uuid),
  public.supervisor_review_report(uuid, public.report_status, text),
  public.host_submit_evaluation(uuid, smallint, smallint, smallint, smallint, smallint, smallint, text, text, boolean),
  public.host_report_concern(uuid, text),
  public.coordinator_resolve_concern(uuid, text),
  public.get_completion_status(uuid),
  public.staff_record_assessment(uuid, numeric, numeric, text),
  public.staff_finalize_assessment(uuid),
  public.mark_all_notifications_read(),
  public.get_coordinator_summary(),
  public.get_management_statistics(),
  public.admin_set_user_active(uuid, boolean),
  public.admin_grant_role(uuid, public.app_role),
  public.admin_revoke_role(uuid, public.app_role),
  public.admin_update_setting(text, jsonb, boolean)
to authenticated, service_role;

