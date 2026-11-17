import { describe, it, expect, beforeAll } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
// @ts-expect-error -- ESM seed helper
import { seedDatabase, DEMO_PASSWORD } from '../../scripts/seed-demo.mjs';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

/**
 * Creates a fresh, isolated Supabase client using ONLY the public anon key
 * (never the service_role key) so every query and RPC runs under real PostgreSQL RLS.
 */
let clientSeq = 0;

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

describe('Digital LEAP System — Real PostgreSQL RLS & 12-Step End-to-End Workflow', () => {
  let seedContext: Awaited<ReturnType<typeof seedDatabase>>;

  beforeAll(async () => {
    seedContext = await seedDatabase({ resetPrimaryStudent: true });
  }, 30000);

  it('rejects invalid credentials and prevents privilege self-escalation', async () => {
    const anon = createRoleClient();
    const { error: badLogin } = await anon.auth.signInWithPassword({
      email: 'student@limkokwing.edu.sl',
      password: 'WrongPassword123!',
    });
    expect(badLogin).toBeTruthy();

    const studentClient = await signInAs('student@limkokwing.edu.sl');

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
    // Supervisor 1 (Ing. Hassan Kamara) must NOT see Samuel Koroma (sp3), who is supervised by Supervisor 2 (Dr. Fatmata Bangura)
    const sup1Client = await signInAs('supervisor@limkokwing.edu.sl');
    const { data: sup1Placements } = await sup1Client.from('placements').select('*');
    const seesSamuel = (sup1Placements || []).some(
      (p) => p.student_id === seedContext.students.sp3.id
    );
    expect(seesSamuel).toBe(false);

    // Host 1 (SLCB) must NOT see placements at Africell or DSTI
    const host1Client = await signInAs('host@slcb.sl');
    const { data: host1Placements } = await host1Client.from('placements').select('*');
    const seesOtherOrg = (host1Placements || []).some(
      (p) => p.organization_id !== seedContext.orgs.slcb.id
    );
    expect(seesOtherOrg).toBe(false);

    // University Management cannot perform administrative changes or coordinator decisions
    const mgmtClient = await signInAs('management@limkokwing.edu.sl');
    const { error: mgmtAdminErr } = await mgmtClient.rpc('admin_set_user_active', {
      p_user_id: seedContext.users.studentUser.id,
      p_is_active: false,
    });
    expect(mgmtAdminErr).toBeTruthy();
  });

  it('executes the complete 12-step end-to-end demonstration workflow in PostgreSQL', async () => {
    const studentClient = await signInAs('student@limkokwing.edu.sl');
    const coordinatorClient = await signInAs('coordinator@limkokwing.edu.sl');
    const supervisorClient = await signInAs('supervisor@limkokwing.edu.sl');
    const hostClient = await signInAs('host@slcb.sl');
    const managementClient = await signInAs('management@limkokwing.edu.sl');
    const adminClient = await signInAs('admin@limkokwing.edu.sl');

    // Baseline Management stats before Madi A. Sesay completes the workflow
    const { data: statsBefore } = await managementClient.rpc('get_management_statistics');
    const completedBefore = (statsBefore as { completed_internships: number })
      .completed_internships;

    // -------------------------------------------------------------------------
    // STEP 1: Student logs in, saves draft, validates, and submits application
    // -------------------------------------------------------------------------
    const { data: appId, error: saveDraftErr } = await studentClient.rpc(
      'student_save_application',
      {
        p_application_id: null,
        p_academic_year: '2026/2027',
        p_preferred_industry: 'Banking & Financial Technology',
        p_preferred_organization_id: seedContext.orgs.slcb.id,
        p_motivation:
          'I am applying for the LEAP internship at Sierra Leone Commercial Bank to apply my software engineering and PostgreSQL database skills to enterprise digital banking systems in Freetown.',
        p_relevant_skills: 'React, TypeScript, PostgreSQL, REST APIs, Git',
        p_preferred_start_date: '2026-12-01',
        p_preferred_end_date: '2027-02-28',
      }
    );
    expect(saveDraftErr).toBeNull();
    expect(appId).toBeTruthy();

    // Student cannot approve their own application
    const { error: selfApproveErr } = await studentClient.rpc(
      'coordinator_decide_application',
      {
        p_application_id: appId,
        p_decision: 'APPROVED',
        p_comment: 'Self approval attempt',
      }
    );
    expect(selfApproveErr).toBeTruthy();

    const { error: submitAppErr } = await studentClient.rpc('student_submit_application', {
      p_application_id: appId,
    });
    expect(submitAppErr).toBeNull();

    // -------------------------------------------------------------------------
    // STEP 2: Coordinator reviews application, requests correction, then approves
    // -------------------------------------------------------------------------
    const { error: startRevErr } = await coordinatorClient.rpc('coordinator_start_review', {
      p_application_id: appId,
    });
    expect(startRevErr).toBeNull();

    const { error: reqCorrErr } = await coordinatorClient.rpc(
      'coordinator_decide_application',
      {
        p_application_id: appId,
        p_decision: 'CORRECTION_REQUIRED',
        p_comment: 'Please include your specific interest in SLCB digital channels.',
      }
    );
    expect(reqCorrErr).toBeNull();

    // Student updates and resubmits
    const { error: updateCorrErr } = await studentClient.rpc('student_save_application', {
      p_application_id: appId,
      p_academic_year: '2026/2027',
      p_preferred_industry: 'Banking & Financial Technology',
      p_preferred_organization_id: seedContext.orgs.slcb.id,
      p_motivation:
        'I am applying for the LEAP internship at Sierra Leone Commercial Bank (Digital Banking & Channels Division) to apply my software engineering and PostgreSQL database skills to enterprise banking systems.',
      p_relevant_skills: 'React, TypeScript, PostgreSQL, REST APIs, Git, Financial Systems',
      p_preferred_start_date: '2026-12-01',
      p_preferred_end_date: '2027-02-28',
    });
    expect(updateCorrErr).toBeNull();

    const { error: resubmitErr } = await studentClient.rpc('student_submit_application', {
      p_application_id: appId,
    });
    expect(resubmitErr).toBeNull();

    // Coordinator starts review and approves
    await coordinatorClient.rpc('coordinator_start_review', { p_application_id: appId });
    const { error: approveErr } = await coordinatorClient.rpc(
      'coordinator_decide_application',
      {
        p_application_id: appId,
        p_decision: 'APPROVED',
        p_comment: 'Academic eligibility verified (GPA 3.65, 78 credits). Approved.',
      }
    );
    expect(approveErr).toBeNull();

    // -------------------------------------------------------------------------
    // STEP 3: Coordinator assigns a placement at SLCB
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

    // Conflicting duplicate active placement for the same student is prevented
    const { error: conflictErr } = await coordinatorClient.rpc(
      'coordinator_create_placement',
      {
        p_application_id: appId,
        p_opportunity_id: seedContext.opportunities.oppSlcb.id,
        p_start_date: '2026-12-01',
        p_end_date: '2027-02-28',
      }
    );
    expect(conflictErr).toBeTruthy();

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
    const { data: studentPl } = await studentClient
      .from('placements')
      .select('*')
      .eq('id', placementId)
      .single();
    expect(studentPl?.status).toBe('ACTIVE');

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
    expect(reportId).toBeTruthy();

    const { error: subRepErr } = await studentClient.rpc('student_submit_report', {
      p_report_id: reportId,
    });
    expect(subRepErr).toBeNull();

    // -------------------------------------------------------------------------
    // STEP 6: Supervisor reviews the report and provides feedback
    // -------------------------------------------------------------------------
    const { error: startRepRevErr } = await supervisorClient.rpc(
      'supervisor_start_report_review',
      {
        p_report_id: reportId,
      }
    );
    expect(startRepRevErr).toBeNull();

    const { error: acceptRepErr } = await supervisorClient.rpc('supervisor_review_report', {
      p_report_id: reportId,
      p_decision: 'ACCEPTED',
      p_comments: 'Well-documented engineering activities and clear learning outcomes.',
    });
    expect(acceptRepErr).toBeNull();

    // Accepted report is locked and cannot be overwritten
    const { error: overwriteAcceptedErr } = await studentClient.rpc('student_save_report', {
      p_report_id: reportId,
      p_period_start: '2026-12-01',
      p_period_end: '2026-12-15',
      p_hours_worked: 80,
      p_activities: 'Attempted modification after acceptance must fail.',
      p_learning_outcomes: 'Attempted modification after acceptance must fail.',
      p_challenges: '',
      p_next_steps: '',
    });
    expect(overwriteAcceptedErr).toBeTruthy();

    // -------------------------------------------------------------------------
    // STEP 7: Host organization submits an evaluation
    // -------------------------------------------------------------------------
    const { data: evalId, error: evalErr } = await hostClient.rpc('host_submit_evaluation', {
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
    expect(evalId).toBeTruthy();

    // -------------------------------------------------------------------------
    // STEP 8: Authorized academic staff record the assessment
    // -------------------------------------------------------------------------
    const { data: assessmentId, error: recAssErr } = await supervisorClient.rpc(
      'staff_record_assessment',
      {
        p_placement_id: placementId,
        p_supervisor_score: 90,
        p_report_score: 92,
        p_comments: 'Excellent logbook documentation, workplace conduct, and technical delivery.',
      }
    );
    expect(recAssErr).toBeNull();
    expect(assessmentId).toBeTruthy();

    // -------------------------------------------------------------------------
    // STEP 9: System verifies completion requirements and finalizes assessment
    // -------------------------------------------------------------------------
    const { data: chkData, error: chkErr } = await supervisorClient.rpc(
      'get_completion_status',
      {
        p_placement_id: placementId,
      }
    );
    expect(chkErr).toBeNull();
    expect((chkData as { requirements_met: boolean }).requirements_met).toBe(true);

    const { data: finData, error: finErr } = await supervisorClient.rpc(
      'staff_finalize_assessment',
      {
        p_placement_id: placementId,
      }
    );
    expect(finErr).toBeNull();
    expect((finData as { outcome: string }).outcome).toBe('COMPLETED');
    expect((finData as { final_score: number }).final_score).toBeGreaterThanOrEqual(90);

    // -------------------------------------------------------------------------
    // STEP 10: Student views updated completion status & finalized assessment
    // -------------------------------------------------------------------------
    const { data: studentComp } = await studentClient
      .from('completion_records')
      .select('*')
      .eq('placement_id', placementId)
      .single();
    expect(studentComp?.status).toBe('COMPLETED');
    expect(studentComp?.accepted_reports).toBe(1);
    expect(studentComp?.total_hours).toBe(80);
    expect(studentComp?.host_evaluation_received).toBe(true);

    const { data: studentAss } = await studentClient
      .from('assessments')
      .select('*')
      .eq('placement_id', placementId)
      .single();
    expect(studentAss?.status).toBe('FINALIZED');

    // -------------------------------------------------------------------------
    // STEP 11: Management views updated statistics
    // -------------------------------------------------------------------------
    const { data: statsAfter, error: statsErr } = await managementClient.rpc(
      'get_management_statistics'
    );
    expect(statsErr).toBeNull();
    const completedAfter = (statsAfter as { completed_internships: number })
      .completed_internships;
    expect(completedAfter).toBe(completedBefore + 1);

    // -------------------------------------------------------------------------
    // STEP 12: Administrator manages accounts and reviews audit events
    // -------------------------------------------------------------------------
    // Deactivate peer student 2 temporarily and verify record_sign_in blocks them
    const { error: deactErr } = await adminClient.rpc('admin_set_user_active', {
      p_user_id: seedContext.users.student2User.id,
      p_is_active: false,
    });
    expect(deactErr).toBeNull();

    const disabledClient = await signInAs('kadiatu.bangura@student.limkokwing.edu.sl');
    const { data: activeFlag } = await disabledClient.rpc('record_sign_in');
    expect(activeFlag).toBe(false);

    // Reactivate peer student 2
    const { error: reactErr } = await adminClient.rpc('admin_set_user_active', {
      p_user_id: seedContext.users.student2User.id,
      p_is_active: true,
    });
    expect(reactErr).toBeNull();

    // Verify audit logs contain the workflow actions
    const { data: auditRows, error: auditErr } = await adminClient
      .from('audit_logs')
      .select('action')
      .order('created_at', { ascending: false })
      .limit(50);
    expect(auditErr).toBeNull();

    const actions = new Set((auditRows || []).map((r) => r.action));
    expect(actions.has('APPLICATION_SUBMITTED')).toBe(true);
    expect(actions.has('APPLICATION_APPROVED')).toBe(true);
    expect(actions.has('PLACEMENT_CREATED')).toBe(true);
    expect(actions.has('SUPERVISOR_ASSIGNED')).toBe(true);
    expect(actions.has('PLACEMENT_CONFIRMED_BY_HOST')).toBe(true);
    expect(actions.has('PLACEMENT_ACTIVATED')).toBe(true);
    expect(actions.has('REPORT_SUBMITTED')).toBe(true);
    expect(actions.has('REPORT_ACCEPTED')).toBe(true);
    expect(actions.has('HOST_EVALUATION_SUBMITTED')).toBe(true);
    expect(actions.has('ASSESSMENT_RECORDED')).toBe(true);
    expect(actions.has('ASSESSMENT_FINALIZED')).toBe(true);
    expect(actions.has('COMPLETION_COMPLETED')).toBe(true);
    expect(actions.has('USER_DEACTIVATED')).toBe(true);
    expect(actions.has('USER_ACTIVATED')).toBe(true);
  }, 30000);
});
