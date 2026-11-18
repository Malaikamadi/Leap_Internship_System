import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ROLE_LABELS } from '../../types/auth';
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
  X,
  LucideIcon,
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface SidebarProps {
  isCollapsed: boolean;
  isMobile?: boolean;
  onToggleCollapse: () => void;
  onNavigate?: () => void;
}

interface NavGroup {
  label: string;
  items: Array<{
    name: string;
    to: string;
    end?: boolean;
    icon: LucideIcon;
  }>;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  isMobile = false,
  onToggleCollapse,
  onNavigate,
}) => {
  const { activeRole } = useAuth();

  const getRoleGroups = (): NavGroup[] => {
    switch (activeRole) {
      case 'student':
        return [
          {
            label: 'Overview',
            items: [{ name: 'Dashboard', to: '/app/student', end: true, icon: LayoutDashboard }],
          },
          {
            label: 'Internship Journey',
            items: [
              { name: 'My Application', to: '/app/student/application', icon: FileText },
              { name: 'My Placement', to: '/app/student/placement', icon: Building2 },
              { name: 'Progress Reports', to: '/app/student/reports', icon: ClipboardList },
              { name: 'Completion & Grades', to: '/app/student/completion', icon: Award },
            ],
          },
        ];
      case 'coordinator':
        return [
          {
            label: 'Overview',
            items: [{ name: 'Operations Desk', to: '/app/coordinator', end: true, icon: LayoutDashboard }],
          },
          {
            label: 'Intake & Matching',
            items: [
              { name: 'Application Reviews', to: '/app/coordinator/applications', icon: FileText },
              { name: 'Hosts & Opportunities', to: '/app/coordinator/opportunities', icon: Building2 },
              { name: 'Placements & Supervisors', to: '/app/coordinator/placements', icon: Users },
            ],
          },
          {
            label: 'Oversight',
            items: [
              { name: 'Monitoring & Completion', to: '/app/coordinator/monitoring', icon: CheckSquare },
            ],
          },
        ];
      case 'supervisor':
        return [
          {
            label: 'Overview',
            items: [{ name: 'Supervision Desk', to: '/app/supervisor', end: true, icon: LayoutDashboard }],
          },
          {
            label: 'Academic Supervision',
            items: [
              { name: 'Assigned Students', to: '/app/supervisor/students', icon: Users },
              { name: 'Review Reports', to: '/app/supervisor/reports', icon: ClipboardList },
              { name: 'Assessments & Completion', to: '/app/supervisor/assessments', icon: Award },
            ],
          },
        ];
      case 'host':
        return [
          {
            label: 'Overview',
            items: [{ name: 'Host Workspace', to: '/app/host', end: true, icon: LayoutDashboard }],
          },
          {
            label: 'Workplace Management',
            items: [
              { name: 'Interns & Confirmations', to: '/app/host/interns', icon: Users },
              { name: 'Evaluations & Concerns', to: '/app/host/evaluations', icon: Award },
            ],
          },
        ];
      case 'management':
        return [
          {
            label: 'Institutional Analytics',
            items: [
              { name: 'Executive Dashboard', to: '/app/management', end: true, icon: LayoutDashboard },
              { name: 'Institutional Reports', to: '/app/management/reports', icon: BarChart3 },
            ],
          },
        ];
      case 'admin':
        return [
          {
            label: 'Overview',
            items: [{ name: 'Admin Console', to: '/app/admin', end: true, icon: LayoutDashboard }],
          },
          {
            label: 'Identity & Governance',
            items: [
              { name: 'Accounts, Roles & Registry', to: '/app/admin/users', icon: Users },
              { name: 'Policy Settings', to: '/app/admin/settings', icon: Settings },
              { name: 'Security Audit Logs', to: '/app/admin/audit', icon: ShieldCheck },
            ],
          },
        ];
      default:
        return [];
    }
  };

  const roleGroups = getRoleGroups();
  const accountGroup: NavGroup = {
    label: 'Account',
    items: [
      { name: 'Notifications', to: '/app/notifications', icon: Bell },
      { name: 'My Profile', to: '/app/profile', icon: User },
    ],
  };

  const allGroups = [...roleGroups, accountGroup];

  return (
    <aside
      aria-label="Workspace navigation"
      className={cn(
        'relative flex flex-col bg-[#002B49] text-white border-r border-[#001a2e] transition-all duration-200 ease-out select-none h-full',
        isCollapsed ? 'w-[72px]' : 'w-64'
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-white/10">
        <Link to="/" className="flex items-center gap-3 overflow-hidden min-w-0">
          <img
            src="/limkokwing-logo.png"
            alt="LUCT Logo"
            className="h-9 w-9 shrink-0 rounded bg-white p-0.5 object-contain"
          />
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-[13px] font-extrabold tracking-wider uppercase text-white leading-tight font-display truncate">
                Digital LEAP
              </span>
              <span className="text-[10px] text-teal-300 font-medium tracking-wide truncate">
                Limkokwing Sierra Leone
              </span>
            </div>
          )}
        </Link>

        {isMobile && (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label="Close navigation menu"
            className="p-1.5 rounded-md text-slate-300 hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Role Context Strip */}
      {!isCollapsed && activeRole && (
        <div className="px-4 py-2.5 bg-[#001f35]/70 border-b border-white/10">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            Active Portal
          </p>
          <p className="text-xs font-bold text-teal-300 mt-0.5 truncate">
            {ROLE_LABELS[activeRole]}
          </p>
        </div>
      )}

      {/* Navigation Groups */}
      <nav className="flex-1 overflow-y-auto py-4 px-2.5 space-y-5">
        {allGroups.map((group, groupIdx) => (
          <div
            key={group.label}
            className={cn(
              'space-y-1',
              groupIdx === allGroups.length - 1 && 'pt-4 border-t border-white/10'
            )}
          >
            <div
              className={cn(
                'px-3 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400',
                isCollapsed && 'text-center px-0'
              )}
            >
              {isCollapsed ? '—' : group.label}
            </div>
            {group.items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={onNavigate}
                  title={isCollapsed ? item.name : undefined}
                  className={({ isActive }) =>
                    cn(
                      'relative group flex items-center gap-3 rounded-md px-3 py-2 text-xs font-semibold transition-all duration-150',
                      isCollapsed && 'justify-center px-2',
                      isActive
                        ? 'bg-white/[0.14] text-white font-bold'
                        : 'text-slate-200 hover:bg-white/[0.07] hover:text-white'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <span
                          className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r bg-teal-400"
                          aria-hidden="true"
                        />
                      )}
                      <Icon
                        className={cn(
                          'h-4 w-4 shrink-0 transition-colors',
                          isActive
                            ? 'text-teal-300'
                            : 'text-slate-400 group-hover:text-teal-300'
                        )}
                      />
                      {!isCollapsed && <span className="truncate">{item.name}</span>}
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Desktop Collapse Toggle */}
      {!isMobile && (
        <div className="p-3 border-t border-white/10 flex items-center justify-between">
          {!isCollapsed && (
            <span className="text-[10px] font-mono text-slate-400 px-1">LUCT-SL • LEAP</span>
          )}
          <button
            type="button"
            onClick={onToggleCollapse}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-md bg-white/[0.07] text-slate-300 hover:bg-teal-700 hover:text-white transition-colors',
              isCollapsed && 'mx-auto'
            )}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>
      )}
    </aside>
  );
};
