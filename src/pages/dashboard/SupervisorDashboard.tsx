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
} from '../../types/database';
import { UserProfile } from '../../types/auth';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { formatDate } from '../../lib/utils';
import {
  Users,
  ClipboardList,
  Award,
  Building2,
  RefreshCw,
} from 'lucide-react';

export const SupervisorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [supervisorRecord, setSupervisorRecord] = useState<AcademicSupervisorRow | null>(null);
  const [placements, setPlacements] = useState<PlacementRow[]>([]);
  const [reports, setReports] = useState<ProgressReportRow[]>([]);
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
    ] = await Promise.all([
      supabase.from('academic_supervisors').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('placements').select('*').order('created_at', { ascending: false }),
      supabase.from('progress_reports').select('*').order('submitted_at', { ascending: false }),
      supabase.from('completion_records').select('*'),
      supabase.from('student_profiles').select('*'),
      supabase.from('profiles').select('*'),
      supabase.from('host_organizations').select('*'),
    ]);

    setSupervisorRecord((supRow as AcademicSupervisorRow) || null);
    setPlacements((plRows || []) as PlacementRow[]);
    setReports((repRows || []) as ProgressReportRow[]);
    setCompletions((compRows || []) as CompletionRecordRow[]);
    setStudents((spRows || []) as StudentProfileRow[]);
    setProfiles((profRows || []) as UserProfile[]);
    setOrganizations((orgRows || []) as HostOrganizationRow[]);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    loadSupervisorDashboard();
  }, [loadSupervisorDashboard]);

  if (loading) {
    return (
      <div className="py-12 text-center text-xs text-slate-500">
        Loading academic supervisor dashboard from PostgreSQL...
      </div>
    );
  }

  const spById = Object.fromEntries(students.map((s) => [s.id, s]));
  const profById = Object.fromEntries(profiles.map((p) => [p.id, p]));
  const orgById = Object.fromEntries(organizations.map((o) => [o.id, o]));
  const compByPlacement = Object.fromEntries(completions.map((c) => [c.placement_id, c]));

  const awaitingReview = reports.filter(
    (r) => r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW'
  );
  const assessmentTasks = placements.filter((p) => p.status === 'ACTIVE');

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-[#002B49]">Academic Supervisor Dashboard</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {supervisorRecord?.title ? `${supervisorRecord.title} ` : ''}
            {user?.full_name} • {supervisorRecord?.department} ({supervisorRecord?.faculty})
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadSupervisorDashboard}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Refresh
          </Button>
          <Link to="/app/supervisor/reports">
            <Button variant="primary" size="sm">
              Review Reports ({awaitingReview.length})
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center justify-between border-l-4 border-l-teal-600">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Assigned Students</p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {placements.length}{' '}
              <span className="text-xs font-normal text-slate-400">
                / {supervisorRecord?.max_students ?? 8} Max
              </span>
            </p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
            <Users className="h-5 w-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between border-l-4 border-l-amber-500">
          <div>
            <p className="text-xs font-semibold text-amber-700 uppercase">
              Reports Awaiting Review
            </p>
            <p className="text-2xl font-black text-amber-900 mt-1">{awaitingReview.length}</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
            <ClipboardList className="h-5 w-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between border-l-4 border-l-indigo-600">
          <div>
            <p className="text-xs font-semibold text-indigo-700 uppercase">
              Active Assessment Tasks
            </p>
            <p className="text-2xl font-black text-indigo-900 mt-1">{assessmentTasks.length}</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Award className="h-5 w-5" />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Assigned Student Progress Summaries</CardTitle>
            <Link
              to="/app/supervisor/students"
              className="text-xs font-semibold text-teal-700 hover:underline"
            >
              View All
            </Link>
          </CardHeader>

          {placements.length === 0 ? (
            <p className="py-8 text-center text-xs text-slate-500">
              No students are currently assigned to you.
            </p>
          ) : (
            <div className="space-y-3 text-xs">
              {placements.map((pl) => {
                const sp = spById[pl.student_id];
                const up = sp ? profById[sp.user_id] : undefined;
                const org = orgById[pl.organization_id];
                const comp = compByPlacement[pl.id];
                return (
                  <div
                    key={pl.id}
                    className="rounded-xl border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">
                          {up?.full_name || 'Student'}
                        </span>
                        <span className="text-slate-400">({sp?.student_number})</span>
                        <StatusBadge status={pl.status} />
                      </div>
                      <p className="text-slate-600">{sp?.programme}</p>
                      <div className="flex items-center gap-2 text-slate-700">
                        <Building2 className="h-3.5 w-3.5 text-slate-400" />
                        <span>
                          Host: <strong>{org?.name}</strong> • Accepted Reports:{' '}
                          <strong>{comp?.accepted_reports ?? 0}</strong> ({comp?.total_hours ?? 0}{' '}
                          hrs)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
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
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recently Submitted Reports</CardTitle>
          </CardHeader>

          {reports.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-500">
              No progress reports submitted by assigned students yet.
            </p>
          ) : (
            <div className="space-y-3 text-xs">
              {reports.slice(0, 6).map((rep) => {
                const sp = spById[rep.student_id];
                const up = sp ? profById[sp.user_id] : undefined;
                return (
                  <div
                    key={rep.id}
                    className="rounded-lg border border-slate-200 p-3 space-y-1 bg-slate-50/50"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">
                        {up?.full_name} — Report #{rep.report_number}
                      </span>
                      <StatusBadge status={rep.status} />
                    </div>
                    <p className="text-slate-500">
                      {formatDate(rep.period_start)} to {formatDate(rep.period_end)} (
                      {rep.hours_worked} hrs)
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
