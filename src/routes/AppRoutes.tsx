import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ROLE_HOME_PATH } from '../types/auth';
import { RoleGuard } from './RoleGuard';
import { AppLayout } from '../components/layout/AppLayout';

// Public Pages
import { LandingPage } from '../pages/LandingPage';
import { LoginPage } from '../pages/auth/LoginPage';

// Dashboards
import { StudentDashboard } from '../pages/dashboard/StudentDashboard';
import { CoordinatorDashboard } from '../pages/dashboard/CoordinatorDashboard';
import { SupervisorDashboard } from '../pages/dashboard/SupervisorDashboard';
import { HostDashboard } from '../pages/dashboard/HostDashboard';
import { ManagementDashboard } from '../pages/dashboard/ManagementDashboard';
import { AdminDashboard } from '../pages/dashboard/AdminDashboard';

// Student Pages
import { StudentApplicationPage } from '../pages/student/StudentApplicationPage';
import { StudentPlacementPage } from '../pages/student/StudentPlacementPage';
import { StudentReportsPage } from '../pages/student/StudentReportsPage';
import { StudentCompletionPage } from '../pages/student/StudentCompletionPage';

// Coordinator Pages
import { CoordinatorApplicationsPage } from '../pages/coordinator/CoordinatorApplicationsPage';
import { CoordinatorOpportunitiesPage } from '../pages/coordinator/CoordinatorOpportunitiesPage';
import { CoordinatorPlacementsPage } from '../pages/coordinator/CoordinatorPlacementsPage';
import { CoordinatorMonitoringPage } from '../pages/coordinator/CoordinatorMonitoringPage';

// Supervisor Pages
import { SupervisorStudentsPage } from '../pages/supervisor/SupervisorStudentsPage';
import { SupervisorReportsPage } from '../pages/supervisor/SupervisorReportsPage';
import { SupervisorAssessmentsPage } from '../pages/supervisor/SupervisorAssessmentsPage';

// Host Pages
import { HostInternsPage } from '../pages/host/HostInternsPage';
import { HostEvaluationsPage } from '../pages/host/HostEvaluationsPage';

// Management Pages
import { ManagementReportsPage } from '../pages/management/ManagementReportsPage';

// Admin Pages
import { AdminUsersPage } from '../pages/admin/AdminUsersPage';
import { AdminSettingsPage } from '../pages/admin/AdminSettingsPage';
import { AdminAuditPage } from '../pages/admin/AdminAuditPage';

// Shared Authenticated Pages
import { NotificationsPage } from '../pages/common/NotificationsPage';
import { ProfilePage } from '../pages/common/ProfilePage';

export const AppRoutes: React.FC = () => {
  const { activeRole } = useAuth();
  const homePath = activeRole ? ROLE_HOME_PATH[activeRole] : '/login';

  return (
    <Routes>
      {/* Default Public Landing Route */}
      <Route path="/" element={<LandingPage />} />

      {/* Single Login Route */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected Workspace Routes */}
      <Route
        path="/app"
        element={
          <RoleGuard>
            <AppLayout />
          </RoleGuard>
        }
      >
        <Route index element={<Navigate to={homePath} replace />} />

        {/* Student Workspace */}
        <Route
          path="student"
          element={
            <RoleGuard allowedRoles={['student']}>
              <StudentDashboard />
            </RoleGuard>
          }
        />
        <Route
          path="student/application"
          element={
            <RoleGuard allowedRoles={['student']}>
              <StudentApplicationPage />
            </RoleGuard>
          }
        />
        <Route
          path="student/placement"
          element={
            <RoleGuard allowedRoles={['student']}>
              <StudentPlacementPage />
            </RoleGuard>
          }
        />
        <Route
          path="student/reports"
          element={
            <RoleGuard allowedRoles={['student']}>
              <StudentReportsPage />
            </RoleGuard>
          }
        />
        <Route
          path="student/completion"
          element={
            <RoleGuard allowedRoles={['student']}>
              <StudentCompletionPage />
            </RoleGuard>
          }
        />

        {/* Coordinator Workspace */}
        <Route
          path="coordinator"
          element={
            <RoleGuard allowedRoles={['coordinator']}>
              <CoordinatorDashboard />
            </RoleGuard>
          }
        />
        <Route
          path="coordinator/applications"
          element={
            <RoleGuard allowedRoles={['coordinator']}>
              <CoordinatorApplicationsPage />
            </RoleGuard>
          }
        />
        <Route
          path="coordinator/opportunities"
          element={
            <RoleGuard allowedRoles={['coordinator']}>
              <CoordinatorOpportunitiesPage />
            </RoleGuard>
          }
        />
        <Route
          path="coordinator/placements"
          element={
            <RoleGuard allowedRoles={['coordinator']}>
              <CoordinatorPlacementsPage />
            </RoleGuard>
          }
        />
        <Route
          path="coordinator/monitoring"
          element={
            <RoleGuard allowedRoles={['coordinator']}>
              <CoordinatorMonitoringPage />
            </RoleGuard>
          }
        />

        {/* Academic Supervisor Workspace */}
        <Route
          path="supervisor"
          element={
            <RoleGuard allowedRoles={['supervisor']}>
              <SupervisorDashboard />
            </RoleGuard>
          }
        />
        <Route
          path="supervisor/students"
          element={
            <RoleGuard allowedRoles={['supervisor']}>
              <SupervisorStudentsPage />
            </RoleGuard>
          }
        />
        <Route
          path="supervisor/reports"
          element={
            <RoleGuard allowedRoles={['supervisor']}>
              <SupervisorReportsPage />
            </RoleGuard>
          }
        />
        <Route
          path="supervisor/assessments"
          element={
            <RoleGuard allowedRoles={['supervisor']}>
              <SupervisorAssessmentsPage />
            </RoleGuard>
          }
        />

        {/* Host Organization Workspace */}
        <Route
          path="host"
          element={
            <RoleGuard allowedRoles={['host']}>
              <HostDashboard />
            </RoleGuard>
          }
        />
        <Route
          path="host/interns"
          element={
            <RoleGuard allowedRoles={['host']}>
              <HostInternsPage />
            </RoleGuard>
          }
        />
        <Route
          path="host/evaluations"
          element={
            <RoleGuard allowedRoles={['host']}>
              <HostEvaluationsPage />
            </RoleGuard>
          }
        />

        {/* University Management Workspace */}
        <Route
          path="management"
          element={
            <RoleGuard allowedRoles={['management']}>
              <ManagementDashboard />
            </RoleGuard>
          }
        />
        <Route
          path="management/reports"
          element={
            <RoleGuard allowedRoles={['management']}>
              <ManagementReportsPage />
            </RoleGuard>
          }
        />

        {/* System Administrator Workspace */}
        <Route
          path="admin"
          element={
            <RoleGuard allowedRoles={['admin']}>
              <AdminDashboard />
            </RoleGuard>
          }
        />
        <Route
          path="admin/users"
          element={
            <RoleGuard allowedRoles={['admin']}>
              <AdminUsersPage />
            </RoleGuard>
          }
        />
        <Route
          path="admin/settings"
          element={
            <RoleGuard allowedRoles={['admin']}>
              <AdminSettingsPage />
            </RoleGuard>
          }
        />
        <Route
          path="admin/audit"
          element={
            <RoleGuard allowedRoles={['admin']}>
              <AdminAuditPage />
            </RoleGuard>
          }
        />

        {/* Shared Authenticated Routes */}
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="profile" element={<ProfilePage />} />

        <Route path="*" element={<Navigate to={homePath} replace />} />
      </Route>

      {/* Catch-all redirects to public landing page */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
