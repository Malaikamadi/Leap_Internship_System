export type AppRole =
  | 'student'
  | 'coordinator'
  | 'supervisor'
  | 'host'
  | 'management'
  | 'admin';

export type UserRole = AppRole;

export const ROLE_LABELS: Record<AppRole, string> = {
  student: 'Student',
  coordinator: 'LEAP Coordinator',
  supervisor: 'Academic Supervisor',
  host: 'Host Organization',
  management: 'University Management',
  admin: 'System Administrator',
};

export const ROLE_HOME_PATH: Record<AppRole, string> = {
  student: '/app/student',
  coordinator: '/app/coordinator',
  supervisor: '/app/supervisor',
  host: '/app/host',
  management: '/app/management',
  admin: '/app/admin',
};

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
