import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { UserProfile, ROLE_LABELS, AppRole } from '../../types/auth';
import { UserRoleRow, AuditLogRow } from '../../types/database';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { formatDateTime } from '../../lib/utils';
import {
  Users,
  ShieldCheck,
  ShieldAlert,
  Settings,
  RefreshCw,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [userRoles, setUserRoles] = useState<UserRoleRow[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogRow[]>([]);

  const loadAdminOverview = useCallback(async () => {
    setLoading(true);
    const [{ data: profRows }, { data: roleRows }, { data: logRows }] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('user_roles').select('*'),
      supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(12),
    ]);

    setProfiles((profRows || []) as UserProfile[]);
    setUserRoles((roleRows || []) as UserRoleRow[]);
    setAuditLogs((logRows || []) as AuditLogRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAdminOverview();
  }, [loadAdminOverview]);

  if (loading) {
    return (
      <div className="py-12 text-center text-xs text-slate-500">
        Loading system administrator console from PostgreSQL...
      </div>
    );
  }

  const activeCount = profiles.filter((p) => p.is_active).length;
  const disabledCount = profiles.filter((p) => !p.is_active).length;

  const roleCounts: Record<AppRole, number> = {
    student: 0,
    coordinator: 0,
    supervisor: 0,
    host: 0,
    management: 0,
    admin: 0,
  };
  for (const ur of userRoles) {
    if (roleCounts[ur.role] !== undefined) {
      roleCounts[ur.role] += 1;
    }
  }

  const profById = Object.fromEntries(profiles.map((p) => [p.id, p]));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-[#002B49]">
            System Administrator Dashboard
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage user accounts, role assignments, configurable university policies, and security
            audit logs
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadAdminOverview}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Refresh
          </Button>
          <Link to="/app/admin/users">
            <Button variant="primary" size="sm">
              <Users className="mr-1.5 h-3.5 w-3.5" />
              Manage Users & Roles
            </Button>
          </Link>
          <Link to="/app/admin/settings">
            <Button variant="outline" size="sm">
              <Settings className="mr-1.5 h-3.5 w-3.5" />
              Policy Settings
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-[#002B49]">
          <p className="text-xs font-semibold text-slate-500 uppercase">Total Users</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-black text-slate-900">{profiles.length}</span>
            <Users className="h-5 w-5 text-slate-400" />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {userRoles.length} total role assignments
          </p>
        </Card>

        <Card className="p-4 border-l-4 border-l-emerald-600">
          <p className="text-xs font-semibold text-emerald-700 uppercase">Active Accounts</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-black text-emerald-900">{activeCount}</span>
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Authorized for login</p>
        </Card>

        <Card className="p-4 border-l-4 border-l-rose-600">
          <p className="text-xs font-semibold text-rose-700 uppercase">Disabled Accounts</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-black text-rose-900">{disabledCount}</span>
            <XCircle className="h-5 w-5 text-rose-600" />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Blocked by RLS & sign-in guard</p>
        </Card>

        <Card className="p-4 border-l-4 border-l-indigo-600">
          <p className="text-xs font-semibold text-indigo-700 uppercase">Recent Audit Events</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-black text-indigo-900">{auditLogs.length}</span>
            <ShieldAlert className="h-5 w-5 text-indigo-600" />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Latest security & workflow events</p>
        </Card>
      </div>

      {/* Role Distribution & Recent Audit Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-teal-600" />
              <span>User Roles Breakdown</span>
            </CardTitle>
          </CardHeader>

          <div className="space-y-2.5 text-xs">
            {(Object.keys(roleCounts) as AppRole[]).map((r) => (
              <div
                key={r}
                className="flex items-center justify-between rounded-lg border border-slate-200 p-3 bg-slate-50/50"
              >
                <span className="font-semibold text-slate-800">{ROLE_LABELS[r]}</span>
                <span className="rounded-full bg-[#002B49] px-2.5 py-0.5 text-[11px] font-bold text-white">
                  {roleCounts[r]}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-teal-600" />
              <span>Recent Security & Workflow Audit Events</span>
            </CardTitle>
            <Link
              to="/app/admin/audit"
              className="text-xs font-semibold text-teal-700 hover:underline"
            >
              Open Full Audit Log
            </Link>
          </CardHeader>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2">Action</th>
                  <th className="px-3 py-2">Actor</th>
                  <th className="px-3 py-2">Entity</th>
                  <th className="px-3 py-2">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((log) => {
                  const actor = log.actor_id ? profById[log.actor_id] : undefined;
                  return (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2.5 font-mono font-bold text-[#002B49]">
                        {log.action}
                      </td>
                      <td className="px-3 py-2.5">
                        {actor?.email || 'System / Seed'}
                      </td>
                      <td className="px-3 py-2.5 text-slate-500">{log.entity_type}</td>
                      <td className="px-3 py-2.5 text-[11px] text-slate-400">
                        {formatDateTime(log.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};
