import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ROLE_LABELS } from '../../types/auth';
import { StudentProfileRow } from '../../types/database';
import { supabase } from '../../lib/supabase';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { User, Lock, CheckCircle2, AlertCircle, GraduationCap } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, roles, refreshProfile } = useAuth();
  const [studentProfile, setStudentProfile] = useState<StudentProfileRow | null>(null);

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [skills, setSkills] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');

  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const isStudent = roles.includes('student');

  useEffect(() => {
    setFullName(user?.full_name || '');
    setPhone(user?.phone || '');
    if (user?.id && isStudent) {
      supabase
        .from('student_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            const sp = data as StudentProfileRow;
            setStudentProfile(sp);
            setSkills(sp.skills || '');
            setEmergencyContact(sp.emergency_contact || '');
          }
        });
    }
  }, [user, isStudent]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage(null);
    setProfileError(null);

    if (fullName.trim().length < 2) {
      setProfileError('Full name must be at least 2 characters.');
      return;
    }

    setSavingProfile(true);
    const { error } = await supabase.rpc('update_my_profile', {
      p_full_name: fullName.trim(),
      p_phone: phone.trim(),
      p_skills: isStudent ? skills.trim() : null,
      p_emergency_contact: isStudent ? emergencyContact.trim() : null,
    });
    setSavingProfile(false);

    if (error) {
      setProfileError(error.message);
      return;
    }

    await refreshProfile();
    setProfileMessage('Your profile has been updated in PostgreSQL.');
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);
    setPasswordError(null);

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Password confirmation does not match.');
      return;
    }

    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);

    if (error) {
      setPasswordError(error.message);
      return;
    }

    setNewPassword('');
    setConfirmPassword('');
    setPasswordMessage('Your password has been updated.');
  };

  return (
    <div className="space-y-6">
      <div className="pb-3 border-b border-slate-200">
        <h2 className="text-xl font-bold text-[#002B49]">Account & Personal Profile</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage your university contact information, student readiness details, and security credentials
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4 text-teal-600" />
              <span>Personal Profile Details</span>
            </CardTitle>
          </CardHeader>

          {profileError && (
            <div className="mb-4 rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{profileError}</span>
            </div>
          )}

          {profileMessage && (
            <div className="mb-4 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800 border border-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{profileMessage}</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="prof-name" className="block text-xs font-semibold text-slate-700">
                  Full Name *
                </label>
                <input
                  id="prof-name"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#002B49]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Email Address (Verified Identity)
                </label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="mt-1 block w-full rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-xs text-slate-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="prof-phone" className="block text-xs font-semibold text-slate-700">
                  Phone Number {isStudent && '*'}
                </label>
                <input
                  id="prof-phone"
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+232 76 543210"
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#002B49]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Authorized System Roles
                </label>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {roles.map((r) => (
                    <span
                      key={r}
                      className="inline-flex items-center rounded bg-[#002B49]/10 px-2.5 py-1 text-xs font-bold text-[#002B49]"
                    >
                      {ROLE_LABELS[r]}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {isStudent && studentProfile && (
              <div className="pt-4 mt-4 border-t border-slate-100 space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-700">
                  <GraduationCap className="h-4 w-4" />
                  <span>Academic Record (Registry Verified)</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-xl bg-slate-50 p-3.5 border border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-500">Student Number</span>
                    <p className="font-bold text-slate-900 mt-0.5">
                      {studentProfile.student_number}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">Year of Study</span>
                    <p className="font-bold text-slate-900 mt-0.5">
                      Year {studentProfile.year_of_study}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">Cumulative GPA</span>
                    <p className="font-bold text-slate-900 mt-0.5">{studentProfile.gpa ?? 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Credits Completed</span>
                    <p className="font-bold text-slate-900 mt-0.5">
                      {studentProfile.credits_completed}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500">Faculty</span>
                    <p className="font-semibold text-slate-900 mt-0.5">{studentProfile.faculty}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500">Programme</span>
                    <p className="font-semibold text-slate-900 mt-0.5">
                      {studentProfile.programme}
                    </p>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="prof-skills"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Technical & Professional Skills * (Required before submitting application)
                  </label>
                  <textarea
                    id="prof-skills"
                    rows={2}
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    placeholder="e.g. React, TypeScript, SQL, Networking, UI/UX Design"
                    className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#002B49]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="prof-emergency"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Emergency Contact * (Required before submitting application)
                  </label>
                  <input
                    id="prof-emergency"
                    type="text"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    placeholder="Name and phone number"
                    className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#002B49]"
                  />
                </div>
              </div>
            )}

            <div className="pt-2">
              <Button type="submit" variant="primary" size="md" isLoading={savingProfile}>
                Save Profile Changes
              </Button>
            </div>
          </form>
        </Card>

        {/* Password Change Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Lock className="h-4 w-4 text-teal-600" />
              <span>Change Password</span>
            </CardTitle>
          </CardHeader>

          {passwordError && (
            <div className="mb-4 rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
              {passwordError}
            </div>
          )}

          {passwordMessage && (
            <div className="mb-4 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800 border border-emerald-200">
              {passwordMessage}
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label htmlFor="new-pw" className="block text-xs font-semibold text-slate-700">
                New Password (min 8 chars)
              </label>
              <input
                id="new-pw"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#002B49]"
              />
            </div>

            <div>
              <label htmlFor="confirm-pw" className="block text-xs font-semibold text-slate-700">
                Confirm New Password
              </label>
              <input
                id="confirm-pw"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#002B49]"
              />
            </div>

            <Button type="submit" variant="outline" size="md" className="w-full" isLoading={savingPassword}>
              Update Password
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};
