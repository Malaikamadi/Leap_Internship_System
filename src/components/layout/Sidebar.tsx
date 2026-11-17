import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  LayoutDashboard, 
  FileText, 
  Building2, 
  CheckSquare, 
  Users, 
  GraduationCap, 
  BarChart3, 
  ShieldCheck, 
  Award, 
  ChevronLeft, 
  ChevronRight,
  ClipboardList,
  Sparkles
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, onToggleCollapse }) => {
  const { role } = useAuth();

  const getNavLinks = () => {
    switch (role) {
      case 'student':
        return [
          { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
          { name: 'My Application', to: '/application', icon: FileText },
          { name: 'Internship Placement', to: '/placement', icon: Building2 },
          { name: 'Progress Reports', to: '/reports', icon: ClipboardList },
          { name: 'Assessment & Grades', to: '/assessment', icon: Award },
        ];
      case 'coordinator':
        return [
          { name: 'Overview', to: '/dashboard', icon: LayoutDashboard },
          { name: 'Student Applications', to: '/applications', icon: FileText, badge: '2 New' },
          { name: 'Placements & Matching', to: '/placements', icon: Building2 },
          { name: 'Supervisor Allocation', to: '/supervisors', icon: Users },
          { name: 'Host Organizations', to: '/hosts', icon: Building2 },
          { name: 'Progress & Completion', to: '/completion', icon: CheckSquare },
          { name: 'Faculty Reports', to: '/reports-analytics', icon: BarChart3 },
        ];
      case 'supervisor':
        return [
          { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
          { name: 'Assigned Interns', to: '/supervisor/students', icon: Users },
          { name: 'Review Reports', to: '/supervisor/reports', icon: ClipboardList, badge: '1 Due' },
          { name: 'Host Appraisals', to: '/supervisor/evaluations', icon: CheckSquare },
          { name: 'Record Assessment', to: '/supervisor/assessments', icon: Award },
        ];
      case 'host':
        return [
          { name: 'Company Portal', to: '/dashboard', icon: LayoutDashboard },
          { name: 'Assigned Interns', to: '/host/interns', icon: Users },
          { name: 'Confirm Placements', to: '/host/confirmations', icon: CheckSquare },
          { name: 'Submit Evaluations', to: '/host/evaluations', icon: Award },
        ];
      case 'management':
        return [
          { name: 'Executive Overview', to: '/dashboard', icon: LayoutDashboard },
          { name: 'Internship Stats', to: '/management/stats', icon: BarChart3 },
          { name: 'Faculty Distribution', to: '/management/faculties', icon: GraduationCap },
          { name: 'Completion Rates', to: '/management/completion', icon: Award },
          { name: 'Export Reports', to: '/management/reports', icon: FileText },
        ];
      case 'admin':
        return [
          { name: 'Admin Console', to: '/dashboard', icon: LayoutDashboard },
          { name: 'User Management', to: '/admin/users', icon: Users },
          { name: 'Roles & Privileges', to: '/admin/roles', icon: ShieldCheck },
          { name: 'Audit Security Logs', to: '/admin/audit', icon: ClipboardList },
          { name: 'System Settings', to: '/admin/settings', icon: Sparkles },
        ];
      default:
        return [{ name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard }];
    }
  };

  const navLinks = getNavLinks();

  return (
    <aside
      className={cn(
        'relative flex flex-col bg-[#002B49] text-white border-r border-[#001f35] transition-all duration-300 ease-in-out select-none',
        isCollapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center px-4 border-b border-[#0f3c63]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-500 font-black text-slate-900 shadow-md">
            LP
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-extrabold tracking-wider uppercase text-white leading-tight">
                LEAP Portal
              </span>
              <span className="text-[10px] text-teal-300 font-medium tracking-wide">
                Limkokwing SL
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <div className={cn("px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-teal-300/70", isCollapsed && "text-center")}>
          {isCollapsed ? '•••' : 'Main Menu'}
        </div>
        {navLinks.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold transition-all relative',
                  isActive
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-[#083a60] hover:text-white'
                )
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!isCollapsed && <span className="truncate">{item.name}</span>}
              {!isCollapsed && item.badge && (
                <span className="ml-auto rounded-full bg-teal-400/20 px-2 py-0.5 text-[10px] font-bold text-teal-200">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Collapse Toggle */}
      <div className="p-3 border-t border-[#0f3c63] flex justify-end">
        <button
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
