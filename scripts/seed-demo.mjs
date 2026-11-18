/**
 * Digital LEAP Internship Management System
 * Limkokwing University of Creative Technology — Sierra Leone
 *
 * Repeatable server-side development seed script.
 * Creates the six official demo accounts in Supabase Auth (auth.users),
 * assigns their roles in public.user_roles, and seeds realistic university
 * organizations, placement opportunities, and isolation test fixtures.
 *
 * Usage:
 *   node scripts/seed-demo.mjs
 *   node scripts/seed-demo.mjs --reset-primary-student
 */

import { createClient } from '@supabase/supabase-js';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

export const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'LeapDemo!2026';

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function ensureAuthUser({ email, password, full_name, phone, is_active = true, roles = [] }) {
  const { data: listData, error: listErr } = await admin.auth.admin.listUsers({ perPage: 200 });
  if (listErr) throw listErr;

  let user = listData.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (!user) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    });
    if (error) throw error;
    user = data.user;
  } else {
    const { error } = await admin.auth.admin.updateUserById(user.id, {
      password,
      email_confirm: true,
      user_metadata: { full_name },
    });
    if (error) throw error;
  }

  const { error: profErr } = await admin.from('profiles').upsert(
    {
      id: user.id,
      email: email.toLowerCase(),
      full_name,
      phone,
      is_active,
    },
    { onConflict: 'id' }
  );
  if (profErr) throw profErr;

  // Sync roles
  const { error: delErr } = await admin.from('user_roles').delete().eq('user_id', user.id);
  if (delErr) throw delErr;

  if (roles.length > 0) {
    const { error: roleErr } = await admin.from('user_roles').insert(
      roles.map((role) => ({ user_id: user.id, role }))
    );
    if (roleErr) throw roleErr;
  }

  return user;
}

