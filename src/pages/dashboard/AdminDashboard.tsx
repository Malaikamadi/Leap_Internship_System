import React from 'react';
import { DEMO_USERS, DEMO_AUDIT_LOGS } from '../../lib/mockData';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { 
  Users, 
  ShieldAlert, 
  Database, 
  Lock, 
  RefreshCw, 
  CheckCircle2
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const users = DEMO_USERS;
  const auditLogs = DEMO_AUDIT_LOGS;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-[#002B49]">System Administration & Security Console</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Database Security, Role-Based Access Control, and System Audit Logs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Sync Supabase RLS
          </Button>
          <Button variant="primary" size="sm">
            <Users className="mr-1.5 h-3.5 w-3.5" />
            Provision Staff Account
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-teal-600">
          <p className="text-xs font-semibold text-slate-500 uppercase">Registered Accounts</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-black text-slate-900">{users.length}</span>
            <Users className="h-5 w-5 text-slate-400" />
          </div>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">100% active, 0 disabled</p>
        </Card>

        <Card className="p-4 border-l-4 border-l-blue-600">
          <p className="text-xs font-semibold text-blue-700 uppercase">Database Tables</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-black text-blue-900">21</span>
            <Database className="h-5 w-5 text-blue-600" />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">PostgreSQL schema migration applied</p>
        </Card>

        <Card className="p-4 border-l-4 border-l-emerald-600">
          <p className="text-xs font-semibold text-emerald-700 uppercase">RLS Policies Active</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-black text-emerald-900">21</span>
            <Lock className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Row Level Security strictly enforced</p>
        </Card>

        <Card className="p-4 border-l-4 border-l-indigo-600">
          <p className="text-xs font-semibold text-indigo-700 uppercase">Security Audit Events</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-black text-indigo-900">{auditLogs.length}</span>
            <ShieldAlert className="h-5 w-5 text-indigo-600" />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">All role transitions recorded</p>
        </Card>
      </div>

      {/* User Accounts Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>Provisioned User Profiles & RBAC Assignments</span>
            <span className="text-xs text-slate-500 font-normal">Protected from direct client elevation</span>
          </CardTitle>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Email Address</th>
                <th className="px-4 py-3">Assigned Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Security Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold text-slate-900">{u.full_name}</td>
                  <td className="px-4 py-3 text-slate-600 font-mono text-[11px]">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-[#002B49]/10 text-[#002B49] uppercase">
                      {u.role_name}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Active
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 font-medium">
                    {u.role_name === 'admin' ? 'Superuser' : u.role_name === 'student' ? 'Student Level' : 'Staff Level'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
