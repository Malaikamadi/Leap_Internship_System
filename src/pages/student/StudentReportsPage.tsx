import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  PlacementRow,
  ProgressReportRow,
  ReportFeedbackRow,
} from '../../types/database';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { formatDate, formatDateTime } from '../../lib/utils';
import {
  ClipboardList,
  Plus,
  Save,
  Send,
  AlertCircle,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export const StudentReportsPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [placement, setPlacement] = useState<PlacementRow | null>(null);
  const [reports, setReports] = useState<ProgressReportRow[]>([]);
  const [feedbackByReport, setFeedbackByReport] = useState<Record<string, ReportFeedbackRow[]>>(
    {}
  );

  // Selected or new report editor state
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [periodStart, setPeriodStart] = useState('2026-12-01');
  const [periodEnd, setPeriodEnd] = useState('2026-12-14');
  const [hoursWorked, setHoursWorked] = useState<number>(80);
  const [activities, setActivities] = useState('');
  const [learningOutcomes, setLearningOutcomes] = useState('');
  const [challenges, setChallenges] = useState('');
  const [nextSteps, setNextSteps] = useState('');

  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadReports = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);

    const { data: sp } = await supabase
      .from('student_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!sp) {
      setLoading(false);
      return;
    }

    const [{ data: plRows }, { data: repRows }] = await Promise.all([
      supabase
        .from('placements')
        .select('*')
        .eq('student_id', sp.id)
        .order('created_at', { ascending: false })
        .limit(1),
      supabase
        .from('progress_reports')
        .select('*')
        .eq('student_id', sp.id)
        .order('report_number', { ascending: true }),
    ]);

    const pl = (plRows?.[0] as PlacementRow) || null;
    const repList = (repRows || []) as ProgressReportRow[];
    setPlacement(pl);
    setReports(repList);

    if (pl) {
      setPeriodStart(pl.start_date);
    }

    if (repList.length > 0) {
      const ids = repList.map((r) => r.id);
      const { data: fbRows } = await supabase
        .from('report_feedback')
        .select('*')
        .in('report_id', ids)
        .order('created_at', { ascending: false });

      const grouped: Record<string, ReportFeedbackRow[]> = {};
      for (const fb of (fbRows || []) as ReportFeedbackRow[]) {
        grouped[fb.report_id] = grouped[fb.report_id] || [];
        grouped[fb.report_id].push(fb);
      }
      setFeedbackByReport(grouped);
    } else {
      setFeedbackByReport({});
    }

    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const selectedReport = reports.find((r) => r.id === selectedReportId) || null;
  const isActivePlacement = placement?.status === 'ACTIVE';
  const canEditSelected =
    isActivePlacement &&
    (!selectedReport ||
      selectedReport.status === 'DRAFT' ||
      selectedReport.status === 'CORRECTION_REQUIRED');

  const handleSelectReport = (rep: ProgressReportRow) => {
    setError(null);
    setSuccess(null);
    setSelectedReportId(rep.id);
    setPeriodStart(rep.period_start);
    setPeriodEnd(rep.period_end);
    setHoursWorked(rep.hours_worked);
    setActivities(rep.activities);
    setLearningOutcomes(rep.learning_outcomes);
    setChallenges(rep.challenges || '');
    setNextSteps(rep.next_steps || '');
  };

  const handleNewReport = () => {
    setError(null);
    setSuccess(null);
    setSelectedReportId(null);
    setPeriodStart(placement?.start_date || '2026-12-01');
    setPeriodEnd('2026-12-14');
    setHoursWorked(80);
    setActivities('');
    setLearningOutcomes('');
    setChallenges('');
    setNextSteps('');
  };

  const handleSaveDraft = async (): Promise<string | null> => {
    setError(null);
    setSuccess(null);
    setSaving(true);

    const { data: repId, error: rpcErr } = await supabase.rpc('student_save_report', {
      p_report_id: selectedReportId,
      p_period_start: periodStart,
      p_period_end: periodEnd,
      p_hours_worked: Number(hoursWorked),
      p_activities: activities.trim(),
      p_learning_outcomes: learningOutcomes.trim(),
      p_challenges: challenges.trim(),
      p_next_steps: nextSteps.trim(),
    });

    setSaving(false);
    if (rpcErr) {
      setError(rpcErr.message);
      return null;
    }

    const id = repId as string;
    setSelectedReportId(id);
    await loadReports();
    setSuccess('Progress report draft saved to PostgreSQL.');
    return id;
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (activities.trim().length < 50) {
      setError(
        `Activities description must be at least 50 characters (currently ${activities.trim().length}).`
      );
      return;
    }
    if (learningOutcomes.trim().length < 30) {
      setError(
        `Learning outcomes must be at least 30 characters (currently ${learningOutcomes.trim().length}).`
      );
      return;
    }
    if (Number(hoursWorked) <= 0) {
      setError('Hours worked must be greater than zero.');
      return;
    }

    setSubmitting(true);
    const savedId = await handleSaveDraft();
    if (!savedId) {
      setSubmitting(false);
      return;
    }

    const { error: subErr } = await supabase.rpc('student_submit_report', {
      p_report_id: savedId,
    });
    setSubmitting(false);

    if (subErr) {
      setError(subErr.message);
      return;
    }

    await loadReports();
    setSuccess('Progress report submitted to your Academic Supervisor for review.');
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-xs text-slate-500">
        Loading progress reports...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-[#002B49]">Progress Reports & Logbooks</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Submit structured progress reports for your active placement and review supervisor
            feedback
          </p>
        </div>
        {isActivePlacement && (
          <Button variant="outline" size="sm" onClick={handleNewReport}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            New Progress Report
          </Button>
        )}
      </div>

      {!isActivePlacement && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 flex items-center gap-2.5">
          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
          <span>
            Progress reporting requires an <strong>ACTIVE</strong> placement. Current placement
            status: <strong>{placement?.status || 'NONE'}</strong>.
          </span>
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Submitted / Draft Reports List */}
        <Card className="lg:col-span-5">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-teal-600" />
              <span>Your Reports ({reports.length})</span>
            </CardTitle>
          </CardHeader>

          {reports.length === 0 ? (
            <p className="py-8 text-center text-xs text-slate-500">
              No progress reports created yet.
            </p>
          ) : (
            <div className="space-y-3">
              {reports.map((rep) => {
                const fbs = feedbackByReport[rep.id] || [];
                const isSelected = rep.id === selectedReportId;
                return (
                  <div
                    key={rep.id}
                    onClick={() => handleSelectReport(rep)}
                    className={`cursor-pointer rounded-xl border p-3.5 transition-all text-xs space-y-2 ${
                      isSelected
                        ? 'border-[#002B49] bg-slate-50'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">
                        Report #{rep.report_number} (v{rep.version})
                      </span>
                      <StatusBadge status={rep.status} />
                    </div>
                    <p className="text-slate-500">
                      Period: {formatDate(rep.period_start)} — {formatDate(rep.period_end)} •{' '}
                      <strong>{rep.hours_worked} hrs</strong>
                    </p>
                    <p className="text-slate-700 line-clamp-2">{rep.activities}</p>

                    {fbs.length > 0 && (
                      <div className="rounded-lg bg-slate-100 p-2.5 border border-slate-200 space-y-1">
                        <p className="font-bold text-slate-800">
                          Supervisor Feedback ({formatDateTime(fbs[0].created_at)}):
                        </p>
                        <p className="text-slate-700">{fbs[0].comments}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Right: Report Editor / Viewer */}
        <Card className="lg:col-span-7">
          <CardHeader>
            <CardTitle className="text-base">
              {selectedReport
                ? `Report #${selectedReport.report_number} (${selectedReport.status})`
                : 'Create New Progress Report'}
            </CardTitle>
            {selectedReport && <StatusBadge status={selectedReport.status} />}
          </CardHeader>

          <form onSubmit={handleSubmitReport} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="rep-start" className="block text-xs font-semibold text-slate-700">
                  Period Start *
                </label>
                <input
                  id="rep-start"
                  type="date"
                  required
                  disabled={!canEditSelected}
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 disabled:bg-slate-100"
                />
              </div>

              <div>
                <label htmlFor="rep-end" className="block text-xs font-semibold text-slate-700">
                  Period End *
                </label>
                <input
                  id="rep-end"
                  type="date"
                  required
                  disabled={!canEditSelected}
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 disabled:bg-slate-100"
                />
              </div>

              <div>
                <label htmlFor="rep-hours" className="block text-xs font-semibold text-slate-700">
                  Hours Worked (1–200) *
                </label>
                <input
                  id="rep-hours"
                  type="number"
                  min={1}
                  max={200}
                  required
                  disabled={!canEditSelected}
                  value={hoursWorked}
                  onChange={(e) => setHoursWorked(Number(e.target.value))}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 disabled:bg-slate-100"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="rep-activities"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Tasks & Activities Completed * (min 50 characters)
                </label>
                <span className="text-[11px] text-slate-500">
                  {activities.trim().length} / 50+ chars
                </span>
              </div>
              <textarea
                id="rep-activities"
                rows={4}
                required
                disabled={!canEditSelected}
                value={activities}
                onChange={(e) => setActivities(e.target.value)}
                placeholder="Describe the engineering, analytical, or operational tasks you performed during this reporting period..."
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 disabled:bg-slate-100"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label
                  htmlFor="rep-outcomes"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Skills & Learning Outcomes * (min 30 characters)
                </label>
                <span className="text-[11px] text-slate-500">
                  {learningOutcomes.trim().length} / 30+ chars
                </span>
              </div>
              <textarea
                id="rep-outcomes"
                rows={3}
                required
                disabled={!canEditSelected}
                value={learningOutcomes}
                onChange={(e) => setLearningOutcomes(e.target.value)}
                placeholder="Document technical competencies, professional practices, and tools mastered..."
                className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 disabled:bg-slate-100"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="rep-challenges"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Challenges Encountered
                </label>
                <textarea
                  id="rep-challenges"
                  rows={2}
                  disabled={!canEditSelected}
                  value={challenges}
                  onChange={(e) => setChallenges(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 disabled:bg-slate-100"
                />
              </div>

              <div>
                <label htmlFor="rep-next" className="block text-xs font-semibold text-slate-700">
                  Plan for Next Period
                </label>
                <textarea
                  id="rep-next"
                  rows={2}
                  disabled={!canEditSelected}
                  value={nextSteps}
                  onChange={(e) => setNextSteps(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-xs text-slate-900 disabled:bg-slate-100"
                />
              </div>
            </div>

            {canEditSelected ? (
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
                    {selectedReport?.status === 'CORRECTION_REQUIRED'
                      ? 'Resubmit Corrected Report'
                      : 'Submit Report to Supervisor'}
                  </span>
                </Button>
              </div>
            ) : (
              selectedReport && (
                <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600 border border-slate-200 flex items-center gap-2">
                  <Lock className="h-4 w-4 text-slate-500 shrink-0" />
                  <span>
                    {selectedReport.status === 'ACCEPTED'
                      ? 'This report has been accepted by your supervisor and is permanently locked.'
                      : 'This report is currently under supervisor review.'}
                  </span>
                </div>
              )
            )}
          </form>
        </Card>
      </div>
    </div>
  );
};
