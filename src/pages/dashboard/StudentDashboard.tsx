import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  DEMO_STUDENT_PROFILE, 
  DEMO_APPLICATIONS, 
  DEMO_PLACEMENTS, 
  DEMO_PROGRESS_REPORTS 
} from '../../lib/mockData';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { 
  GraduationCap, 
  Building2, 
  ClipboardCheck, 
  Calendar, 
  ArrowRight, 
  CheckCircle, 
  UserCheck,
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const profile = DEMO_STUDENT_PROFILE;
  const application = DEMO_APPLICATIONS[0];
  const placement = DEMO_PLACEMENTS[0];
  const reports = DEMO_PROGRESS_REPORTS;

  return (
    <div className="space-y-6">
      {/* Welcome & Student Hero */}
      <div className="rounded-2xl bg-gradient-to-r from-[#002B49] via-[#0b3c63] to-[#0d9488] p-6 text-white shadow-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-teal-200 backdrop-blur mb-2">
              <GraduationCap className="h-4 w-4" />
              <span>Student ID: {profile.student_id_number}</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Welcome back, {user?.full_name}!</h2>
            <p className="text-sm text-slate-200 mt-1 max-w-2xl">
              {profile.program_of_study} • {profile.faculty} • {profile.current_semester}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/application">
              <Button variant="secondary" size="md">
                View Application
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Overview Stat Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center justify-between border-l-4 border-l-teal-600">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase">Application</p>
            <div className="mt-1">
              <StatusBadge status={application.application_status} />
            </div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
            <ClipboardCheck className="h-5 w-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between border-l-4 border-l-blue-600">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase">Placement Status</p>
            <div className="mt-1">
              <StatusBadge status={placement.status} />
            </div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
            <Building2 className="h-5 w-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between border-l-4 border-l-indigo-600">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase">Supervisor</p>
            <p className="text-sm font-bold text-slate-800 mt-1 truncate max-w-[150px]">
              {placement.supervisor_name}
            </p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
            <UserCheck className="h-5 w-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between border-l-4 border-l-emerald-600">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase">Reports Accepted</p>
            <p className="text-xl font-bold text-slate-900 mt-1">
              {reports.filter((r) => r.status === 'ACCEPTED').length} / {reports.length}
            </p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle className="h-5 w-5" />
          </div>
        </Card>
      </div>

      {/* Main Grid: Active Placement Details & Progress Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Placement Details Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-teal-600" />
              Active Host Placement Details
            </CardTitle>
            <StatusBadge status={placement.status} />
          </CardHeader>

          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <h4 className="text-base font-bold text-slate-900">{placement.organization_name}</h4>
              <p className="text-xs text-slate-600 mt-1">{placement.host_acceptance_notes}</p>
              
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="font-semibold text-slate-500">Duration:</span>
                  <p className="text-slate-800 font-medium mt-0.5">
                    {placement.start_date} to {placement.end_date} (12 Weeks)
                  </p>
                </div>
                <div>
                  <span className="font-semibold text-slate-500">Academic Supervisor:</span>
                  <p className="text-slate-800 font-medium mt-0.5">{placement.supervisor_name}</p>
                </div>
              </div>
            </div>

            {/* Reports Breakdown */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-slate-800">Submitted Progress Reports</h4>
                <Link to="/reports" className="text-xs font-medium text-teal-700 hover:underline">
                  View All Logbooks
                </Link>
              </div>

              <div className="space-y-3">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className="p-3.5 rounded-lg border border-slate-200 hover:border-slate-300 transition-all bg-white flex flex-col md:flex-row md:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          Report #{report.report_number}
                        </span>
                        <StatusBadge status={report.status} />
                      </div>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                        {report.tasks_completed}
                      </p>
                      {report.feedback_notes && (
                        <p className="text-xs text-emerald-700 bg-emerald-50/70 p-2 rounded-md mt-2 border border-emerald-100">
                          <span className="font-semibold">Supervisor Feedback:</span> {report.feedback_notes}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-slate-400 shrink-0">
                      {report.period_start_date} - {report.period_end_date}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Upcoming Deadlines & Requirements Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-5 w-5 text-indigo-600" />
              Key Milestones & Deadlines
            </CardTitle>
          </CardHeader>

          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-indigo-50/50 border border-indigo-100">
              <AlertCircle className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-indigo-950">Bi-Weekly Logbook #3 Due</p>
                <p className="text-xs text-indigo-800 mt-0.5">Submit by Friday, 5:00 PM for supervisor review.</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-600">Mid-term Host Appraisal</span>
                <span className="font-semibold text-slate-800">Week 6 (Pending)</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-600">Final Internship Report</span>
                <span className="font-semibold text-slate-800">Week 12</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-600">Oral Defense / Presentation</span>
                <span className="font-semibold text-slate-800">Post-Internship</span>
              </div>
            </div>

            <div className="pt-2">
              <Link to="/reports">
                <Button variant="outline" size="sm" className="w-full">
                  Submit New Progress Report
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
