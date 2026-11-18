import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { ManagementStatistics } from '../../types/database';
import { Card, CardTitle } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { DashboardSkeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatDateTime } from '../../lib/utils';
import { Download, BarChart3, Award } from 'lucide-react';

export const ManagementReportsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ManagementStatistics | null>(null);
  const [facultyFilter, setFacultyFilter] = useState<string>('ALL');

  const loadReports = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.rpc('get_management_statistics');
    setStats((data as ManagementStatistics) || null);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const faculties = (stats?.by_faculty || []).map((f) => f.faculty);
  const filteredSummaries = (stats?.assessment_summaries || []).filter((s) =>
    facultyFilter === 'ALL' ? true : s.faculty === facultyFilter
  );

  const handleDownloadCsv = () => {
    if (!stats) return;
    const rows = [
      ['Faculty', 'Students', 'Applications', 'Active Placements', 'Completed Placements', 'Avg Score'],
      ...stats.by_faculty.map((f) => [
        `"${f.faculty}"`,
        String(f.students),
        String(f.applications),
        String(f.active_placements),
        String(f.completed_placements),
        f.avg_score !== null ? String(f.avg_score) : 'N/A',
      ]),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'leap-institutional-report.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Signature Institutional Report Header */}
      <div className="rounded-lg bg-white border border-slate-200 border-t-4 border-t-[#002B49] p-5 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-4">
          <img
            src="/limkokwing-logo.png"
            alt="Limkokwing University Sierra Leone"
            className="h-11 w-auto object-contain shrink-0"
          />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-teal-700">
              Limkokwing University of Creative Technology — Sierra Leone
            </p>
            <h2 className="text-lg sm:text-xl font-bold text-[#002B49] mt-0.5">
              Institutional Participation, Completion & Assessment Report
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Aggregated academic governance summaries with zero exposure of confidential student
              identity details
            </p>
          </div>
        </div>

        <Button variant="primary" size="sm" onClick={handleDownloadCsv} className="shrink-0">
          <Download className="h-4 w-4" />
          <span>Export CSV</span>
        </Button>
      </div>

      {/* Faculty Summary Table */}
      <Card noPadding className="overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-teal-700" />
            <span>Faculty Participation & Completion Breakdown</span>
          </CardTitle>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-4 py-2.5">Faculty</th>
                <th className="px-4 py-2.5 text-right">Students</th>
                <th className="px-4 py-2.5 text-right">Applications</th>
                <th className="px-4 py-2.5 text-right">Active</th>
                <th className="px-4 py-2.5 text-right">Completed</th>
                <th className="px-4 py-2.5 text-right">Mean Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(stats?.by_faculty || []).map((f) => (
                <tr key={f.faculty} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-900">{f.faculty}</td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">{f.students}</td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums">{f.applications}</td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-teal-700 tabular-nums">
                    {f.active_placements}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-emerald-700 tabular-nums">
                    {f.completed_placements}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-[#002B49] tabular-nums">
                    {f.avg_score !== null ? `${f.avg_score}%` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Anonymized Assessment & Completion Summaries */}
      <Card noPadding className="overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2">
            <Award className="h-4 w-4 text-teal-700" />
            <span>Permitted Assessment & Completion Summaries ({filteredSummaries.length})</span>
          </CardTitle>
          <select
            aria-label="Filter by faculty"
            value={facultyFilter}
            onChange={(e) => setFacultyFilter(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#002B49]"
          >
            <option value="ALL">All Faculties</option>
            {faculties.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>

        {filteredSummaries.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={Award}
              title="No Completion Records Match Filter"
              description="Switch the faculty filter above to view permitted completion summaries across all faculties."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2.5">Programme & Faculty</th>
                  <th className="px-4 py-2.5">Host Organization</th>
                  <th className="px-4 py-2.5 text-right">Reports</th>
                  <th className="px-4 py-2.5 text-right">Hours</th>
                  <th className="px-4 py-2.5 text-right">Final Score</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5 text-right">Decided At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSummaries.map((s, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{s.programme}</p>
                      <p className="text-[11px] text-slate-500">{s.faculty}</p>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">{s.organization_name}</td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">
                      {s.accepted_reports}
                    </td>
                    <td className="px-4 py-3 text-right font-mono tabular-nums">
                      {s.total_hours} hrs
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-[#002B49] tabular-nums">
                      {s.final_score !== null ? `${s.final_score}%` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={s.completion_status} />
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {formatDateTime(s.decided_at)}
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
