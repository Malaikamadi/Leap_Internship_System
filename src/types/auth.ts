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

export interface DemoAccountInfo {
  role: AppRole;
  label: string;
  name: string;
  email: string;
  subtitle: string;
}

export const DEMO_ACCOUNTS: DemoAccountInfo[] = [
  {
    role: 'student',
    label: 'Student',
    name: 'Madi A. Sesay',
    email: 'student@limkokwing.edu.sl',
    subtitle: 'BSc Software Engineering • Year 3',
  },
  {
    role: 'coordinator',
    label: 'LEAP Coordinator',
    name: 'Dr. Joseph Bockarie',
    email: 'coordinator@limkokwing.edu.sl',
    subtitle: 'Faculty Internship Coordination Office',
  },
  {
    role: 'supervisor',
    label: 'Academic Supervisor',
    name: 'Ing. Hassan Kamara',
    email: 'supervisor@limkokwing.edu.sl',
    subtitle: 'Senior Lecturer • Software Engineering',
  },
  {
    role: 'host',
    label: 'Host Organization',
    name: 'Amadu Mansaray',
    email: 'host@slcb.sl',
    subtitle: 'Sierra Leone Commercial Bank (SLCB)',
  },
  {
    role: 'management',
    label: 'University Management',
    name: 'Prof. Agnes Conteh',
    email: 'management@limkokwing.edu.sl',
    subtitle: 'Dean of Academic Affairs',
  },
  {
    role: 'admin',
    label: 'System Administrator',
    name: 'Ibrahim Koroma',
    email: 'admin@limkokwing.edu.sl',
    subtitle: 'LUCT ICT Systems & Security (Multi-Role: Admin + Management)',
  },
];
