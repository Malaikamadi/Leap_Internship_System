import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { AppRole, ROLE_HOME_PATH, UserProfile } from '../types/auth';

interface SignInResult {
  ok: boolean;
  error?: string;
  redirectPath?: string;
  roles?: AppRole[];
}

interface AuthContextType {
  session: Session | null;
  user: UserProfile | null;
  roles: AppRole[];
  activeRole: AppRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authError: string | null;
  signIn: (email: string, password: string) => Promise<SignInResult>;
  signOut: () => Promise<void>;
  setActiveRole: (role: AppRole) => boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ACTIVE_ROLE_STORAGE_KEY = 'leap_active_role_v2';

const ROLE_PRIORITY: AppRole[] = [
  'admin',
  'coordinator',
  'supervisor',
  'host',
  'management',
  'student',
];

function selectDefaultRole(assignedRoles: AppRole[], storedRole?: string | null): AppRole | null {
  if (assignedRoles.length === 0) return null;
  if (storedRole && assignedRoles.includes(storedRole as AppRole)) {
    return storedRole as AppRole;
  }
  for (const r of ROLE_PRIORITY) {
    if (assignedRoles.includes(r)) return r;
  }
  return assignedRoles[0];
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [activeRole, setActiveRoleState] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const loadUserContext = useCallback(async (activeSession: Session | null) => {
    if (!activeSession?.user) {
      setSession(null);
      setUser(null);
      setRoles([]);
      setActiveRoleState(null);
      setIsLoading(false);
      return { profile: null, assignedRoles: [] as AppRole[] };
    }

    setSession(activeSession);
    const uid = activeSession.user.id;

    const [{ data: profileData, error: profileErr }, { data: roleRows, error: rolesErr }] =
      await Promise.all([
        supabase.from('profiles').select('*').eq('id', uid).maybeSingle(),
        supabase.from('user_roles').select('role').eq('user_id', uid),
      ]);

    if (profileErr || rolesErr || !profileData) {
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      setRoles([]);
      setActiveRoleState(null);
      setAuthError(
        'Your account is deactivated or has no authorized profile. Contact the System Administrator.'
      );
      setIsLoading(false);
      return { profile: null, assignedRoles: [] as AppRole[] };
    }

    if (!profileData.is_active) {
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      setRoles([]);
      setActiveRoleState(null);
      setAuthError('This account has been deactivated by the System Administrator.');
      setIsLoading(false);
      return { profile: null, assignedRoles: [] as AppRole[] };
    }

    const assignedRoles = ((roleRows || []).map((r) => r.role) as AppRole[]).filter(Boolean);
    const stored = localStorage.getItem(`${ACTIVE_ROLE_STORAGE_KEY}:${uid}`);
    const chosenRole = selectDefaultRole(assignedRoles, stored);

    setUser(profileData as UserProfile);
    setRoles(assignedRoles);
    setActiveRoleState(chosenRole);
    if (chosenRole) {
      localStorage.setItem(`${ACTIVE_ROLE_STORAGE_KEY}:${uid}`, chosenRole);
    }
    setAuthError(null);
    setIsLoading(false);
    return { profile: profileData as UserProfile, assignedRoles, chosenRole };
  }, []);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      if (mounted) {
        loadUserContext(initialSession);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (mounted) {
        loadUserContext(nextSession);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadUserContext]);

  const signIn = async (email: string, password: string): Promise<SignInResult> => {
    setIsLoading(true);
    setAuthError(null);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      setIsLoading(false);
      return { ok: false, error: 'Please enter both your email address and password.' };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    });

    if (error || !data.session) {
      setIsLoading(false);
      const msg = error?.message || 'Invalid email or password.';
      setAuthError(msg);
      return { ok: false, error: msg };
    }

    // Record sign-in in PostgreSQL and verify account is active
    const { data: isActiveAccount, error: signInRpcErr } = await supabase.rpc('record_sign_in');
    if (signInRpcErr || isActiveAccount === false) {
      await supabase.auth.signOut();
      setIsLoading(false);
      const deactivatedMsg =
        'Your account is currently deactivated. Please contact the Limkokwing ICT Administrator.';
      setAuthError(deactivatedMsg);
      return { ok: false, error: deactivatedMsg };
    }

    const { profile, assignedRoles, chosenRole } = await loadUserContext(data.session);
    if (!profile || !chosenRole) {
      return {
        ok: false,
        error:
          'Account has no authorized role assigned. Contact the System Administrator.',
      };
    }

    return {
      ok: true,
      roles: assignedRoles,
      redirectPath: ROLE_HOME_PATH[chosenRole],
    };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setRoles([]);
    setActiveRoleState(null);
  };

  const setActiveRole = (nextRole: AppRole): boolean => {
    // Strictly verify that nextRole is in the user's database-assigned roles
    if (!roles.includes(nextRole)) {
      return false;
    }
    setActiveRoleState(nextRole);
    if (user?.id) {
      localStorage.setItem(`${ACTIVE_ROLE_STORAGE_KEY}:${user.id}`, nextRole);
    }
    return true;
  };

  const refreshProfile = async () => {
    const {
      data: { session: currentSession },
    } = await supabase.auth.getSession();
    await loadUserContext(currentSession);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        roles,
        activeRole,
        isAuthenticated: Boolean(session && user && activeRole),
        isLoading,
        authError,
        signIn,
        signOut,
        setActiveRole,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
