import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { AppRole, ROLE_HOME_PATH, ROLE_LABELS } from '../../types/auth';
import { NotificationRow } from '../../types/database';
import { supabase } from '../../lib/supabase';
import { formatDateTime } from '../../lib/utils';
import {
  Bell,
  LogOut,
  User,
  CheckCircle2,
  Menu,
  CheckCheck,
  Shield,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';

interface NavbarProps {
  onToggleSidebar?: () => void;
}

const ROUTE_TITLES: Record<string, string> = {
  '/app/student': 'Dashboard',
  '/app/student/application': 'My Application',
  '/app/student/placement': 'My Placement',
  '/app/student/reports': 'Progress Reports',
  '/app/student/completion': 'Completion & Grades',
  '/app/coordinator': 'Operations Desk',
  '/app/coordinator/applications': 'Application Reviews',
  '/app/coordinator/opportunities': 'Hosts & Opportunities',
  '/app/coordinator/placements': 'Placements & Supervisors',
  '/app/coordinator/monitoring': 'Monitoring & Completion',
  '/app/supervisor': 'Supervision Desk',
  '/app/supervisor/students': 'Assigned Students',
  '/app/supervisor/reports': 'Review Reports',
  '/app/supervisor/assessments': 'Assessments & Completion',
  '/app/host': 'Host Workspace',
  '/app/host/interns': 'Interns & Confirmations',
  '/app/host/evaluations': 'Evaluations & Concerns',
  '/app/management': 'Executive Dashboard',
  '/app/management/reports': 'Institutional Reports',
  '/app/admin': 'Admin Console',
  '/app/admin/users': 'Accounts, Roles & Registry',
  '/app/admin/settings': 'Policy Settings',
  '/app/admin/audit': 'Security Audit Logs',
  '/app/notifications': 'Notifications',
  '/app/profile': 'My Profile',
};

function getInitials(name?: string | null): string {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, roles, activeRole, signOut, setActiveRole } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const dropdownContainerRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(15);
    if (data) {
      setNotifications(data as NotificationRow[]);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchNotifications();
    if (!user?.id) return;

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchNotifications]);

  // Close popovers on outside click or Escape key
  useEffect(() => {
    const handlePointerDown = (e: MouseEvent) => {
      if (
        dropdownContainerRef.current &&
        !dropdownContainerRef.current.contains(e.target as Node)
      ) {
        setShowNotifications(false);
        setShowProfileMenu(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowNotifications(false);
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const pageTitle = ROUTE_TITLES[location.pathname] || 'Workspace';
  const roleLabel = activeRole ? ROLE_LABELS[activeRole] : 'Portal';

  const handleMarkOneRead = async (n: NotificationRow) => {
    if (!n.is_read) {
      await supabase.from('notifications').update({ is_read: true }).eq('id', n.id);
      await fetchNotifications();
    }
    setShowNotifications(false);
    if (n.link) {
      navigate(n.link);
    }
  };

  const handleMarkAllRead = async () => {
    await supabase.rpc('mark_all_notifications_read');
    await fetchNotifications();
  };

  const handleSwitchAuthorizedRole = (nextRole: AppRole) => {
    if (setActiveRole(nextRole)) {
      navigate(ROLE_HOME_PATH[nextRole]);
    }
  };

  const handleSignOut = async () => {
    setShowProfileMenu(false);
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/90 bg-white px-4 lg:px-7">
      {/* Left: Mobile Trigger + Dynamic Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-2 rounded-md text-slate-600 hover:bg-slate-100 hover:text-[#002B49] focus:outline-none lg:hidden"
          aria-label="Toggle navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs min-w-0">
          <Link
            to={activeRole ? ROLE_HOME_PATH[activeRole] : '/'}
            className="font-semibold text-slate-500 hover:text-[#002B49] transition-colors hidden sm:inline truncate"
          >
            {roleLabel}
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-slate-300 hidden sm:inline shrink-0" />
          <span className="font-bold text-[#002B49] truncate font-display text-sm">
            {pageTitle}
          </span>
        </nav>
      </div>

      {/* Right: Role Switcher, Notifications, Profile Menu */}
      <div ref={dropdownContainerRef} className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Authorized Multi-Role Switcher (only shown when user has >1 database role) */}
        {roles.length > 1 && activeRole && (
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5">
            <Shield className="h-3.5 w-3.5 text-teal-700 shrink-0" />
            <span className="text-[11px] font-medium text-slate-500 hidden md:inline">Role:</span>
            <select
              aria-label="Switch authorized role"
              value={activeRole}
              onChange={(e) => handleSwitchAuthorizedRole(e.target.value as AppRole)}
              className="text-xs font-semibold text-[#002B49] bg-transparent pr-1 focus:outline-none cursor-pointer"
            >
              {roles.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowNotifications((prev) => !prev);
              setShowProfileMenu(false);
            }}
            className="relative p-2 rounded-md text-slate-600 hover:bg-slate-100 hover:text-[#002B49] transition-colors"
            aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`}
            aria-expanded={showNotifications}
          >
            <Bell className="h-[18px] w-[18px]" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded bg-teal-700 px-1 text-[10px] font-bold text-white tabular-nums">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-lg bg-white shadow-dropdown border border-slate-200 z-50 overflow-hidden leap-dropdown-enter">
              <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  Notifications ({unreadCount} unread)
                </span>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 hover:text-[#002B49]"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <p className="px-4 py-8 text-center text-xs text-slate-500">
                    You have no notifications yet.
                  </p>
                ) : (
                  notifications.map((n) => (
                    <button
                      type="button"
                      key={n.id}
                      onClick={() => handleMarkOneRead(n)}
                      className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors ${
                        !n.is_read ? 'bg-teal-50/40' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-semibold text-slate-900 leading-snug">
                          {n.title}
                        </p>
                        {!n.is_read && (
                          <span className="h-2 w-2 rounded-full bg-teal-600 shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
                        {n.body}
                      </p>
                      <p className="text-[10px] font-mono text-slate-400 mt-1.5">
                        {formatDateTime(n.created_at)}
                      </p>
                    </button>
                  ))
                )}
              </div>

              <div className="px-4 py-2.5 bg-slate-50/70 border-t border-slate-100 text-center">
                <Link
                  to="/app/notifications"
                  onClick={() => setShowNotifications(false)}
                  className="text-xs font-semibold text-[#002B49] hover:text-teal-700"
                >
                  Open Notification Center
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-slate-200 hidden sm:block" aria-hidden="true" />

        {/* User Profile Popover */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowProfileMenu((prev) => !prev);
              setShowNotifications(false);
            }}
            aria-expanded={showProfileMenu}
            className="flex items-center gap-2.5 py-1 pl-1 pr-2 rounded-md hover:bg-slate-100 transition-colors"
          >
            <div className="h-8 w-8 rounded-md bg-[#002B49] text-white flex items-center justify-center font-bold text-xs font-display tracking-wide">
              {getInitials(user?.full_name)}
            </div>
            <div className="hidden text-left md:block max-w-[160px]">
              <p className="text-xs font-semibold text-slate-900 leading-tight truncate">
                {user?.full_name}
              </p>
              <p className="text-[11px] font-medium text-slate-500 leading-tight truncate">
                {roleLabel}
              </p>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 hidden md:block" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-64 rounded-lg bg-white shadow-dropdown border border-slate-200 py-1.5 z-50 leap-dropdown-enter">
              <div className="px-4 py-3 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900">{user?.full_name}</p>
                <p className="text-[11px] font-mono text-slate-500 truncate mt-0.5">
                  {user?.email}
                </p>
                <div className="mt-2 inline-flex items-center gap-1.5 rounded bg-teal-50 border border-teal-200/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-teal-800">
                  <CheckCircle2 className="h-3 w-3 text-teal-600" />
                  <span>{roleLabel}</span>
                </div>
              </div>

              <div className="py-1">
                <Link
                  to="/app/profile"
                  onClick={() => setShowProfileMenu(false)}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-[#002B49]"
                >
                  <User className="h-4 w-4 text-slate-400" />
                  <span>Account & Profile</span>
                </Link>
              </div>

              <div className="border-t border-slate-100 pt-1">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 text-left"
                >
                  <LogOut className="h-4 w-4 text-rose-600" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
