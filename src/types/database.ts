import { AppRole, UserProfile } from './auth';

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

export type AssessmentStatus = 'DRAFT' | 'FINALIZED';

export type CompletionStatus = 'IN_PROGRESS' | 'COMPLETED' | 'NOT_COMPLETED';

export interface RoleRow {
  code: AppRole;
  name: string;
  description: string;
}

export interface UserRoleRow {
  user_id: string;
  role: AppRole;
  granted_by: string | null;
  granted_at: string;
}

export type EnrollmentStatus =
  | 'ENROLLED'
  | 'ON_LEAVE'
  | 'SUSPENDED'
  | 'GRADUATED'
  | 'WITHDRAWN';

export interface StudentRegistryRecord {
  id: string;
  student_number: string;
  institutional_email: string;
  full_name: string;
  faculty: string;
  programme: string;
  year_of_study: number;
  semester: number;
  gpa: number;
  credits_completed: number;
  enrollment_status: EnrollmentStatus;
  academic_year: string;
  claimed_by_user_id: string | null;
  claimed_at: string | null;
  last_email_correction_reason: string | null;
  verification_state: 'CLAIMED' | 'PENDING_EMAIL_CONFIRMATION' | 'UNCLAIMED';
}

export interface StudentRegistryCandidateResult {
  ok: boolean;
  verified_candidate?: boolean;
  student_number?: string;
  rate_limited?: boolean;
  error?: string;
}

export interface StudentProfileRow {
  id: string;
  user_id: string;
  registry_id?: string;
  registry_verified_at?: string;
  student_number: string;
  faculty: string;
  programme: string;
  year_of_study: number;
  semester: number;
  gpa: number | null;
  credits_completed: number;
  skills: string | null;
  emergency_contact: string | null;
  created_at: string;
  updated_at: string;
  profile?: UserProfile;
}

export interface AcademicSupervisorRow {
  id: string;
  user_id: string;
  staff_number: string;
  title: string | null;
  faculty: string;
  department: string;
  max_students: number;
  created_at: string;
  updated_at: string;
  profile?: UserProfile;
}

