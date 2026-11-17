import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import {
  ApplicationStatus,
  InternshipApplicationRow,
  StudentProfileRow,
  HostOrganizationRow,
  ApplicationReviewRow,
  EligibilityResult,
} from '../../types/database';
import { UserProfile } from '../../types/auth';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { formatDate, formatDateTime } from '../../lib/utils';
import {
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Play,
  RotateCcw,
} from 'lucide-react';

interface EnrichedApplication extends InternshipApplicationRow {
  studentProfile?: StudentProfileRow;
  userProfile?: UserProfile;
  preferredOrgName?: string;
}

export const CoordinatorApplicationsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<EnrichedApplication[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [eligibility, setEligibility] = useState<EligibilityResult | null>(null);
  const [reviews, setReviews] = useState<ApplicationReviewRow[]>([]);

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [comment, setComment] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadApplications = useCallback(async () => {
    setLoading(true);
    const [{ data: appRows }, { data: spRows }, { data: profRows }, { data: orgRows }] =
      await Promise.all([
        supabase
          .from('internship_applications')
          .select('*')
          .order('updated_at', { ascending: false }),
        supabase.from('student_profiles').select('*'),
        supabase.from('profiles').select('*'),
        supabase.from('host_organizations').select('*'),
      ]);

    const spMap = Object.fromEntries(
      ((spRows || []) as StudentProfileRow[]).map((s) => [s.id, s])
    );
    const profMap = Object.fromEntries(
      ((profRows || []) as UserProfile[]).map((p) => [p.id, p])
    );
    const orgMap = Object.fromEntries(
      ((orgRows || []) as HostOrganizationRow[]).map((o) => [o.id, o.name])
    );

    const list: EnrichedApplication[] = ((appRows || []) as InternshipApplicationRow[]).map(
      (a) => {
        const sp = spMap[a.student_id];
        const up = sp ? profMap[sp.user_id] : undefined;
        return {
          ...a,
          studentProfile: sp,
          userProfile: up,
          preferredOrgName: a.preferred_organization_id
            ? orgMap[a.preferred_organization_id]
            : undefined,
        };
      }
    );

    setApplications(list);
    if (!selectedId && list.length > 0) {
      setSelectedId(list[0].id);
    }
    setLoading(false);
  }, [selectedId]);

  const loadSelectedDetails = useCallback(async (appId: string | null) => {
    if (!appId) {
      setEligibility(null);
      setReviews([]);
      return;
    }
    const [{ data: eligData }, { data: revData }] = await Promise.all([
      supabase.rpc('get_application_eligibility', { p_application_id: appId }),
      supabase
        .from('application_reviews')
        .select('*')
        .eq('application_id', appId)
        .order('created_at', { ascending: false }),
    ]);
    setEligibility((eligData as EligibilityResult) || null);
    setReviews((revData as ApplicationReviewRow[]) || []);
  }, []);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  useEffect(() => {
    loadSelectedDetails(selectedId);
  }, [selectedId, loadSelectedDetails]);

  const selectedApp = applications.find((a) => a.id === selectedId) || null;

  const handleStartReview = async (appId: string) => {
    setError(null);
    setSuccess(null);
    setProcessing(true);

    const { error: rpcErr } = await supabase.rpc('coordinator_start_review', {
      p_application_id: appId,
    });
    setProcessing(false);

    if (rpcErr) {
      setError(rpcErr.message);
      return;
    }

    await loadApplications();
    await loadSelectedDetails(appId);
    setSuccess('Application moved to UNDER_REVIEW.');
  };

  const handleDecision = async (decision: ApplicationStatus) => {
    if (!selectedApp) return;
    setError(null);
    setSuccess(null);

    if (
      (decision === 'REJECTED' || decision === 'CORRECTION_REQUIRED') &&
      comment.trim().length < 5
    ) {
      setError(
        'Please enter a decision comment (minimum 5 characters) when requesting corrections or rejecting.'
      );
      return;
    }

    setProcessing(true);
    const { error: rpcErr } = await supabase.rpc('coordinator_decide_application', {
      p_application_id: selectedApp.id,
      p_decision: decision,
      p_comment: comment.trim() || 'Eligibility verified and approved by LEAP Coordinator.',
    });
    setProcessing(false);

    if (rpcErr) {
      setError(rpcErr.message);
      return;
    }

    setComment('');
    await loadApplications();
    await loadSelectedDetails(selectedApp.id);
    setSuccess(`Application decision recorded: ${decision}.`);
  };

  const filteredApps = applications.filter((a) => {
    if (statusFilter !== 'ALL' && a.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const name = a.userProfile?.full_name?.toLowerCase() || '';
      const num = a.studentProfile?.student_number?.toLowerCase() || '';
      const ind = a.preferred_industry?.toLowerCase() || '';
      const prefOrg = (a.preferred_host_organization || a.preferredOrgName || '').toLowerCase();
      return name.includes(q) || num.includes(q) || ind.includes(q) || prefOrg.includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-[#002B49]">
            Student Application Review & Eligibility
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Verify student academic eligibility and record approval, correction, or rejection
            decisions
          </p>
        </div>
      </div>

      {/* Search & Status Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by student name, ID number, or industry..."
            className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#002B49]"
          />
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="coord-app-status" className="text-xs font-medium text-slate-600">
            Status:
          </label>
          <select
            id="coord-app-status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800"
          >
            <option value="ALL">All Statuses ({applications.length})</option>
            <option value="SUBMITTED">SUBMITTED</option>
            <option value="UNDER_REVIEW">UNDER_REVIEW</option>
            <option value="CORRECTION_REQUIRED">CORRECTION_REQUIRED</option>
            <option value="APPROVED">APPROVED</option>
            <option value="REJECTED">REJECTED</option>
            <option value="DRAFT">DRAFT</option>
          </select>
        </div>
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

      {loading ? (
        <div className="py-12 text-center text-xs text-slate-500">
          Loading applications from PostgreSQL...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Queue */}
          <Card className="lg:col-span-5">
            <CardHeader>
              <CardTitle className="text-base">
                Applications ({filteredApps.length})
              </CardTitle>
            </CardHeader>

            {filteredApps.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-500">
                No applications match your filter.
              </p>
            ) : (
              <div className="space-y-2.5">
                {filteredApps.map((app) => {
                  const active = app.id === selectedId;
                  return (
                    <div
                      key={app.id}
                      onClick={() => {
                        setSelectedId(app.id);
                        setError(null);
                        setSuccess(null);
                      }}
                      className={`cursor-pointer rounded-xl border p-3.5 text-xs transition-all space-y-1.5 ${
                        active
                          ? 'border-[#002B49] bg-slate-50'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-slate-900">
                          {app.userProfile?.full_name || 'Student'}
                        </span>
                        <StatusBadge status={app.status} />
                      </div>
                      <p className="text-slate-500">
                        {app.studentProfile?.student_number} • {app.academic_year}
                      </p>
                      <p className="text-slate-600 truncate">
                        {app.preferred_host_organization ||
                          app.preferredOrgName ||
                          app.preferred_industry ||
                          'Open Preference'}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Right Inspector & Decision Actions */}
          <Card className="lg:col-span-7">
            {!selectedApp ? (
              <p className="py-12 text-center text-xs text-slate-500">
                Select an application from the queue to inspect and record a decision.
              </p>
            ) : (
              <div className="space-y-5 text-xs">
                <CardHeader>
                  <div>
                    <CardTitle className="text-base">
                      {selectedApp.userProfile?.full_name} (
                      {selectedApp.studentProfile?.student_number})
                    </CardTitle>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {selectedApp.studentProfile?.programme} •{' '}
                      {selectedApp.studentProfile?.faculty}
                    </p>
                  </div>
                  <StatusBadge status={selectedApp.status} />
                </CardHeader>

                {/* Eligibility Checks */}
                {eligibility && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                        Automated Eligibility Verification
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                          eligibility.eligible
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {eligibility.eligible ? 'ELIGIBLE' : 'NOT ELIGIBLE'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                      {eligibility.checks.map((c) => (
                        <div
                          key={c.rule}
                          className="rounded-lg bg-white p-2.5 border border-slate-200"
                        >
                          <p className="text-[11px] text-slate-500">{c.rule}</p>
                          <p className="font-bold text-slate-900 mt-0.5">
                            Actual: {String(c.actual)} (Req &ge; {c.required})
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Application Fields */}
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded-lg border border-slate-200 p-3">
                      <span className="text-slate-500">Preferred Host Organization</span>
                      <p className="font-semibold text-slate-900 mt-0.5">
                        {selectedApp.preferred_host_organization ||
                          selectedApp.preferredOrgName ||
                          'Any Partner Organization'}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Industry: {selectedApp.preferred_industry || 'Not specified'}
                      </p>
                    </div>
                    <div className="rounded-lg border border-slate-200 p-3">
                      <span className="text-slate-500">Preferred Period</span>
                      <p className="font-semibold text-slate-900 mt-0.5">
                        {formatDate(selectedApp.preferred_start_date)} to{' '}
                        {formatDate(selectedApp.preferred_end_date)}
                      </p>
                    </div>
                  </div>

                  {selectedApp.preference_reason && (
                    <div className="rounded-lg border border-slate-200 p-3 bg-slate-50/60">
                      <span className="font-semibold text-slate-700">
                        Reason for Choosing This Organization
                      </span>
                      <p className="text-slate-600 mt-1 whitespace-pre-line">
                        {selectedApp.preference_reason}
                      </p>
                    </div>
                  )}

                  <div className="rounded-lg border border-slate-200 p-3">
                    <span className="font-semibold text-slate-700">Relevant Skills</span>
                    <p className="text-slate-600 mt-1">
                      {selectedApp.relevant_skills || 'Not specified'}
                    </p>
                  </div>

                  <div className="rounded-lg border border-slate-200 p-3">
                    <span className="font-semibold text-slate-700">Motivation Statement</span>
                    <p className="text-slate-600 mt-1 whitespace-pre-line leading-relaxed">
                      {selectedApp.motivation || 'Not specified'}
                    </p>
                  </div>
                </div>

                {/* Coordinator Workflow Actions */}
                {selectedApp.status === 'SUBMITTED' && (
                  <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-bold text-slate-900">Ready for Coordinator Review</p>
                      <p className="text-slate-600 mt-0.5">
                        Start the formal review to transition this application to UNDER_REVIEW.
                      </p>
                    </div>
                    <Button
                      variant="primary"
                      size="md"
                      isLoading={processing}
                      onClick={() => handleStartReview(selectedApp.id)}
                    >
                      <Play className="mr-1.5 h-3.5 w-3.5" />
                      Start Review
                    </Button>
                  </div>
                )}

                {selectedApp.status === 'UNDER_REVIEW' && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                    <label
                      htmlFor="coord-decision-comment"
                      className="block font-bold text-slate-800"
                    >
                      Coordinator Decision Comment (Required for Corrections or Rejection)
                    </label>
                    <textarea
                      id="coord-decision-comment"
                      rows={2}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Enter review notes, correction instructions, or approval remarks..."
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900"
                    />
                    <div className="flex flex-wrap items-center gap-2.5">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        isLoading={processing}
                        onClick={() => handleDecision('APPROVED')}
                      >
                        <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                        Approve Application
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        isLoading={processing}
                        onClick={() => handleDecision('CORRECTION_REQUIRED')}
                      >
                        <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                        Request Corrections
                      </Button>
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        isLoading={processing}
                        onClick={() => handleDecision('REJECTED')}
                      >
                        <XCircle className="mr-1.5 h-3.5 w-3.5" />
                        Reject Application
                      </Button>
                    </div>
                  </div>
                )}

                {/* Decision History */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <p className="font-bold text-slate-800">Audit & Decision Trail</p>
                  {reviews.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-start justify-between rounded-lg border border-slate-200 p-2.5"
                    >
                      <div>
                        <StatusBadge status={r.to_status} />
                        {r.comment && <p className="text-slate-700 mt-1">{r.comment}</p>}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {formatDateTime(r.created_at)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};

