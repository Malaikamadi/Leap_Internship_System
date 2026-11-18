import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  StudentProfileRow,
  InternshipApplicationRow,
  ApplicationReviewRow,
  EligibilityResult,
} from '../../types/database';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { DashboardSkeleton } from '../../components/ui/Skeleton';
import { ActivityTimeline } from '../../components/ui/ActivityTimeline';
import { PageHeader } from '../../components/ui/PageHeader';
import {
  FileText,
  Save,
  Send,
  AlertCircle,
  CheckCircle2,
  History,
  Info,
} from 'lucide-react';

export const StudentApplicationPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [studentProfile, setStudentProfile] = useState<StudentProfileRow | null>(null);
  const [application, setApplication] = useState<InternshipApplicationRow | null>(null);
  const [reviews, setReviews] = useState<ApplicationReviewRow[]>([]);
  const [eligibility, setEligibility] = useState<EligibilityResult | null>(null);

  const [academicYear, setAcademicYear] = useState('2026/2027');
  const [preferredIndustry, setPreferredIndustry] = useState(
    'Banking & Financial Technology'
  );
  const [preferredHostOrganization, setPreferredHostOrganization] = useState('');
  const [preferenceReason, setPreferenceReason] = useState('');
  const [motivation, setMotivation] = useState('');
  const [relevantSkills, setRelevantSkills] = useState('');
  const [preferredStartDate, setPreferredStartDate] = useState('2026-12-01');
  const [preferredEndDate, setPreferredEndDate] = useState('2027-02-28');

  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);

    const { data: spData } = await supabase
      .from('student_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    const sp = (spData as StudentProfileRow) || null;
    setStudentProfile(sp);

    if (sp) {
      const { data: appRows } = await supabase
        .from('internship_applications')
        .select('*')
        .eq('student_id', sp.id)
        .order('created_at', { ascending: false })
        .limit(1);

      const currentApp = (appRows?.[0] as InternshipApplicationRow) || null;
      setApplication(currentApp);

      if (currentApp) {
        setAcademicYear(currentApp.academic_year);
        setPreferredIndustry(currentApp.preferred_industry || '');
        setPreferredHostOrganization(currentApp.preferred_host_organization || '');
        setPreferenceReason(currentApp.preference_reason || '');
        setMotivation(currentApp.motivation || '');
        setRelevantSkills(currentApp.relevant_skills || sp.skills || '');
        setPreferredStartDate(currentApp.preferred_start_date || '2026-12-01');
        setPreferredEndDate(currentApp.preferred_end_date || '2027-02-28');

        const [{ data: revRows }, { data: eligData }] = await Promise.all([
          supabase
            .from('application_reviews')
            .select('*')
            .eq('application_id', currentApp.id)
            .order('created_at', { ascending: false }),
          supabase.rpc('get_application_eligibility', {
            p_application_id: currentApp.id,
          }),
        ]);
        setReviews((revRows || []) as ApplicationReviewRow[]);
        setEligibility((eligData as EligibilityResult) || null);
      } else {
        setRelevantSkills(sp.skills || '');
        setReviews([]);
        setEligibility(null);
      }
    }

    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const canEdit =
    !application ||
    application.status === 'DRAFT' ||
    application.status === 'CORRECTION_REQUIRED';

  const handleSaveDraft = async (): Promise<string | null> => {
    setError(null);
    setSuccess(null);

    if (preferredHostOrganization.trim().length > 200) {
      setError('Preferred Host Organization must be 200 characters or fewer.');
      return null;
    }

    setSaving(true);
    const { data: appId, error: rpcErr } = await supabase.rpc('student_save_application', {
      p_application_id: application?.id || null,
      p_academic_year: academicYear.trim(),
      p_preferred_industry: preferredIndustry.trim(),
      p_preferred_organization_id: null,
      p_motivation: motivation.trim(),
      p_relevant_skills: relevantSkills.trim(),
      p_preferred_start_date: preferredStartDate || null,
      p_preferred_end_date: preferredEndDate || null,
      p_preferred_host_organization: preferredHostOrganization.trim() || null,
      p_preference_reason: preferenceReason.trim() || null,
    });

    setSaving(false);
    if (rpcErr) {
      setError(rpcErr.message);
      return null;
    }

    await loadData();
    setSuccess('Application draft saved to PostgreSQL.');
    return appId as string;
  };

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (preferredHostOrganization.trim().length > 200) {
      setError('Preferred Host Organization must be 200 characters or fewer.');
      return;
    }

    if (motivation.trim().length < 100) {
      setError(
        `Motivation statement must be at least 100 characters (currently ${motivation.trim().length}).`
      );
      return;
    }

    setSubmitting(true);
    const savedId = await handleSaveDraft();
    if (!savedId) {
      setSubmitting(false);
      return;
    }

    const { error: subErr } = await supabase.rpc('student_submit_application', {
      p_application_id: savedId,
    });
    setSubmitting(false);

    if (subErr) {
      setError(subErr.message);
      return;
    }

    await loadData();
    setSuccess(
      'Application submitted for coordinator eligibility review. You will be notified of the decision.'
    );
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  const latestCorrection = reviews.find((r) => r.to_status === 'CORRECTION_REQUIRED');

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Student Internship Journey"
        title="LEAP Internship Application"
        description="Draft, submit, and track your experiential learning placement application through coordinator eligibility review."
        actions={
          application ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">Current Status:</span>
              <StatusBadge status={application.status} />
            </div>
          ) : undefined
        }
      />

      {/* Coordinator Correction Banner */}
      {application?.status === 'CORRECTION_REQUIRED' && latestCorrection && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Coordinator Requested Corrections</p>
            <p>{latestCorrection.comment}</p>
            <p className="text-[11px] text-amber-700">
              Update the fields below and click &ldquo;Resubmit Corrected Application&rdquo; to
              resubmit for review.
            </p>
          </div>
        </div>
      )}

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Application Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-teal-600" />
              <span>Application Details ({academicYear})</span>
            </CardTitle>
          </CardHeader>

          <form onSubmit={handleSubmitApplication} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="app-year" className="block text-xs font-semibold text-slate-700">
                  Academic Year (YYYY/YYYY) *
                </label>
                <input
                  id="app-year"
                  type="text"
                  disabled={!canEdit}
                  required
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 disabled:bg-slate-100"
                />
              </div>

              <div>
                <label
                  htmlFor="app-industry"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Preferred Industry Sector *
                </label>
                <input
                  id="app-industry"
                  type="text"
                  disabled={!canEdit}
                  required
                  value={preferredIndustry}
                  onChange={(e) => setPreferredIndustry(e.target.value)}
                  placeholder="e.g. Banking & Financial Technology"
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 disabled:bg-slate-100"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="app-org" className="block text-xs font-semibold text-slate-700">
                  Preferred Host Organization
                </label>
                <span className="text-[11px] text-slate-500">
                  {preferredHostOrganization.length} / 200 chars
                </span>
              </div>
              <input
                id="app-org"
                type="text"
                maxLength={200}
                disabled={!canEdit}
                value={preferredHostOrganization}
                onChange={(e) => setPreferredHostOrganization(e.target.value)}
                placeholder="e.g. Orange Sierra Leone, Ministry of Health"
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 disabled:bg-slate-100"
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Enter any preferred organization name. The LEAP Coordinator reviews your preference
                and assigns the official placement.
              </p>
            </div>

            <div>
              <label
                htmlFor="app-pref-reason"
                className="block text-xs font-semibold text-slate-700"
              >
                Reason for Choosing This Organization (Optional)
              </label>
              <textarea
                id="app-pref-reason"
                rows={2}
                disabled={!canEdit}
                value={preferenceReason}
                onChange={(e) => setPreferenceReason(e.target.value)}
                placeholder="Explain why this organization aligns with your academic programme or career objectives..."
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 disabled:bg-slate-100"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="app-start" className="block text-xs font-semibold text-slate-700">
                  Preferred Start Date *
                </label>
                <input
                  id="app-start"
                  type="date"
                  disabled={!canEdit}
                  required
                  value={preferredStartDate}
                  onChange={(e) => setPreferredStartDate(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 disabled:bg-slate-100"
                />
              </div>

              <div>
                <label htmlFor="app-end" className="block text-xs font-semibold text-slate-700">
                  Preferred End Date *
                </label>
                <input
                  id="app-end"
                  type="date"
                  disabled={!canEdit}
                  required
                  value={preferredEndDate}
                  onChange={(e) => setPreferredEndDate(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 disabled:bg-slate-100"
                />
              </div>
            </div>

            <div>
              <label htmlFor="app-skills" className="block text-xs font-semibold text-slate-700">
                Relevant Academic & Technical Skills *
              </label>
              <textarea
                id="app-skills"
                rows={2}
                disabled={!canEdit}
                required
                value={relevantSkills}
                onChange={(e) => setRelevantSkills(e.target.value)}
                placeholder="Summarize relevant programming languages, design tools, coursework, or domain skills..."
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 disabled:bg-slate-100"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="app-motivation"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Statement of Motivation & Learning Objectives * (min 100 characters)
                </label>
                <span className="text-[11px] text-slate-500">
                  {motivation.trim().length} / 100+ chars
                </span>
              </div>
              <textarea
                id="app-motivation"
                rows={5}
                disabled={!canEdit}
                required
                value={motivation}
                onChange={(e) => setMotivation(e.target.value)}
                placeholder="Explain your career goals, why you selected this industry/host organization, and the specific competencies you aim to develop during the LEAP placement..."
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 disabled:bg-slate-100"
              />
            </div>

            {canEdit ? (
              <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  isLoading={saving}
                  onClick={handleSaveDraft}
                >
                  <Save className="mr-1.5 h-4 w-4" />
                  <span>Save Draft</span>
                </Button>
                <Button type="submit" variant="primary" size="md" isLoading={submitting}>
                  <Send className="mr-1.5 h-4 w-4" />
                  <span>
                    {application?.status === 'CORRECTION_REQUIRED'
                      ? 'Resubmit Corrected Application'
                      : 'Submit Application for Review'}
                  </span>
                </Button>
              </div>
            ) : (
              <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600 border border-slate-200 flex items-center gap-2">
                <Info className="h-4 w-4 text-slate-500 shrink-0" />
                <span>
                  This application is currently <strong>{application?.status}</strong> and locked
                  from editing.
                </span>
              </div>
            )}
          </form>
        </Card>

        {/* Right Column: Profile Readiness & Decision History */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold">Academic Eligibility Snapshot</CardTitle>
            </CardHeader>

            {studentProfile ? (
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Academic Standing</span>
                  <span className="font-bold text-slate-900">
                    Year {studentProfile.year_of_study} • Semester {studentProfile.semester ?? 8}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Cumulative GPA</span>
                  <span className="font-bold text-slate-900">{studentProfile.gpa ?? 'N/A'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Completed Credits</span>
                  <span className="font-bold text-slate-900">
                    {studentProfile.credits_completed}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Profile Readiness</span>
                  <span className="font-bold text-emerald-700">
                    {studentProfile.skills && studentProfile.emergency_contact && user?.phone
                      ? 'Complete'
                      : 'Incomplete'}
                  </span>
                </div>

                {eligibility && (
                  <div className="pt-2 border-t border-slate-100 space-y-1.5">
                    <p className="text-[11px] font-bold uppercase text-slate-500">
                      Rule Evaluation (Configurable)
                    </p>
                    {eligibility.checks.map((c) => (
                      <div key={c.rule} className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-600">
                          {c.rule} (&ge; {c.required})
                        </span>
                        <span
                          className={`font-bold ${
                            c.passed ? 'text-emerald-700' : 'text-rose-600'
                          }`}
                        >
                          {String(c.actual)} ({c.passed ? 'Pass' : 'Fail'})
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <Link to="/app/profile" className="block pt-2">
                  <Button variant="outline" size="sm" className="w-full">
                    Edit Profile Details
                  </Button>
                </Link>
              </div>
            ) : (
              <p className="text-xs text-slate-500">No student profile record found.</p>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-4 w-4 text-teal-700" />
                <span>Application Review Timeline</span>
              </CardTitle>
            </CardHeader>

            <ActivityTimeline
              items={reviews.map((rev) => ({
                id: rev.id,
                status: rev.to_status,
                body: rev.comment,
                timestamp: rev.created_at,
              }))}
              emptyMessage="No status transitions recorded yet."
            />
          </Card>
        </div>
      </div>
    </div>
  );
};
