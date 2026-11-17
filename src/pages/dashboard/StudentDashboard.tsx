import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  StudentProfileRow,
  InternshipApplicationRow,
  PlacementRow,
  ProgressReportRow,
  CompletionRecordRow,
  NotificationRow,
  ReportFeedbackRow,
} from '../../types/database';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { formatDate, formatDateTime } from '../../lib/utils';
import {
  GraduationCap,
  Building2,
  ClipboardCheck,
  ArrowRight,
  CheckCircle2,
  UserCheck,
  Bell,
  MessageSquare,
  Award,
  RefreshCw,
} from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [studentProfile, setStudentProfile] = useState<StudentProfileRow | null>(null);
  const [application, setApplication] = useState<InternshipApplicationRow | null>(null);
  const [placement, setPlacement] = useState<PlacementRow | null>(null);
  const [supervisorName, setSupervisorName] = useState<string | null>(null);
  const [organizationName, setOrganizationName] = useState<string | null>(null);
  const [opportunityTitle, setOpportunityTitle] = useState<string | null>(null);
  const [reports, setReports] = useState<ProgressReportRow[]>([]);
  const [recentFeedback, setRecentFeedback] = useState<ReportFeedbackRow[]>([]);
  const [completion, setCompletion] = useState<CompletionRecordRow | null>(null);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);

  const loadDashboard = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);

    const { data: spData } = await supabase
      .from('student_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    const sp = (spData as StudentProfileRow) || null;
    setStudentProfile(sp);

    if (sp) {
      const [{ data: apps }, { data: placements }, { data: repRows }, { data: compRow }] =
        await Promise.all([
          supabase
            .from('internship_applications')
            .select('*')
            .eq('student_id', sp.id)
            .order('created_at', { ascending: false })
            .limit(1),
          supabase
            .from('placements')
            .select('*')
            .eq('student_id', sp.id)
            .order('created_at', { ascending: false })
            .limit(1),
          supabase
            .from('progress_reports')
            .select('*')
            .eq('student_id', sp.id)
            .order('report_number', { ascending: false }),
          supabase
            .from('completion_records')
            .select('*')
            .eq('student_id', sp.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

      const latestApp = (apps?.[0] as InternshipApplicationRow) || null;
      const latestPl = (placements?.[0] as PlacementRow) || null;
      setApplication(latestApp);
      setPlacement(latestPl);
      setReports((repRows || []) as ProgressReportRow[]);
      setCompletion((compRow as CompletionRecordRow) || null);

      if (latestPl) {
        const [{ data: orgData }, { data: oppData }, { data: saData }] = await Promise.all([
          supabase
            .from('host_organizations')
            .select('name')
            .eq('id', latestPl.organization_id)
            .maybeSingle(),
          supabase
            .from('placement_opportunities')
            .select('title')
            .eq('id', latestPl.opportunity_id)
            .maybeSingle(),
          supabase
            .from('supervisor_assignments')
            .select('supervisor_id')
            .eq('placement_id', latestPl.id)
            .eq('is_current', true)
            .maybeSingle(),
        ]);

        setOrganizationName(orgData?.name || null);
        setOpportunityTitle(oppData?.title || null);

        if (saData?.supervisor_id) {
          const { data: supRow } = await supabase
            .from('academic_supervisors')
            .select('user_id, title')
            .eq('id', saData.supervisor_id)
            .maybeSingle();
          if (supRow?.user_id) {
            const { data: supProf } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', supRow.user_id)
              .maybeSingle();
            setSupervisorName(
              supProf?.full_name
                ? `${supRow.title ? supRow.title + ' ' : ''}${supProf.full_name}`
                : null
            );
          }
        } else {
          setSupervisorName(null);
        }
      } else {
        setOrganizationName(null);
        setOpportunityTitle(null);
        setSupervisorName(null);
      }

      if (repRows && repRows.length > 0) {
        const reportIds = repRows.map((r) => r.id);
        const { data: fbRows } = await supabase
          .from('report_feedback')
          .select('*')
          .in('report_id', reportIds)
          .order('created_at', { ascending: false })
          .limit(5);
        setRecentFeedback((fbRows || []) as ReportFeedbackRow[]);
      } else {
        setRecentFeedback([]);
      }
    }

    const { data: notifRows } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);
    setNotifications((notifRows || []) as NotificationRow[]);

    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  if (loading) {
    return (
      <div className="py-12 text-center text-xs text-slate-500">
        Loading student dashboard from PostgreSQL...
      </div>
    );
  }

  const acceptedReportsCount = reports.filter((r) => r.status === 'ACCEPTED').length;
  const totalVerifiedHours = reports
    .filter((r) => r.status === 'ACCEPTED')
    .reduce((sum, r) => sum + (r.hours_worked || 0), 0);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-2xl bg-[#002B49] p-6 text-white shadow-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-teal-300 mb-2">
              <GraduationCap className="h-4 w-4" />
              <span>Student Number: {studentProfile?.student_number || 'Unregistered'}</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight">
              Welcome, {user?.full_name}
            </h2>
            {studentProfile && (
              <p className="text-xs sm:text-sm text-slate-200 mt-1">
                {studentProfile.programme} • {studentProfile.faculty} • Year{' '}
                {studentProfile.year_of_study} (GPA: {studentProfile.gpa ?? 'N/A'} | Credits:{' '}
                {studentProfile.credits_completed})
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadDashboard} className="bg-white/10 text-white border-white/20 hover:bg-white/20">
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Refresh
            </Button>
            <Link to="/app/student/application">
              <Button variant="secondary" size="md">
                <span>{application ? 'Manage Application' : 'Start LEAP Application'}</span>
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Four Real-Time Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center justify-between border-l-4 border-l-teal-600">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Application Status</p>
            <div className="mt-1.5">
              {application ? (
                <StatusBadge status={application.status} />
              ) : (
                <span className="text-xs font-semibold text-slate-500">Not Yet Created</span>
              )}
            </div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
            <ClipboardCheck className="h-5 w-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between border-l-4 border-l-blue-600">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Placement Status</p>
            <div className="mt-1.5">
              {placement ? (
                <StatusBadge status={placement.status} />
              ) : (
                <span className="text-xs font-semibold text-slate-500">Awaiting Assignment</span>
              )}
            </div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
            <Building2 className="h-5 w-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between border-l-4 border-l-indigo-600">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Assigned Supervisor</p>
            <p className="text-xs font-bold text-slate-900 mt-1.5 truncate max-w-[160px]">
              {supervisorName || 'Not yet assigned'}
            </p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
            <UserCheck className="h-5 w-5" />
          </div>
        </Card>

        <Card className="p-4 flex items-center justify-between border-l-4 border-l-emerald-600">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase">Progress Reports</p>
            <p className="text-sm font-bold text-slate-900 mt-1">
              {acceptedReportsCount} accepted / {reports.length} total ({totalVerifiedHours} hrs)
            </p>
          </div>
          <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Placement, Reports & Feedback */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4 text-teal-600" />
                <span>Placement & Supervision Summary</span>
              </CardTitle>
              {placement && <StatusBadge status={placement.status} />}
            </CardHeader>

            {placement ? (
              <div className="space-y-3 text-xs">
                <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        {opportunityTitle || 'Internship Placement'}
                      </p>
                      <p className="text-xs font-medium text-teal-700">{organizationName}</p>
                    </div>
                    <span className="text-xs text-slate-500">
                      {formatDate(placement.start_date)} — {formatDate(placement.end_date)}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                    <div>
                      <span className="text-slate-500">Academic Supervisor:</span>
                      <p className="font-semibold text-slate-900 mt-0.5">
                        {supervisorName || 'Pending Coordinator Assignment'}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500">Host Confirmation Note:</span>
                      <p className="font-medium text-slate-800 mt-0.5">
                        {placement.host_response_note || 'Awaiting host response'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <Link to="/app/student/placement">
                    <Button variant="outline" size="sm">
                      View Placement Details
                    </Button>
                  </Link>
                  {placement.status === 'ACTIVE' && (
                    <Link to="/app/student/reports">
                      <Button variant="primary" size="sm">
                        Submit Progress Report
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <div className="rounded-xl bg-slate-50 p-6 text-center border border-slate-200 space-y-3">
                <p className="text-xs text-slate-600">
                  {application?.status === 'APPROVED'
                    ? 'Your application is approved. The LEAP Coordinator will assign your host placement shortly.'
                    : 'Submit your LEAP internship application and receive coordinator approval to be matched with a host organization.'}
                </p>
                <Link to="/app/student/application">
                  <Button variant="primary" size="sm">
                    {application ? 'View Application' : 'Create Application'}
                  </Button>
                </Link>
              </div>
            )}
          </Card>

          {/* Recent Supervisor Feedback */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-teal-600" />
                <span>Recent Supervisor Feedback</span>
              </CardTitle>
              <Link
                to="/app/student/reports"
                className="text-xs font-semibold text-teal-700 hover:underline"
              >
                Open Reports
              </Link>
            </CardHeader>

            {recentFeedback.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-500">
                No supervisor report feedback recorded yet.
              </p>
            ) : (
              <div className="space-y-3">
                {recentFeedback.map((fb) => (
                  <div
                    key={fb.id}
                    className="rounded-lg border border-slate-200 p-3.5 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <StatusBadge status={fb.decision} />
                      <span className="text-[11px] text-slate-400">
                        {formatDateTime(fb.created_at)}
                      </span>
                    </div>
                    <p className="text-slate-700">{fb.comments}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Completion Status & Notifications */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Award className="h-4 w-4 text-teal-600" />
                <span>Completion Progress</span>
              </CardTitle>
              {completion && <StatusBadge status={completion.status} />}
            </CardHeader>

            {completion ? (
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-600">Accepted Reports</span>
                  <span className="font-bold text-slate-900">{completion.accepted_reports}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-600">Verified Hours</span>
                  <span className="font-bold text-slate-900">{completion.total_hours} hrs</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-600">Host Evaluation</span>
                  <span className="font-bold text-slate-900">
                    {completion.host_evaluation_received ? 'Submitted' : 'Pending'}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-600">Final Assessment Score</span>
                  <span className="font-bold text-slate-900">
                    {completion.final_score !== null ? `${completion.final_score}%` : 'Pending'}
                  </span>
                </div>
                <Link to="/app/student/completion" className="block pt-2">
                  <Button variant="outline" size="sm" className="w-full">
                    View Completion Checklist
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3 text-xs text-slate-500">
                <p>
                  Completion tracking begins automatically once your placement becomes ACTIVE.
                </p>
                <Link to="/app/student/completion" className="block">
                  <Button variant="outline" size="sm" className="w-full">
                    View Completion Requirements
                  </Button>
                </Link>
              </div>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="h-4 w-4 text-teal-600" />
                <span>Recent Notifications</span>
              </CardTitle>
              <Link
                to="/app/notifications"
                className="text-xs font-semibold text-teal-700 hover:underline"
              >
                All
              </Link>
            </CardHeader>

            {notifications.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-500">No notifications yet.</p>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {notifications.map((n) => (
                  <div key={n.id} className="py-2.5">
                    <p className="font-semibold text-slate-900">{n.title}</p>
                    <p className="text-slate-600 mt-0.5 line-clamp-2">{n.body}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
