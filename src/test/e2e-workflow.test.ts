import { describe, it, expect, beforeAll } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
// @ts-expect-error -- ESM seed helper
import { seedDatabase, DEMO_PASSWORD } from '../../scripts/seed-demo.mjs';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

let clientSeq = 0;

/**
 * Creates a fresh, isolated Supabase client using ONLY the public anon key
 * (never the service_role key) so every query and RPC runs under real PostgreSQL RLS.
 */
function createRoleClient(): SupabaseClient {
  clientSeq += 1;
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storageKey: `sb-test-role-client-${clientSeq}`,
    },
  });
}

async function signInAs(email: string, password = DEMO_PASSWORD): Promise<SupabaseClient> {
  const client = createRoleClient();
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) {
    throw new Error(`Failed to sign in as ${email}: ${error.message}`);
  }
  return client;
}

describe('Digital LEAP System — Real PostgreSQL RLS, Registration, Staff Provisioning & 12-Step Workflow', () => {
  let seedContext: Awaited<ReturnType<typeof seedDatabase>>;

  beforeAll(async () => {
    seedContext = await seedDatabase({ resetPrimaryStudent: true });
  }, 30000);

  it('registers a new student via Supabase Auth, assigns ONLY the student role, blocks duplicate student IDs, and allows login', async () => {
    const anon = createRoleClient();
    const uniqueSuffix = Date.now();
    const newStudentEmail = `student.reg.${uniqueSuffix}@student.limkokwing.edu.sl`;
    const newStudentId = `LUCT-SL-REG-${uniqueSuffix}`;

    // 1. Pre-check student ID availability
    const { data: availableBefore } = await anon.rpc('check_student_id_available', {
      p_student_number: newStudentId,
    });
    expect(availableBefore).toBe(true);

    // 2. Self-register student (attempting to pass role: 'admin' in metadata must be ignored)
    const { data: signUpData, error: signUpErr } = await anon.auth.signUp({
      email: newStudentEmail,
      password: 'StudentSelfReg!2026',
      options: {
        data: {
          full_name: 'Fatu K. Turay',
          student_number: newStudentId,
          faculty: 'Faculty of Information & Communication Technology',
          programme: 'BSc (Hons) in Software Engineering with Multimedia',
          year_of_study: 4,
          semester: 8,
          role: 'admin', // Malicious metadata must be ignored by handle_new_auth_user
        },
      },
    });
    expect(signUpErr).toBeNull();
    expect(signUpData.user).toBeTruthy();

    // 3. Duplicate Student ID is rejected
    const { data: availableAfter } = await anon.rpc('check_student_id_available', {
      p_student_number: newStudentId,
    });
    expect(availableAfter).toBe(false);

    const { error: dupSignUpErr } = await anon.auth.signUp({
      email: `dup.${uniqueSuffix}@student.limkokwing.edu.sl`,
      password: 'StudentSelfReg!2026',
      options: {
        data: {
          full_name: 'Duplicate Student',
          student_number: newStudentId,
        },
      },
    });
    expect(dupSignUpErr).toBeTruthy();

    // 4. Student logs in and has ONLY the 'student' role
    const newStudentClient = await signInAs(newStudentEmail, 'StudentSelfReg!2026');
    const { data: roleRows } = await newStudentClient
      .from('user_roles')
      .select('role')
      .eq('user_id', signUpData.user!.id);
    expect(roleRows).toEqual([{ role: 'student' }]);

    const { data: spRow } = await newStudentClient
      .from('student_profiles')
      .select('*')
      .eq('user_id', signUpData.user!.id)
      .single();
    expect(spRow?.student_number).toBe(newStudentId);
    expect(spRow?.year_of_study).toBe(4);
    expect(spRow?.semester).toBe(8);
  });

  it('allows System Administrator to provision staff accounts with one-time password setup links and staff can log in', async () => {
    const adminClient = await signInAs('admin@limkokwing.edu.sl');
    const uniqueSuffix = Date.now();
    const staffEmail = `coord.prov.${uniqueSuffix}@limkokwing.edu.sl`;

    // 1. Provision new LEAP Coordinator account (no plaintext password passed)
    const { data: provData, error: provErr } = await adminClient.rpc(
      'admin_provision_staff_account',
      {
        p_email: staffEmail,
        p_full_name: 'Dr. Zainab Mansaray',
        p_role: 'coordinator',
        p_phone: '+232 76 800900',
      }
    );
    expect(provErr).toBeNull();
    const result = provData as {
      user_id: string;
      email: string;
      role: string;
      invitation_token: string;
      setup_path: string;
    };
    expect(result.email).toBe(staffEmail);
    expect(result.role).toBe('coordinator');
    expect(result.invitation_token).toBeTruthy();

    // 2. Staff completes password setup using one-time invitation token
    const anon = createRoleClient();
    const { error: setupErr } = await anon.rpc('complete_staff_password_setup', {
      p_token: result.invitation_token,
      p_password: 'ProvisionedStaff!2026',
    });
    expect(setupErr).toBeNull();

    // Reusing the one-time token must fail
    const { error: reuseErr } = await anon.rpc('complete_staff_password_setup', {
      p_token: result.invitation_token,
      p_password: 'AnotherPassword!2026',
    });
    expect(reuseErr).toBeTruthy();

    // 3. Provisioned staff logs in through the normal login process and has the coordinator role
    const staffClient = await signInAs(staffEmail, 'ProvisionedStaff!2026');
    const { data: hasCoord } = await staffClient.rpc('current_user_has_role', {
      p_role: 'coordinator',
    });
    expect(hasCoord).toBe(true);
  });

  it('rejects invalid credentials and prevents privilege self-escalation', async () => {
    const anon = createRoleClient();
    const { error: badLogin } = await anon.auth.signInWithPassword({
      email: 'student@limkokwing.edu.sl',
      password: 'WrongPassword123!',
    });
    expect(badLogin).toBeTruthy();

    const studentClient = await signInAs('student@limkokwing.edu.sl');

    // Verify demo student is Year 4, Semester 8
    const { data: demoSp } = await studentClient
      .from('student_profiles')
      .select('year_of_study, semester')
      .eq('id', seedContext.students.sp1.id)
      .single();
    expect(demoSp?.year_of_study).toBe(4);
    expect(demoSp?.semester).toBe(8);

    // Student cannot grant themselves admin role via table insert or admin RPC
    const { error: directRoleErr } = await studentClient.from('user_roles').insert({
      user_id: seedContext.users.studentUser.id,
      role: 'admin',
    });
    expect(directRoleErr).toBeTruthy();

    const { error: rpcRoleErr } = await studentClient.rpc('admin_grant_role', {
      p_user_id: seedContext.users.studentUser.id,
      p_role: 'admin',
    });
    expect(rpcRoleErr).toBeTruthy();

    // Student cannot read audit_logs (RLS returns empty set)
    const { data: studentAuditRows } = await studentClient.from('audit_logs').select('*');
    expect(studentAuditRows || []).toHaveLength(0);
  });

  it('enforces cross-role RLS isolation for Academic Supervisors, Host Organizations, and Management', async () => {
    const sup1Client = await signInAs('supervisor@limkokwing.edu.sl');
    const { data: sup1Placements } = await sup1Client.from('placements').select('*');
    const seesSamuel = (sup1Placements || []).some(
      (p) => p.student_id === seedContext.students.sp3.id
    );
    expect(seesSamuel).toBe(false);

    const host1Client = await signInAs('host@slcb.sl');
    const { data: host1Placements } = await host1Client.from('placements').select('*');
    const seesOtherOrg = (host1Placements || []).some(
      (p) => p.organization_id !== seedContext.orgs.slcb.id
    );
    expect(seesOtherOrg).toBe(false);

    const mgmtClient = await signInAs('management@limkokwing.edu.sl');
    const { error: mgmtAdminErr } = await mgmtClient.rpc('admin_set_user_active', {
      p_user_id: seedContext.users.studentUser.id,
      p_is_active: false,
    });
    expect(mgmtAdminErr).toBeTruthy();
  });

  it('executes the complete 12-step end-to-end demonstration workflow with free-text preferred host organization and independent placement assignment', async () => {
    const studentClient = await signInAs('student@limkokwing.edu.sl');
    const coordinatorClient = await signInAs('coordinator@limkokwing.edu.sl');
    const supervisorClient = await signInAs('supervisor@limkokwing.edu.sl');
    const hostClient = await signInAs('host@slcb.sl');
    const managementClient = await signInAs('management@limkokwing.edu.sl');
    const adminClient = await signInAs('admin@limkokwing.edu.sl');

    const { data: statsBefore } = await managementClient.rpc('get_management_statistics');
    const completedBefore = (statsBefore as { completed_internships: number })
      .completed_internships;

    // -------------------------------------------------------------------------
    // STEP 1: Student logs in, enters free-text preferred host organization + reason, and submits
    // -------------------------------------------------------------------------
    const { data: appId, error: saveDraftErr } = await studentClient.rpc(
      'student_save_application',
      {
        p_application_id: null,
        p_academic_year: '2026/2027',
        p_preferred_industry: 'Public Health Informatics & FinTech',
        p_preferred_organization_id: null,
        p_motivation:
          'I am applying for the LEAP internship to apply my software engineering and PostgreSQL database skills to enterprise digital systems in Freetown.',
        p_relevant_skills: 'React, TypeScript, PostgreSQL, REST APIs, Git',
        p_preferred_start_date: '2026-12-01',
        p_preferred_end_date: '2027-02-28',
        p_preferred_host_organization: 'Ministry of Health & Sanitation, Sierra Leone',
        p_preference_reason:
          'I want to gain experience building national health information portals and digital payment integrations.',
      }
    );
    expect(saveDraftErr).toBeNull();
    expect(appId).toBeTruthy();

    // Verify preferred_host_organization and preference_reason are stored in applications view
    const { data: savedAppRow } = await studentClient
      .from('applications')
      .select('preferred_host_organization, preference_reason')
      .eq('id', appId)
      .single();
    expect(savedAppRow?.preferred_host_organization).toBe(
      'Ministry of Health & Sanitation, Sierra Leone'
    );
    expect(savedAppRow?.preference_reason).toContain('national health information portals');

    const { error: submitAppErr } = await studentClient.rpc('student_submit_application', {
      p_application_id: appId,
    });
    expect(submitAppErr).toBeNull();

    // -------------------------------------------------------------------------
    // STEP 2: Coordinator reviews student's preference and approves application
    // -------------------------------------------------------------------------
    const { data: coordViewApp } = await coordinatorClient
      .from('internship_applications')
      .select('preferred_host_organization, preference_reason')
      .eq('id', appId)
      .single();
    expect(coordViewApp?.preferred_host_organization).toBe(
      'Ministry of Health & Sanitation, Sierra Leone'
    );

    await coordinatorClient.rpc('coordinator_start_review', { p_application_id: appId });
    const { error: approveErr } = await coordinatorClient.rpc(
      'coordinator_decide_application',
      {
        p_application_id: appId,
        p_decision: 'APPROVED',
        p_comment: 'Academic eligibility verified (Year 4 Sem 8, GPA 3.65). Approved.',
      }
    );
    expect(approveErr).toBeNull();

    // -------------------------------------------------------------------------
    // STEP 3: Coordinator assigns actual placement independently (SLCB)
    // -------------------------------------------------------------------------
    const { data: placementId, error: createPlErr } = await coordinatorClient.rpc(
      'coordinator_create_placement',
      {
        p_application_id: appId,
        p_opportunity_id: seedContext.opportunities.oppSlcb.id,
        p_start_date: '2026-12-01',
        p_end_date: '2027-02-28',
      }
    );
    expect(createPlErr).toBeNull();
    expect(placementId).toBeTruthy();

    // -------------------------------------------------------------------------
    // STEP 4: Coordinator assigns Academic Supervisor; Host confirms; Coordinator activates
    // -------------------------------------------------------------------------
    const { error: assignSupErr } = await coordinatorClient.rpc(
      'coordinator_assign_supervisor',
      {
        p_placement_id: placementId,
        p_supervisor_id: seedContext.supervisors.sup1.id,
      }
    );
    expect(assignSupErr).toBeNull();

    const { error: hostConfirmErr } = await hostClient.rpc('host_respond_placement', {
      p_placement_id: placementId,
      p_accept: true,
      p_note: 'Confirmed by SLCB Digital Banking team under Amadu Mansaray.',
    });
    expect(hostConfirmErr).toBeNull();

    const { error: activateErr } = await coordinatorClient.rpc(
      'coordinator_activate_placement',
      {
        p_placement_id: placementId,
      }
    );
    expect(activateErr).toBeNull();

    // -------------------------------------------------------------------------
    // STEP 5: Student views active placement and submits a progress report
    // -------------------------------------------------------------------------
    const { data: reportId, error: saveRepErr } = await studentClient.rpc(
      'student_save_report',
      {
        p_report_id: null,
        p_period_start: '2026-12-01',
        p_period_end: '2026-12-15',
        p_hours_worked: 80,
        p_activities:
          'Completed SLCB engineering onboarding, configured local PostgreSQL test schemas, and built customer self-service transaction filter components.',
        p_learning_outcomes:
          'Learned banking security compliance, PostgreSQL indexing, and React Hook Form validation.',
        p_challenges: 'Aligning test dataset timestamps with local Leone currency formatting.',
        p_next_steps: 'Implement automated integration tests for the self-service portal.',
      }
    );
    expect(saveRepErr).toBeNull();

    const { error: subRepErr } = await studentClient.rpc('student_submit_report', {
      p_report_id: reportId,
    });
    expect(subRepErr).toBeNull();

    // -------------------------------------------------------------------------
    // STEP 6: Supervisor reviews the report and provides feedback
    // -------------------------------------------------------------------------
    await supervisorClient.rpc('supervisor_start_report_review', { p_report_id: reportId });
    const { error: acceptRepErr } = await supervisorClient.rpc('supervisor_review_report', {
      p_report_id: reportId,
      p_decision: 'ACCEPTED',
      p_comments: 'Well-documented engineering activities and clear learning outcomes.',
    });
    expect(acceptRepErr).toBeNull();

    // -------------------------------------------------------------------------
    // STEP 7: Host organization submits an evaluation
    // -------------------------------------------------------------------------
    const { error: evalErr } = await hostClient.rpc('host_submit_evaluation', {
      p_placement_id: placementId,
      p_punctuality: 5,
      p_professionalism: 5,
      p_technical_skills: 5,
      p_communication: 4,
      p_teamwork: 5,
      p_initiative: 5,
      p_strengths: 'Strong software engineering discipline and proactive problem-solving.',
      p_improvements: 'Continue expanding domain knowledge in core banking settlements.',
      p_recommend: true,
    });
    expect(evalErr).toBeNull();

    // -------------------------------------------------------------------------
    // STEP 8 & 9: Academic staff record and finalize assessment
    // -------------------------------------------------------------------------
    const { error: recAssErr } = await supervisorClient.rpc('staff_record_assessment', {
      p_placement_id: placementId,
      p_supervisor_score: 90,
      p_report_score: 92,
      p_comments: 'Excellent logbook documentation, workplace conduct, and technical delivery.',
    });
    expect(recAssErr).toBeNull();

    const { data: finData, error: finErr } = await supervisorClient.rpc(
      'staff_finalize_assessment',
      {
        p_placement_id: placementId,
      }
    );
    expect(finErr).toBeNull();
    expect((finData as { outcome: string }).outcome).toBe('COMPLETED');

    // -------------------------------------------------------------------------
    // STEP 10, 11 & 12: Student completion, Management stats, Admin audit logs
    // -------------------------------------------------------------------------
    const { data: studentComp } = await studentClient
      .from('completion_records')
      .select('*')
      .eq('placement_id', placementId)
      .single();
    expect(studentComp?.status).toBe('COMPLETED');

    const { data: statsAfter } = await managementClient.rpc('get_management_statistics');
    const completedAfter = (statsAfter as { completed_internships: number })
      .completed_internships;
    expect(completedAfter).toBe(completedBefore + 1);

    const { data: auditRows } = await adminClient
      .from('audit_logs')
      .select('action')
      .order('created_at', { ascending: false })
      .limit(60);
    const actions = new Set((auditRows || []).map((r) => r.action));
    expect(actions.has('STUDENT_SELF_REGISTERED')).toBe(true);
    expect(actions.has('STAFF_ACCOUNT_PROVISIONED')).toBe(true);
    expect(actions.has('STAFF_PASSWORD_SETUP_COMPLETED')).toBe(true);
    expect(actions.has('COMPLETION_COMPLETED')).toBe(true);
  }, 30000);
});
