import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { ManagementStatistics } from '../../types/database';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
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
    return (
      <div className="py-12 text-center text-xs text-slate-500">
        Loading institutional reports...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-[#002B49]">
            Institutional Participation, Completion & Assessment Reports
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Aggregated academic summaries without unrestricted exposure of confidential student
            records
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={handleDownloadCsv}>
          <Download className="mr-1.5 h-4 w-4" />
          Export Faculty Report (CSV)
        </Button>
      </div>

      {/* Faculty Summary Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-teal-600" />
            <span>Faculty Participation & Completion Breakdown</span>
          </CardTitle>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-3 py-2.5">Faculty</th>
                <th className="px-3 py-2.5">Enrolled Students</th>
                <th className="px-3 py-2.5">Applications</th>
                <th className="px-3 py-2.5">Active Placements</th>
                <th className="px-3 py-2.5">Completed</th>
                <th className="px-3 py-2.5">Mean Assessment Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(stats?.by_faculty || []).map((f) => (
                <tr key={f.faculty} className="hover:bg-slate-50">
                  <td className="px-3 py-3 font-bold text-slate-900">{f.faculty}</td>
                  <td className="px-3 py-3">{f.students}</td>
                  <td className="px-3 py-3">{f.applications}</td>
                  <td className="px-3 py-3 text-teal-700 font-semibold">
                    {f.active_placements}
                  </td>
                  <td className="px-3 py-3 text-emerald-700 font-semibold">
                    {f.completed_placements}
                  </td>
                  <td className="px-3 py-3 font-bold">
                    {f.avg_score !== null ? `${f.avg_score}%` : 'Pending'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Anonymized Assessment & Completion Summaries */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Award className="h-4 w-4 text-teal-600" />
            <span>Permitted Assessment & Completion Summaries ({filteredSummaries.length})</span>
          </CardTitle>
          <select
            aria-label="Filter by faculty"
            value={facultyFilter}
            onChange={(e) => setFacultyFilter(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800"
          >
            <option value="ALL">All Faculties</option>
            {faculties.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </CardHeader>

        {filteredSummaries.length === 0 ? (
          <p className="py-6 text-center text-xs text-slate-500">
            No completion records match the selected faculty.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2.5">Programme & Faculty</th>
                  <th className="px-3 py-2.5">Host Organization</th>
                  <th className="px-3 py-2.5">Accepted Reports</th>
                  <th className="px-3 py-2.5">Verified Hours</th>
                  <th className="px-3 py-2.5">Final Score</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5">Decided At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSummaries.map((s, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="px-3 py-3">
                      <p className="font-bold text-slate-900">{s.programme}</p>
                      <p className="text-[11px] text-slate-500">{s.faculty}</p>
                    </td>
                    <td className="px-3 py-3 font-medium">{s.organization_name}</td>
                    <td className="px-3 py-3">{s.accepted_reports}</td>
                    <td className="px-3 py-3">{s.total_hours} hrs</td>
                    <td className="px-3 py-3 font-bold">
                      {s.final_score !== null ? `${s.final_score}%` : 'Pending'}
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge status={s.completion_status} />
                    </td>
                    <td className="px-3 py-3 text-[11px] text-slate-500">
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