export async function seedDatabase({ resetPrimaryStudent = false } = {}) {
  console.log(`Seeding Digital LEAP Internship Management System at ${SUPABASE_URL}...`);

  // 1. Provision the 6 official demo accounts + isolation test accounts
  const adminUser = await ensureAuthUser({
    email: 'admin@limkokwing.edu.sl',
    password: DEMO_PASSWORD,
    full_name: 'Ibrahim Koroma',
    phone: '+232 88 000111',
    roles: ['admin', 'management'],
  });

  const coordinatorUser = await ensureAuthUser({
    email: 'coordinator@limkokwing.edu.sl',
    password: DEMO_PASSWORD,
    full_name: 'Dr. Joseph Bockarie',
    phone: '+232 78 112233',
    roles: ['coordinator'],
  });

  const supervisorUser = await ensureAuthUser({
    email: 'supervisor@limkokwing.edu.sl',
    password: DEMO_PASSWORD,
    full_name: 'Ing. Sheku Dinneh Kamara',
    phone: '+232 77 334455',
    roles: ['supervisor'],
  });

  const supervisor2User = await ensureAuthUser({
    email: 'supervisor2@limkokwing.edu.sl',
    password: DEMO_PASSWORD,
    full_name: 'Dr. Fatmata Bangura',
    phone: '+232 77 445566',
    roles: ['supervisor'],
  });

  const hostUser = await ensureAuthUser({
    email: 'host@slcb.sl',
    password: DEMO_PASSWORD,
    full_name: 'Amadu Mansaray',
    phone: '+232 76 123456',
    roles: ['host'],
  });

  const host2User = await ensureAuthUser({
    email: 'host@africell.sl',
    password: DEMO_PASSWORD,
    full_name: 'Mariama Koroma',
    phone: '+232 77 987654',
    roles: ['host'],
  });

  const managementUser = await ensureAuthUser({
    email: 'management@limkokwing.edu.sl',
    password: DEMO_PASSWORD,
    full_name: 'Prof. Agnes Conteh',
    phone: '+232 30 998877',
    roles: ['management'],
  });

  const studentUser = await ensureAuthUser({
    email: 'student@limkokwing.edu.sl',
    password: DEMO_PASSWORD,
    full_name: 'Madi A. Sesay',
    phone: '+232 76 543210',
    roles: ['student'],
  });

  const student2User = await ensureAuthUser({
    email: 'kadiatu.bangura@student.limkokwing.edu.sl',
    password: DEMO_PASSWORD,
    full_name: 'Kadiatu Bangura',
    phone: '+232 76 222333',
    roles: ['student'],
  });

  const student3User = await ensureAuthUser({
    email: 'samuel.koroma@student.limkokwing.edu.sl',
    password: DEMO_PASSWORD,
    full_name: 'Samuel Koroma',
    phone: '+232 78 333444',
    roles: ['student'],
  });

  const student4User = await ensureAuthUser({
    email: 'aminata.jalloh@student.limkokwing.edu.sl',
    password: DEMO_PASSWORD,
    full_name: 'Aminata Jalloh',
    phone: '+232 79 444555',
    roles: ['student'],
  });

  // 2. Host organizations
  const orgRows = [
    {
      name: 'Sierra Leone Commercial Bank (SLCB)',
      industry: 'Banking & Financial Technology',
      address: '29-31 Siaka Stevens Street',
      city: 'Freetown',
      contact_email: 'hr.leap@slcb.sl',
      contact_phone: '+232 76 123456',
      is_active: true,
    },
    {
      name: 'Africell Sierra Leone',
      industry: 'Telecommunications & Network Systems',
      address: '1 Wilkinson Road',
      city: 'Freetown',
      contact_email: 'internships@africell.sl',
      contact_phone: '+232 77 987654',
      is_active: true,
    },
    {
      name: 'Directorate of Science, Technology & Innovation (DSTI)',
      industry: 'Public Sector Digital Innovation',
      address: 'State House, Tower Hill',
      city: 'Freetown',
      contact_email: 'leap@dsti.gov.sl',
      contact_phone: '+232 30 112233',
      is_active: true,
    },
    {
      name: 'Orange Sierra Leone',
      industry: 'Digital Services & Mobile Engineering',
      address: '25 Regent Road, Hill Station',
      city: 'Freetown',
      contact_email: 'careers@orange.sl',
      contact_phone: '+232 78 555666',
      is_active: true,
    },
  ];

  const { data: orgs, error: orgErr } = await admin
    .from('host_organizations')
    .upsert(orgRows, { onConflict: 'name' })
    .select();
  if (orgErr) throw orgErr;

  const byOrgName = Object.fromEntries(orgs.map((o) => [o.name, o]));
  const slcb = byOrgName['Sierra Leone Commercial Bank (SLCB)'];
  const africell = byOrgName['Africell Sierra Leone'];
  const dsti = byOrgName['Directorate of Science, Technology & Innovation (DSTI)'];
  const orange = byOrgName['Orange Sierra Leone'];

  // 3. Host representatives
  const { error: hrErr } = await admin.from('host_representatives').upsert(
    [
      {
        user_id: hostUser.id,
        organization_id: slcb.id,
        job_title: 'Head of Digital Banking & IT',
      },
      {
        user_id: host2User.id,
        organization_id: africell.id,
        job_title: 'Network Operations Lead',
      },
    ],
    { onConflict: 'user_id' }
  );
  if (hrErr) throw hrErr;

  // 4. Academic supervisors
  const { data: supervisors, error: supErr } = await admin
    .from('academic_supervisors')
    .upsert(
      [
        {
          user_id: supervisorUser.id,
          staff_number: 'LUCT-STAFF-014',
          title: 'Senior Lecturer',
          faculty: 'Faculty of Information & Communication Technology',
          department: 'Software Engineering & IT',
          max_students: 8,
        },
        {
          user_id: supervisor2User.id,
          staff_number: 'LUCT-STAFF-022',
          title: 'Associate Professor',
          faculty: 'Faculty of Business & Globalization',
          department: 'Business Information Systems',
          max_students: 6,
        },
      ],
      { onConflict: 'user_id' }
    )
    .select();
  if (supErr) throw supErr;

  const sup1 = supervisors.find((s) => s.user_id === supervisorUser.id);
  const sup2 = supervisors.find((s) => s.user_id === supervisor2User.id);

  // 5. Student profiles
  const { data: studentProfiles, error: spErr } = await admin
    .from('student_profiles')
    .upsert(
      [
        {
          user_id: studentUser.id,
          student_number: 'LUCT-SL-2024-0452',
          faculty: 'Faculty of Information & Communication Technology',
          programme: 'BSc (Hons) in Software Engineering with Multimedia',
          year_of_study: 4,
          semester: 8,
          gpa: 3.65,
          credits_completed: 96,
          skills: 'React, TypeScript, PostgreSQL, REST APIs, Git, UI/UX Prototyping',
          emergency_contact: 'Mariatu Sesay (+232 76 200100)',
        },
        {
          user_id: student2User.id,
          student_number: 'LUCT-SL-2024-0588',
          faculty: 'Faculty of Information & Communication Technology',
          programme: 'BSc (Hons) in Information Technology',
          year_of_study: 4,
          semester: 8,
          gpa: 3.4,
          credits_completed: 90,
          skills: 'Cisco Networking, Linux Administration, Cyber Security Basics, Python',
          emergency_contact: 'Alhaji Bangura (+232 76 300200)',
        },
        {
          user_id: student3User.id,
          student_number: 'LUCT-SL-2024-0312',
          faculty: 'Faculty of Business & Globalization',
          programme: 'BSc (Hons) in Business Information Systems',
          year_of_study: 4,
          semester: 8,
          gpa: 3.55,
          credits_completed: 92,
          skills: 'Business Process Modelling, SQL Analytics, Power BI, IT Governance',
          emergency_contact: 'Hawa Koroma (+232 78 400300)',
        },
        {
          user_id: student4User.id,
          student_number: 'LUCT-SL-2023-0190',
          faculty: 'Faculty of Architecture & The Built Environment',
          programme: 'BSc (Hons) in Architectural Technology',
          year_of_study: 4,
          semester: 8,
          gpa: 3.78,
          credits_completed: 96,
          skills: 'GIS Mapping, CAD Modelling, Civic Infrastructure Planning',
          emergency_contact: 'Chernor Jalloh (+232 79 500400)',
        },
      ],
      { onConflict: 'user_id' }
    )
    .select();
  if (spErr) throw spErr;

  const sp1 = studentProfiles.find((s) => s.user_id === studentUser.id);
  const sp2 = studentProfiles.find((s) => s.user_id === student2User.id);
  const sp3 = studentProfiles.find((s) => s.user_id === student3User.id);
  const sp4 = studentProfiles.find((s) => s.user_id === student4User.id);

  // 6. Placement opportunities
  const { data: existingOpps } = await admin.from('placement_opportunities').select('*');
  const ensureOpportunity = async (opp) => {
    const found = (existingOpps || []).find(
      (o) => o.organization_id === opp.organization_id && o.title === opp.title
    );
    if (found) {
      const { data, error } = await admin
        .from('placement_opportunities')
        .update(opp)
        .eq('id', found.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    const { data, error } = await admin
      .from('placement_opportunities')
      .insert(opp)
      .select()
      .single();
    if (error) throw error;
    return data;
  };

  const oppSlcb = await ensureOpportunity({
    organization_id: slcb.id,
    title: 'Software & Web Applications Intern',
    department: 'Digital Banking & Channels Division',
    description:
      'Collaborate with the SLCB engineering squad to build internal banking workflows, customer onboarding portals, and automated PostgreSQL reporting integrations.',
    requirements: 'TypeScript/React fundamentals, relational database design, Git version control.',
    location: 'Siaka Stevens Street, Freetown',
    capacity: 3,
    start_date: '2026-12-01',
    end_date: '2027-02-28',
    status: 'OPEN',
    created_by: coordinatorUser.id,
  });

  const oppAfricell = await ensureOpportunity({
    organization_id: africell.id,
    title: 'Network & Systems Operations Intern',
    department: 'Network Operations Center (NOC)',
    description:
      'Support IP core monitoring, enterprise connectivity diagnostics, and systems automation across Freetown base stations.',
    requirements: 'Networking fundamentals, Linux CLI, analytical troubleshooting.',
    location: 'Wilkinson Road, Freetown',
    capacity: 4,
    start_date: '2026-12-01',
    end_date: '2027-02-28',
    status: 'OPEN',
    created_by: coordinatorUser.id,
  });

  const oppDsti = await ensureOpportunity({
    organization_id: dsti.id,
    title: 'Civic Tech & Digital Public Goods Intern',
    department: 'National Digital Platforms Unit',
    description:
      'Assist in designing, testing, and documenting citizen-facing digital services and open-data dashboards.',
    requirements: 'Data analysis, web technologies, user research and documentation.',
    location: 'State House, Freetown',
    capacity: 2,
    start_date: '2026-06-01',
    end_date: '2026-08-31',
    status: 'OPEN',
    created_by: coordinatorUser.id,
  });

  await ensureOpportunity({
    organization_id: orange.id,
    title: 'Mobile FinTech & QA Engineering Intern',
    department: 'Orange Money Technical Division',
    description:
      'Execute automated regression suites, validate USSD/mobile payment flows, and document release quality metrics.',
    requirements: 'Software testing concepts, SQL queries, attention to detail.',
    location: 'Hill Station, Freetown',
    capacity: 3,
    start_date: '2026-12-01',
    end_date: '2027-02-28',
    status: 'OPEN',
    created_by: coordinatorUser.id,
  });

  // 7. Reset primary student (Madi A. Sesay) if requested so the 12-step live demo starts cleanly
  if (resetPrimaryStudent) {
    await admin.from('placements').delete().eq('student_id', sp1.id);
    await admin.from('internship_applications').delete().eq('student_id', sp1.id);
  }

  // 8. Seed Peer Student 2 (Kadiatu Bangura) — SUBMITTED application awaiting review
  const { data: app2Existing } = await admin
    .from('internship_applications')
    .select('*')
    .eq('student_id', sp2.id)
    .eq('academic_year', '2026/2027')
    .maybeSingle();

  if (!app2Existing) {
    const { data: app2, error: app2Err } = await admin
      .from('internship_applications')
      .insert({
        student_id: sp2.id,
        academic_year: '2026/2027',
        preferred_industry: 'Telecommunications & Network Systems',
        preferred_organization_id: africell.id,
        preferred_host_organization: 'Africell Sierra Leone',
        preference_reason: 'Africell operates the largest NOC in Freetown with hands-on IP core routing teams.',
        motivation:
          'I am eager to apply my networking and Linux coursework in a production telecommunications environment at Africell Sierra Leone, focusing on network reliability and NOC diagnostics.',
        relevant_skills: 'TCP/IP routing, VLAN configuration, Linux shell scripting, Wireshark packet analysis',
        preferred_start_date: '2026-12-01',
        preferred_end_date: '2027-02-28',
        status: 'SUBMITTED',
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (app2Err) throw app2Err;

    await admin.from('application_reviews').insert([
      {
        application_id: app2.id,
        actor_id: student2User.id,
        from_status: 'DRAFT',
        to_status: 'SUBMITTED',
        comment: 'Submitted for coordinator eligibility review',
      },
    ]);
  }

  // 9. Seed Peer Student 3 (Samuel Koroma) — ACTIVE placement at Africell under Supervisor 2 (for isolation tests)
  const { data: app3Existing } = await admin
    .from('internship_applications')
    .select('*')
    .eq('student_id', sp3.id)
    .eq('academic_year', '2026/2027')
    .maybeSingle();

  if (!app3Existing) {
    const { data: app3, error: app3Err } = await admin
      .from('internship_applications')
      .insert({
        student_id: sp3.id,
        academic_year: '2026/2027',
        preferred_industry: 'Telecommunications & Network Systems',
        preferred_organization_id: africell.id,
        motivation:
          'My goal is to bridge business systems analysis and telecom operations at Africell Sierra Leone by building operational KPI reports and service quality trackers.',
        relevant_skills: 'SQL, Business Process Mapping, Data Visualization, Systems Analysis',
        preferred_start_date: '2026-12-01',
        preferred_end_date: '2027-02-28',
        status: 'APPROVED',
        submitted_at: new Date().toISOString(),
        decided_at: new Date().toISOString(),
        decided_by: coordinatorUser.id,
      })
      .select()
      .single();
    if (app3Err) throw app3Err;

    const { data: pl3, error: pl3Err } = await admin
      .from('placements')
      .insert({
        application_id: app3.id,
        student_id: sp3.id,
        opportunity_id: oppAfricell.id,
        organization_id: africell.id,
        status: 'ACTIVE',
        start_date: '2026-12-01',
        end_date: '2027-02-28',
        host_response_note: 'Confirmed by Africell NOC team.',
        host_responded_at: new Date().toISOString(),
        host_responded_by: host2User.id,
        created_by: coordinatorUser.id,
      })
      .select()
      .single();
    if (pl3Err) throw pl3Err;

    await admin.from('supervisor_assignments').insert({
      placement_id: pl3.id,
      supervisor_id: sup2.id,
      assigned_by: coordinatorUser.id,
      is_current: true,
    });

    await admin.from('completion_records').insert({
      placement_id: pl3.id,
      student_id: sp3.id,
      status: 'IN_PROGRESS',
    });
  }

  // 10. Seed Peer Student 4 (Aminata Jalloh) — COMPLETED placement at DSTI (historical record)
  const { data: app4Existing } = await admin
    .from('internship_applications')
    .select('*')
    .eq('student_id', sp4.id)
    .eq('academic_year', '2025/2026')
    .maybeSingle();

  if (!app4Existing) {
    const { data: app4, error: app4Err } = await admin
      .from('internship_applications')
      .insert({
        student_id: sp4.id,
        academic_year: '2025/2026',
        preferred_industry: 'Public Sector Digital Innovation',
        preferred_organization_id: dsti.id,
        motivation:
          'Applying spatial mapping and digital public infrastructure design to national school and clinic mapping initiatives at DSTI.',
        relevant_skills: 'GIS, CAD, Technical Documentation, Stakeholder Engagement',
        preferred_start_date: '2026-06-01',
        preferred_end_date: '2026-08-31',
        status: 'APPROVED',
        submitted_at: new Date().toISOString(),
        decided_at: new Date().toISOString(),
        decided_by: coordinatorUser.id,
      })
      .select()
      .single();
    if (app4Err) throw app4Err;

    const { data: pl4, error: pl4Err } = await admin
      .from('placements')
      .insert({
        application_id: app4.id,
        student_id: sp4.id,
        opportunity_id: oppDsti.id,
        organization_id: dsti.id,
        status: 'COMPLETED',
        start_date: '2026-06-01',
        end_date: '2026-08-31',
        host_response_note: 'Confirmed by DSTI National Platforms Directorate.',
        host_responded_at: new Date().toISOString(),
        created_by: coordinatorUser.id,
      })
      .select()
      .single();
    if (pl4Err) throw pl4Err;

    await admin.from('supervisor_assignments').insert({
      placement_id: pl4.id,
      supervisor_id: sup1.id,
      assigned_by: coordinatorUser.id,
      is_current: true,
    });

    await admin.from('progress_reports').insert({
      placement_id: pl4.id,
      student_id: sp4.id,
      report_number: 1,
      period_start: '2026-06-01',
      period_end: '2026-06-30',
      hours_worked: 160,
      activities:
        'Compiled geospatial coordinates for 45 secondary schools across Western Area Urban and Rural and validated metadata schemas.',
      learning_outcomes:
        'Mastered GeoJSON validation pipelines, public-sector data governance, and collaborative Git workflows.',
      challenges: 'Standardizing legacy coordinate formats from district offices.',
      next_steps: 'Publish interactive map layers for ministry review.',
      status: 'ACCEPTED',
      version: 1,
      submitted_at: new Date().toISOString(),
      reviewed_at: new Date().toISOString(),
    });

    await admin.from('host_evaluations').insert({
      placement_id: pl4.id,
      submitted_by: coordinatorUser.id,
      punctuality: 5,
      professionalism: 5,
      technical_skills: 4,
      communication: 5,
      teamwork: 5,
      initiative: 4,
      strengths: 'Exceptional reliability, accurate geospatial documentation, strong teamwork.',
      improvements: 'Continue expanding automated scripting skills.',
      recommend_for_employment: true,
    });

    await admin.from('assessments').insert({
      placement_id: pl4.id,
      recorded_by: supervisorUser.id,
      supervisor_score: 88,
      report_score: 90,
      host_score: 93.33,
      final_score: 90.2,
      comments: 'Outstanding internship performance and comprehensive final technical dossier.',
      status: 'FINALIZED',
      finalized_by: supervisorUser.id,
      finalized_at: new Date().toISOString(),
    });

    await admin.from('completion_records').insert({
      placement_id: pl4.id,
      student_id: sp4.id,
      status: 'COMPLETED',
      accepted_reports: 1,
      total_hours: 160,
      host_evaluation_received: true,
      final_score: 90.2,
      decided_by: supervisorUser.id,
      decided_at: new Date().toISOString(),
    });
  }

  // Record a seed audit event
  await admin.from('audit_logs').insert({
    actor_id: adminUser.id,
    action: 'DEMO_ACCOUNTS_PROVISIONED',
    entity_type: 'system',
    entity_id: 'seed',
    details: {
      accounts: [
        'student@limkokwing.edu.sl',
        'coordinator@limkokwing.edu.sl',
        'supervisor@limkokwing.edu.sl',
        'host@slcb.sl',
        'management@limkokwing.edu.sl',
        'admin@limkokwing.edu.sl',
      ],
    },
  });

  console.log('Seed completed successfully.');
  return {
    users: {
      studentUser,
      student2User,
      student3User,
      student4User,
      coordinatorUser,
      supervisorUser,
      supervisor2User,
      hostUser,
      host2User,
      managementUser,
      adminUser,
    },
    orgs: { slcb, africell, dsti, orange },
    supervisors: { sup1, sup2 },
    students: { sp1, sp2, sp3, sp4 },
    opportunities: { oppSlcb, oppAfricell, oppDsti },
  };
}

const isMainModule =
  process.argv[1] &&
  import.meta.url.toLowerCase() === pathToFileURL(path.resolve(process.argv[1])).href.toLowerCase();

if (isMainModule) {
  const resetPrimaryStudent = process.argv.includes('--reset-primary-student');
  seedDatabase({ resetPrimaryStudent }).catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
}
