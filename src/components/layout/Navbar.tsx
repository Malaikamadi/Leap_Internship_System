import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
} from 'lucide-react';

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const navigate = useNavigate();
  const { user, roles, activeRole, signOut, setActiveRole } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);

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

  const unreadCount = notifications.filter((n) => !n.is_read).length;

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
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 backdrop-blur px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-none lg:hidden"
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3">
          <img
            src="/limkokwing-logo.png"
            alt="Limkokwing University Sierra Leone"
            className="h-9 w-auto object-contain hidden sm:block"
          />
          <div className="flex flex-col">
            <span className="text-[11px] font-semibold tracking-wider text-teal-700 uppercase">
              Limkokwing University • Sierra Leone
            </span>
            <h1 className="text-xs sm:text-sm font-bold text-[#002B49] leading-tight">
              Digital LEAP Internship Management System
            </h1>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Authorized Multi-Role Switcher (only shown when user has >1 database role) */}
        {roles.length > 1 && activeRole && (
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1">
            <Shield className="h-3.5 w-3.5 text-teal-600" />
            <span className="text-[11px] font-medium text-slate-500 hidden sm:inline">
              Active Role:
            </span>
            <select
              aria-label="Switch authorized role"
              value={activeRole}
              onChange={(e) => handleSwitchAuthorizedRole(e.target.value as AppRole)}
              className="text-xs font-semibold text-[#002B49] bg-transparent py-0.5 pr-2 focus:outline-none cursor-pointer"
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
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-none"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center rounded-full bg-teal-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-white shadow-xl border border-slate-200 py-2 z-50">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Notifications ({unreadCount} unread)
                </span>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 hover:underline"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <p className="px-4 py-6 text-center text-xs text-slate-500">
                    No notifications yet
                  </p>
                ) : (
                  notifications.map((n) => (
                    <button
                      type="button"
                      key={n.id}
                      onClick={() => handleMarkOneRead(n)}
                      className={`w-full text-left p-3 hover:bg-slate-50 transition-colors ${
                        !n.is_read ? 'bg-teal-50/40' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-slate-900">{n.title}</p>
                        {!n.is_read && (
                          <span className="h-2 w-2 rounded-full bg-teal-600 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{n.body}</p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {formatDateTime(n.created_at)}
                      </p>
                    </button>
                  ))
                )}
              </div>

              <div className="px-4 pt-2 mt-1 border-t border-slate-100 text-center">
                <Link
                  to="/app/notifications"
                  onClick={() => setShowNotifications(false)}
                  className="text-xs font-semibold text-[#002B49] hover:underline"
                >
                  View all notifications
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProfileMenu(!showProfileMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-100 focus:outline-none"
          >
            <div className="h-8 w-8 rounded-full bg-[#002B49] text-white flex items-center justify-center font-bold text-xs ring-2 ring-slate-100">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="hidden text-left xl:block">
              <p className="text-xs font-semibold text-slate-800 leading-none">
                {user?.full_name}
              </p>
              <p className="text-[11px] font-medium text-teal-700 leading-tight mt-0.5">
                {activeRole ? ROLE_LABELS[activeRole] : ''}
              </p>
            </div>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-60 rounded-xl bg-white shadow-xl border border-slate-200 py-2 z-50">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-900">{user?.full_name}</p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                <div className="mt-1 flex items-center gap-1 text-[11px] font-medium text-teal-700">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>{activeRole ? ROLE_LABELS[activeRole] : ''}</span>
                </div>
              </div>
              <Link
                to="/app/profile"
                onClick={() => setShowProfileMenu(false)}
                className="w-full flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50"
              >
                <User className="h-4 w-4 text-slate-400" />
                Account & Security
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 text-left"
              >
                <LogOut className="h-4 w-4 text-rose-500" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
