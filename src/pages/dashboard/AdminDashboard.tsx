import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { UserProfile, ROLE_LABELS, AppRole } from '../../types/auth';
import { UserRoleRow, AuditLogRow, StudentRegistryRecord } from '../../types/database';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/ui/PageHeader';
import { DashboardSkeleton } from '../../components/ui/Skeleton';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { formatDateTime } from '../../lib/utils';
import {
  Users,
  ShieldCheck,
  ShieldAlert,
  Settings,
  RefreshCw,
  GraduationCap,
  UserPlus,
  ArrowRight,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [userRoles, setUserRoles] = useState<UserRoleRow[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogRow[]>([]);
  const [registryRecords, setRegistryRecords] = useState<StudentRegistryRecord[]>([]);

  const loadAdminOverview = useCallback(async () => {
    setLoading(true);
    const [{ data: profRows }, { data: roleRows }, { data: logRows }, { data: regRows }] =
      await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('user_roles').select('*'),
        supabase
          .from('audit_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(12),
        supabase.rpc('admin_list_student_registry', { p_search: null }),
      ]);

    setProfiles((profRows || []) as UserProfile[]);
    setUserRoles((roleRows || []) as UserRoleRow[]);
    setAuditLogs((logRows || []) as AuditLogRow[]);
    setRegistryRecords((regRows as StudentRegistryRecord[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAdminOverview();
  }, [loadAdminOverview]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  const activeCount = profiles.filter((p) => p.is_active).length;
  const disabledCount = profiles.filter((p) => !p.is_active).length;
  const claimedRegistry = registryRecords.filter((r) => r.verification_state === 'CLAIMED').length;
  const unclaimedRegistry = registryRecords.filter(
    (r) => r.verification_state !== 'CLAIMED'
  ).length;

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
  const maxRoleCount = Math.max(1, ...Object.values(roleCounts));
  const profById = Object.fromEntries(profiles.map((p) => [p.id, p]));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="ICT Administration & Governance"
        title="System Administrator Console"
        description="Provision staff accounts, administer the protected University Student Registry, govern multi-role access, configure policies, and inspect immutable audit logs."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={loadAdminOverview}>
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Refresh</span>
            </Button>
            <Link to="/app/admin/users">
              <Button variant="primary" size="sm">
                <UserPlus className="h-3.5 w-3.5" />
                <span>Users & Student Registry</span>
              </Button>
            </Link>
            <Link to="/app/admin/settings">
              <Button variant="outline" size="sm">
                <Settings className="h-3.5 w-3.5" />
                <span>Policies</span>
              </Button>
            </Link>
          </>
        }
      />

      {/* Unified Governance Telemetry Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-slate-200 border border-slate-200 rounded-lg overflow-hidden shadow-subtle">
        <div className="bg-white p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Total Accounts
          </p>
          <p className="text-2xl font-bold text-[#002B49] mt-1 font-display tabular-nums">
            {profiles.length}
          </p>
          <p className="text-[11px] text-slate-500 mt-1 tabular-nums">
            <span className="text-emerald-700 font-semibold">{activeCount} active</span> •{' '}
            <span className={disabledCount > 0 ? 'text-rose-700 font-semibold' : ''}>
              {disabledCount} disabled
            </span>
          </p>
        </div>

        <div className="bg-white p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-teal-700">
            Student Registry Records
          </p>
          <p className="text-2xl font-bold text-teal-900 mt-1 font-display tabular-nums">
            {registryRecords.length}
          </p>
          <p className="text-[11px] text-slate-500 mt-1 tabular-nums">
            {claimedRegistry} claimed • {unclaimedRegistry} unclaimed
          </p>
        </div>

        <div className="bg-white p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Role Assignments
          </p>
          <p className="text-2xl font-bold text-[#002B49] mt-1 font-display tabular-nums">
            {userRoles.length}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Across 6 RLS-enforced roles</p>
        </div>

        <div className="bg-white p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Recent Audit Events
          </p>
          <p className="text-2xl font-bold text-[#002B49] mt-1 font-display tabular-nums">
            {auditLogs.length}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Latest immutable log entries</p>
        </div>
      </div>

      {/* Quick Administrative Modules Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          {
            title: 'Staff Provisioning & Roles',
            desc: 'Issue one-time setup links and manage multi-role access',
            to: '/app/admin/users',
            icon: Users,
          },
          {
            title: 'Protected Student Registry',
            desc: `${claimedRegistry} claimed / ${unclaimedRegistry} ready for signup`,
            to: '/app/admin/users',
            icon: GraduationCap,
          },
          {
            title: 'Academic Policy Settings',
            desc: 'Configure GPA, credits, report count & grading weights',
            to: '/app/admin/settings',
            icon: Settings,
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.title}
              to={item.to}
              className="group bg-white border border-slate-200 rounded-lg p-4 hover:border-[#002B49]/40 transition-colors flex items-start justify-between gap-3"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="h-8 w-8 rounded-md bg-[#002B49]/[0.07] text-[#002B49] flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#002B49] group-hover:text-teal-700 transition-colors">
                    {item.title}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{item.desc}</p>
                </div>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-[#002B49] shrink-0 mt-1" />
            </Link>
          );
        })}
      </div>

      {/* Main 12-Col Governance Breakdown + Audit Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-teal-700" />
              <span>Role Distribution</span>
            </CardTitle>
          </CardHeader>

          <div className="space-y-3.5">
            {(Object.keys(roleCounts) as AppRole[]).map((r) => (
              <ProgressBar
                key={r}
                label={ROLE_LABELS[r]}
                value={roleCounts[r]}
                max={maxRoleCount}
                valueLabel={String(roleCounts[r])}
                tone={r === 'admin' ? 'navy' : 'teal'}
              />
            ))}
          </div>
        </Card>

        <Card noPadding className="lg:col-span-8 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-teal-700" />
              <span>Recent Security & Workflow Audit Ledger</span>
            </CardTitle>
            <Link
              to="/app/admin/audit"
              className="text-xs font-semibold text-teal-700 hover:text-[#002B49] hover:underline"
            >
              Full Audit Log
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2.5">Action</th>
                  <th className="px-4 py-2.5">Actor</th>
                  <th className="px-4 py-2.5">Entity</th>
                  <th className="px-4 py-2.5 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((log) => {
                  const actor = log.actor_id ? profById[log.actor_id] : undefined;
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-2.5 font-mono text-[11px] font-semibold text-[#002B49]">
                        {log.action}
                      </td>
                      <td className="px-4 py-2.5 text-slate-700">
                        {actor?.email || 'System / Seed'}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-[11px] text-slate-500">
                        {log.entity_type}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-[11px] text-slate-400 whitespace-nowrap">
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
