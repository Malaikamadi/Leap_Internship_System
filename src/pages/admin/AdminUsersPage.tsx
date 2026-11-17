import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { AppRole, ROLE_LABELS, UserProfile } from '../../types/auth';
import {
  EnrollmentStatus,
  HostOrganizationRow,
  StudentRegistryRecord,
  UserRoleRow,
} from '../../types/database';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import {
  Users,
  Search,
  CheckCircle2,
  XCircle,
  Plus,
  X,
  AlertCircle,
  UserPlus,
  Link2,
  GraduationCap,
  MailCheck,
} from 'lucide-react';

const ALL_ROLES: AppRole[] = [
  'student',
  'coordinator',
  'supervisor',
  'host',
  'management',
  'admin',
];

const STAFF_PROVISION_ROLES: AppRole[] = [
  'coordinator',
  'supervisor',
  'host',
  'management',
  'admin',
];

interface ProvisionResult {
  user_id: string;
  email: string;
  full_name: string;
  role: AppRole;
  invitation_token: string;
  setup_path: string;
}

export const AdminUsersPage: React.FC = () => {
  const { user: currentUser, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [userRoles, setUserRoles] = useState<UserRoleRow[]>([]);
  const [organizations, setOrganizations] = useState<HostOrganizationRow[]>([]);
  const [registryRecords, setRegistryRecords] = useState<StudentRegistryRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleSelections, setRoleSelections] = useState<Record<string, AppRole>>({});

  // Staff Account Provisioning state
  const [provEmail, setProvEmail] = useState('');
  const [provFullName, setProvFullName] = useState('');
  const [provPhone, setProvPhone] = useState('');
  const [provRole, setProvRole] = useState<AppRole>('coordinator');
  const [provStaffNumber, setProvStaffNumber] = useState('');
  const [provTitle, setProvTitle] = useState('Lecturer');
  const [provFaculty, setProvFaculty] = useState(
    'Faculty of Information & Communication Technology'
  );
  const [provDepartment, setProvDepartment] = useState('Software Engineering & IT');
  const [provMaxStudents, setProvMaxStudents] = useState<number>(8);
  const [provOrgId, setProvOrgId] = useState('');
  const [provJobTitle, setProvJobTitle] = useState('');
  const [provisionedInvite, setProvisionedInvite] = useState<ProvisionResult | null>(null);

  // University Student Registry Upsert & Email Recovery state
  const [regStudentId, setRegStudentId] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regFullName, setRegFullName] = useState('');
  const [regFaculty, setRegFaculty] = useState(
    'Faculty of Information & Communication Technology'
  );
  const [regProgramme, setRegProgramme] = useState(
    'BSc (Hons) in Software Engineering with Multimedia'
  );
  const [regYear, setRegYear] = useState<number>(4);
  const [regSemester, setRegSemester] = useState<number>(8);
  const [regGpa, setRegGpa] = useState<number>(3.5);
  const [regCredits, setRegCredits] = useState<number>(90);
  const [regStatus, setRegStatus] = useState<EnrollmentStatus>('ENROLLED');

  const [corrStudentId, setCorrStudentId] = useState('');
  const [corrNewEmail, setCorrNewEmail] = useState('');
  const [corrReason, setCorrReason] = useState('');

  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const [{ data: profRows }, { data: roleRows }, { data: orgRows }, { data: regData }] =
      await Promise.all([
        supabase.from('profiles').select('*').order('full_name', { ascending: true }),
        supabase.from('user_roles').select('*'),
        supabase.from('host_organizations').select('*').order('name', { ascending: true }),
        supabase.rpc('admin_list_student_registry', { p_search: null }),
      ]);

    const profList = (profRows || []) as UserProfile[];
    const orgList = (orgRows || []) as HostOrganizationRow[];
    setProfiles(profList);
    setUserRoles((roleRows || []) as UserRoleRow[]);
    setOrganizations(orgList);
    setRegistryRecords((regData as StudentRegistryRecord[]) || []);

    if (orgList.length > 0 && !provOrgId) {
      setProvOrgId(orgList[0].id);
    }

    const defaults: Record<string, AppRole> = {};
    for (const p of profList) {
      defaults[p.id] = 'coordinator';
    }
    setRoleSelections((prev) => ({ ...defaults, ...prev }));
    setLoading(false);
  }, [provOrgId]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const rolesByUser: Record<string, AppRole[]> = {};
  for (const ur of userRoles) {
    rolesByUser[ur.user_id] = rolesByUser[ur.user_id] || [];
    rolesByUser[ur.user_id].push(ur.role);
  }

  const handleProvisionStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setProvisionedInvite(null);
    setProcessing(true);

    const { data, error: rpcErr } = await supabase.rpc('admin_provision_staff_account', {
      p_email: provEmail.trim().toLowerCase(),
      p_full_name: provFullName.trim(),
      p_role: provRole,
      p_phone: provPhone.trim() || null,
      p_staff_number: provRole === 'supervisor' ? provStaffNumber.trim() : null,
      p_title: provRole === 'supervisor' ? provTitle.trim() : null,
      p_faculty: provRole === 'supervisor' ? provFaculty.trim() : null,
      p_department: provRole === 'supervisor' ? provDepartment.trim() : null,
      p_max_students: provRole === 'supervisor' ? Number(provMaxStudents) : 8,
      p_organization_id: provRole === 'host' ? provOrgId : null,
      p_job_title: provRole === 'host' ? provJobTitle.trim() : null,
    });

    setProcessing(false);
    if (rpcErr) {
      setError(rpcErr.message);
      return;
    }

    const res = data as ProvisionResult;
    setProvisionedInvite(res);
    setProvEmail('');
    setProvFullName('');
    setProvPhone('');
    setProvStaffNumber('');
    setProvJobTitle('');
    await loadUsers();
    setSuccess(
      `Provisioned ${ROLE_LABELS[res.role]} account for ${res.email}. A secure password-setup invitation link has been generated.`
    );
  };

  const handleUpsertRegistryRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setProcessing(true);

    const { error: rpcErr } = await supabase.rpc('admin_upsert_student_registry_batch', {
      p_records: [
        {
          student_number: regStudentId.trim().toUpperCase(),
          institutional_email: regEmail.trim().toLowerCase(),
          full_name: regFullName.trim(),
          faculty: regFaculty.trim(),
          programme: regProgramme.trim(),
          year_of_study: Number(regYear),
          semester: Number(regSemester),
          gpa: Number(regGpa),
          credits_completed: Number(regCredits),
          enrollment_status: regStatus,
          academic_year: '2025/2026',
        },
      ],
    });

    setProcessing(false);
    if (rpcErr) {
      setError(rpcErr.message);
      return;
    }

    setRegStudentId('');
    setRegEmail('');
    setRegFullName('');
    await loadUsers();
    setSuccess('University Student Registry record upserted and synchronized.');
  };

  const handleCorrectRegistryEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setProcessing(true);

    const { error: rpcErr } = await supabase.rpc('admin_correct_registry_student_email', {
      p_student_number: corrStudentId.trim().toUpperCase(),
      p_new_email: corrNewEmail.trim().toLowerCase(),
      p_reason: corrReason.trim(),
    });

    setProcessing(false);
    if (rpcErr) {
      setError(rpcErr.message);
      return;
    }

    setCorrStudentId('');
    setCorrNewEmail('');
    setCorrReason('');
    await loadUsers();
    setSuccess('Unclaimed student registry email updated and logged in the system audit trail.');
  };

  const handleToggleActive = async (targetUser: UserProfile) => {
    setError(null);
    setSuccess(null);
    setProcessing(true);

    const nextActive = !targetUser.is_active;
    const { error: rpcErr } = await supabase.rpc('admin_set_user_active', {
      p_user_id: targetUser.id,
      p_is_active: nextActive,
    });
    setProcessing(false);

    if (rpcErr) {
      setError(rpcErr.message);
      return;
    }

    await loadUsers();
    setSuccess(
      `Account ${targetUser.email} ${nextActive ? 'activated' : 'deactivated'}.`
    );
  };

  const handleGrantRole = async (userId: string) => {
    setError(null);
    setSuccess(null);
    const roleToGrant = roleSelections[userId];
    if (!roleToGrant) return;

    setProcessing(true);
    const { error: rpcErr } = await supabase.rpc('admin_grant_role', {
      p_user_id: userId,
      p_role: roleToGrant,
    });
    setProcessing(false);

    if (rpcErr) {
      setError(rpcErr.message);
      return;
    }

    await loadUsers();
    if (userId === currentUser?.id) {
      await refreshProfile();
    }
    setSuccess(`Granted role "${ROLE_LABELS[roleToGrant]}".`);
  };

  const handleRevokeRole = async (userId: string, role: AppRole) => {
    setError(null);
    setSuccess(null);
    setProcessing(true);

    const { error: rpcErr } = await supabase.rpc('admin_revoke_role', {
      p_user_id: userId,
      p_role: role,
    });
    setProcessing(false);

    if (rpcErr) {
      setError(rpcErr.message);
      return;
    }

    await loadUsers();
    if (userId === currentUser?.id) {
      await refreshProfile();
    }
    setSuccess(`Revoked role "${ROLE_LABELS[role]}".`);
  };

  const filteredProfiles = profiles.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.full_name.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="pb-3 border-b border-slate-200">
        <h2 className="text-xl font-bold text-[#002B49]">
          Staff Account Provisioning, Student Registry & Role-Based Access Management
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Provision staff accounts with secure password-setup invitations, manage the protected
          University Student Registry, and control role-based user access
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700 flex items-start gap-2.5"
        >
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800 flex items-start gap-2.5">
          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      {/* Provision Staff Account Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-teal-600" />
            <span>
              Provision Staff Account (Coordinator, Supervisor, Host Representative, Management)
            </span>
          </CardTitle>
        </CardHeader>

        <form onSubmit={handleProvisionStaff} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label htmlFor="prov-role" className="block font-semibold text-slate-700">
                Staff Role *
              </label>
              <select
                id="prov-role"
                value={provRole}
                onChange={(e) => setProvRole(e.target.value as AppRole)}
                className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
              >
                {STAFF_PROVISION_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="prov-name" className="block font-semibold text-slate-700">
                Full Name *
              </label>
              <input
                id="prov-name"
                type="text"
                required
                value={provFullName}
                onChange={(e) => setProvFullName(e.target.value)}
                placeholder="e.g. Dr. Mohamed Conteh"
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
              />
            </div>

            <div>
              <label htmlFor="prov-email" className="block font-semibold text-slate-700">
                Official Email Address *
              </label>
              <input
                id="prov-email"
                type="email"
                required
                value={provEmail}
                onChange={(e) => setProvEmail(e.target.value)}
                placeholder="name@limkokwing.edu.sl"
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
              />
            </div>

            <div>
              <label htmlFor="prov-phone" className="block font-semibold text-slate-700">
                Phone Number
              </label>
              <input
                id="prov-phone"
                type="text"
                value={provPhone}
                onChange={(e) => setProvPhone(e.target.value)}
                placeholder="+232 76 000000"
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
              />
            </div>
          </div>

          {provRole === 'supervisor' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 rounded-xl bg-slate-50 p-3.5 border border-slate-200">
              <div>
                <label htmlFor="prov-staff-no" className="block font-semibold text-slate-700">
                  Staff Number *
                </label>
                <input
                  id="prov-staff-no"
                  type="text"
                  required
                  value={provStaffNumber}
                  onChange={(e) => setProvStaffNumber(e.target.value)}
                  placeholder="LUCT-STAFF-050"
                  className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-slate-900"
                />
              </div>

              <div>
                <label htmlFor="prov-title" className="block font-semibold text-slate-700">
                  Academic Title
                </label>
                <input
                  id="prov-title"
                  type="text"
                  value={provTitle}
                  onChange={(e) => setProvTitle(e.target.value)}
                  placeholder="Senior Lecturer"
                  className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-slate-900"
                />
              </div>

              <div>
                <label htmlFor="prov-faculty" className="block font-semibold text-slate-700">
                  Faculty *
                </label>
                <input
                  id="prov-faculty"
                  type="text"
                  required
                  value={provFaculty}
                  onChange={(e) => setProvFaculty(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-slate-900"
                />
              </div>

              <div>
                <label htmlFor="prov-dept" className="block font-semibold text-slate-700">
                  Department *
                </label>
                <input
                  id="prov-dept"
                  type="text"
                  required
                  value={provDepartment}
                  onChange={(e) => setProvDepartment(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-slate-900"
                />
              </div>

              <div>
                <label htmlFor="prov-max" className="block font-semibold text-slate-700">
                  Max Students
                </label>
                <input
                  id="prov-max"
                  type="number"
                  min={1}
                  max={50}
                  value={provMaxStudents}
                  onChange={(e) => setProvMaxStudents(Number(e.target.value))}
                  className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-slate-900"
                />
              </div>
            </div>
          )}

          {provRole === 'host' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3.5 border border-slate-200">
              <div>
                <label htmlFor="prov-org" className="block font-semibold text-slate-700">
                  Host Organization *
                </label>
                <select
                  id="prov-org"
                  required
                  value={provOrgId}
                  onChange={(e) => setProvOrgId(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-slate-900"
                >
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name} ({org.city})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="prov-job-title" className="block font-semibold text-slate-700">
                  Representative Job Title
                </label>
                <input
                  id="prov-job-title"
                  type="text"
                  value={provJobTitle}
                  onChange={(e) => setProvJobTitle(e.target.value)}
                  placeholder="Head of Engineering / HR Lead"
                  className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-slate-900"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <p className="text-[11px] text-slate-500">
              No plaintext passwords are created or distributed. A one-time password-setup link is
              issued for the staff member.
            </p>
            <Button type="submit" variant="primary" size="sm" isLoading={processing}>
              <UserPlus className="mr-1.5 h-3.5 w-3.5" />
              <span>Provision Account & Generate Setup Link</span>
            </Button>
          </div>
        </form>

        {provisionedInvite && (
          <div className="mt-4 rounded-xl border border-teal-200 bg-teal-50/70 p-4 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-teal-950 flex items-center gap-1.5">
                <Link2 className="h-4 w-4 text-teal-700" />
                One-Time Password Setup Invitation Issued for {provisionedInvite.email}
              </span>
              <Link
                to={provisionedInvite.setup_path}
                className="font-bold text-[#002B49] hover:underline"
              >
                Open Setup Link
              </Link>
            </div>
            <p className="font-mono text-[11px] text-slate-700 break-all">
              {window.location.origin}
              {provisionedInvite.setup_path}
            </p>
          </div>
        )}
      </Card>

      {/* Protected University Student Registry Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-teal-600" />
            <span>
              Protected University Student Registry ({registryRecords.length} Enrolled Records)
            </span>
          </CardTitle>
        </CardHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
          {/* Upsert Registrar Student Record */}
          <form
            onSubmit={handleUpsertRegistryRecord}
            className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs"
          >
            <p className="font-bold text-[#002B49]">
              Add / Sync Official Student Registry Record
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label htmlFor="reg-stu-id" className="block font-semibold text-slate-700">
                  Student ID *
                </label>
                <input
                  id="reg-stu-id"
                  type="text"
                  required
                  value={regStudentId}
                  onChange={(e) => setRegStudentId(e.target.value)}
                  placeholder="LUCT-SL-2024-0901"
                  className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 uppercase"
                />
              </div>
              <div>
                <label htmlFor="reg-stu-email" className="block font-semibold text-slate-700">
                  Institutional Email *
                </label>
                <input
                  id="reg-stu-email"
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="student@student.limkokwing.edu.sl"
                  className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5"
                />
              </div>
              <div>
                <label htmlFor="reg-stu-name" className="block font-semibold text-slate-700">
                  Full Name *
                </label>
                <input
                  id="reg-stu-name"
                  type="text"
                  required
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  placeholder="Mariama Conteh"
                  className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label htmlFor="reg-stu-faculty" className="block font-semibold text-slate-700">
                  Faculty *
                </label>
                <input
                  id="reg-stu-faculty"
                  type="text"
                  required
                  value={regFaculty}
                  onChange={(e) => setRegFaculty(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5"
                />
              </div>
              <div>
                <label htmlFor="reg-stu-prog" className="block font-semibold text-slate-700">
                  Programme *
                </label>
                <input
                  id="reg-stu-prog"
                  type="text"
                  required
                  value={regProgramme}
                  onChange={(e) => setRegProgramme(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <div>
                <label htmlFor="reg-stu-year" className="block font-semibold text-slate-700">
                  Year
                </label>
                <input
                  id="reg-stu-year"
                  type="number"
                  min={1}
                  max={6}
                  value={regYear}
                  onChange={(e) => setRegYear(Number(e.target.value))}
                  className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-2 py-1"
                />
              </div>
              <div>
                <label htmlFor="reg-stu-sem" className="block font-semibold text-slate-700">
                  Semester
                </label>
                <input
                  id="reg-stu-sem"
                  type="number"
                  min={1}
                  max={12}
                  value={regSemester}
                  onChange={(e) => setRegSemester(Number(e.target.value))}
                  className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-2 py-1"
                />
              </div>
              <div>
                <label htmlFor="reg-stu-gpa" className="block font-semibold text-slate-700">
                  GPA
                </label>
                <input
                  id="reg-stu-gpa"
                  type="number"
                  step="0.01"
                  min={0}
                  max={4}
                  value={regGpa}
                  onChange={(e) => setRegGpa(Number(e.target.value))}
                  className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-2 py-1"
                />
              </div>
              <div>
                <label htmlFor="reg-stu-credits" className="block font-semibold text-slate-700">
                  Credits
                </label>
                <input
                  id="reg-stu-credits"
                  type="number"
                  min={0}
                  value={regCredits}
                  onChange={(e) => setRegCredits(Number(e.target.value))}
                  className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-2 py-1"
                />
              </div>
              <div>
                <label htmlFor="reg-stu-status" className="block font-semibold text-slate-700">
                  Status
                </label>
                <select
                  id="reg-stu-status"
                  value={regStatus}
                  onChange={(e) => setRegStatus(e.target.value as EnrollmentStatus)}
                  className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-2 py-1"
                >
                  <option value="ENROLLED">ENROLLED</option>
                  <option value="ON_LEAVE">ON_LEAVE</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                  <option value="GRADUATED">GRADUATED</option>
                  <option value="WITHDRAWN">WITHDRAWN</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" variant="primary" size="sm" isLoading={processing}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                <span>Upsert Registry Student</span>
              </Button>
            </div>
          </form>

          {/* Registry Email Recovery Form */}
          <form
            onSubmit={handleCorrectRegistryEmail}
            className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs flex flex-col justify-between"
          >
            <div className="space-y-3">
              <p className="font-bold text-[#002B49] flex items-center gap-1.5">
                <MailCheck className="h-4 w-4 text-teal-700" />
                <span>Unclaimed Registry Email Correction (Registrar Recovery)</span>
              </p>
              <p className="text-[11px] text-slate-500">
                If an official registry record contains a mistyped institutional email before a
                student has claimed their account, update it here with an audited reason.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label htmlFor="corr-stu-id" className="block font-semibold text-slate-700">
                    Unclaimed Student ID *
                  </label>
                  <input
                    id="corr-stu-id"
                    type="text"
                    required
                    value={corrStudentId}
                    onChange={(e) => setCorrStudentId(e.target.value)}
                    placeholder="LUCT-SL-2024-0901"
                    className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 uppercase"
                  />
                </div>
                <div>
                  <label htmlFor="corr-new-email" className="block font-semibold text-slate-700">
                    Corrected University Email *
                  </label>
                  <input
                    id="corr-new-email"
                    type="email"
                    required
                    value={corrNewEmail}
                    onChange={(e) => setCorrNewEmail(e.target.value)}
                    placeholder="corrected@student.limkokwing.edu.sl"
                    className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="corr-reason" className="block font-semibold text-slate-700">
                  Audit Reason *
                </label>
                <input
                  id="corr-reason"
                  type="text"
                  required
                  value={corrReason}
                  onChange={(e) => setCorrReason(e.target.value)}
                  placeholder="Verified student ID card at Registrar desk; corrected email typo"
                  className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" variant="outline" size="sm" isLoading={processing}>
                <span>Correct Registry Email</span>
              </Button>
            </div>
          </form>
        </div>

        {/* Registry Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-3 py-2">Student ID</th>
                <th className="px-3 py-2">Full Name & Institutional Email</th>
                <th className="px-3 py-2">Programme & Standing</th>
                <th className="px-3 py-2">Enrollment</th>
                <th className="px-3 py-2">Verification Claim State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {registryRecords.map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2.5 font-mono font-bold text-[#002B49]">
                    {rec.student_number}
                  </td>
                  <td className="px-3 py-2.5">
                    <p className="font-bold text-slate-900">{rec.full_name}</p>
                    <p className="text-[11px] font-mono text-slate-500">
                      {rec.institutional_email}
                    </p>
                  </td>
                  <td className="px-3 py-2.5">
                    <p className="font-medium text-slate-800">{rec.programme}</p>
                    <p className="text-[11px] text-slate-500">
                      Year {rec.year_of_study}, Sem {rec.semester} • GPA {Number(rec.gpa).toFixed(2)}{' '}
                      • {rec.credits_completed} Credits
                    </p>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="inline-flex rounded bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-800">
                      {rec.enrollment_status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    {rec.verification_state === 'CLAIMED' ? (
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                        <CheckCircle2 className="h-3 w-3" />
                        Claimed & Active
                      </span>
                    ) : rec.verification_state === 'PENDING_EMAIL_CONFIRMATION' ? (
                      <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800">
                        Pending Email Confirmation
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700">
                        Unclaimed (Ready for Signup)
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="relative max-w-md">
        <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search accounts by name or email..."
          className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2 text-xs text-slate-900"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-teal-600" />
            <span>Registered Accounts ({filteredProfiles.length})</span>
          </CardTitle>
        </CardHeader>

        {loading ? (
          <p className="py-8 text-center text-xs text-slate-500">Loading accounts...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2.5">User</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5">Assigned Roles</th>
                  <th className="px-3 py-2.5">Grant Additional Role</th>
                  <th className="px-3 py-2.5 text-right">Account Status Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProfiles.map((p) => {
                  const assigned = rolesByUser[p.id] || [];
                  const isSelf = p.id === currentUser?.id;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="px-3 py-3">
                        <p className="font-bold text-slate-900">{p.full_name}</p>
                        <p className="text-[11px] font-mono text-slate-500">{p.email}</p>
                      </td>

                      <td className="px-3 py-3">
                        {p.is_active ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-700 font-semibold">
                            <XCircle className="h-3.5 w-3.5" />
                            Disabled
                          </span>
                        )}
                      </td>

                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          {assigned.map((r) => (
                            <span
                              key={r}
                              className="inline-flex items-center gap-1 rounded bg-[#002B49]/10 px-2 py-0.5 text-[11px] font-bold text-[#002B49]"
                            >
                              <span>{ROLE_LABELS[r]}</span>
                              {assigned.length > 1 && !(isSelf && r === 'admin') && (
                                <button
                                  type="button"
                                  title={`Revoke ${ROLE_LABELS[r]}`}
                                  onClick={() => handleRevokeRole(p.id, r)}
                                  className="text-slate-500 hover:text-rose-600"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              )}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1.5">
                          <select
                            aria-label={`Select role to grant to ${p.email}`}
                            value={roleSelections[p.id] || 'coordinator'}
                            onChange={(e) =>
                              setRoleSelections({
                                ...roleSelections,
                                [p.id]: e.target.value as AppRole,
                              })
                            }
                            className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs"
                          >
                            {ALL_ROLES.map((r) => (
                              <option key={r} value={r}>
                                {ROLE_LABELS[r]}
                              </option>
                            ))}
                          </select>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            isLoading={processing}
                            onClick={() => handleGrantRole(p.id)}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>

                      <td className="px-3 py-3 text-right">
                        <Button
                          type="button"
                          variant={p.is_active ? 'danger' : 'secondary'}
                          size="sm"
                          disabled={isSelf && p.is_active}
                          isLoading={processing}
                          onClick={() => handleToggleActive(p)}
                        >
                          {p.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
