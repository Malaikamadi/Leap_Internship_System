import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AppRole, ROLE_HOME_PATH } from '../types/auth';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles?: AppRole[];
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, roles, activeRole, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#002B49]" />
          <p className="text-xs font-semibold text-slate-500">
            Verifying session & access permissions...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !activeRole) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const hasAllowedRole = allowedRoles.some((r) => roles.includes(r));
    if (!hasAllowedRole) {
      return <Navigate to={ROLE_HOME_PATH[activeRole]} replace />;
    }
  }

  return <>{children}</>;
};
