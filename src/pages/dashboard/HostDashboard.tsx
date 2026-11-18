import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  HostRepresentativeRow,
  HostOrganizationRow,
  PlacementRow,
  HostEvaluationRow,
  PlacementConcernRow,
  StudentProfileRow,
  PlacementOpportunityRow,
} from '../../types/database';
import { UserProfile } from '../../types/auth';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { DashboardSkeleton } from '../../components/ui/Skeleton';
import { NextActionPanel } from '../../components/ui/NextActionPanel';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatDate, formatDateTime } from '../../lib/utils';
import {
  Building2,
  Users,
  Award,
  RefreshCw,
  AlertTriangle,
  MapPin,
  Briefcase,
} from 'lucide-react';

export const HostDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [repRecord, setRepRecord] = useState<HostRepresentativeRow | null>(null);
  const [organization, setOrganization] = useState<HostOrganizationRow | null>(null);
  const [placements, setPlacements] = useState<PlacementRow[]>([]);
  const [evaluations, setEvaluations] = useState<HostEvaluationRow[]>([]);
  const [concerns, setConcerns] = useState<PlacementConcernRow[]>([]);
  const [students, setStudents] = useState<StudentProfileRow[]>([]);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [opportunities, setOpportunities] = useState<PlacementOpportunityRow[]>([]);

  const loadHostDashboard = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);

    const { data: repData } = await supabase
      .from('host_representatives')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    const rep = (repData as HostRepresentativeRow) || null;
    setRepRecord(rep);

    if (rep) {
      const [
        { data: orgData },
        { data: plRows },
        { data: evalRows },
        { data: concernRows },
        { data: spRows },
        { data: profRows },
        { data: oppRows },
      ] = await Promise.all([
        supabase
          .from('host_organizations')
          .select('*')
          .eq('id', rep.organization_id)
          .maybeSingle(),
        supabase.from('placements').select('*').order('created_at', { ascending: false }),
        supabase.from('host_evaluations').select('*'),
        supabase
          .from('placement_concerns')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(6),
        supabase.from('student_profiles').select('*'),
        supabase.from('profiles').select('*'),
        supabase.from('placement_opportunities').select('*'),
      ]);

      setOrganization((orgData as HostOrganizationRow) || null);
      setPlacements((plRows || []) as PlacementRow[]);
      setEvaluations((evalRows || []) as HostEvaluationRow[]);
      setConcerns((concernRows || []) as PlacementConcernRow[]);
      setStudents((spRows || []) as StudentProfileRow[]);
      setProfiles((profRows || []) as UserProfile[]);
      setOpportunities((oppRows || []) as PlacementOpportunityRow[]);
    }

    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    loadHostDashboard();
  }, [loadHostDashboard]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  const spById = Object.fromEntries(students.map((s) => [s.id, s]));
  const profById = Object.fromEntries(profiles.map((p) => [p.id, p]));
  const oppById = Object.fromEntries(opportunities.map((o) => [o.id, o]));
  const evalByPlacement = Object.fromEntries(evaluations.map((e) => [e.placement_id, e]));

  const pendingConfirmations = placements.filter((p) => p.status === 'AWAITING_CONFIRMATION');
  const activeInterns = placements.filter(
    (p) => p.status === 'CONFIRMED' || p.status === 'ACTIVE'
  );
  const evaluationsAwaiting = placements.filter(
    (p) => p.status === 'ACTIVE' && !evalByPlacement[p.id]
  );
  const openConcerns = concerns.filter((c) => c.status === 'OPEN');

  const avgHostScore =
    evaluations.length > 0
      ? Math.round(
          evaluations.reduce((sum, e) => sum + Number(e.overall_score || 0), 0) / evaluations.length
        )
      : null;

  return (
    <div className="space-y-6">
      {/* Workplace Organization Identity Header */}
      <div className="rounded-lg bg-white border border-slate-200 border-l-4 border-l-[#002B49] p-5 shadow-subtle">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-teal-700">
              <Building2 className="h-3.5 w-3.5" />
              <span>Partner Host Organization Workspace</span>
              {organization?.industry && (
                <span className="text-slate-400 font-medium normal-case">
                  • {organization.industry}
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#002B49]">
              {organization?.name || 'Partner Organization'}
            </h2>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
              <span className="inline-flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                <span>
                  {user?.full_name} ({repRecord?.job_title || 'Workplace Supervisor'})
                </span>
              </span>
              {organization?.city && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  <span>
                    {organization.address ? `${organization.address}, ` : ''}
                    {organization.city}
                  </span>
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={loadHostDashboard}>
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Refresh</span>
            </Button>
            <Link to="/app/host/interns">
              <Button variant="primary" size="sm">
                Confirmations ({pendingConfirmations.length})
              </Button>
            </Link>
            <Link to="/app/host/evaluations">
              <Button variant="secondary" size="sm">
                Evaluations ({evaluationsAwaiting.length})
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Action-First Operational Callout */}
      {pendingConfirmations.length > 0 ? (
        <NextActionPanel
          eyebrow="Placement Confirmation Required"
          title={`${pendingConfirmations.length} Nominated Intern(s) Awaiting Your Confirmation`}
          description="Review nominated student profiles and confirm or decline placement availability so the LEAP Coordinator can activate their internship."
          actionLabel="Review Nominations"
          actionTo="/app/host/interns"
          tone="amber"
        />
      ) : evaluationsAwaiting.length > 0 ? (
        <NextActionPanel
          eyebrow="Workplace Evaluation Due"
          title={`${evaluationsAwaiting.length} Active Intern(s) Pending Workplace Evaluation`}
          description="Submit structured six-criterion workplace performance ratings so academic supervisors can finalize internship completion."
          actionLabel="Submit Evaluation"
          actionTo="/app/host/evaluations"
          tone="navy"
        />
      ) : null}

      {/* Main 12-Col Workplace Management Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Cols: Intern Roster Table */}
        <Card noPadding className="lg:col-span-8 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-2">
            <div>
              <CardTitle>Assigned Interns & Placement Schedule ({placements.length})</CardTitle>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {activeInterns.length} active/confirmed • {pendingConfirmations.length} awaiting
                confirmation • {evaluations.length} evaluated
              </p>
            </div>
            <Link
              to="/app/host/interns"
              className="text-xs font-semibold text-teal-700 hover:text-[#002B49] hover:underline"
            >
              Manage All
            </Link>
          </div>

          {placements.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={Users}
                title="No Student Interns Assigned Yet"
                description="When the LEAP Coordinator nominates students for opportunities at your organization, they will appear here for confirmation."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2.5">Intern</th>
                    <th className="px-4 py-2.5">Role & Dates</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5">Evaluation</th>
                    <th className="px-4 py-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {placements.map((pl) => {
                    const sp = spById[pl.student_id];
                    const up = sp ? profById[sp.user_id] : undefined;
                    const opp = oppById[pl.opportunity_id];
                    const ev = evalByPlacement[pl.id];

                    return (
                      <tr key={pl.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-900">
                            {up?.full_name || 'Student Intern'}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            <span className="font-mono">{sp?.student_number}</span> • {sp?.programme}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-800">{opp?.title || 'Internship'}</p>
                          <p className="text-[11px] font-mono text-slate-400">
                            {formatDate(pl.start_date)} – {formatDate(pl.end_date)}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={pl.status} />
                        </td>
                        <td className="px-4 py-3 tabular-nums">
                          {ev ? (
                            <span className="font-semibold text-emerald-700">
                              Submitted ({ev.overall_score}%)
                            </span>
                          ) : (
                            <span className="text-slate-500">Pending</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {pl.status === 'AWAITING_CONFIRMATION' ? (
                            <Link to="/app/host/interns">
                              <Button variant="primary" size="sm">
                                Confirm
                              </Button>
                            </Link>
                          ) : pl.status === 'ACTIVE' && !ev ? (
                            <Link to="/app/host/evaluations">
                              <Button variant="secondary" size="sm">
                                Evaluate
                              </Button>
                            </Link>
                          ) : (
                            <Link to="/app/host/interns">
                              <Button variant="outline" size="sm">
                                Details
                              </Button>
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Right 4 Cols: Performance Summary & Workplace Concerns */}
        <div className="lg:col-span-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-4 w-4 text-teal-700" />
                <span>Evaluation Summary</span>
              </CardTitle>
            </CardHeader>

            <dl className="divide-y divide-slate-100 text-xs">
              <div className="py-2.5 flex items-center justify-between">
                <dt className="text-slate-600">Active / Confirmed Interns</dt>
                <dd className="font-bold text-[#002B49] tabular-nums">{activeInterns.length}</dd>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <dt className="text-slate-600">Completed Evaluations</dt>
                <dd className="font-bold text-emerald-700 tabular-nums">{evaluations.length}</dd>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <dt className="text-slate-600">Pending Evaluations</dt>
                <dd className="font-bold text-amber-700 tabular-nums">
                  {evaluationsAwaiting.length}
                </dd>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <dt className="text-slate-600">Mean Workplace Rating</dt>
                <dd className="font-bold text-[#002B49] font-mono tabular-nums">
                  {avgHostScore !== null ? `${avgHostScore}%` : '—'}
                </dd>
              </div>
            </dl>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span>Workplace Concerns ({openConcerns.length} open)</span>
              </CardTitle>
              <Link
                to="/app/host/evaluations"
                className="text-xs font-semibold text-teal-700 hover:underline"
              >
                Report
              </Link>
            </CardHeader>

            {concerns.length === 0 ? (
              <p className="py-4 text-xs text-slate-500">
                No workplace concerns have been raised for your organization&apos;s interns.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100 text-xs">
                {concerns.map((c) => (
                  <li key={c.id} className="py-2.5 first:pt-0 last:pb-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-slate-900 truncate">{c.subject}</span>
                      <StatusBadge status={c.status} />
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
        </div>
      </div>
    </div>
  );
};
