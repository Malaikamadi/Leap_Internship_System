import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { ManagementStatistics } from '../../types/database';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  GraduationCap,
  Building2,
  Award,
  TrendingUp,
  RefreshCw,
  FileSpreadsheet,
} from 'lucide-react';

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
    return (
      <div className="py-12 text-center text-xs text-slate-500">
        Loading institutional statistics from PostgreSQL...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-[#002B49]">
            University Management Dashboard
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Live institutional participation, placement distribution, completion rates, and
            assessment summaries from PostgreSQL
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadStats}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Refresh
          </Button>
          <Link to="/app/management/reports">
            <Button variant="primary" size="sm">
              <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5" />
              Institutional Reports & Export
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700">
          {error}
        </div>
      )}

      {/* 4 Live Institutional KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-[#002B49]">
          <p className="text-xs font-semibold text-slate-500 uppercase">
            Participating Students
          </p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-black text-slate-900">
              {stats?.total_participating_students ?? 0}
            </span>
            <GraduationCap className="h-6 w-6 text-slate-400" />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {stats?.total_applications ?? 0} submitted applications
          </p>
        </Card>

        <Card className="p-4 border-l-4 border-l-teal-600">
          <p className="text-xs font-semibold text-teal-700 uppercase">Active Internships</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-black text-teal-900">
              {stats?.active_internships ?? 0}
            </span>
            <Building2 className="h-6 w-6 text-teal-600" />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Across {stats?.partner_organizations ?? 0} partner organizations
          </p>
        </Card>

        <Card className="p-4 border-l-4 border-l-emerald-600">
          <p className="text-xs font-semibold text-emerald-700 uppercase">Completion Rate</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-black text-emerald-900">
              {stats?.completion_rate ?? 0}%
            </span>
            <Award className="h-6 w-6 text-emerald-600" />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {stats?.completed_internships ?? 0} of {stats?.total_placements ?? 0} placements
            completed
          </p>
        </Card>

        <Card className="p-4 border-l-4 border-l-blue-600">
          <p className="text-xs font-semibold text-blue-700 uppercase">
            Mean Final Assessment
          </p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-black text-blue-900">
              {stats?.average_final_score !== null && stats?.average_final_score !== undefined
                ? `${stats.average_final_score}%`
                : 'N/A'}
            </span>
            <TrendingUp className="h-6 w-6 text-blue-600" />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {stats?.total_verified_hours ?? 0} verified workplace hours
          </p>
        </Card>
      </div>

      {/* Charts & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Participation & Placements by Faculty
            </CardTitle>
          </CardHeader>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats?.by_faculty || []}
                margin={{ top: 10, right: 10, left: -15, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="faculty" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="students" name="Students" fill="#002B49" radius={[4, 4, 0, 0]} />
                <Bar
                  dataKey="active_placements"
                  name="Active"
                  fill="#0d9488"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="completed_placements"
                  name="Completed"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Placement Distribution by Industry</CardTitle>
          </CardHeader>

          <div className="space-y-3 text-xs">
            {(stats?.by_industry || []).map((ind) => (
              <div
                key={ind.industry}
                className="rounded-xl border border-slate-200 p-3.5 flex items-center justify-between bg-slate-50/50"
              >
                <div>
                  <p className="font-bold text-slate-900">{ind.industry}</p>
                  <p className="text-[11px] text-slate-500">
                    {ind.organizations} partner organization(s)
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[#002B49]">{ind.placements} placement(s)</p>
                  <p className="text-[11px] text-teal-700">
                    {ind.active} active • {ind.completed} completed
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
