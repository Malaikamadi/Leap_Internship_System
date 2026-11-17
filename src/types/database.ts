export type ApplicationStatus = 
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'CORRECTION_REQUIRED'
  | 'APPROVED'
  | 'REJECTED';

export type PlacementStatus = 
  | 'PENDING'
  | 'AWAITING_CONFIRMATION'
  | 'CONFIRMED'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'CANCELLED';

export type ReportStatus = 
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'CORRECTION_REQUIRED'
  | 'ACCEPTED';

export type CompletionStatus = 
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'INCOMPLETE'
  | 'FAILED';

export interface StudentProfile {
  id: string;
  user_id: string;
  student_id_number: string;
  faculty: string;
  department: string;
  program_of_study: string;
  current_semester: string;
  current_year: number;
  academic_year: string;
  cumulative_gpa: number;
  credits_completed: number;
  eligibility_status: 'ELIGIBLE' | 'INELIGIBLE' | 'PENDING_REVIEW';
  resume_url?: string;
  full_name?: string;
  email?: string;
}

export interface AcademicSupervisor {
  id: string;
  user_id: string;
  staff_id: string;
  faculty: string;
  department: string;
  title: string;
  office_location?: string;
  phone_number?: string;
  max_interns: number;
  active_interns_count: number;
  full_name?: string;
  email?: string;
}

export interface HostOrganization {
  id: string;
  name: string;
  industry: string;
  contact_person: string;
  email: string;
  phone: string;
  physical_address: string;
  city: string;
  country: string;
  website?: string;
  max_placement_capacity: number;
  active_placements_count: number;
  is_verified: boolean;
}

export interface HostRepresentative {
  id: string;
  user_id: string;
  organization_id: string;
  designation: string;
  department?: string;
  is_primary_contact: boolean;
  full_name?: string;
  organization_name?: string;
}

export interface PlacementOpportunity {
  id: string;
  organization_id: string;
  organization_name?: string;
  title: string;
  department?: string;
  description: string;
  requirements?: string;
  location: string;
  total_slots: number;
  filled_slots: number;
  stipend_details: string;
  application_deadline: string;
  status: 'OPEN' | 'CLOSED' | 'FILLED';
}

export interface InternshipApplication {
  id: string;
  student_id: string;
  student_name?: string;
  student_id_number?: string;
  program_of_study?: string;
  gpa?: number;
  academic_year: string;
  preferred_organization_id?: string;
  preferred_organization_name?: string;
  preferred_industry?: string;
  statement_of_intent: string;
  target_start_date: string;
  target_end_date: string;
  application_status: ApplicationStatus;
  correction_notes?: string;
  submitted_at?: string;
  reviewed_at?: string;
  reviewed_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Placement {
  id: string;
  student_id: string;
  student_name?: string;
  student_id_number?: string;
  program_of_study?: string;
  application_id: string;
  opportunity_id?: string;
  organization_id: string;
  organization_name?: string;
  supervisor_id?: string;
  supervisor_name?: string;
  host_rep_id?: string;
  status: PlacementStatus;
  start_date: string;
  end_date: string;
  host_acceptance_notes?: string;
  confirmed_at?: string;
  created_at: string;
}

export interface ProgressReport {
  id: string;
  placement_id: string;
  student_id: string;
  student_name?: string;
  report_number: number;
  period_start_date: string;
  period_end_date: string;
  tasks_completed: string;
  skills_acquired: string;
  challenges_faced?: string;
  plans_for_next_period?: string;
  attachment_url?: string;
  status: ReportStatus;
  feedback_notes?: string;
  submitted_at?: string;
  created_at: string;
}

export interface HostEvaluation {
  id: string;
  placement_id: string;
  host_rep_id: string;
  punctuality_score: number;
  professional_conduct_score: number;
  technical_skills_score: number;
  communication_score: number;
  problem_solving_score: number;
  initiative_score: number;
  overall_score: number;
  strengths: string;
  areas_for_improvement: string;
  general_remarks?: string;
  recommend_for_hire: boolean;
  submitted_at: string;
}

export interface Assessment {
  id: string;
  placement_id: string;
  supervisor_id: string;
  academic_score: number;
  host_score: number;
  logbook_report_score: number;
  presentation_score: number;
  total_score: number;
  letter_grade: string;
  final_assessment_status: 'PENDING' | 'FINALIZED';
  notes?: string;
  finalized_at?: string;
}

export interface CompletionRecord {
  id: string;
  placement_id: string;
  student_id: string;
  academic_year: string;
  final_status: CompletionStatus;
  total_hours_completed: number;
  total_reports_accepted: number;
  supervisor_signoff: boolean;
  coordinator_signoff: boolean;
  completed_at?: string;
  certificate_issued: boolean;
  certificate_number?: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  link_url?: string;
  is_read: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  user_email?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  created_at: string;
}
