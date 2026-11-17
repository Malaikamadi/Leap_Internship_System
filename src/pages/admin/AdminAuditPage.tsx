import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { AuditLogRow } from '../../types/database';
import { UserProfile } from '../../types/auth';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { formatDateTime } from '../../lib/utils';
import { ShieldCheck, Search, RefreshCw } from 'lucide-react';

export const AdminAuditPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  const loadAuditLogs = useCallback(async () => {
    setLoading(true);
    const [{ data: logRows }, { data: profRows }] = await Promise.all([
      supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100),
      supabase.from('profiles').select('*'),
    ]);

    setLogs((logRows || []) as AuditLogRow[]);
    setProfiles((profRows || []) as UserProfile[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAuditLogs();
  }, [loadAuditLogs]);

  const profById = Object.fromEntries(profiles.map((p) => [p.id, p]));
  const distinctActions = Array.from(new Set(logs.map((l) => l.action)));

  const filteredLogs = logs.filter((l) => {
    if (actionFilter !== 'ALL' && l.action !== actionFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const actorEmail = l.actor_id ? profById[l.actor_id]?.email?.toLowerCase() || '' : '';
    return (
      l.action.toLowerCase().includes(q) ||
      l.entity_type.toLowerCase().includes(q) ||
      actorEmail.includes(q) ||
      JSON.stringify(l.details || {}).toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-[#002B49]">Security & Workflow Audit Logs</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable PostgreSQL audit trail of authentication, role changes, and workflow
            decisions
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadAuditLogs}>
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by actor email, action, or entity..."
            className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2 text-xs text-slate-900"
          />
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="audit-action-filter" className="text-xs font-medium text-slate-600">
            Action:
          </label>
          <select
            id="audit-action-filter"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800"
          >
            <option value="ALL">All Actions ({logs.length})</option>
            {distinctActions.map((act) => (
              <option key={act} value={act}>
                {act}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-teal-600" />
            <span>Audit Events ({filteredLogs.length})</span>
          </CardTitle>
        </CardHeader>

        {loading ? (
          <p className="py-8 text-center text-xs text-slate-500">Loading audit logs...</p>
        ) : filteredLogs.length === 0 ? (
          <p className="py-8 text-center text-xs text-slate-500">
            No audit events match your filter.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2.5">ID</th>
                  <th className="px-3 py-2.5">Action</th>
                  <th className="px-3 py-2.5">Actor</th>
                  <th className="px-3 py-2.5">Entity</th>
                  <th className="px-3 py-2.5">Details</th>
                  <th className="px-3 py-2.5">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => {
                  const actor = log.actor_id ? profById[log.actor_id] : undefined;
                  return (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2.5 font-mono text-slate-400">#{log.id}</td>
                      <td className="px-3 py-2.5 font-mono font-bold text-[#002B49]">
                        {log.action}
                      </td>
                      <td className="px-3 py-2.5">
                        {actor ? (
                          <div>
                            <p className="font-semibold text-slate-900">{actor.full_name}</p>
                            <p className="text-[11px] font-mono text-slate-500">{actor.email}</p>
                          </div>
                        ) : (
                          <span className="text-slate-400">System</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="font-semibold text-slate-700">{log.entity_type}</span>
                        {log.entity_id && (
                          <p className="text-[10px] font-mono text-slate-400 truncate max-w-[140px]">
                            {log.entity_id}
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-[11px] text-slate-600 max-w-xs truncate">
                        {JSON.stringify(log.details)}
                      </td>
                      <td className="px-3 py-2.5 text-[11px] text-slate-500">
                        {formatDateTime(log.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
