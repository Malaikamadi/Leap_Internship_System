import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types/auth';
import { DEMO_USERS } from '../lib/mockData';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, role?: UserRole) => Promise<boolean>;
  logout: () => Promise<void>;
  switchDemoRole: (role: UserRole) => void;
  availableDemoUsers: UserProfile[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('leap_active_user');
    return saved ? JSON.parse(saved) : DEMO_USERS[0]; // Default to Student for initial demo
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('leap_active_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('leap_active_user');
    }
  }, [user]);

  const login = async (email: string, targetRole?: UserRole): Promise<boolean> => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured) {
        // If Supabase is connected, auth handled here
      }
      
      // Match demo user or fall back
      const matched = DEMO_USERS.find(
        (u) => u.email.toLowerCase() === email.toLowerCase() || (targetRole && u.role_name === targetRole)
      );

      if (matched) {
        setUser(matched);
        setIsLoading(false);
        return true;
      }

      // Default mock login
      const newUser: UserProfile = {
        id: `usr-${Date.now()}`,
        email,
        full_name: email.split('@')[0].replace('.', ' '),
        role_name: targetRole || 'student',
        is_active: true,
      };
      setUser(newUser);
      setIsLoading(false);
      return true;
    } catch (err) {
      console.error('Login error:', err);
      setIsLoading(false);
      return false;
    }
  };

  const logout = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    localStorage.removeItem('leap_active_user');
  };

  const switchDemoRole = (role: UserRole) => {
    const found = DEMO_USERS.find((u) => u.role_name === role);
    if (found) {
      setUser(found);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role_name || null,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        switchDemoRole,
        availableDemoUsers: DEMO_USERS,
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
