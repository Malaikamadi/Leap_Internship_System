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
import { DashboardSkeleton } from '../../components/ui/Skeleton';
import { JourneyTimeline } from '../../components/ui/JourneyTimeline';
import { NextActionPanel } from '../../components/ui/NextActionPanel';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { ActivityTimeline } from '../../components/ui/ActivityTimeline';
import { EmptyState } from '../../components/ui/EmptyState';
import { MiniTechOrbital } from '../../components/landing/GlobalTechBackdrop';
import { formatDate, formatDateTime } from '../../lib/utils';
import {
  GraduationCap,
  Building2,
  ArrowRight,
  CheckCircle2,
  Circle,
  Bell,
  MessageSquare,
  Award,
  RefreshCw,
  FileText,
  UserCheck,
} from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [studentProfile, setStudentProfile] = useState<StudentProfileRow | null>(null);
  const [application, setApplication] = useState<InternshipApplicationRow | null>(null);
  const [placement, setPlacement] = useState<PlacementRow | null>(null);
  const [supervisorName, setSupervisorName] = useState<string | null>(null);
  const [supervisorDepartment, setSupervisorDepartment] = useState<string | null>(null);
  const [organizationName, setOrganizationName] = useState<string | null>(null);
  const [opportunityTitle, setOpportunityTitle] = useState<string | null>(null);
  const [reports, setReports] = useState<ProgressReportRow[]>([]);
  const [recentFeedback, setRecentFeedback] = useState<ReportFeedbackRow[]>([]);
  const [completion, setCompletion] = useState<CompletionRecordRow | null>(null);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [minRequiredReports, setMinRequiredReports] = useState<number>(1);

  const loadDashboard = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);

    const [{ data: spData }, { data: settingRow }] = await Promise.all([
      supabase.from('student_profiles').select('*').eq('user_id', user.id).maybeSingle(),
      supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'minimum_accepted_reports')
        .maybeSingle(),
    ]);

    if (settingRow?.value) {
      const parsed = Number(settingRow.value);
      if (!Number.isNaN(parsed) && parsed > 0) setMinRequiredReports(parsed);
    }

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
            .select('user_id, title, department')
            .eq('id', saData.supervisor_id)
            .maybeSingle();
          setSupervisorDepartment(supRow?.department || null);
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
          setSupervisorDepartment(null);
        }
      } else {
        setOrganizationName(null);
        setOpportunityTitle(null);
        setSupervisorName(null);
        setSupervisorDepartment(null);
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
    return <DashboardSkeleton />;
  }

  const acceptedReportsCount = reports.filter((r) => r.status === 'ACCEPTED').length;
  const revisionNeededReport = reports.find((r) => r.status === 'CORRECTION_REQUIRED');
  const totalVerifiedHours = reports
    .filter((r) => r.status === 'ACCEPTED')
    .reduce((sum, r) => sum + (r.hours_worked || 0), 0);

  // Derive personalized Next Required Action from real PostgreSQL workflow state
  const getNextAction = () => {
    if (completion?.status === 'COMPLETED') {
      return {
        tone: 'emerald' as const,
        title: 'Internship Successfully Completed',
        description: `All academic and workplace requirements have been verified with a final score of ${
          completion.final_score ?? 'N/A'
        }%. Review your official completion record below.`,
        actionLabel: 'View Completion Record',
        actionTo: '/app/student/completion',
      };
    }
    if (revisionNeededReport) {
      return {
        tone: 'amber' as const,
        title: `Progress Report #${revisionNeededReport.report_number} Requires Revision`,
        description:
          'Your academic supervisor has requested updates on your progress report. Open Progress Reports to review feedback and resubmit.',
        actionLabel: 'Revise Progress Report',
        actionTo: '/app/student/reports',
      };
    }
    if (!application) {
      return {
        tone: 'navy' as const,
        title: 'Start Your LEAP Internship Application',
        description:
          'Confirm your contact details in My Profile, then draft and submit your official internship application for LEAP Coordinator eligibility review.',
        actionLabel: 'Create Application',
        actionTo: '/app/student/application',
      };
    }
    if (application.status === 'DRAFT') {
      return {
        tone: 'navy' as const,
        title: 'Submit Your Draft Application for Review',
        description:
          'Your application is currently saved as a draft. Complete all required fields and submit it so the LEAP Coordinator can review your eligibility.',
        actionLabel: 'Continue Application',
        actionTo: '/app/student/application',
      };
    }
    if (application.status === 'CORRECTION_REQUIRED') {
      return {
        tone: 'amber' as const,
        title: 'Coordinator Requested Application Corrections',
        description:
          'Review the LEAP Coordinator feedback on your application, update the requested details, and resubmit.',
        actionLabel: 'Update Application',
        actionTo: '/app/student/application',
      };
    }
    if (application.status === 'SUBMITTED' || application.status === 'UNDER_REVIEW') {
      return {
        tone: 'navy' as const,
        title: 'Application Under LEAP Coordinator Review',
        description:
          'Your application has been submitted and is currently being reviewed for academic eligibility. You will be notified as soon as a decision is recorded.',
        actionLabel: 'Track Application',
        actionTo: '/app/student/application',
      };
    }
    if (application.status === 'APPROVED' && !placement) {
      return {
        tone: 'emerald' as const,
        title: 'Application Approved — Awaiting Placement Assignment',
        description:
          'The LEAP Coordinator has approved your application and will assign your host organization placement and academic supervisor shortly.',
        actionLabel: 'View Placement Status',
        actionTo: '/app/student/placement',
      };
    }
    if (placement && (placement.status === 'PENDING' || placement.status === 'AWAITING_CONFIRMATION')) {
      return {
        tone: 'navy' as const,
        title: `Placement Nominated at ${organizationName || 'Host Organization'}`,
        description:
          'Your placement has been created and is awaiting confirmation from the host organization and final activation by the LEAP Coordinator.',
        actionLabel: 'View Placement Details',
        actionTo: '/app/student/placement',
      };
    }
    if (placement?.status === 'ACTIVE') {
      return {
        tone: 'navy' as const,
        title: 'Log Your Workplace Progress Reports',
        description: `Your internship at ${organizationName || 'your host organization'} is active. You currently have ${acceptedReportsCount} of ${minRequiredReports} minimum accepted report(s).`,
        actionLabel: 'Open Progress Reports',
        actionTo: '/app/student/reports',
      };
    }
    return {
      tone: 'navy' as const,
      title: 'Review Your Internship Status',
      description: 'Check your application, placement, and completion records for any updates.',
      actionLabel: 'Open My Application',
      actionTo: '/app/student/application',
    };
  };

  const nextAction = getNextAction();

  return (
    <div className="space-y-6">
      {/* Compact Institutional Student Identity Band with Animated Orbital Accent */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-[#001b30] via-[#002B49] to-[#02243d] leap-geo-grid-dark text-white p-5 sm:p-6 border border-[#001a2e] leap-stagger-1">
        <MiniTechOrbital className="absolute -right-12 -top-12 h-52 w-52 opacity-55" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2 min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              <span className="inline-flex items-center gap-1.5 font-mono font-semibold text-teal-300 bg-white/10 border border-teal-400/25 px-2 py-0.5 rounded">
                <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse" />
                <GraduationCap className="h-3.5 w-3.5" />
                {studentProfile?.student_number || 'Unregistered ID'}
              </span>
              {application && <StatusBadge status={application.status} />}
              {placement && <StatusBadge status={placement.status} />}
            </div>

            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              {user?.full_name}
            </h2>

            {studentProfile && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300">
                <span className="font-medium text-white/90">{studentProfile.programme}</span>
                <span>{studentProfile.faculty}</span>
                <span className="font-mono text-teal-200">
                  Year {studentProfile.year_of_study}, Sem {studentProfile.semester ?? 8} • GPA{' '}
                  {studentProfile.gpa ?? 'N/A'} • {studentProfile.credits_completed} Credits
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={loadDashboard}
              className="bg-white/10 text-white border-white/20 hover:bg-white/20 hover:border-white/30"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Refresh</span>
            </Button>
            <Link to={placement?.status === 'ACTIVE' ? '/app/student/reports' : '/app/student/application'}>
              <Button variant="secondary" size="sm">
                <span>
                  {placement?.status === 'ACTIVE'
                    ? 'Submit Progress Report'
                    : application
                    ? 'Manage Application'
                    : 'Start Application'}
                </span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Signature LEAP 5-Stage Internship Journey Timeline */}
      <div className="leap-stagger-2">
        <JourneyTimeline
          application={application}
          placement={placement}
          acceptedReportsCount={acceptedReportsCount}
          completion={completion}
        />
      </div>

      {/* Signature LEAP Next Required Action Panel */}
      <div className="leap-stagger-3">
        <NextActionPanel
          title={nextAction.title}
          description={nextAction.description}
          actionLabel={nextAction.actionLabel}
          actionTo={nextAction.actionTo}
          tone={nextAction.tone}
        />
      </div>

      {/* Main 12-Column Editorial Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 leap-stagger-4">
        {/* Left 7 Columns: Placement Dossier + Progress Reporting + Feedback */}
        <div className="lg:col-span-7 space-y-6">
          {/* Placement & Academic Supervision Dossier */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-teal-700" />
                <span>Placement & Supervision Dossier</span>
              </CardTitle>
              {placement && <StatusBadge status={placement.status} />}
            </CardHeader>

            {placement ? (
              <div className="space-y-4">
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-xs">
                  <div className="pb-3 border-b border-slate-100">
                    <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Host Organization
                    </dt>
                    <dd className="font-bold text-slate-900 mt-1 text-sm">
                      {organizationName || 'Assigned Organization'}
                    </dd>
                    <dd className="text-slate-600 mt-0.5">{opportunityTitle || 'Internship Role'}</dd>
                  </div>

                  <div className="pb-3 border-b border-slate-100">
                    <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Placement Schedule
                    </dt>
                    <dd className="font-semibold text-slate-900 mt-1 font-mono">
                      {formatDate(placement.start_date)} — {formatDate(placement.end_date)}
                    </dd>
                    <dd className="text-slate-500 mt-0.5">
                      Academic Year {application?.academic_year || 'Current'}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <UserCheck className="h-3.5 w-3.5 text-teal-700" />
                      <span>Academic Supervisor</span>
                    </dt>
                    <dd className="font-bold text-slate-900 mt-1">
                      {supervisorName || 'Pending Coordinator Assignment'}
                    </dd>
                    {supervisorDepartment && (
                      <dd className="text-slate-500 mt-0.5">{supervisorDepartment}</dd>
                    )}
                  </div>

                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Host Confirmation Note
                    </dt>
                    <dd className="text-slate-700 mt-1 leading-relaxed">
                      {placement.host_response_note || 'Awaiting host organization confirmation.'}
                    </dd>
                  </div>
                </dl>

                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
                  <Link to="/app/student/placement">
                    <Button variant="outline" size="sm">
                      Open Placement Record
                    </Button>
                  </Link>
                  {placement.status === 'ACTIVE' && (
                    <Link to="/app/student/reports">
                      <Button variant="primary" size="sm">
                        Log Progress Report
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <EmptyState
                icon={FileText}
                title="No Active Host Placement Yet"
                description={
                  application?.status === 'APPROVED'
                    ? 'Your application is approved. The LEAP Coordinator will assign your host placement and academic supervisor shortly.'
                    : 'Submit your LEAP internship application and await coordinator approval to receive a placement match.'
                }
                action={
                  <Link to="/app/student/application">
                    <Button variant="primary" size="sm">
                      {application ? 'View Application' : 'Create Application'}
                    </Button>
                  </Link>
                }
              />
            )}
          </Card>

          {/* Report Submission Progress & Supervisor Feedback */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-teal-700" />
                <span>Reporting Progress & Supervisor Feedback</span>
              </CardTitle>
              <Link
                to="/app/student/reports"
                className="text-xs font-semibold text-teal-700 hover:text-[#002B49] hover:underline"
              >
                All Reports ({reports.length})
              </Link>
            </CardHeader>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-5 mb-5 border-b border-slate-100">
              <ProgressBar
                label="Accepted Progress Reports"
                value={acceptedReportsCount}
                max={minRequiredReports}
                valueLabel={`${acceptedReportsCount} / ${minRequiredReports} min`}
                tone="teal"
              />
              <div className="flex items-center justify-between sm:justify-end gap-4 sm:border-l sm:border-slate-100 sm:pl-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Verified Workplace Hours
                  </p>
                  <p className="text-lg font-bold text-[#002B49] font-display tabular-nums">
                    {totalVerifiedHours} hrs
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Total Logged
                  </p>
                  <p className="text-lg font-bold text-slate-700 font-display tabular-nums">
                    {reports.length} report(s)
                  </p>
                </div>
              </div>
            </div>

            <ActivityTimeline
              items={recentFeedback.map((fb) => ({
                id: fb.id,
                status: fb.decision,
                body: fb.comments,
                timestamp: fb.created_at,
              }))}
              emptyMessage="No supervisor report feedback recorded yet."
            />
          </Card>
        </div>

        {/* Right 5 Columns: Completion Checklist & Recent Activity */}
        <div className="lg:col-span-5 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-4 w-4 text-teal-700" />
                <span>Completion Requirements</span>
              </CardTitle>
              {completion && <StatusBadge status={completion.status} />}
            </CardHeader>

            <ul className="divide-y divide-slate-100 text-xs">
              {[
                {
                  label: 'Accepted Progress Reports',
                  value: `${completion?.accepted_reports ?? acceptedReportsCount} / ${minRequiredReports}`,
                  met: (completion?.accepted_reports ?? acceptedReportsCount) >= minRequiredReports,
                },
                {
                  label: 'Verified Workplace Hours',
                  value: `${completion?.total_hours ?? totalVerifiedHours} hrs`,
                  met: (completion?.total_hours ?? totalVerifiedHours) > 0,
                },
                {
                  label: 'Host Organization Evaluation',
                  value: completion?.host_evaluation_received ? 'Received' : 'Pending',
                  met: Boolean(completion?.host_evaluation_received),
                },
                {
                  label: 'Final Academic Assessment',
                  value:
                    completion?.final_score !== null && completion?.final_score !== undefined
                      ? `${completion.final_score}%`
                      : 'Pending',
                  met: completion?.final_score !== null && completion?.final_score !== undefined,
                },
              ].map((req) => (
                <li key={req.label} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    {req.met ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    ) : (
                      <Circle className="h-4 w-4 text-slate-300 shrink-0" />
                    )}
                    <span className="text-slate-700 font-medium">{req.label}</span>
                  </div>
                  <span className="font-mono font-semibold text-slate-900 tabular-nums shrink-0">
                    {req.value}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-4 pt-3 border-t border-slate-100">
              <Link to="/app/student/completion" className="block">
                <Button variant="outline" size="sm" className="w-full">
                  Inspect Completion & Grades
                </Button>
              </Link>
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-teal-700" />
                <span>Recent Activity</span>
              </CardTitle>
              <Link
                to="/app/notifications"
                className="text-xs font-semibold text-teal-700 hover:text-[#002B49] hover:underline"
              >
                View All
              </Link>
            </CardHeader>

            {notifications.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-500">
                No recent notifications recorded.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100 text-xs">
                {notifications.map((n) => (
                  <li key={n.id} className="py-2.5 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-slate-900 leading-snug">{n.title}</p>
                      {!n.is_read && (
                        <span className="h-2 w-2 rounded-full bg-teal-600 shrink-0 mt-1" />
                      )}
                    </div>
                    <p className="text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">{n.body}</p>
                    <p className="text-[10px] font-mono text-slate-400 mt-1">
                      {formatDateTime(n.created_at)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
