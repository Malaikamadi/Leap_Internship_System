import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { RoleGuard } from './RoleGuard';
import { AppLayout } from '../components/layout/AppLayout';

// Auth Pages
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';

// Dashboards
import { StudentDashboard } from '../pages/dashboard/StudentDashboard';
import { CoordinatorDashboard } from '../pages/dashboard/CoordinatorDashboard';
import { SupervisorDashboard } from '../pages/dashboard/SupervisorDashboard';
import { HostDashboard } from '../pages/dashboard/HostDashboard';
import { ManagementDashboard } from '../pages/dashboard/ManagementDashboard';
import { AdminDashboard } from '../pages/dashboard/AdminDashboard';

// Common Placeholder
import { PlaceholderView } from '../pages/common/PlaceholderView';

export const AppRoutes: React.FC = () => {
  const { role } = useAuth();

  const renderDashboardByRole = () => {
    switch (role) {
      case 'student':
        return <StudentDashboard />;
      case 'coordinator':
        return <CoordinatorDashboard />;
      case 'supervisor':
        return <SupervisorDashboard />;
      case 'host':
        return <HostDashboard />;
      case 'management':
        return <ManagementDashboard />;
      case 'admin':
        return <AdminDashboard />;
      default:
        return <StudentDashboard />;
    }
  };

  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected App Routes */}
      <Route
        path="/"
        element={
          <RoleGuard>
            <AppLayout />
          </RoleGuard>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={renderDashboardByRole()} />

        {/* Student Specific Routes */}
        <Route
          path="application"
          element={
            <RoleGuard allowedRoles={['student', 'coordinator', 'admin']}>
              <PlaceholderView
                title="LEAP Internship Application Form"
                moduleName="Student Module"
                description="Allows students to prepare drafts, validate prerequisite credits/GPA, submit industry preferences, and track decision status."
              />
            </RoleGuard>
          }
        />
        <Route
          path="placement"
          element={
            <RoleGuard allowedRoles={['student', 'coordinator', 'admin']}>
              <PlaceholderView
                title="My Placement Details"
                moduleName="Student Module"
                description="Displays confirmed host organization placement, work terms, corporate mentor, and assigned university academic supervisor."
              />
            </RoleGuard>
          }
        />
        <Route
          path="reports"
          element={
            <RoleGuard allowedRoles={['student', 'supervisor', 'coordinator', 'admin']}>
              <PlaceholderView
                title="Bi-Weekly Progress Reports & Logbooks"
                moduleName="Progress Module"
                description="Allows undergraduate interns to document completed tasks, technical competencies gained, weekly challenges, and review supervisor feedback."
              />
            </RoleGuard>
          }
        />
        <Route
          path="assessment"
          element={
            <RoleGuard allowedRoles={['student', 'supervisor', 'coordinator', 'management', 'admin']}>
              <PlaceholderView
                title="Assessment & Completion Status"
                moduleName="Assessment Module"
                description="Aggregated final grading breakdown combining Host Organization appraisal (40%) and Academic Supervisor evaluation (60%)."
              />
            </RoleGuard>
          }
        />

        {/* Coordinator Routes */}
        <Route
          path="applications"
          element={
            <RoleGuard allowedRoles={['coordinator', 'admin']}>
              <PlaceholderView
                title="Student Application Reviews"
                moduleName="Coordinator Module"
                description="Faculty review queue to verify academic eligibility, review statements of intent, approve, reject, or request applicant corrections."
              />
            </RoleGuard>
          }
        />
        <Route
          path="placements"
          element={
            <RoleGuard allowedRoles={['coordinator', 'admin']}>
              <PlaceholderView
                title="Placements & Host Matching"
                moduleName="Coordinator Module"
                description="Match approved students to open host partner opportunities, verify company slots, and issue formal university placement letters."
              />
            </RoleGuard>
          }
        />
        <Route
          path="supervisors"
          element={
            <RoleGuard allowedRoles={['coordinator', 'admin']}>
              <PlaceholderView
                title="Academic Supervisor Allocation"
                moduleName="Coordinator Module"
                description="Assign faculty lecturers to supervise active students according to departmental load balance and quota limits."
              />
            </RoleGuard>
          }
        />
        <Route
          path="hosts"
          element={
            <RoleGuard allowedRoles={['coordinator', 'admin']}>
              <PlaceholderView
                title="Host Organizations Directory"
                moduleName="Coordinator Module"
                description="Manage registered industry partners, agreements, contact persons, and internship quota allocations across Sierra Leone."
              />
            </RoleGuard>
          }
        />
        <Route
          path="completion"
          element={
            <RoleGuard allowedRoles={['coordinator', 'management', 'admin']}>
              <PlaceholderView
                title="Internship Completion & Certification"
                moduleName="Coordinator Module"
                description="Review finalized student evaluations, verified logbook hours, and generate official LEAP completion certificates."
              />
            </RoleGuard>
          }
        />
        <Route
          path="reports-analytics"
          element={
            <RoleGuard allowedRoles={['coordinator', 'management', 'admin']}>
              <PlaceholderView
                title="Faculty Analytics & Accreditation Reports"
                moduleName="Reporting Module"
                description="Generate aggregate reports on host evaluations, student distribution, and academic learning outcomes."
              />
            </RoleGuard>
          }
        />

        {/* Supervisor Routes */}
        <Route
          path="supervisor/students"
          element={
            <RoleGuard allowedRoles={['supervisor', 'coordinator', 'admin']}>
              <PlaceholderView
                title="Supervised Students Directory"
                moduleName="Supervisor Module"
                description="List of students actively supervised by your academic department with contact info and workplace locations."
              />
            </RoleGuard>
          }
        />
        <Route
          path="supervisor/reports"
          element={
            <RoleGuard allowedRoles={['supervisor', 'coordinator', 'admin']}>
              <PlaceholderView
                title="Logbook Review & Feedback"
                moduleName="Supervisor Module"
                description="Review submitted student bi-weekly progress reports, provide constructive feedback, or request corrections."
              />
            </RoleGuard>
          }
        />
        <Route
          path="supervisor/evaluations"
          element={
            <RoleGuard allowedRoles={['supervisor', 'coordinator', 'admin']}>
              <PlaceholderView
                title="Host Organization Appraisals"
                moduleName="Supervisor Module"
                description="View workplace performance appraisal forms submitted by host company supervisors."
              />
            </RoleGuard>
          }
        />
        <Route
          path="supervisor/assessments"
          element={
            <RoleGuard allowedRoles={['supervisor', 'coordinator', 'admin']}>
              <PlaceholderView
                title="Record Academic Assessment"
                moduleName="Supervisor Module"
                description="Enter marks for logbook quality, presentation/viva, and combine with host appraisal scores."
              />
            </RoleGuard>
          }
        />

        {/* Host Routes */}
        <Route
          path="host/interns"
          element={
            <RoleGuard allowedRoles={['host', 'admin']}>
              <PlaceholderView
                title="Host Interns Directory"
                moduleName="Host Module"
                description="Overview of students placed at your company with department details and university supervisor contacts."
              />
            </RoleGuard>
          }
        />
        <Route
          path="host/confirmations"
          element={
            <RoleGuard allowedRoles={['host', 'admin']}>
              <PlaceholderView
                title="Placement Confirmations"
                moduleName="Host Module"
                description="Confirm acceptance of nominated students and assign workplace mentors."
              />
            </RoleGuard>
          }
        />
        <Route
          path="host/evaluations"
          element={
            <RoleGuard allowedRoles={['host', 'admin']}>
              <PlaceholderView
                title="Workplace Performance Evaluation"
                moduleName="Host Module"
                description="Submit professional conduct, punctuality, technical skill, and initiative ratings for assigned student interns."
              />
            </RoleGuard>
          }
        />

        {/* Management Routes */}
        <Route
          path="management/stats"
          element={
            <RoleGuard allowedRoles={['management', 'admin']}>
              <PlaceholderView
                title="Institutional Statistics"
                moduleName="Management Module"
                description="High-level metrics on student participation, faculty breakdown, and industry partner engagement."
              />
            </RoleGuard>
          }
        />
        <Route
          path="management/faculties"
          element={
            <RoleGuard allowedRoles={['management', 'admin']}>
              <PlaceholderView
                title="Faculty Distribution"
                moduleName="Management Module"
                description="Cross-faculty comparison of placement rates and partner industry alignment."
              />
            </RoleGuard>
          }
        />
        <Route
          path="management/completion"
          element={
            <RoleGuard allowedRoles={['management', 'admin']}>
              <PlaceholderView
                title="Completion & Graduation Eligibility"
                moduleName="Management Module"
                description="Track student completion records required for degree conferment."
              />
            </RoleGuard>
          }
        />
        <Route
          path="management/reports"
          element={
            <RoleGuard allowedRoles={['management', 'admin']}>
              <PlaceholderView
                title="Executive Reports & Export"
                moduleName="Management Module"
                description="Download university executive summaries and accreditation compliance documents."
              />
            </RoleGuard>
          }
        />

        {/* Admin Routes */}
        <Route
          path="admin/users"
          element={
            <RoleGuard allowedRoles={['admin']}>
              <PlaceholderView
                title="User Account Management"
                moduleName="Admin Module"
                description="Provision staff accounts, activate or deactivate user logins, and manage email credentials."
              />
            </RoleGuard>
          }
        />
        <Route
          path="admin/roles"
          element={
            <RoleGuard allowedRoles={['admin']}>
              <PlaceholderView
                title="Role-Based Access Control (RBAC)"
                moduleName="Admin Module"
                description="Review security permissions matrix, assign roles, and audit access boundaries."
              />
            </RoleGuard>
          }
        />
        <Route
          path="admin/audit"
          element={
            <RoleGuard allowedRoles={['admin']}>
              <PlaceholderView
                title="Security Audit Logs"
                moduleName="Admin Module"
                description="Immutable log of all user authentication events, application decisions, placement changes, and role assignments."
              />
            </RoleGuard>
          }
        />
        <Route
          path="admin/settings"
          element={
            <RoleGuard allowedRoles={['admin']}>
              <PlaceholderView
                title="System Configuration & Term Settings"
                moduleName="Admin Module"
                description="Configure active academic years, application submission deadlines, and grading criteria weights."
              />
            </RoleGuard>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
};
