import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import {
  ProgressReportRow,
  ReportFeedbackRow,
  ReportStatus,
  StudentProfileRow,
} from '../../types/database';
import { UserProfile } from '../../types/auth';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { formatDate, formatDateTime } from '../../lib/utils';
import {
  ClipboardList,
  CheckCircle2,
  RotateCcw,
  AlertCircle,
  Play,
} from 'lucide-react';

export const SupervisorReportsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<ProgressReportRow[]>([]);
  const [students, setStudents] = useState<StudentProfileRow[]>([]);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [feedback, setFeedback] = useState<ReportFeedbackRow[]>([]);

  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [comments, setComments] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadReports = useCallback(async () => {
    setLoading(true);
    const [{ data: repRows }, { data: spRows }, { data: profRows }, { data: fbRows }] =
      await Promise.all([
        supabase
          .from('progress_reports')
          .select('*')
          .order('updated_at', { ascending: false }),
        supabase.from('student_profiles').select('*'),
        supabase.from('profiles').select('*'),
        supabase
          .from('report_feedback')
          .select('*')
          .order('created_at', { ascending: false }),
      ]);

    const repList = (repRows || []) as ProgressReportRow[];
    setReports(repList);
    setStudents((spRows || []) as StudentProfileRow[]);
    setProfiles((profRows || []) as UserProfile[]);
    setFeedback((fbRows || []) as ReportFeedbackRow[]);

    if (!selectedReportId && repList.length > 0) {
      setSelectedReportId(repList[0].id);
    }
    setLoading(false);
  }, [selectedReportId]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const spById = Object.fromEntries(students.map((s) => [s.id, s]));
  const profById = Object.fromEntries(profiles.map((p) => [p.id, p]));

  const filteredReports = reports.filter((r) =>
    statusFilter === 'ALL' ? true : r.status === statusFilter
  );

  const selectedReport = reports.find((r) => r.id === selectedReportId) || null;
  const selectedFeedback = feedback.filter((f) => f.report_id === selectedReportId);

  const handleStartReview = async (reportId: string) => {
    setError(null);
    setSuccess(null);
    setProcessing(true);

    const { error: rpcErr } = await supabase.rpc('supervisor_start_report_review', {
      p_report_id: reportId,
    });
    setProcessing(false);

    if (rpcErr) {
      setError(rpcErr.message);
      return;
    }

    await loadReports();
    setSuccess('Report moved to UNDER_REVIEW.');
  };

  const handleReviewDecision = async (decision: ReportStatus) => {
    if (!selectedReport) return;
    setError(null);
    setSuccess(null);

    if (comments.trim().length < 5) {
      setError('Feedback comments must be at least 5 characters.');
      return;
    }

    setProcessing(true);
    const { error: rpcErr } = await supabase.rpc('supervisor_review_report', {
      p_report_id: selectedReport.id,
      p_decision: decision,
      p_comments: comments.trim(),
    });
    setProcessing(false);

    if (rpcErr) {
      setError(rpcErr.message);
      return;
    }

    setComments('');
    await loadReports();
    setSuccess(`Report #${selectedReport.report_number} marked ${decision}.`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-[#002B49]">
            Progress Report Review & Feedback
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Review submitted student logbooks, provide constructive academic feedback, or accept
            reports toward completion
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="sup-rep-filter" className="text-xs font-medium text-slate-600">
            Status:
          </label>
          <select
            id="sup-rep-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800"
          >
            <option value="ALL">All ({reports.length})</option>
            <option value="SUBMITTED">SUBMITTED</option>
            <option value="UNDER_REVIEW">UNDER_REVIEW</option>
            <option value="CORRECTION_REQUIRED">CORRECTION_REQUIRED</option>
            <option value="ACCEPTED">ACCEPTED</option>
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
        <div className="py-12 text-center text-xs text-slate-500">Loading reports...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Reports List */}
          <Card className="lg:col-span-5">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-teal-600" />
                <span>Student Reports ({filteredReports.length})</span>
              </CardTitle>
            </CardHeader>

            {filteredReports.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-500">
                No reports match your filter.
              </p>
            ) : (
              <div className="space-y-2.5">
                {filteredReports.map((rep) => {
                  const sp = spById[rep.student_id];
                  const up = sp ? profById[sp.user_id] : undefined;
                  const active = rep.id === selectedReportId;
                  return (
                    <div
                      key={rep.id}
                      onClick={() => {
                        setSelectedReportId(rep.id);
                        setError(null);
                        setSuccess(null);
                      }}
                      className={`cursor-pointer rounded-xl border p-3.5 text-xs space-y-1.5 transition-all ${
                        active
                          ? 'border-[#002B49] bg-slate-50'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">
                          {up?.full_name || 'Student'} — Report #{rep.report_number}
                        </span>
                        <StatusBadge status={rep.status} />
                      </div>
                      <p className="text-slate-500">
                        {formatDate(rep.period_start)} to {formatDate(rep.period_end)} •{' '}
                        <strong>{rep.hours_worked} hrs</strong> (v{rep.version})
                      </p>
                      <p className="text-slate-600 line-clamp-2">{rep.activities}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Report Inspector & Feedback Form */}
          <Card className="lg:col-span-7">
            {!selectedReport ? (
              <p className="py-12 text-center text-xs text-slate-500">
                Select a progress report to inspect and review.
              </p>
            ) : (
              <div className="space-y-4 text-xs">
                <CardHeader>
                  <div>
                    <CardTitle className="text-base">
                      Report #{selectedReport.report_number} —{' '}
                      {
                        profById[spById[selectedReport.student_id]?.user_id || '']
                          ?.full_name
                      }
                    </CardTitle>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Period: {formatDate(selectedReport.period_start)} to{' '}
                      {formatDate(selectedReport.period_end)} • Hours Worked:{' '}
                      <strong>{selectedReport.hours_worked}</strong> • Version:{' '}
                      {selectedReport.version}
                    </p>
                  </div>
                  <StatusBadge status={selectedReport.status} />
                </CardHeader>

                <div className="space-y-3">
                  <div className="rounded-lg border border-slate-200 p-3">
                    <span className="font-bold text-slate-800">Activities Completed</span>
                    <p className="text-slate-700 mt-1 whitespace-pre-line">
                      {selectedReport.activities}
                    </p>
                  </div>

                  <div className="rounded-lg border border-slate-200 p-3">
                    <span className="font-bold text-slate-800">Skills & Learning Outcomes</span>
                    <p className="text-slate-700 mt-1 whitespace-pre-line">
                      {selectedReport.learning_outcomes}
                    </p>
                  </div>

                  {selectedReport.challenges && (
                    <div className="rounded-lg border border-slate-200 p-3">
                      <span className="font-bold text-slate-800">Challenges</span>
                      <p className="text-slate-700 mt-1">{selectedReport.challenges}</p>
                    </div>
                  )}

                  {selectedReport.next_steps && (
                    <div className="rounded-lg border border-slate-200 p-3">
                      <span className="font-bold text-slate-800">Next Period Plan</span>
                      <p className="text-slate-700 mt-1">{selectedReport.next_steps}</p>
                    </div>
                  )}
                </div>

                {/* Review Actions */}
                {(selectedReport.status === 'SUBMITTED' ||
                  selectedReport.status === 'UNDER_REVIEW') && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                    {selectedReport.status === 'SUBMITTED' && (
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                        <span className="text-slate-600">
                          Optionally mark report as UNDER_REVIEW or submit your decision directly:
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          isLoading={processing}
                          onClick={() => handleStartReview(selectedReport.id)}
                        >
                          <Play className="mr-1 h-3.5 w-3.5" />
                          Mark Under Review
                        </Button>
                      </div>
                    )}

                    <div>
                      <label
                        htmlFor="sup-feedback-comments"
                        className="block font-bold text-slate-800"
                      >
                        Supervisor Feedback Comments * (min 5 characters)
                      </label>
                      <textarea
                        id="sup-feedback-comments"
                        rows={3}
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                        placeholder="Provide constructive academic feedback or specify required revisions..."
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        isLoading={processing}
                        onClick={() => handleReviewDecision('ACCEPTED')}
                      >
                        <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                        Accept Report
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        isLoading={processing}
                        onClick={() => handleReviewDecision('CORRECTION_REQUIRED')}
                      >
                        <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                        Request Corrections
                      </Button>
                    </div>
                  </div>
                )}

                {/* Previous Feedback History */}
                {selectedFeedback.length > 0 && (
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <p className="font-bold text-slate-800">Recorded Feedback History</p>
                    {selectedFeedback.map((fb) => (
                      <div
                        key={fb.id}
                        className="rounded-lg border border-slate-200 p-3 space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <StatusBadge status={fb.decision} />
                          <span className="text-[10px] text-slate-400">
                            {formatDateTime(fb.created_at)}
                          </span>
                        </div>
                        <p className="text-slate-700">{fb.comments}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};
