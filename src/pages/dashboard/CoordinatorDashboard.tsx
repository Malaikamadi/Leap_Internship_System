import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  CoordinatorSummary,
  InternshipApplicationRow,
  ApplicationReviewRow,
  StudentProfileRow,
  PlacementConcernRow,
} from '../../types/database';
import { UserProfile } from '../../types/auth';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/ui/PageHeader';
import { DashboardSkeleton } from '../../components/ui/Skeleton';
import { ActivityTimeline } from '../../components/ui/ActivityTimeline';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatDateTime } from '../../lib/utils';
import {
  FileText,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  Building2,
  Users,
  ClipboardCheck,
  ShieldAlert,
} from 'lucide-react';

export const CoordinatorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<CoordinatorSummary | null>(null);
  const [recentApps, setRecentApps] = useState<
    Array<InternshipApplicationRow & { studentName: string; studentNumber: string; programme: string }>
  >([]);
  const [recentActivity, setRecentActivity] = useState<ApplicationReviewRow[]>([]);
  const [openConcerns, setOpenConcerns] = useState<PlacementConcernRow[]>([]);

  const loadCoordinatorDashboard = useCallback(async () => {
    setLoading(true);

    const [
      { data: sumData },
      { data: appRows },
      { data: spRows },
      { data: profRows },
      { data: revRows },
      { data: concernRows },
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
        .limit(7),
      supabase
        .from('placement_concerns')
        .select('*')
        .eq('status', 'OPEN')
        .order('created_at', { ascending: false })
        .limit(5),
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
    setOpenConcerns((concernRows || []) as PlacementConcernRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadCoordinatorDashboard();
  }, [loadCoordinatorDashboard]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  const priorityTasks = [
    {
      label: 'Applications Awaiting Review',
      count: summary?.pending_reviews ?? 0,
      to: '/app/coordinator/applications',
      icon: FileText,
      urgent: (summary?.pending_reviews ?? 0) > 0,
    },
    {
      label: 'Approved & Awaiting Placement',
      count: summary?.awaiting_placement ?? 0,
      to: '/app/coordinator/placements',
      icon: Building2,
      urgent: (summary?.awaiting_placement ?? 0) > 0,
    },
    {
      label: 'Placements Missing Supervisor',
      count: summary?.unassigned_supervisors ?? 0,
      to: '/app/coordinator/placements',
      icon: Users,
      urgent: (summary?.unassigned_supervisors ?? 0) > 0,
    },
    {
      label: 'Open Workplace Concerns',
      count: openConcerns.length,
      to: '/app/coordinator/monitoring',
      icon: ShieldAlert,
      urgent: openConcerns.length > 0,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="LEAP Coordination Office"
        title="Coordinator Operations Desk"
        description={`Signed in as ${user?.full_name} — prioritize pending eligibility reviews, placement assignments, supervisor allocations, and active internship oversight.`}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={loadCoordinatorDashboard}>
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Refresh</span>
            </Button>
            <Link to="/app/coordinator/applications">
              <Button variant="primary" size="sm">
                Review Queue ({summary?.pending_reviews ?? 0})
              </Button>
            </Link>
            <Link to="/app/coordinator/placements">
              <Button variant="secondary" size="sm">
                Assign Placements ({summary?.awaiting_placement ?? 0})
              </Button>
            </Link>
          </>
        }
      />

      {/* Unified Segmented Operational Pipeline Bar (replaces 8 separate floating KPI cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-slate-200 border border-slate-200 rounded-lg overflow-hidden shadow-subtle">
        <div className="bg-white p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Total Applications
          </p>
          <p className="text-2xl font-bold text-[#002B49] mt-1 font-display tabular-nums">
            {summary?.total_applications ?? 0}
          </p>
          <p className="text-[11px] text-slate-500 mt-1 tabular-nums">
            <span className="text-emerald-700 font-semibold">
              {summary?.approved_applications ?? 0} approved
            </span>{' '}
            •{' '}
            <span className="text-rose-700 font-semibold">
              {summary?.rejected_applications ?? 0} rejected
            </span>
          </p>
        </div>

        <div className="bg-white p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
            Pending Review Queue
          </p>
          <p className="text-2xl font-bold text-amber-900 mt-1 font-display tabular-nums">
            {summary?.pending_reviews ?? 0}
          </p>
          <p className="text-[11px] text-slate-500 mt-1 tabular-nums">
            {summary?.correction_required ?? 0} awaiting student revision
          </p>
        </div>

        <div className="bg-white p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-teal-700">
            Active Internships
          </p>
          <p className="text-2xl font-bold text-teal-900 mt-1 font-display tabular-nums">
            {summary?.active_placements ?? 0}
          </p>
          <p className="text-[11px] text-slate-500 mt-1 tabular-nums">
            {summary?.awaiting_confirmation ?? 0} awaiting host confirm •{' '}
            {summary?.completed_placements ?? 0} completed
          </p>
        </div>

        <div className="bg-white p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Supervision & Reports
          </p>
          <p className="text-2xl font-bold text-[#002B49] mt-1 font-display tabular-nums">
            {summary?.outstanding_reports ?? 0}
          </p>
          <p className="text-[11px] text-slate-500 mt-1 tabular-nums">
            Reports in review • {summary?.unassigned_supervisors ?? 0} unassigned placements
          </p>
        </div>
      </div>

      {/* Priority Tasks Action Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {priorityTasks.map((task) => {
          const Icon = task.icon;
          return (
            <Link
              key={task.label}
              to={task.to}
              className={`group rounded-lg border p-3.5 transition-all flex items-center justify-between gap-3 ${
                task.urgent
                  ? 'bg-white border-slate-200 hover:border-[#002B49]/40 border-l-[3px] border-l-amber-500'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon
                  className={`h-4 w-4 shrink-0 ${
                    task.urgent ? 'text-amber-600' : 'text-slate-400'
                  }`}
                />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate group-hover:text-[#002B49]">
                    {task.label}
                  </p>
                  <p className="text-[11px] text-slate-500 tabular-nums">
                    {task.count} item(s)
                  </p>
                </div>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-[#002B49] group-hover:translate-x-0.5 transition-all shrink-0" />
            </Link>
          );
        })}
      </div>

      {/* Main 12-Col Triage Table + Activity / Concerns Column */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card noPadding className="lg:col-span-8 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-2">
            <div>
              <CardTitle>Applications Triage Queue</CardTitle>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Most recently updated student internship applications
              </p>
            </div>
            <Link
              to="/app/coordinator/applications"
              className="text-xs font-semibold text-teal-700 hover:text-[#002B49] hover:underline"
            >
              Open Full Queue
            </Link>
          </div>

          {recentApps.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={ClipboardCheck}
                title="No Student Applications Found"
                description="Submitted student internship applications will appear here for eligibility verification and review."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2.5">Student</th>
                    <th className="px-4 py-2.5">Preference</th>
                    <th className="px-4 py-2.5">Year</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentApps.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900">{app.studentName}</p>
                        <p className="text-[11px] text-slate-500">
                          <span className="font-mono">{app.studentNumber}</span> • {app.programme}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800 truncate max-w-[180px]">
                          {app.preferred_host_organization || app.preferred_industry || 'Unspecified'}
                        </p>
                        {app.preferred_host_organization && app.preferred_industry && (
                          <p className="text-[11px] text-slate-400 truncate max-w-[180px]">
                            {app.preferred_industry}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600">{app.academic_year}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={app.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link to="/app/coordinator/applications">
                          <Button variant="outline" size="sm">
                            Review
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

        <div className="lg:col-span-4 space-y-6">
          {/* Open Workplace Concerns */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span>Outstanding Concerns ({openConcerns.length})</span>
              </CardTitle>
              <Link
                to="/app/coordinator/monitoring"
                className="text-xs font-semibold text-teal-700 hover:underline"
              >
                Monitor
              </Link>
            </CardHeader>

            {openConcerns.length === 0 ? (
              <p className="py-4 text-xs text-slate-500">
                No open workplace concerns currently reported.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100 text-xs">
                {openConcerns.map((c) => (
                  <li key={c.id} className="py-2.5 first:pt-0 last:pb-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-slate-900 truncate">{c.subject}</span>
                      <StatusBadge status={c.severity} />
                    </div>
                    <p className="text-slate-600 line-clamp-2">{c.description}</p>
                    <p className="text-[10px] font-mono text-slate-400">
                      {formatDateTime(c.created_at)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Recent Coordinator Decisions */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Decision Timeline</CardTitle>
            </CardHeader>

            <ActivityTimeline
              items={recentActivity.map((act) => ({
                id: act.id,
                status: act.to_status,
                body: act.comment,
                timestamp: act.created_at,
              }))}
              emptyMessage="No recent application review decisions."
            />
          </Card>
        </div>
      </div>
    </div>
  );
};
