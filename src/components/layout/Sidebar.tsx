import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  FileText,
  Building2,
  CheckSquare,
  Users,
  BarChart3,
  ShieldCheck,
  Award,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Settings,
  Bell,
  User,
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggleCollapse }) => {
  const { activeRole } = useAuth();

  const getRoleLinks = () => {
    switch (activeRole) {
      case 'student':
        return [
          { name: 'Dashboard', to: '/app/student', end: true, icon: LayoutDashboard },
          { name: 'My Application', to: '/app/student/application', icon: FileText },
          { name: 'My Placement', to: '/app/student/placement', icon: Building2 },
          { name: 'Progress Reports', to: '/app/student/reports', icon: ClipboardList },
          { name: 'Completion & Grades', to: '/app/student/completion', icon: Award },
        ];
      case 'coordinator':
        return [
          { name: 'Dashboard', to: '/app/coordinator', end: true, icon: LayoutDashboard },
          { name: 'Application Reviews', to: '/app/coordinator/applications', icon: FileText },
          { name: 'Hosts & Opportunities', to: '/app/coordinator/opportunities', icon: Building2 },
          { name: 'Placements & Supervisors', to: '/app/coordinator/placements', icon: Users },
          { name: 'Monitoring & Completion', to: '/app/coordinator/monitoring', icon: CheckSquare },
        ];
      case 'supervisor':
        return [
          { name: 'Dashboard', to: '/app/supervisor', end: true, icon: LayoutDashboard },
          { name: 'Assigned Students', to: '/app/supervisor/students', icon: Users },
          { name: 'Review Reports', to: '/app/supervisor/reports', icon: ClipboardList },
          { name: 'Assessments & Completion', to: '/app/supervisor/assessments', icon: Award },
        ];
      case 'host':
        return [
          { name: 'Dashboard', to: '/app/host', end: true, icon: LayoutDashboard },
          { name: 'Interns & Confirmations', to: '/app/host/interns', icon: Users },
          { name: 'Evaluations & Concerns', to: '/app/host/evaluations', icon: Award },
        ];
      case 'management':
        return [
          { name: 'Executive Dashboard', to: '/app/management', end: true, icon: LayoutDashboard },
          { name: 'Institutional Reports', to: '/app/management/reports', icon: BarChart3 },
        ];
      case 'admin':
        return [
          { name: 'Admin Overview', to: '/app/admin', end: true, icon: LayoutDashboard },
          { name: 'Accounts & Roles', to: '/app/admin/users', icon: Users },
          { name: 'Policy Settings', to: '/app/admin/settings', icon: Settings },
          { name: 'Security Audit Logs', to: '/app/admin/audit', icon: ShieldCheck },
        ];
      default:
        return [];
    }
  };

  const sharedLinks = [
    { name: 'Notifications', to: '/app/notifications', icon: Bell },
    { name: 'My Profile', to: '/app/profile', icon: User },
  ];

  const navLinks = getRoleLinks();

  return (
    <aside
      className={cn(
        'relative flex flex-col bg-[#002B49] text-white border-r border-[#001f35] transition-all duration-300 ease-in-out select-none',
        isCollapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center px-4 border-b border-[#0f3c63]">
        <Link to="/" className="flex items-center gap-3 overflow-hidden">
          <img
            src="/limkokwing-logo.png"
            alt="LUCT Logo"
            className="h-9 w-9 shrink-0 rounded bg-white p-0.5 object-contain"
          />
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-extrabold tracking-wider uppercase text-white leading-tight">
                Digital LEAP
              </span>
              <span className="text-[10px] text-teal-300 font-medium tracking-wide">
                Limkokwing Sierra Leone
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* Role Menu */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        <div className="space-y-1">
          <div
            className={cn(
              'px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-teal-300/80',
              isCollapsed && 'text-center'
            )}
          >
            {isCollapsed ? '•••' : 'Workspace'}
          </div>
          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold transition-all',
                    isActive
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-[#083a60] hover:text-white'
                  )
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!isCollapsed && <span className="truncate">{item.name}</span>}
              </NavLink>
            );
          })}
        </div>

        <div className="space-y-1 pt-2 border-t border-[#0f3c63]">
          <div
            className={cn(
              'px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-teal-300/80',
              isCollapsed && 'text-center'
            )}
          >
            {isCollapsed ? '•••' : 'Account'}
          </div>
          {sharedLinks.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold transition-all',
                    isActive
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-[#083a60] hover:text-white'
                  )
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!isCollapsed && <span className="truncate">{item.name}</span>}
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* Collapse Toggle */}
      <div className="p-3 border-t border-[#0f3c63] flex justify-end">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#083a60] text-slate-300 hover:bg-teal-600 hover:text-white transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
    </aside>
  );
};
