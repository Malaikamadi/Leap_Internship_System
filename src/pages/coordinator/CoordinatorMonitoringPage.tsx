import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import {
  PlacementRow,
  ProgressReportRow,
  HostEvaluationRow,
  PlacementConcernRow,
  CompletionRecordRow,
  StudentProfileRow,
  HostOrganizationRow,
} from '../../types/database';
import { UserProfile } from '../../types/auth';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { formatDate, formatDateTime } from '../../lib/utils';
import {
  CheckSquare,
  AlertTriangle,
  Award,
  ClipboardList,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const CoordinatorMonitoringPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [placements, setPlacements] = useState<PlacementRow[]>([]);
  const [reports, setReports] = useState<ProgressReportRow[]>([]);
  const [evaluations, setEvaluations] = useState<HostEvaluationRow[]>([]);
  const [concerns, setConcerns] = useState<PlacementConcernRow[]>([]);
  const [completions, setCompletions] = useState<CompletionRecordRow[]>([]);
  const [students, setStudents] = useState<StudentProfileRow[]>([]);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [organizations, setOrganizations] = useState<HostOrganizationRow[]>([]);

  const [resolutionNotes, setResolutionNotes] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadMonitoringData = useCallback(async () => {
    setLoading(true);
    const [
      { data: plRows },
      { data: repRows },
      { data: evalRows },
      { data: concRows },
      { data: compRows },
      { data: spRows },
      { data: profRows },
      { data: orgRows },
    ] = await Promise.all([
      supabase.from('placements').select('*').order('created_at', { ascending: false }),
      supabase.from('progress_reports').select('*').order('created_at', { ascending: false }),
      supabase.from('host_evaluations').select('*').order('submitted_at', { ascending: false }),
      supabase.from('placement_concerns').select('*').order('created_at', { ascending: false }),
      supabase.from('completion_records').select('*').order('updated_at', { ascending: false }),
      supabase.from('student_profiles').select('*'),
      supabase.from('profiles').select('*'),
      supabase.from('host_organizations').select('*'),
    ]);

    setPlacements((plRows || []) as PlacementRow[]);
    setReports((repRows || []) as ProgressReportRow[]);
    setEvaluations((evalRows || []) as HostEvaluationRow[]);
    setConcerns((concRows || []) as PlacementConcernRow[]);
    setCompletions((compRows || []) as CompletionRecordRow[]);
    setStudents((spRows || []) as StudentProfileRow[]);
    setProfiles((profRows || []) as UserProfile[]);
    setOrganizations((orgRows || []) as HostOrganizationRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadMonitoringData();
  }, [loadMonitoringData]);

  const spById = Object.fromEntries(students.map((s) => [s.id, s]));
  const profById = Object.fromEntries(profiles.map((p) => [p.id, p]));
  const orgById = Object.fromEntries(organizations.map((o) => [o.id, o]));
  const plById = Object.fromEntries(placements.map((p) => [p.id, p]));

  const getStudentLabel = (studentId: string) => {
    const sp = spById[studentId];
    const up = sp ? profById[sp.user_id] : undefined;
    return `${up?.full_name || 'Student'} (${sp?.student_number || 'N/A'})`;
  };

  // Active placements with zero submitted/accepted reports
  const activePlacementsMissingReports = placements.filter(
    (p) =>
      p.status === 'ACTIVE' &&
      !reports.some(
        (r) => r.placement_id === p.id && r.status !== 'DRAFT'
      )
  );

  const handleResolveConcern = async (concernId: string) => {
    setError(null);
    setSuccess(null);
    const note = (resolutionNotes[concernId] || '').trim();
    if (note.length < 5) {
      setError('Enter a resolution note (at least 5 characters).');
      return;
    }

    setProcessing(true);
    const { error: rpcErr } = await supabase.rpc('coordinator_resolve_concern', {
      p_concern_id: concernId,
      p_note: note,
    });
    setProcessing(false);

    if (rpcErr) {
      setError(rpcErr.message);
      return;
    }

    await loadMonitoringData();
    setSuccess('Placement concern marked as RESOLVED.');
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-xs text-slate-500">
        Loading progress & completion monitoring...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="pb-3 border-b border-slate-200">
        <h2 className="text-xl font-bold text-[#002B49]">
          Progress Monitoring, Evaluations & Completion
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Track missing progress reports, review host evaluations, resolve workplace concerns, and
          inspect completion records
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

      {/* Missing Reports Tracker */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-amber-600" />
            <span>
              Active Placements Missing Submitted Reports ({activePlacementsMissingReports.length})
            </span>
          </CardTitle>
        </CardHeader>

        {activePlacementsMissingReports.length === 0 ? (
          <p className="text-xs text-emerald-700 font-medium">
            All active placements have submitted at least one progress report.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {activePlacementsMissingReports.map((pl) => (
              <div
                key={pl.id}
                className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 flex items-center justify-between"
              >
                <div>
                  <p className="font-bold text-slate-900">{getStudentLabel(pl.student_id)}</p>
                  <p className="text-slate-600">
                    {orgById[pl.organization_id]?.name} • Started {formatDate(pl.start_date)}
                  </p>
                </div>
                <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-800">
                  No Report Submitted
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Host Evaluations & Concerns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="h-4 w-4 text-teal-600" />
              <span>Submitted Host Evaluations ({evaluations.length})</span>
            </CardTitle>
          </CardHeader>

          {evaluations.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-500">
              No host organization evaluations submitted yet.
            </p>
          ) : (
            <div className="space-y-3 text-xs">
              {evaluations.map((ev) => {
                const pl = plById[ev.placement_id];
                const org = pl ? orgById[pl.organization_id] : undefined;
                return (
                  <div
                    key={ev.id}
                    className="rounded-xl border border-slate-200 p-3.5 space-y-2 bg-slate-50/50"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-900">
                          {pl ? getStudentLabel(pl.student_id) : 'Intern'}
                        </p>
                        <p className="text-[11px] text-teal-700">{org?.name}</p>
                      </div>
                      <span className="rounded-lg bg-[#002B49] px-2.5 py-1 text-xs font-bold text-white">
                        {ev.overall_rating} / 5.00
                      </span>
                    </div>
                    {ev.strengths && (
                      <p className="text-slate-700">
                        <strong>Strengths:</strong> {ev.strengths}
                      </p>
                    )}
                    <p className="text-[11px] text-slate-500">
                      Recommend for employment:{' '}
                      <strong>{ev.recommend_for_employment ? 'Yes' : 'No'}</strong> •{' '}
                      {formatDateTime(ev.submitted_at)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-600" />
              <span>Workplace Placement Concerns ({concerns.length})</span>
            </CardTitle>
          </CardHeader>

          {concerns.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-500">
              No placement concerns reported by host organizations.
            </p>
          ) : (
            <div className="space-y-3 text-xs">
              {concerns.map((c) => {
                const pl = plById[c.placement_id];
                return (
                  <div key={c.id} className="rounded-xl border border-slate-200 p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">
                        {pl ? getStudentLabel(pl.student_id) : 'Placement'}
                      </span>
                      <StatusBadge status={c.status} />
                    </div>
                    <p className="text-slate-700">{c.message}</p>
                    {c.status === 'OPEN' ? (
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="text"
                          placeholder="Enter resolution note..."
                          value={resolutionNotes[c.id] || ''}
                          onChange={(e) =>
                            setResolutionNotes({ ...resolutionNotes, [c.id]: e.target.value })
                          }
                          className="flex-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs"
                        />
                        <Button
                          variant="primary"
                          size="sm"
                          isLoading={processing}
                          onClick={() => handleResolveConcern(c.id)}
                        >
                          Resolve
                        </Button>
                      </div>
                    ) : (
                      <p className="text-emerald-700 text-[11px]">
                        <strong>Resolution:</strong> {c.resolution_note}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Completion Records Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-teal-600" />
            <span>Student Completion Records ({completions.length})</span>
          </CardTitle>
        </CardHeader>

        {completions.length === 0 ? (
          <p className="py-6 text-center text-xs text-slate-500">No completion records yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2.5">Student</th>
                  <th className="px-3 py-2.5">Accepted Reports</th>
                  <th className="px-3 py-2.5">Verified Hours</th>
                  <th className="px-3 py-2.5">Host Evaluation</th>
                  <th className="px-3 py-2.5">Final Score</th>
                  <th className="px-3 py-2.5">Completion Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {completions.map((cr) => (
                  <tr key={cr.id} className="hover:bg-slate-50">
                    <td className="px-3 py-3 font-bold text-slate-900">
                      {getStudentLabel(cr.student_id)}
                    </td>
                    <td className="px-3 py-3">{cr.accepted_reports}</td>
                    <td className="px-3 py-3">{cr.total_hours} hrs</td>
                    <td className="px-3 py-3">
                      {cr.host_evaluation_received ? 'Received' : 'Pending'}
                    </td>
                    <td className="px-3 py-3 font-bold">
                      {cr.final_score !== null ? `${cr.final_score}%` : 'Pending'}
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge status={cr.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

