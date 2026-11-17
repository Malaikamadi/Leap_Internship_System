import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { DEMO_PLACEMENTS, DEMO_HOST_ORGS } from '../../lib/mockData';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { Building2, Users, ClipboardCheck, Award } from 'lucide-react';
import { Link } from 'react-router-dom';

export const HostDashboard: React.FC = () => {
  const { user } = useAuth();
  const org = DEMO_HOST_ORGS[0]; // SLCB
  const companyPlacements = DEMO_PLACEMENTS.filter((p) => p.organization_id === org.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-600 uppercase mb-1">
            <Building2 className="h-3.5 w-3.5" />
            <span>Host Organization Partner</span>
          </div>
          <h2 className="text-xl font-bold text-[#002B49]">{org.name} Portal</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Representative: {user?.full_name} ({org.physical_address}, {org.city})
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center justify-between border-l-4 border-l-teal-600">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Current Interns</p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {companyPlacements.length} <span className="text-xs font-normal text-slate-400">/ {org.max_placement_capacity} Capacity</span>
            </p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
            <Users className="h-5 w-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between border-l-4 border-l-emerald-600">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Confirmed Placements</p>
            <p className="text-2xl font-black text-emerald-900 mt-1">
              {companyPlacements.filter((p) => p.status === 'ACTIVE' || p.status === 'CONFIRMED').length}
            </p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
            <ClipboardCheck className="h-5 w-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between border-l-4 border-l-amber-500">
          <div>
            <p className="text-xs font-semibold text-amber-700 uppercase">Pending Workplace Appraisals</p>
            <p className="text-2xl font-black text-amber-900 mt-1">1</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
            <Award className="h-5 w-5" />
          </div>
        </Card>
      </div>

      {/* Active Interns List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>Interns Placed at Your Organization</span>
            <span className="text-xs font-medium text-slate-500">Term 2026/2027</span>
          </CardTitle>
        </CardHeader>

        <div className="space-y-4">
          {companyPlacements.map((plc) => (
            <div
              key={plc.id}
              className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900">{plc.student_name}</span>
                  <span className="text-xs text-slate-400">ID: {plc.student_id_number}</span>
                  <StatusBadge status={plc.status} />
                </div>
                <p className="text-xs text-slate-600 mt-1">{plc.program_of_study}</p>
                <p className="text-xs text-slate-500 mt-1">
                  Assigned Team: {plc.host_acceptance_notes}
                </p>
                <div className="mt-2 text-xs text-teal-800 font-medium">
                  Academic Supervisor: {plc.supervisor_name}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link to="/host/evaluations">
                  <Button variant="primary" size="sm">
                    Submit Performance Appraisal
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
