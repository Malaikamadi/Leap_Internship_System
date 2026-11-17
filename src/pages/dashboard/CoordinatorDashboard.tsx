import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  DEMO_APPLICATIONS, 
  DEMO_PLACEMENTS, 
  DEMO_HOST_ORGS, 
  DEMO_AUDIT_LOGS 
} from '../../lib/mockData';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { 
  FileText, 
  Building2, 
  Users, 
  CheckCircle, 
  Clock, 
  ShieldCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const CoordinatorDashboard: React.FC = () => {
  const { user } = useAuth();
  const applications = DEMO_APPLICATIONS;
  const placements = DEMO_PLACEMENTS;
  const orgs = DEMO_HOST_ORGS;
  const audits = DEMO_AUDIT_LOGS;

  const totalApps = applications.length;
  const pendingReviews = applications.filter((a) => a.application_status === 'UNDER_REVIEW' || a.application_status === 'SUBMITTED').length;
  const approvedApps = applications.filter((a) => a.application_status === 'APPROVED').length;
  const awaitingPlacement = applications.filter(
    (a) => a.application_status === 'APPROVED' && !placements.some((p) => p.application_id === a.id)
  ).length;
  const activePlacements = placements.filter((p) => p.status === 'ACTIVE').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-[#002B49]">LEAP Coordinator Command Center</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Signed in as {user?.full_name} • Faculty Internship Coordination Office
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/applications">
            <Button variant="primary" size="sm">
              Review Submissions ({pendingReviews})
            </Button>
          </Link>
          <Link to="/placements">
            <Button variant="outline" size="sm">
              Manage Placements
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-subtle">
          <p className="text-[11px] font-semibold text-slate-500 uppercase">Total Applications</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-slate-900">{totalApps}</span>
            <FileText className="h-4 w-4 text-slate-400" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-subtle border-l-4 border-l-amber-500">
          <p className="text-[11px] font-semibold text-amber-700 uppercase">Pending Review</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-amber-900">{pendingReviews}</span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-subtle border-l-4 border-l-emerald-500">
          <p className="text-[11px] font-semibold text-emerald-700 uppercase">Approved</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-emerald-900">{approvedApps}</span>
            <CheckCircle className="h-4 w-4 text-emerald-600" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-subtle border-l-4 border-l-blue-500">
          <p className="text-[11px] font-semibold text-blue-700 uppercase">Awaiting Match</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-blue-900">{awaitingPlacement}</span>
            <Users className="h-4 w-4 text-blue-600" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-subtle border-l-4 border-l-teal-500">
          <p className="text-[11px] font-semibold text-teal-700 uppercase">Active Placements</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-teal-900">{activePlacements}</span>
            <Building2 className="h-4 w-4 text-teal-600" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-subtle">
          <p className="text-[11px] font-semibold text-slate-500 uppercase">Host Partners</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-slate-900">{orgs.length}</span>
            <Building2 className="h-4 w-4 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Main Grid: Pending Reviews Table & Host Organizations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student Applications Awaiting Decision */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>Applications Awaiting Review</span>
              <span className="text-xs font-normal text-slate-500">Cycle 2026/2027</span>
            </CardTitle>
          </CardHeader>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2.5">Student</th>
                  <th className="px-3 py-2.5">Program</th>
                  <th className="px-3 py-2.5">Preferred Host</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-3 py-3 font-medium text-slate-900">
                      <div>{app.student_name}</div>
                      <div className="text-[10px] text-slate-400">ID: {app.student_id_number}</div>
                    </td>
                    <td className="px-3 py-3 text-slate-600 max-w-[140px] truncate">
                      {app.program_of_study}
                    </td>
                    <td className="px-3 py-3 text-slate-700">
                      {app.preferred_organization_name || 'Open Placement'}
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge status={app.application_status} />
                    </td>
                    <td className="px-3 py-3 text-right">
                      <Link to="/applications">
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
        </Card>

        {/* Host Capacity & Recent Audit Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Building2 className="h-4 w-4 text-teal-600" />
                Host Organization Capacity
              </CardTitle>
            </CardHeader>
            <div className="space-y-3">
              {orgs.map((org) => {
                const fillPercent = Math.round((org.active_placements_count / org.max_placement_capacity) * 100);
                return (
                  <div key={org.id} className="text-xs">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-semibold text-slate-800 truncate max-w-[170px]">{org.name}</span>
                      <span className="text-slate-500 font-medium">
                        {org.active_placements_count} / {org.max_placement_capacity} ({fillPercent}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          fillPercent >= 80 ? 'bg-amber-500' : 'bg-teal-600'
                        }`}
                        style={{ width: `${fillPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-indigo-600" />
                Recent System Activity
              </CardTitle>
            </CardHeader>
            <div className="space-y-2.5">
              {audits.map((a) => (
                <div key={a.id} className="text-xs border-b border-slate-100 pb-2 last:border-none">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">{a.action}</span>
                    <span className="text-[10px] text-slate-400">Recent</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 truncate">{a.user_email}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
