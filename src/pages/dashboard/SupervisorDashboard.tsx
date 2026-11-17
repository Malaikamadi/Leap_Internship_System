import React from 'react';
import { 
  DEMO_SUPERVISORS, 
  DEMO_PLACEMENTS, 
  DEMO_PROGRESS_REPORTS 
} from '../../lib/mockData';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { 
  Users, 
  ClipboardList, 
  Award, 
  Building2, 
  CheckCircle2
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const SupervisorDashboard: React.FC = () => {
  const supervisor = DEMO_SUPERVISORS[0];
  const assignedPlacements = DEMO_PLACEMENTS;
  const reports = DEMO_PROGRESS_REPORTS;
  const reportsAwaiting = reports.filter((r) => r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW');

  return (
    <div className="space-y-6">
      {/* Supervisor Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-[#002B49]">Academic Supervision Workspace</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {supervisor.title} • {supervisor.faculty} ({supervisor.office_location})
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/supervisor/reports">
            <Button variant="primary" size="sm">
              Review Submitted Reports ({reportsAwaiting.length})
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center justify-between border-l-4 border-l-teal-600">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Assigned Interns</p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {assignedPlacements.length} <span className="text-xs font-normal text-slate-400">/ {supervisor.max_interns} Max</span>
            </p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
            <Users className="h-5 w-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between border-l-4 border-l-amber-500">
          <div>
            <p className="text-xs font-semibold text-amber-700 uppercase">Reports Awaiting Review</p>
            <p className="text-2xl font-black text-amber-900 mt-1">{reportsAwaiting.length}</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
            <ClipboardList className="h-5 w-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between border-l-4 border-l-indigo-600">
          <div>
            <p className="text-xs font-semibold text-indigo-700 uppercase">Pending Final Evaluations</p>
            <p className="text-2xl font-black text-indigo-900 mt-1">1</p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Award className="h-5 w-5" />
          </div>
        </Card>
      </div>

      {/* Assigned Students List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-teal-600" />
              Undergraduate Students Under Your Supervision
            </CardTitle>
          </CardHeader>

          <div className="space-y-3">
            {assignedPlacements.map((plc) => (
              <div
                key={plc.id}
                className="p-4 rounded-xl border border-slate-200 bg-white hover:border-teal-500 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">{plc.student_name}</span>
                    <span className="text-xs text-slate-400">ID: {plc.student_id_number}</span>
                    <StatusBadge status={plc.status} />
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{plc.program_of_study}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-slate-700">
                    <Building2 className="h-3.5 w-3.5 text-slate-400" />
                    <span>Host: <strong className="text-slate-900">{plc.organization_name}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link to="/supervisor/reports">
                    <Button variant="outline" size="sm">
                      Logbooks
                    </Button>
                  </Link>
                  <Link to="/supervisor/assessments">
                    <Button variant="primary" size="sm">
                      Assess
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Supervision Checklist */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-teal-600" />
              Academic Supervision Tasks
            </CardTitle>
          </CardHeader>
          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <p className="font-semibold text-slate-900">1. Workplace Site Visit</p>
              <p className="text-slate-500 mt-0.5">Verify student working conditions and speak with host mentor at SLCB.</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <p className="font-semibold text-slate-900">2. Review Bi-Weekly Progress</p>
              <p className="text-slate-500 mt-0.5">Ensure logbook reports match syllabus learning objectives.</p>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <p className="font-semibold text-slate-900">3. Final Assessment Recording</p>
              <p className="text-slate-500 mt-0.5">Combine workplace score with presentation and report mark.</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