export interface HostOrganizationRow {
  id: string;
  name: string;
  industry: string;
  address: string | null;
  city: string;
  contact_email: string | null;
  contact_phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface HostRepresentativeRow {
  id: string;
  user_id: string;
  organization_id: string;
  job_title: string | null;
  created_at: string;
  organization?: HostOrganizationRow;
  profile?: UserProfile;
}

export interface PlacementOpportunityRow {
  id: string;
  organization_id: string;
  title: string;
  department: string | null;
  description: string;
  requirements: string | null;
  location: string | null;
  capacity: number;
  start_date: string | null;
  end_date: string | null;
  status: 'OPEN' | 'CLOSED';
  created_by: string | null;
  created_at: string;
  updated_at: string;
  organization?: HostOrganizationRow;
}

export interface InternshipApplicationRow {
  id: string;
  student_id: string;
  academic_year: string;
  preferred_industry: string | null;
  preferred_organization_id: string | null;
  preferred_host_organization: string | null;
  preference_reason: string | null;
  motivation: string | null;
  relevant_skills: string | null;
  preferred_start_date: string | null;
  preferred_end_date: string | null;
  status: ApplicationStatus;
  submitted_at: string | null;
  decided_at: string | null;
  decided_by: string | null;
  created_at: string;
  updated_at: string;
  student?: StudentProfileRow;
  preferred_organization?: HostOrganizationRow | null;
}

export interface ApplicationReviewRow {
  id: string;
  application_id: string;
  actor_id: string | null;
  from_status: ApplicationStatus | null;
  to_status: ApplicationStatus;
  comment: string | null;
  created_at: string;
  actor?: UserProfile | null;
}

export interface SupervisorAssignmentRow {
  id: string;
  placement_id: string;
  supervisor_id: string;
  assigned_by: string | null;
  assigned_at: string;
  is_current: boolean;
  ended_at: string | null;
  supervisor?: AcademicSupervisorRow;
}

export interface PlacementRow {
  id: string;
  application_id: string;
  student_id: string;
  opportunity_id: string;
  organization_id: string;
  status: PlacementStatus;
  start_date: string;
  end_date: string;
  host_response_note: string | null;
  host_responded_at: string | null;
  host_responded_by: string | null;
  cancellation_reason: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  student?: StudentProfileRow;
  opportunity?: PlacementOpportunityRow;
  organization?: HostOrganizationRow;
  supervisor_assignments?: SupervisorAssignmentRow[];
}

export interface ProgressReportRow {
  id: string;
  placement_id: string;
  student_id: string;
  report_number: number;
  period_start: string;
  period_end: string;
  hours_worked: number;
  activities: string;
  learning_outcomes: string;
  challenges: string | null;
  next_steps: string | null;
  status: ReportStatus;
  version: number;
  submitted_at: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  student?: StudentProfileRow;
  placement?: PlacementRow;
  feedback?: ReportFeedbackRow[];
}

export interface ReportRevisionRow {
  id: string;
  report_id: string;
  version: number;
  snapshot: {
    period_start: string;
    period_end: string;
    hours_worked: number;
    activities: string;
    learning_outcomes: string;
    challenges: string | null;
    next_steps: string | null;
  };
  created_at: string;
}

export interface ReportFeedbackRow {
  id: string;
  report_id: string;
  reviewer_id: string | null;
  decision: ReportStatus;
  comments: string;
  created_at: string;
  reviewer?: UserProfile | null;
}

export interface HostEvaluationRow {
  id: string;
  placement_id: string;
  submitted_by: string | null;
  punctuality: number;
  professionalism: number;
  technical_skills: number;
  communication: number;
  teamwork: number;
  initiative: number;
  overall_rating: number;
  strengths: string | null;
  improvements: string | null;
  recommend_for_employment: boolean;
  submitted_at: string;
}

export interface PlacementConcernRow {
  id: string;
  placement_id: string;
  raised_by: string | null;
  message: string;
  status: 'OPEN' | 'RESOLVED';
  resolution_note: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
}

export interface AssessmentRow {
  id: string;
  placement_id: string;
  recorded_by: string | null;
  supervisor_score: number;
  report_score: number;
  host_score: number | null;
  final_score: number | null;
  comments: string | null;
  status: AssessmentStatus;
  finalized_by: string | null;
  finalized_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CompletionRecordRow {
  id: string;
  placement_id: string;
  student_id: string;
  status: CompletionStatus;
  accepted_reports: number;
  total_hours: number;
  host_evaluation_received: boolean;
  final_score: number | null;
  requirements_snapshot: CompletionChecklist | null;
  decided_by: string | null;
  decided_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CompletionRequirementItem {
  requirement: string;
  required: number | boolean;
  actual: number | boolean;
  met: boolean;
}

export interface CompletionChecklist {
  requirements_met: boolean;
  items: CompletionRequirementItem[];
  pass_mark: number;
  final_score: number | null;
  assessment_status: AssessmentStatus | null;
}

export interface EligibilityCheckItem {
  rule: string;
  required: number;
  actual: number | null;
  passed: boolean;
}

export interface EligibilityResult {
  eligible: boolean;
  checks: EligibilityCheckItem[];
}

export interface SystemSettingRow {
  key: string;
  value: unknown;
  description: string;
  policy_confirmed: boolean;
  updated_by: string | null;
  updated_at: string;
}

export interface NotificationRow {
  id: string;
  user_id: string;
  category: string;
  title: string;
  body: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export interface AuditLogRow {
  id: number;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
  actor?: UserProfile | null;
}

export interface CoordinatorSummary {
  total_applications: number;
  pending_reviews: number;
  approved_applications: number;
  rejected_applications: number;
  correction_required: number;
  awaiting_placement: number;
  active_placements: number;
  awaiting_confirmation: number;
  completed_placements: number;
  unassigned_supervisors: number;
  outstanding_reports: number;
  open_concerns: number;
}

export interface ManagementStatistics {
  total_participating_students: number;
  total_applications: number;
  approved_applications: number;
  active_internships: number;
  completed_internships: number;
  total_placements: number;
  completion_rate: number;
  average_final_score: number | null;
  average_host_rating: number | null;
  total_verified_hours: number;
  partner_organizations: number;
  by_faculty: Array<{
    faculty: string;
    students: number;
    applications: number;
    active_placements: number;
    completed_placements: number;
    avg_score: number | null;
  }>;
  by_industry: Array<{
    industry: string;
    organizations: number;
    placements: number;
    active: number;
    completed: number;
  }>;
  placement_status_breakdown: Array<{ status: string; count: number }>;
  application_status_breakdown: Array<{ status: string; count: number }>;
  assessment_summaries: Array<{
    faculty: string;
    programme: string;
    organization_name: string;
    completion_status: string;
    accepted_reports: number;
    total_hours: number;
    host_evaluation_received: boolean;
    final_score: number | null;
    decided_at: string | null;
  }>;
}
