import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types/auth';
import { 
  Bell, 
  LogOut, 
  User, 
  CheckCircle2, 
  Menu
} from 'lucide-react';
import { DEMO_NOTIFICATIONS } from '../../lib/mockData';

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user, role, logout, switchDemoRole } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const roleLabels: Record<UserRole, string> = {
    student: 'Student',
    coordinator: 'LEAP Coordinator',
    supervisor: 'Academic Supervisor',
    host: 'Host Representative',
    management: 'University Management',
    admin: 'System Admin',
  };

  const userNotifications = DEMO_NOTIFICATIONS.filter(
    (n) => n.user_id === user?.id || role === 'admin'
  );

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

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold tracking-wider text-teal-600 uppercase">
              Limkokwing University • Sierra Leone
            </span>
          </div>
          <h1 className="text-sm md:text-base font-bold text-[#002B49] leading-tight">
            Digital LEAP Internship Management System
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Interactive Academic Demo Role Switcher */}
        <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-1">
          <span className="text-xs font-medium text-slate-500 pl-2">Demo Role:</span>
          <select
            value={role || 'student'}
            onChange={(e) => switchDemoRole(e.target.value as UserRole)}
            className="text-xs font-semibold text-[#002B49] bg-transparent py-1 pr-3 focus:outline-none cursor-pointer"
          >
            <option value="student">Student (Madi A. Sesay)</option>
            <option value="coordinator">Coordinator (Dr. Bockarie)</option>
            <option value="supervisor">Supervisor (Ing. Kamara)</option>
            <option value="host">Host Org (SLCB Bank)</option>
            <option value="management">Management (Dean Agnes)</option>
            <option value="admin">Admin (LUCT IT)</option>
          </select>
        </div>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-none"
            aria-label="View notifications"
          >
            <Bell className="h-5 w-5" />
            {userNotifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-600"></span>
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl bg-white shadow-xl border border-slate-200 py-2 z-50">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Notifications ({userNotifications.length})
                </span>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {userNotifications.length === 0 ? (
                  <p className="px-4 py-6 text-center text-xs text-slate-500">No new notifications</p>
                ) : (
                  userNotifications.map((n) => (
                    <div key={n.id} className="p-3 hover:bg-slate-50 transition-colors">
                      <p className="text-xs font-semibold text-slate-800">{n.title}</p>
                      <p className="text-xs text-slate-600 mt-0.5">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-100 focus:outline-none"
          >
            <div className="h-8 w-8 rounded-full bg-[#002B49] text-white flex items-center justify-center font-bold text-xs ring-2 ring-slate-100">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="hidden text-left xl:block">
              <p className="text-xs font-semibold text-slate-800 leading-none">{user?.full_name}</p>
              <p className="text-[11px] font-medium text-teal-700 leading-tight mt-0.5">
                {role ? roleLabels[role] : 'Guest'}
              </p>
            </div>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white shadow-xl border border-slate-200 py-2 z-50">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-xs font-semibold text-slate-800">{user?.full_name}</p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                <div className="mt-1 flex items-center gap-1 text-[11px] font-medium text-teal-700">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>{role ? roleLabels[role] : ''}</span>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                }}
                className="w-full flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 text-left"
              >
                <User className="h-4 w-4 text-slate-400" />
                Profile Details
              </button>
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  logout();
                }}
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
