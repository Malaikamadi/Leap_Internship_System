import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ManagementStatistics } from '../../types/database';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { DashboardSkeleton } from '../../components/ui/Skeleton';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { MiniTechOrbital } from '../../components/landing/GlobalTechBackdrop';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { RefreshCw, FileSpreadsheet, Building2 } from 'lucide-react';

export const ManagementDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ManagementStatistics | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: rpcErr } = await supabase.rpc('get_management_statistics');
    if (rpcErr) {
      setError(rpcErr.message);
    } else {
      setStats((data as ManagementStatistics) || null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  const totalPlacements = stats?.total_placements ?? 0;
  const activeInternships = stats?.active_internships ?? 0;
  const completedInternships = stats?.completed_internships ?? 0;
  const otherPlacements = Math.max(0, totalPlacements - activeInternships - completedInternships);

  const placementOutcomeData = [
    { name: 'Active Internships', value: activeInternships, color: '#0d9488' },
    { name: 'Completed', value: completedInternships, color: '#002B49' },
    { name: 'Pending / Confirming', value: otherPlacements, color: '#94a3b8' },
  ].filter((d) => d.value > 0);

  const maxIndustryPlacements = Math.max(
    1,
    ...(stats?.by_industry || []).map((i) => i.placements)
  );

  return (
    <div className="space-y-6">
      {/* Signature Institutional Executive Report Masthead with Animated Orbital */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-[#001b30] via-[#002B49] to-[#02243d] leap-geo-grid-dark text-white p-5 sm:p-6 border border-[#001a2e] leap-stagger-1">
        <MiniTechOrbital className="absolute -right-12 -top-12 h-52 w-52 opacity-55" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <img
              src="/limkokwing-logo.png"
              alt="Limkokwing University Sierra Leone"
              className="h-12 w-auto bg-white rounded p-1 object-contain shrink-0"
            />
            <div>
              <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-teal-300 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse" />
                <span>Office of Academic Affairs • Executive Briefing</span>
              </p>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-0.5">
                University Management Analytics
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Live institutional participation, industry distribution, completion rates, and
                academic assessment outcomes
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={loadStats}
              className="bg-white/10 text-white border-white/20 hover:bg-white/20"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Refresh</span>
            </Button>
            <Link to="/app/management/reports">
              <Button variant="secondary" size="sm">
                <FileSpreadsheet className="h-3.5 w-3.5" />
                <span>Reports & CSV Export</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
          {error}
        </div>
      )}

      {/* Executive KPI Strip (Connected Segmented Grid, Tabular Numerals) */}
      <div className="leap-stagger-2 grid grid-cols-2 lg:grid-cols-4 gap-px bg-slate-200 border border-slate-200 rounded-lg overflow-hidden shadow-subtle">
        <div className="bg-white p-5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Participating Students
          </p>
          <p className="text-3xl font-bold text-[#002B49] mt-1.5 font-display tabular-nums">
            {stats?.total_participating_students ?? 0}
          </p>
          <p className="text-[11px] text-slate-500 mt-1 tabular-nums">
            {stats?.total_applications ?? 0} applications • {stats?.approved_applications ?? 0}{' '}
            approved
          </p>
        </div>

        <div className="bg-white p-5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-teal-700">
            Active Internships
          </p>
          <p className="text-3xl font-bold text-teal-800 mt-1.5 font-display tabular-nums">
            {activeInternships}
          </p>
          <p className="text-[11px] text-slate-500 mt-1 tabular-nums">
            Across {stats?.partner_organizations ?? 0} partner organizations
          </p>
        </div>

        <div className="bg-white p-5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
            Completion Rate
          </p>
          <p className="text-3xl font-bold text-emerald-800 mt-1.5 font-display tabular-nums">
            {stats?.completion_rate ?? 0}%
          </p>
          <p className="text-[11px] text-slate-500 mt-1 tabular-nums">
            {completedInternships} of {totalPlacements} placements completed
          </p>
        </div>

        <div className="bg-white p-5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Mean Assessment Score
          </p>
          <p className="text-3xl font-bold text-[#002B49] mt-1.5 font-display tabular-nums">
            {stats?.average_final_score !== null && stats?.average_final_score !== undefined
              ? `${stats.average_final_score}%`
              : '—'}
          </p>
          <p className="text-[11px] text-slate-500 mt-1 tabular-nums">
            {stats?.total_verified_hours ?? 0} verified workplace hours
          </p>
        </div>
      </div>

      {/* Primary Charts Row */}
      <div className="leap-stagger-3 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-7">
          <CardHeader>
            <div>
              <CardTitle>Faculty Participation & Completion</CardTitle>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Enrolled students, active placements, and completed internships by faculty
              </p>
            </div>
          </CardHeader>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats?.by_faculty || []}
                margin={{ top: 10, right: 12, left: -16, bottom: 24 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="faculty"
                  tick={{ fontSize: 10, fill: '#475569' }}
                  interval={0}
                  tickFormatter={(val: string) =>
                    val.length > 22 ? `${val.slice(0, 20)}…` : val
                  }
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    borderColor: '#cbd5e1',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="students" name="Students" fill="#002B49" radius={[3, 3, 0, 0]} />
                <Bar
                  dataKey="active_placements"
                  name="Active"
                  fill="#0d9488"
                  radius={[3, 3, 0, 0]}
                />
                <Bar
                  dataKey="completed_placements"
                  name="Completed"
                  fill="#059669"
                  radius={[3, 3, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="lg:col-span-5">
          <CardHeader>
            <div>
              <CardTitle>Placement Outcomes Distribution</CardTitle>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Proportion of active, completed, and pending placements
              </p>
            </div>
          </CardHeader>

          {placementOutcomeData.length === 0 ? (
            <p className="py-12 text-center text-xs text-slate-500">
              No placement records available yet.
            </p>
          ) : (
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={placementOutcomeData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={48}
                    outerRadius={76}
                    paddingAngle={2}
                  >
                    {placementOutcomeData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      borderColor: '#cbd5e1',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="mt-2 pt-3 border-t border-slate-100 divide-y divide-slate-100 text-xs">
            {placementOutcomeData.map((item) => (
              <div key={item.name} className="py-1.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-xs shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-slate-700 font-medium">{item.name}</span>
                </div>
                <span className="font-mono font-bold text-slate-900 tabular-nums">
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Industry Placement Coverage Matrix */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-teal-700" />
            <span>Placement Distribution by Industry Sector</span>
          </CardTitle>
          <Link
            to="/app/management/reports"
            className="text-xs font-semibold text-teal-700 hover:text-[#002B49] hover:underline"
          >
            View Full Faculty & Assessment Table
          </Link>
        </CardHeader>

        {(stats?.by_industry || []).length === 0 ? (
          <p className="py-6 text-center text-xs text-slate-500">
            No industry placement data recorded yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            {(stats?.by_industry || []).map((ind) => (
              <div key={ind.industry} className="space-y-1.5">
                <div className="flex items-baseline justify-between gap-2 text-xs">
                  <span className="font-semibold text-slate-900">{ind.industry}</span>
                  <span className="text-[11px] font-mono text-slate-600 tabular-nums shrink-0">
                    {ind.placements} placement(s) • {ind.organizations} org(s)
                  </span>
                </div>
                <ProgressBar
                  value={ind.placements}
                  max={maxIndustryPlacements}
                  tone="navy"
                />
                <p className="text-[11px] text-slate-500 tabular-nums">
                  {ind.active} active • {ind.completed} completed
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
