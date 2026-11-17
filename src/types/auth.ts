export type UserRole = 
  | 'student'
  | 'coordinator'
  | 'supervisor'
  | 'host'
  | 'management'
  | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role_name: UserRole;
  phone_number?: string;
  avatar_url?: string;
  is_active: boolean;
  created_at?: string;
}

export interface AuthState {
  user: UserProfile | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
