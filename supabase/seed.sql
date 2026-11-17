-- =============================================================================
-- Digital LEAP Internship Management System
-- Reference seed data (roles, permissions, configurable university policies,
-- and partner host organizations in Sierra Leone)
-- =============================================================================

insert into public.roles (code, name, description) values
  ('student',     'Student',                        'Undergraduate student enrolled in the LEAP experiential learning programme'),
  ('coordinator', 'LEAP Coordinator',               'Faculty internship coordinator managing eligibility, placements and supervision'),
  ('supervisor',  'Academic Supervisor',            'University academic staff supervising and assessing assigned students'),
  ('host',        'Host Organization',              'Workplace representative confirming placements and evaluating interns'),
  ('management',  'University Management',          'Institutional leadership reviewing aggregate participation and completion metrics'),
  ('admin',       'System Administrator',           'ICT administrator managing user accounts, roles, settings and security audit logs')
on conflict (code) do update
  set name = excluded.name,
      description = excluded.description;

insert into public.permissions (code, module, description) values
  ('profile.self.manage',          'profiles',      'View and update own profile details'),
  ('application.self.manage',      'applications',  'Create, save draft, edit and submit own internship application'),
  ('application.review',           'applications',  'Review applications, verify eligibility and record approval/rejection/correction decisions'),
  ('opportunity.manage',           'placements',    'Create and update host organizations and placement opportunities'),
  ('placement.assign',             'placements',    'Assign approved students to placement opportunities and academic supervisors'),
  ('placement.confirm.host',       'placements',    'Confirm or decline nominated placements for own host organization'),
  ('report.self.submit',           'reports',       'Create, save draft and submit progress reports for own active placement'),
  ('report.review.assigned',       'reports',       'Review and provide feedback on progress reports for assigned students'),
  ('evaluation.submit.host',       'evaluations',   'Submit workplace evaluations and report concerns for own organization interns'),
  ('assessment.record',            'assessments',   'Record and finalize academic assessments for supervised placements'),
  ('analytics.institutional.view', 'reporting',     'View aggregate university participation, placement and completion statistics'),
  ('admin.users.manage',           'administration','Activate/deactivate accounts and grant or revoke user roles'),
  ('admin.settings.manage',        'administration','Configure university eligibility and completion policy parameters'),
  ('admin.audit.view',             'administration','Inspect immutable system security audit logs')
on conflict (code) do nothing;

insert into public.role_permissions (role, permission) values
  ('student',     'profile.self.manage'),
  ('student',     'application.self.manage'),
  ('student',     'report.self.submit'),
  ('coordinator', 'profile.self.manage'),
  ('coordinator', 'application.review'),
  ('coordinator', 'opportunity.manage'),
  ('coordinator', 'placement.assign'),
  ('coordinator', 'assessment.record'),
  ('coordinator', 'analytics.institutional.view'),
  ('supervisor',  'profile.self.manage'),
  ('supervisor',  'report.review.assigned'),
  ('supervisor',  'assessment.record'),
  ('host',        'profile.self.manage'),
  ('host',        'placement.confirm.host'),
  ('host',        'evaluation.submit.host'),
  ('management',  'profile.self.manage'),
  ('management',  'analytics.institutional.view'),
  ('admin',       'profile.self.manage'),
  ('admin',       'admin.users.manage'),
  ('admin',       'admin.settings.manage'),
  ('admin',       'admin.audit.view')
on conflict (role, permission) do nothing;

-- Configurable business rules (marked policy_confirmed = false until confirmed by University Senate)
insert into public.system_settings (key, value, description, policy_confirmed) values
  ('eligibility_min_gpa',                 '2.00'::jsonb, 'Minimum cumulative GPA required for LEAP internship eligibility', false),
  ('eligibility_min_credits',             '60'::jsonb,   'Minimum completed credit hours required prior to internship placement', false),
  ('eligibility_min_year',                '3'::jsonb,    'Minimum undergraduate year of study required for LEAP placement', false),
  ('placement_requires_host_confirmation','true'::jsonb, 'Whether host organization confirmation is required before activating a placement', false),
  ('completion_min_accepted_reports',     '1'::jsonb,    'Minimum number of accepted progress reports required for completion sign-off', false),
  ('completion_min_hours',                '40'::jsonb,   'Minimum verified workplace hours across accepted progress reports', false),
  ('completion_requires_host_evaluation', 'true'::jsonb, 'Whether a submitted host organization evaluation is required before finalization', false),
  ('completion_pass_mark',                '50'::jsonb,   'Minimum composite final score (%) required to achieve COMPLETED status', false),
  ('assessment_weights',                  '{"supervisor":40,"reports":30,"host":30}'::jsonb, 'Percentage weighting for Academic Supervisor, Progress Reports, and Host Evaluation', false)
on conflict (key) do update
  set value = excluded.value,
      description = excluded.description;

