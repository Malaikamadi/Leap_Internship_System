import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  AcademicSupervisorRow,
  PlacementRow,
  ProgressReportRow,
  CompletionRecordRow,
  StudentProfileRow,
  HostOrganizationRow,
  ReportFeedbackRow,
} from '../../types/database';
import { UserProfile } from '../../types/auth';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/ui/PageHeader';
import { DashboardSkeleton } from '../../components/ui/Skeleton';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { ActivityTimeline } from '../../components/ui/ActivityTimeline';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatDate } from '../../lib/utils';
import {
  Users,
  ClipboardList,
  Award,
  RefreshCw,
  ArrowRight,
  MessageSquare,
} from 'lucide-react';

export const SupervisorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [supervisorRecord, setSupervisorRecord] = useState<AcademicSupervisorRow | null>(null);
  const [placements, setPlacements] = useState<PlacementRow[]>([]);
  const [reports, setReports] = useState<ProgressReportRow[]>([]);
  const [feedbackHistory, setFeedbackHistory] = useState<ReportFeedbackRow[]>([]);
  const [completions, setCompletions] = useState<CompletionRecordRow[]>([]);
  const [students, setStudents] = useState<StudentProfileRow[]>([]);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [organizations, setOrganizations] = useState<HostOrganizationRow[]>([]);

  const loadSupervisorDashboard = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);

    const [
      { data: supRow },
      { data: plRows },
      { data: repRows },
      { data: compRows },
      { data: spRows },
      { data: profRows },
      { data: orgRows },
      { data: fbRows },
    ] = await Promise.all([
      supabase.from('academic_supervisors').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('placements').select('*').order('created_at', { ascending: false }),
      supabase.from('progress_reports').select('*').order('submitted_at', { ascending: false }),
      supabase.from('completion_records').select('*'),
      supabase.from('student_profiles').select('*'),
      supabase.from('profiles').select('*'),
      supabase.from('host_organizations').select('*'),
      supabase
        .from('report_feedback')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(6),
    ]);

    setSupervisorRecord((supRow as AcademicSupervisorRow) || null);
    setPlacements((plRows || []) as PlacementRow[]);
    setReports((repRows || []) as ProgressReportRow[]);
    setCompletions((compRows || []) as CompletionRecordRow[]);
    setStudents((spRows || []) as StudentProfileRow[]);
    setProfiles((profRows || []) as UserProfile[]);
    setOrganizations((orgRows || []) as HostOrganizationRow[]);
    setFeedbackHistory((fbRows || []) as ReportFeedbackRow[]);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    loadSupervisorDashboard();
  }, [loadSupervisorDashboard]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  const spById = Object.fromEntries(students.map((s) => [s.id, s]));
  const profById = Object.fromEntries(profiles.map((p) => [p.id, p]));
  const orgById = Object.fromEntries(organizations.map((o) => [o.id, o]));
  const compByPlacement = Object.fromEntries(completions.map((c) => [c.placement_id, c]));

  const awaitingReview = reports.filter(
    (r) => r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW'
  );
  const assessmentTasks = placements.filter((p) => p.status === 'ACTIVE');
  const maxStudents = supervisorRecord?.max_students ?? 8;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={supervisorRecord?.faculty || 'Academic Supervision'}
        title="Academic Supervision Workspace"
        description={`${supervisorRecord?.title ? `${supervisorRecord.title} ` : ''}${
          user?.full_name
        } • ${supervisorRecord?.department || 'Faculty Department'} (${
          supervisorRecord?.staff_number || 'Staff'
        })`}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={loadSupervisorDashboard}>
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Refresh</span>
            </Button>
            <Link to="/app/supervisor/reports">
              <Button variant="primary" size="sm">
                Review Reports ({awaitingReview.length})
              </Button>
            </Link>
            <Link to="/app/supervisor/assessments">
              <Button variant="secondary" size="sm">
                Assessments ({assessmentTasks.length})
              </Button>
            </Link>
          </>
        }
      />

      {/* Focused Supervision Load & Tasks Summary Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-px bg-slate-200 border border-slate-200 rounded-lg overflow-hidden shadow-subtle">
        <div className="md:col-span-5 bg-white p-4 flex flex-col justify-center">
          <ProgressBar
            label="Supervision Allocation Capacity"
            value={placements.length}
            max={maxStudents}
            valueLabel={`${placements.length} / ${maxStudents} students`}
            tone="navy"
          />
          <p className="text-[11px] text-slate-500 mt-1.5">
            Active mentees under your academic supervision
          </p>
        </div>

        <div className="md:col-span-4 bg-white p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
              Reports Awaiting Review
            </p>
            <p className="text-2xl font-bold text-amber-900 mt-0.5 font-display tabular-nums">
              {awaitingReview.length}
            </p>
            <p className="text-[11px] text-slate-500">Submitted & under review</p>
          </div>
          <ClipboardList className="h-5 w-5 text-amber-600" />
        </div>

        <div className="md:col-span-3 bg-white p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-teal-700">
              Active Assessments
            </p>
            <p className="text-2xl font-bold text-[#002B49] mt-0.5 font-display tabular-nums">
              {assessmentTasks.length}
            </p>
            <p className="text-[11px] text-slate-500">Active placements</p>
          </div>
          <Award className="h-5 w-5 text-teal-700" />
        </div>
      </div>

      {/* Prominent Pending Report Review Queue (shown when reports await review) */}
      {awaitingReview.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-amber-200/70">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                Action Required
              </p>
              <h3 className="text-sm font-bold text-slate-900">
                Progress Reports Awaiting Your Review ({awaitingReview.length})
              </h3>
            </div>
            <Link to="/app/supervisor/reports">
              <Button variant="primary" size="sm">
                <span>Open Review Studio</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          <div className="mt-3 divide-y divide-amber-200/50">
            {awaitingReview.slice(0, 4).map((rep) => {
              const sp = spById[rep.student_id];
              const up = sp ? profById[sp.user_id] : undefined;
              return (
                <div
                  key={rep.id}
                  className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-slate-900">{up?.full_name || 'Student'}</span>
                    <span className="font-mono text-slate-500">Report #{rep.report_number}</span>
                    <StatusBadge status={rep.status} />
                  </div>
                  <div className="flex items-center gap-3 text-slate-600">
                    <span className="font-mono text-[11px]">
                      {formatDate(rep.period_start)} – {formatDate(rep.period_end)} (
                      {rep.hours_worked} hrs)
                    </span>
                    <Link
                      to="/app/supervisor/reports"
                      className="font-semibold text-[#002B49] hover:text-teal-700 underline"
                    >
                      Inspect
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main 12-Col Assigned Students Table & Feedback Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card noPadding className="lg:col-span-8 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <CardTitle>Assigned Mentee Roster ({placements.length})</CardTitle>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Track student report completions, logged hours, and assessment readiness
              </p>
            </div>
            <Link
              to="/app/supervisor/students"
              className="text-xs font-semibold text-teal-700 hover:text-[#002B49] hover:underline"
            >
              Detailed Roster
            </Link>
          </div>

          {placements.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={Users}
                title="No Students Currently Assigned"
                description="Once the LEAP Coordinator allocates interns to you, their placement and progress records will appear here."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2.5">Student</th>
                    <th className="px-4 py-2.5">Host Organization</th>
                    <th className="px-4 py-2.5">Progress</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {placements.map((pl) => {
                    const sp = spById[pl.student_id];
                    const up = sp ? profById[sp.user_id] : undefined;
                    const org = orgById[pl.organization_id];
                    const comp = compByPlacement[pl.id];
                    return (
                      <tr key={pl.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-900">{up?.full_name || 'Student'}</p>
                          <p className="text-[11px] text-slate-500">
                            <span className="font-mono">{sp?.student_number}</span> • {sp?.programme}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-800">{org?.name || 'Host Org'}</p>
                          <p className="text-[11px] font-mono text-slate-400">
                            {formatDate(pl.start_date)} – {formatDate(pl.end_date)}
                          </p>
                        </td>
                        <td className="px-4 py-3 tabular-nums">
                          <p className="font-semibold text-slate-900">
                            {comp?.accepted_reports ?? 0} accepted
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {comp?.total_hours ?? 0} verified hrs
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={pl.status} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <Link to="/app/supervisor/reports">
                              <Button variant="outline" size="sm">
                                Reports
                              </Button>
                            </Link>
                            <Link to="/app/supervisor/assessments">
                              <Button variant="primary" size="sm">
                                Assess
                              </Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-teal-700" />
              <span>Feedback History</span>
            </CardTitle>
          </CardHeader>

          <ActivityTimeline
            items={feedbackHistory.map((fb) => ({
              id: fb.id,
              status: fb.decision,
              body: fb.comments,
              timestamp: fb.created_at,
            }))}
            emptyMessage="No report feedback submitted yet."
          />
        </Card>
      </div>
    </div>
  );
};
