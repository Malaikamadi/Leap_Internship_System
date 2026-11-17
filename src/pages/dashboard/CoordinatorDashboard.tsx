import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  CoordinatorSummary,
  InternshipApplicationRow,
  ApplicationReviewRow,
  StudentProfileRow,
} from '../../types/database';
import { UserProfile } from '../../types/auth';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { formatDateTime } from '../../lib/utils';
import {
  FileText,
  Building2,
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  ClipboardList,
  RefreshCw,
} from 'lucide-react';

export const CoordinatorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<CoordinatorSummary | null>(null);
  const [recentApps, setRecentApps] = useState<
    Array<InternshipApplicationRow & { studentName: string; studentNumber: string; programme: string }>
  >([]);
  const [recentActivity, setRecentActivity] = useState<ApplicationReviewRow[]>([]);

  const loadCoordinatorDashboard = useCallback(async () => {
    setLoading(true);

    const [
      { data: sumData },
      { data: appRows },
      { data: spRows },
      { data: profRows },
      { data: revRows },
    ] = await Promise.all([
      supabase.rpc('get_coordinator_summary'),
      supabase
        .from('internship_applications')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(8),
      supabase.from('student_profiles').select('*'),
      supabase.from('profiles').select('*'),
      supabase
        .from('application_reviews')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(8),
    ]);

    setSummary((sumData as CoordinatorSummary) || null);

    const spById = Object.fromEntries(
      ((spRows || []) as StudentProfileRow[]).map((s) => [s.id, s])
    );
    const profById = Object.fromEntries(
      ((profRows || []) as UserProfile[]).map((p) => [p.id, p])
    );

    const enrichedApps = ((appRows || []) as InternshipApplicationRow[]).map((a) => {
      const sp = spById[a.student_id];
      const prof = sp ? profById[sp.user_id] : undefined;
      return {
        ...a,
        studentName: prof?.full_name || 'Student',
        studentNumber: sp?.student_number || 'N/A',
        programme: sp?.programme || 'N/A',
      };
    });

    setRecentApps(enrichedApps);
    setRecentActivity((revRows || []) as ApplicationReviewRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadCoordinatorDashboard();
  }, [loadCoordinatorDashboard]);

  if (loading) {
    return (
      <div className="py-12 text-center text-xs text-slate-500">
        Loading coordinator dashboard from PostgreSQL...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-[#002B49]">LEAP Coordinator Dashboard</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Signed in as {user?.full_name} • Live PostgreSQL Coordination Metrics
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadCoordinatorDashboard}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Refresh
          </Button>
          <Link to="/app/coordinator/applications">
            <Button variant="primary" size="sm">
              Review Applications ({summary?.pending_reviews ?? 0})
            </Button>
          </Link>
          <Link to="/app/coordinator/placements">
            <Button variant="secondary" size="sm">
              Assign Placements ({summary?.awaiting_placement ?? 0})
            </Button>
          </Link>
        </div>
      </div>

      {/* 8 Real PostgreSQL KPI Cards required by Section 6 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <Card className="p-4 border-l-4 border-l-[#002B49]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-500">
              Total Applications
            </span>
            <FileText className="h-4 w-4 text-slate-400" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">
            {summary?.total_applications ?? 0}
          </p>
        </Card>

        <Card className="p-4 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-amber-700">
              Pending Reviews
            </span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-amber-900 mt-2">
            {summary?.pending_reviews ?? 0}
          </p>
        </Card>

        <Card className="p-4 border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-emerald-700">
              Approved Applications
            </span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-900 mt-2">
            {summary?.approved_applications ?? 0}
          </p>
        </Card>

        <Card className="p-4 border-l-4 border-l-rose-500">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-rose-700">
              Rejected Applications
            </span>
            <XCircle className="h-4 w-4 text-rose-600" />
          </div>
          <p className="text-2xl font-black text-rose-900 mt-2">
            {summary?.rejected_applications ?? 0}
          </p>
        </Card>

        <Card className="p-4 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-blue-700">
              Awaiting Placement
            </span>
            <Building2 className="h-4 w-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-blue-900 mt-2">
            {summary?.awaiting_placement ?? 0}
          </p>
        </Card>

        <Card className="p-4 border-l-4 border-l-teal-500">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-teal-700">
              Active Placements
            </span>
            <Building2 className="h-4 w-4 text-teal-600" />
          </div>
          <p className="text-2xl font-black text-teal-900 mt-2">
            {summary?.active_placements ?? 0}
          </p>
        </Card>

        <Card className="p-4 border-l-4 border-l-indigo-500">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-indigo-700">
              Unassigned Supervisors
            </span>
            <Users className="h-4 w-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-black text-indigo-900 mt-2">
            {summary?.unassigned_supervisors ?? 0}
          </p>
        </Card>

        <Card className="p-4 border-l-4 border-l-orange-500">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-orange-700">
              Outstanding Reports
            </span>
            <ClipboardList className="h-4 w-4 text-orange-600" />
          </div>
          <p className="text-2xl font-black text-orange-900 mt-2">
            {summary?.outstanding_reports ?? 0}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Recent Student Applications</CardTitle>
            <Link
              to="/app/coordinator/applications"
              className="text-xs font-semibold text-teal-700 hover:underline"
            >
              Open Full Queue
            </Link>
          </CardHeader>

          {recentApps.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-500">
              No student applications found in PostgreSQL.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2.5">Student</th>
                    <th className="px-3 py-2.5">Academic Year</th>
                    <th className="px-3 py-2.5">Industry Preference</th>
                    <th className="px-3 py-2.5">Status</th>
                    <th className="px-3 py-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentApps.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50">
                      <td className="px-3 py-3">
                        <p className="font-bold text-slate-900">{app.studentName}</p>
                        <p className="text-[11px] text-slate-500">
                          {app.studentNumber} • {app.programme}
                        </p>
                      </td>
                      <td className="px-3 py-3 font-medium">{app.academic_year}</td>
                      <td className="px-3 py-3">{app.preferred_industry || 'Any'}</td>
                      <td className="px-3 py-3">
                        <StatusBadge status={app.status} />
                      </td>
                      <td className="px-3 py-3 text-right">
                        <Link to="/app/coordinator/applications">
                          <Button variant="outline" size="sm">
                            Inspect
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-teal-600" />
              <span>Recent Decision Activity</span>
            </CardTitle>
          </CardHeader>

          {recentActivity.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-500">
              No recent decision activity.
            </p>
          ) : (
            <div className="space-y-3 text-xs">
              {recentActivity.map((act) => (
                <div
                  key={act.id}
                  className="rounded-lg border border-slate-200 p-3 space-y-1 bg-slate-50/50"
                >
                  <div className="flex items-center justify-between">
                    <StatusBadge status={act.to_status} />
                    <span className="text-[10px] text-slate-400">
                      {formatDateTime(act.created_at)}
                    </span>
                  </div>
                  {act.comment && <p className="text-slate-600">{act.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
