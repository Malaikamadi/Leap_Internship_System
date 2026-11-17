import { describe, it, expect, beforeAll } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
// @ts-expect-error -- ESM seed helper
import { seedDatabase, DEMO_PASSWORD } from '../../scripts/seed-demo.mjs';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

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

const serviceAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function signInAs(email: string, password = DEMO_PASSWORD): Promise<SupabaseClient> {
  const client = createRoleClient();
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) {
    throw new Error(`Failed to sign in as ${email}: ${error.message}`);
  }
  return client;
}

describe('Digital LEAP System — Protected University Student Registry, RLS & 12-Step Workflow', () => {
  let seedContext: Awaited<ReturnType<typeof seedDatabase>>;

  beforeAll(async () => {
    seedContext = await seedDatabase({ resetPrimaryStudent: true });
  }, 30000);

  it('verifies all 11 University Student Registry security & workflow scenarios (Scenarios 1–11)', async () => {
    const anon = createRoleClient();
    const adminClient = await signInAs('admin@limkokwing.edu.sl');
    const coordinatorClient = await signInAs('coordinator@limkokwing.edu.sl');
    const uniqueSuffix = Date.now().toString().slice(-4);

    // Seed official Registrar records via the protected Admin RPC (admin_upsert_student_registry_batch)
    const validStudentId = `LUCT-SL-2026-${uniqueSuffix}`;
    const validStudentEmail = `mariama.conteh.${uniqueSuffix}@student.limkokwing.edu.sl`;

    const stage1StudentId = `LUCT-SL-2025-${uniqueSuffix}`;
    const stage1MistypedEmail = `typo.kamara.${uniqueSuffix}@student.limkokwing.edu.sl`;
    const stage1CorrectedEmail = `ibr.kamara.${uniqueSuffix}@student.limkokwing.edu.sl`;

    const concurrentStudentId = `LUCT-SL-2027-${uniqueSuffix}`;
    const concurrentEmail = `conc.sesay.${uniqueSuffix}@student.limkokwing.edu.sl`;

    const suspendedStudentId = `LUCT-SL-2028-${uniqueSuffix}`;
    const suspendedEmail = `suspended.${uniqueSuffix}@student.limkokwing.edu.sl`;

    const { data: batchData, error: batchErr } = await adminClient.rpc(
      'admin_upsert_student_registry_batch',
      {
        p_records: [
          {
            student_number: validStudentId,
            institutional_email: validStudentEmail,
            full_name: 'Mariama K. Conteh',
            faculty: 'Faculty of Business & Globalization',
            programme: 'BSc (Hons) in Business Information Systems',
            year_of_study: 4,
            semester: 8,
            gpa: 3.15,
            credits_completed: 88,
            enrollment_status: 'ENROLLED',
            academic_year: '2025/2026',
          },
          {
            student_number: stage1StudentId,
            institutional_email: stage1MistypedEmail,
            full_name: 'Ibrahim S. Kamara',
            faculty: 'Faculty of Information & Communication Technology',
            programme: 'BSc (Hons) in Software Engineering with Multimedia',
            year_of_study: 4,
            semester: 8,
            gpa: 3.45,
            credits_completed: 92,
            enrollment_status: 'ENROLLED',
            academic_year: '2025/2026',
          },
          {
            student_number: concurrentStudentId,
            institutional_email: concurrentEmail,
            full_name: 'fatmata J. Sesay',
            faculty: 'Faculty of Information & Communication Technology',
            programme: 'BSc (Hons) in Information Technology',
            year_of_study: 4,
            semester: 8,
            gpa: 3.6,
            credits_completed: 94,
            enrollment_status: 'ENROLLED',
            academic_year: '2025/2026',
          },
          {
            student_number: suspendedStudentId,
            institutional_email: suspendedEmail,
            full_name: 'Suspended Student Record',
            faculty: 'Faculty of ICT',
            programme: 'BSc IT',
            year_of_study: 3,
            semester: 6,
            gpa: 2.1,
            credits_completed: 60,
            enrollment_status: 'SUSPENDED',
            academic_year: '2025/2026',
          },
        ],
      }
    );
    expect(batchErr).toBeNull();
    expect((batchData as { upserted_count: number }).upserted_count).toBe(4);

    // -------------------------------------------------------------------------
    // SCENARIO 2 & 3: Invalid Student ID and Wrong Email for a Valid Student ID
    // Must both fail with the exact same generic error message (zero enumeration)
    // -------------------------------------------------------------------------
    const { data: invalidIdCheck } = await anon.rpc('verify_student_registration_candidate', {
      p_student_number: 'LUCT-SL-9999-9999',
      p_email: 'nobody@student.limkokwing.edu.sl',
    });
    const { data: wrongEmailCheck } = await anon.rpc('verify_student_registration_candidate', {
      p_student_number: validStudentId,
      p_email: 'wrong.person@student.limkokwing.edu.sl',
    });
    const { data: suspendedCheck } = await anon.rpc('verify_student_registration_candidate', {
      p_student_number: suspendedStudentId,
      p_email: suspendedEmail,
    });

    expect((invalidIdCheck as { ok: boolean }).ok).toBe(false);
    expect((wrongEmailCheck as { ok: boolean }).ok).toBe(false);
    expect((suspendedCheck as { ok: boolean }).ok).toBe(false);
    expect((invalidIdCheck as { error: string }).error).toBe(
      (wrongEmailCheck as { error: string }).error
    );
    expect((wrongEmailCheck as { error: string }).error).toBe(
      (suspendedCheck as { error: string }).error
    );

    // Direct signUp bypassing pre-check with wrong email or invalid ID must also be blocked by trigger
    const { error: directBadSignUpErr } = await anon.auth.signUp({
      email: 'wrong.person@student.limkokwing.edu.sl',
      password: 'StudentSelfReg!2026',
      options: { data: { full_name: 'Spoof User', student_number: validStudentId } },
    });
    expect(directBadSignUpErr).toBeTruthy();

    // -------------------------------------------------------------------------
    // SCENARIO 1 & 7: Valid Student ID + matching university email + Role/GPA spoofing defense
    // -------------------------------------------------------------------------
    const { data: validCand } = await anon.rpc('verify_student_registration_candidate', {
      p_student_number: validStudentId,
      p_email: validStudentEmail,
    });
    expect((validCand as { ok: boolean; verified_candidate: boolean }).ok).toBe(true);
    expect((validCand as { ok: boolean; verified_candidate: boolean }).verified_candidate).toBe(
      true
    );

    // Attempt to spoof role: 'admin', gpa: 4.00, credits_completed: 120, and fake faculty in signUp metadata
    const { data: signUpData, error: signUpErr } = await anon.auth.signUp({
      email: validStudentEmail,
      password: 'StudentSelfReg!2026',
      options: {
        data: {
          full_name: 'Client Spoofed Name',
          student_number: validStudentId,
          role: 'admin',
          faculty: 'Spoofed Faculty',
          programme: 'Spoofed Programme',
          gpa: 4.0,
          credits_completed: 120,
        },
      },
    });
    expect(signUpErr).toBeNull();
    expect(signUpData.user).toBeTruthy();

    // Sign in as the newly registered student and verify authoritative Registry data won over spoofed metadata
    const newStudentClient = await signInAs(validStudentEmail, 'StudentSelfReg!2026');
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
    expect(spRow?.student_number).toBe(validStudentId);
    expect(spRow?.faculty).toBe('Faculty of Business & Globalization');
    expect(spRow?.programme).toBe('BSc (Hons) in Business Information Systems');
    expect(Number(spRow?.gpa)).toBeCloseTo(3.15, 2);
    expect(spRow?.credits_completed).toBe(88);
    expect(spRow?.registry_id).toBeTruthy();
    expect(spRow?.registry_verified_at).toBeTruthy();

    // Verify student cannot tamper with GPA or student_number via direct UPDATE
    const { error: tamperErr } = await newStudentClient
      .from('student_profiles')
      .update({ gpa: 4.0 })
      .eq('id', spRow!.id);
    expect(tamperErr).toBeTruthy();

    // -------------------------------------------------------------------------
    // SCENARIO 4: Duplicate Registration Prevention
    // -------------------------------------------------------------------------
    const { data: dupCheckAfter } = await anon.rpc('verify_student_registration_candidate', {
      p_student_number: validStudentId,
      p_email: validStudentEmail,
    });
    expect((dupCheckAfter as { ok: boolean }).ok).toBe(false);

    const { error: dupSignUpErr } = await anon.auth.signUp({
      email: `another.${uniqueSuffix}@student.limkokwing.edu.sl`,
      password: 'StudentSelfReg!2026',
      options: { data: { full_name: 'Duplicate Claimer', student_number: validStudentId } },
    });
    expect(dupSignUpErr).toBeTruthy();

    // -------------------------------------------------------------------------
    // SCENARIO 5 & 6: Unverified Account Access, Email Correction Recovery & Expired Confirmation
    // -------------------------------------------------------------------------
    // Admin corrects the mistyped registry email for stage1StudentId before the student registers
    const { data: corrData, error: corrErr } = await adminClient.rpc(
      'admin_correct_registry_student_email',
      {
        p_student_number: stage1StudentId,
        p_new_email: stage1CorrectedEmail,
        p_reason: 'Verified Student ID card in person; corrected Registrar email typo.',
      }
    );
    expect(corrErr).toBeNull();
    expect((corrData as { institutional_email: string }).institutional_email).toBe(
      stage1CorrectedEmail
    );

    // Create a Stage 1 pending user (email_confirm: false => email_confirmed_at IS NULL)
    const { data: pendingAuthData, error: pendingAuthErr } =
      await serviceAdmin.auth.admin.createUser({
        email: stage1CorrectedEmail,
        password: 'PendingStudent!2026',
        email_confirm: false,
        user_metadata: {
          full_name: 'Ibrahim S. Kamara',
          student_number: stage1StudentId,
        },
      });
    expect(pendingAuthErr).toBeNull();
    const pendingUserId = pendingAuthData.user!.id;

    // Verify Stage 1 pending account has is_active = false, ZERO roles, and ZERO student_profiles rows
    const { data: pendingProf } = await serviceAdmin
      .from('profiles')
      .select('is_active')
      .eq('id', pendingUserId)
      .single();
    expect(pendingProf?.is_active).toBe(false);

    const { data: pendingRoles } = await serviceAdmin
      .from('user_roles')
      .select('*')
      .eq('user_id', pendingUserId);
    expect(pendingRoles || []).toHaveLength(0);

    const { data: pendingSp } = await serviceAdmin
      .from('student_profiles')
      .select('*')
      .eq('user_id', pendingUserId);
    expect(pendingSp || []).toHaveLength(0);

    // Refresh verification expiry window and then confirm email (Stage 2 activation)
    const { data: refreshRes, error: refreshErr } = await anon.rpc(
      'refresh_student_verification_expiry',
      { p_email: stage1CorrectedEmail }
    );
    expect(refreshErr).toBeNull();
    expect((refreshRes as { refreshed: boolean }).refreshed).toBe(true);

    // Confirm email -> fires on_auth_user_email_confirmed trigger -> activates student account!
    const { error: confirmErr } = await serviceAdmin.auth.admin.updateUserById(pendingUserId, {
      email_confirm: true,
    });
    expect(confirmErr).toBeNull();

    // Now the confirmed student can sign in and has an active student profile & role
    const confirmedStudentClient = await signInAs(stage1CorrectedEmail, 'PendingStudent!2026');
    const { data: confirmedSp } = await confirmedStudentClient
      .from('student_profiles')
      .select('student_number, registry_verified_at')
      .eq('user_id', pendingUserId)
      .single();
    expect(confirmedSp?.student_number).toBe(stage1StudentId);
    expect(confirmedSp?.registry_verified_at).toBeTruthy();

    // -------------------------------------------------------------------------
    // SCENARIO 8: Concurrent Registration Protection
    // -------------------------------------------------------------------------
    const [conc1, conc2] = await Promise.all([
      anon.auth.signUp({
        email: concurrentEmail,
        password: 'Concurrent!2026',
        options: { data: { full_name: 'Fatmata J. Sesay', student_number: concurrentStudentId } },
      }),
      anon.auth.signUp({
        email: concurrentEmail,
        password: 'Concurrent!2026',
        options: { data: { full_name: 'Fatmata J. Sesay', student_number: concurrentStudentId } },
      }),
    ]);
    const concSuccessCount = [conc1, conc2].filter((r) => !r.error && r.data?.user).length;
    expect(concSuccessCount).toBeGreaterThanOrEqual(1);
    const { data: concProfiles } = await serviceAdmin
      .from('student_profiles')
      .select('*')
      .eq('student_number', concurrentStudentId);
    expect(concProfiles).toHaveLength(1);

    // -------------------------------------------------------------------------
    // SCENARIO 10 & 11: Newly Registered Student Submits Application (DRAFT -> SUBMITTED)
    // and ONLY Coordinator Can Review and Approve (UNDER_REVIEW -> APPROVED)
    // -------------------------------------------------------------------------
    // Verify newly registered student does NOT automatically have an approved application
    const { data: initialApps } = await newStudentClient
      .from('internship_applications')
      .select('*');
    expect(initialApps || []).toHaveLength(0);

    // Student creates DRAFT application and submits it (SUBMITTED)
    const { data: newAppId, error: newAppDraftErr } = await newStudentClient.rpc(
      'student_save_application',
      {
        p_application_id: null,
        p_academic_year: '2025/2026',
        p_preferred_industry: 'Financial Information Systems',
        p_preferred_organization_id: null,
        p_motivation:
          'Applying my Business Information Systems coursework to digital banking operations.',
        p_relevant_skills: 'SQL, Business Process Modelling, ERP Systems',
        p_preferred_start_date: '2026-12-01',
        p_preferred_end_date: '2027-02-28',
        p_preferred_host_organization: 'Sierra Leone Commercial Bank (SLCB)',
        p_preference_reason: 'Interest in enterprise banking systems.',
      }
    );
    expect(newAppDraftErr).toBeNull();
    expect(newAppId).toBeTruthy();

    const { error: newAppSubmitErr } = await newStudentClient.rpc('student_submit_application', {
      p_application_id: newAppId,
    });
    expect(newAppSubmitErr).toBeNull();

    const { data: submittedApp } = await newStudentClient
      .from('internship_applications')
      .select('status')
      .eq('id', newAppId)
      .single();
    expect(submittedApp?.status).toBe('SUBMITTED');

    // Student cannot approve their own application
    const { error: studentApproveAttempt } = await newStudentClient.rpc(
      'coordinator_decide_application',
      {
        p_application_id: newAppId,
        p_decision: 'APPROVED',
        p_comment: 'Trying to self-approve',
      }
    );
    expect(studentApproveAttempt).toBeTruthy();

    // Only Coordinator can transition SUBMITTED -> UNDER_REVIEW -> APPROVED
    const { error: coordStartErr } = await coordinatorClient.rpc('coordinator_start_review', {
      p_application_id: newAppId,
    });
    expect(coordStartErr).toBeNull();

    const { error: coordDecideErr } = await coordinatorClient.rpc(
      'coordinator_decide_application',
      {
        p_application_id: newAppId,
        p_decision: 'APPROVED',
        p_comment: 'Verified registry academic standing (GPA 3.15, 88 credits). Approved.',
      }
    );
    expect(coordDecideErr).toBeNull();
  }, 30000);

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

  it('rejects invalid credentials, preserves existing student accounts (Scenario 9), and prevents privilege self-escalation', async () => {
    const anon = createRoleClient();
    const { error: badLogin } = await anon.auth.signInWithPassword({
      email: 'student@limkokwing.edu.sl',
      password: 'WrongPassword123!',
    });
    expect(badLogin).toBeTruthy();

    const studentClient = await signInAs('student@limkokwing.edu.sl');
    const student2Client = await signInAs('kadiatu.bangura@student.limkokwing.edu.sl');
    const student3Client = await signInAs('samuel.koroma@student.limkokwing.edu.sl');
    const student4Client = await signInAs('aminata.jalloh@student.limkokwing.edu.sl');

    // Scenario 9: Verify all 4 existing seeded students have valid registry_id & registry_verified_at
    for (const client of [studentClient, student2Client, student3Client, student4Client]) {
      const { data: sp } = await client
        .from('student_profiles')
        .select('student_number, year_of_study, semester, registry_id, registry_verified_at')
        .single();
      expect(sp?.year_of_study).toBe(4);
      expect(sp?.semester).toBe(8);
      expect(sp?.registry_id).toBeTruthy();
      expect(sp?.registry_verified_at).toBeTruthy();
    }

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
      .limit(80);
    const actions = new Set((auditRows || []).map((r) => r.action));
    expect(actions.has('STUDENT_REGISTRY_ACCOUNT_ACTIVATED')).toBe(true);
    expect(actions.has('STUDENT_REGISTRY_BATCH_UPSERTED')).toBe(true);
    expect(actions.has('STUDENT_REGISTRY_EMAIL_CORRECTED')).toBe(true);
    expect(actions.has('STAFF_ACCOUNT_PROVISIONED')).toBe(true);
    expect(actions.has('STAFF_PASSWORD_SETUP_COMPLETED')).toBe(true);
    expect(actions.has('COMPLETION_COMPLETED')).toBe(true);
  }, 30000);
});
