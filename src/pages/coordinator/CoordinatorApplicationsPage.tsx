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
import { Card, CardTitle } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/ui/PageHeader';
import { DashboardSkeleton } from '../../components/ui/Skeleton';
import { ActivityTimeline } from '../../components/ui/ActivityTimeline';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatDate } from '../../lib/utils';
import {
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Play,
  RotateCcw,
  FileText,
  RefreshCw,
} from 'lucide-react';

interface EnrichedApplication extends InternshipApplicationRow {
  studentProfile?: StudentProfileRow;
  userProfile?: UserProfile;
  preferredOrgName?: string;
}

const FILTER_TABS: Array<{ value: string; label: string }> = [
  { value: 'ALL', label: 'All' },
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'UNDER_REVIEW', label: 'Under Review' },
  { value: 'CORRECTION_REQUIRED', label: 'Corrections' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
];

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
  const [confirmRejectOpen, setConfirmRejectOpen] = useState(false);
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
      setConfirmRejectOpen(false);
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
    setConfirmRejectOpen(false);

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

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="LEAP Coordination Office"
        title="Student Application Review & Eligibility"
        description="Verify academic eligibility against university policy thresholds and record audited approval, correction, or rejection decisions."
        actions={
          <Button variant="outline" size="sm" onClick={loadApplications}>
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh Queue</span>
          </Button>
        }
      />

      {/* Search & Status Tabs Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Filter applications by status"
          className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-100/90 p-1 border border-slate-200/80"
        >
          {FILTER_TABS.map((tab) => {
            const count =
              tab.value === 'ALL'
                ? applications.length
                : applications.filter((a) => a.status === tab.value).length;
            const active = statusFilter === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setStatusFilter(tab.value)}
                className={`px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all tabular-nums ${
                  active
                    ? 'bg-white text-[#002B49] shadow-subtle'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}{' '}
                <span className="text-[10px] font-mono text-slate-400 ml-0.5">{count}</span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full lg:w-72">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search student, ID, or host preference..."
            className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#002B49] focus:ring-2 focus:ring-[#002B49]/15"
          />
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800 flex items-start gap-2.5"
        >
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800 flex items-start gap-2.5">
          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Queue List */}
        <Card noPadding className="lg:col-span-4 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
            <CardTitle>Queue ({filteredApps.length})</CardTitle>
          </div>

          {filteredApps.length === 0 ? (
            <div className="p-5">
              <EmptyState
                icon={FileText}
                title="No Matching Applications"
                description="Try clearing your search query or switching status filters."
              />
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[680px] overflow-y-auto">
              {filteredApps.map((app) => {
                const active = app.id === selectedId;
                return (
                  <button
                    type="button"
                    key={app.id}
                    onClick={() => {
                      setSelectedId(app.id);
                      setError(null);
                      setSuccess(null);
                    }}
                    className={`w-full text-left px-4 py-3.5 text-xs transition-colors space-y-1.5 relative ${
                      active
                        ? 'bg-[#002B49]/[0.04] before:absolute before:left-0 before:inset-y-0 before:w-[3px] before:bg-[#002B49]'
                        : 'bg-white hover:bg-slate-50/80'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-900 truncate">
                        {app.userProfile?.full_name || 'Student'}
                      </span>
                      <StatusBadge status={app.status} />
                    </div>
                    <p className="text-[11px] text-slate-500 font-mono">
                      {app.studentProfile?.student_number} • {app.academic_year}
                    </p>
                    <p className="text-slate-600 truncate">
                      {app.preferred_host_organization ||
                        app.preferredOrgName ||
                        app.preferred_industry ||
                        'Open Preference'}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </Card>

        {/* Right Dossier Inspector & Decision Panel */}
        <Card className="lg:col-span-8">
          {!selectedApp ? (
            <EmptyState
              icon={FileText}
              title="Select an Application"
              description="Choose a student application from the queue on the left to inspect academic eligibility and record a review decision."
            />
          ) : (
            <div className="space-y-6 text-xs">
              {/* Student Dossier Header */}
              <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <p className="text-[11px] font-mono font-semibold text-teal-700">
                    {selectedApp.studentProfile?.student_number} • Academic Year{' '}
                    {selectedApp.academic_year}
                  </p>
                  <h3 className="text-lg font-bold text-[#002B49] mt-0.5">
                    {selectedApp.userProfile?.full_name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedApp.studentProfile?.programme} • {selectedApp.studentProfile?.faculty}
                  </p>
                </div>
                <StatusBadge status={selectedApp.status} />
              </div>

              {/* Automated Eligibility Strip */}
              {eligibility && (
                <div className="rounded-lg border border-slate-200 overflow-hidden">
                  <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      Automated Policy Eligibility Verification
                    </span>
                    <StatusBadge status={eligibility.eligible ? 'APPROVED' : 'REJECTED'} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-slate-200">
                    {eligibility.checks.map((c) => (
                      <div key={c.rule} className="bg-white px-4 py-3">
                        <p className="text-[11px] text-slate-500">{c.rule}</p>
                        <div className="flex items-baseline justify-between mt-1">
                          <span className="font-bold font-mono text-slate-900">
                            {String(c.actual)}
                          </span>
                          <span
                            className={`text-[11px] font-semibold ${
                              c.passed ? 'text-emerald-700' : 'text-rose-700'
                            }`}
                          >
                            Req ≥ {c.required} ({c.passed ? 'Pass' : 'Fail'})
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Structured Application Specification */}
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                <div className="pb-3 border-b border-slate-100">
                  <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Preferred Host Organization
                  </dt>
                  <dd className="font-semibold text-slate-900 mt-1">
                    {selectedApp.preferred_host_organization ||
                      selectedApp.preferredOrgName ||
                      'Any Partner Organization'}
                  </dd>
                  <dd className="text-[11px] text-slate-500 mt-0.5">
                    Industry: {selectedApp.preferred_industry || 'Not specified'}
                  </dd>
                </div>

                <div className="pb-3 border-b border-slate-100">
                  <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Preferred Schedule
                  </dt>
                  <dd className="font-mono font-semibold text-slate-900 mt-1">
                    {formatDate(selectedApp.preferred_start_date)} —{' '}
                    {formatDate(selectedApp.preferred_end_date)}
                  </dd>
                </div>

                {selectedApp.preference_reason && (
                  <div className="sm:col-span-2 pb-3 border-b border-slate-100">
                    <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Reason for Choosing Preferred Organization
                    </dt>
                    <dd className="text-slate-700 mt-1 whitespace-pre-line leading-relaxed">
                      {selectedApp.preference_reason}
                    </dd>
                  </div>
                )}

                <div className="sm:col-span-2 pb-3 border-b border-slate-100">
                  <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Relevant Skills
                  </dt>
                  <dd className="text-slate-700 mt-1 leading-relaxed">
                    {selectedApp.relevant_skills || 'Not specified'}
                  </dd>
                </div>

                <div className="sm:col-span-2">
                  <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Statement of Motivation
                  </dt>
                  <dd className="text-slate-700 mt-1 whitespace-pre-line leading-relaxed">
                    {selectedApp.motivation || 'Not specified'}
                  </dd>
                </div>
              </dl>

              {/* Coordinator Workflow Controls */}
              {selectedApp.status === 'SUBMITTED' && (
                <div className="rounded-lg border border-[#002B49]/20 border-l-[3px] border-l-[#002B49] bg-[#002B49]/[0.03] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="font-bold text-slate-900">Ready for Formal Review</p>
                    <p className="text-slate-600 mt-0.5">
                      Transition this application to UNDER_REVIEW to evaluate and record a decision.
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    isLoading={processing}
                    onClick={() => handleStartReview(selectedApp.id)}
                  >
                    <Play className="h-3.5 w-3.5" />
                    <span>Start Review</span>
                  </Button>
                </div>
              )}

              {selectedApp.status === 'UNDER_REVIEW' && (
                <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4 space-y-3">
                  <label
                    htmlFor="coord-decision-comment"
                    className="block font-bold text-slate-800"
                  >
                    Coordinator Decision Comment (Required for Corrections or Rejection)
                  </label>
                  <textarea
                    id="coord-decision-comment"
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Enter review notes, correction instructions, or approval remarks..."
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-[#002B49] focus:ring-2 focus:ring-[#002B49]/15"
                  />
                  <div className="flex flex-wrap items-center gap-2.5 pt-1">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      isLoading={processing}
                      onClick={() => handleDecision('APPROVED')}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Approve Application</span>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      isLoading={processing}
                      onClick={() => handleDecision('CORRECTION_REQUIRED')}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Request Corrections</span>
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      isLoading={processing}
                      onClick={() => setConfirmRejectOpen(true)}
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      <span>Reject Application</span>
                    </Button>
                  </div>
                </div>
              )}

              {/* Signature Application Review Timeline */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Application Review Timeline
                </p>
                <ActivityTimeline
                  items={reviews.map((r) => ({
                    id: r.id,
                    status: r.to_status,
                    body: r.comment,
                    timestamp: r.created_at,
                  }))}
                  emptyMessage="No decision history recorded yet."
                />
              </div>
            </div>
          )}
        </Card>
      </div>

      <ConfirmDialog
        open={confirmRejectOpen}
        title="Confirm Application Rejection"
        description={`Are you sure you want to reject ${
          selectedApp?.userProfile?.full_name || 'this student'
        }'s internship application? Make sure your review remarks clearly explain the reason.`}
        confirmLabel="Reject Application"
        variant="danger"
        isLoading={processing}
        onConfirm={() => handleDecision('REJECTED')}
        onCancel={() => setConfirmRejectOpen(false)}
      />
    </div>
  );
};
