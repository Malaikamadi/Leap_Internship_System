-- ====================================================================
-- Digital LEAP Internship Management System
-- Limkokwing University of Creative Technology — Sierra Leone
-- COMP 217 Relational Database Schema & Row Level Security (RLS)
-- ====================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Enumerations and Custom Types
DO $$ BEGIN
    CREATE TYPE application_status_enum AS ENUM (
        'DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'CORRECTION_REQUIRED', 'APPROVED', 'REJECTED'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE placement_status_enum AS ENUM (
        'PENDING', 'AWAITING_CONFIRMATION', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE report_status_enum AS ENUM (
        'DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'CORRECTION_REQUIRED', 'ACCEPTED'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE completion_status_enum AS ENUM (
        'IN_PROGRESS', 'COMPLETED', 'INCOMPLETE', 'FAILED'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. Roles and Permissions Tables
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_system_role BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(100) UNIQUE NOT NULL,
    module VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- 4. User Profiles (Linked to auth.users in Supabase)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY, -- Matches auth.users.id
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role_name VARCHAR(50) NOT NULL DEFAULT 'student',
    phone_number VARCHAR(50),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    assigned_by UUID REFERENCES profiles(id),
    UNIQUE(user_id, role_id)
);

-- 5. Academic & Student Entities
CREATE TABLE IF NOT EXISTS student_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    student_id_number VARCHAR(50) UNIQUE NOT NULL,
    faculty VARCHAR(150) NOT NULL,
    department VARCHAR(150) NOT NULL,
    program_of_study VARCHAR(150) NOT NULL,
    current_semester VARCHAR(20) NOT NULL,
    current_year INT NOT NULL DEFAULT 3,
    academic_year VARCHAR(20) NOT NULL,
    cumulative_gpa NUMERIC(3, 2) DEFAULT 0.00,
    credits_completed INT DEFAULT 0,
    eligibility_status VARCHAR(50) DEFAULT 'ELIGIBLE',
    resume_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS academic_supervisors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    staff_id VARCHAR(50) UNIQUE NOT NULL,
    faculty VARCHAR(150) NOT NULL,
    department VARCHAR(150) NOT NULL,
    title VARCHAR(50) DEFAULT 'Lecturer',
    office_location VARCHAR(100),
    phone_number VARCHAR(50),
    max_interns INT DEFAULT 10,
    active_interns_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Host Organizations & Opportunities
CREATE TABLE IF NOT EXISTS host_organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) UNIQUE NOT NULL,
    industry VARCHAR(150) NOT NULL,
    contact_person VARCHAR(150),
    email VARCHAR(255),
    phone VARCHAR(50),
    physical_address TEXT,
    city VARCHAR(100) DEFAULT 'Freetown',
    country VARCHAR(100) DEFAULT 'Sierra Leone',
    website TEXT,
    max_placement_capacity INT DEFAULT 5,
    active_placements_count INT DEFAULT 0,
    is_verified BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS host_representatives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES host_organizations(id) ON DELETE CASCADE,
    designation VARCHAR(150) NOT NULL,
    department VARCHAR(150),
    is_primary_contact BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS placement_opportunities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES host_organizations(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    department VARCHAR(150),
    description TEXT NOT NULL,
    requirements TEXT,
    location VARCHAR(150) DEFAULT 'Freetown, Sierra Leone',
    total_slots INT NOT NULL DEFAULT 1,
    filled_slots INT NOT NULL DEFAULT 0,
    stipend_details VARCHAR(255) DEFAULT 'Unpaid / University Credit',
    application_deadline DATE,
    status VARCHAR(50) DEFAULT 'OPEN',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Internship Applications & Reviews
CREATE TABLE IF NOT EXISTS internship_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    academic_year VARCHAR(20) NOT NULL,
    preferred_organization_id UUID REFERENCES host_organizations(id),
    preferred_industry VARCHAR(150),
    statement_of_intent TEXT,
    target_start_date DATE,
    target_end_date DATE,
    application_status application_status_enum NOT NULL DEFAULT 'DRAFT',
    correction_notes TEXT,
    submitted_at TIMESTAMPTZ,
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS application_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES internship_applications(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES profiles(id),
    previous_status application_status_enum NOT NULL,
    new_status application_status_enum NOT NULL,
    review_decision VARCHAR(50) NOT NULL,
    comments TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Placements & Supervisor Assignments
CREATE TABLE IF NOT EXISTS placements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE RESTRICT,
    application_id UUID NOT NULL REFERENCES internship_applications(id) ON DELETE RESTRICT,
    opportunity_id UUID REFERENCES placement_opportunities(id),
    organization_id UUID NOT NULL REFERENCES host_organizations(id) ON DELETE RESTRICT,
    supervisor_id UUID REFERENCES academic_supervisors(id),
    host_rep_id UUID REFERENCES host_representatives(id),
    status placement_status_enum NOT NULL DEFAULT 'PENDING',
    start_date DATE,
    end_date DATE,
    host_acceptance_notes TEXT,
    confirmed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS supervisor_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    placement_id UUID NOT NULL REFERENCES placements(id) ON DELETE CASCADE,
    supervisor_id UUID NOT NULL REFERENCES academic_supervisors(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES profiles(id),
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'ACTIVE',
    notes TEXT
);

-- 9. Progress Reports & Feedback
CREATE TABLE IF NOT EXISTS progress_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    placement_id UUID NOT NULL REFERENCES placements(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    report_number INT NOT NULL,
    period_start_date DATE NOT NULL,
    period_end_date DATE NOT NULL,
    tasks_completed TEXT NOT NULL,
    skills_acquired TEXT NOT NULL,
    challenges_faced TEXT,
    plans_for_next_period TEXT,
    attachment_url TEXT,
    status report_status_enum NOT NULL DEFAULT 'DRAFT',
    submitted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(placement_id, report_number)
);

CREATE TABLE IF NOT EXISTS report_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES progress_reports(id) ON DELETE CASCADE,
    supervisor_id UUID NOT NULL REFERENCES academic_supervisors(id) ON DELETE RESTRICT,
    feedback_text TEXT NOT NULL,
    grade_or_status VARCHAR(50),
    correction_instructions TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Host Evaluations, Assessments, and Completion
CREATE TABLE IF NOT EXISTS host_evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    placement_id UUID UNIQUE NOT NULL REFERENCES placements(id) ON DELETE CASCADE,
    host_rep_id UUID NOT NULL REFERENCES host_representatives(id) ON DELETE RESTRICT,
    punctuality_score INT CHECK (punctuality_score BETWEEN 1 AND 5),
    professional_conduct_score INT CHECK (professional_conduct_score BETWEEN 1 AND 5),
    technical_skills_score INT CHECK (technical_skills_score BETWEEN 1 AND 5),
    communication_score INT CHECK (communication_score BETWEEN 1 AND 5),
    problem_solving_score INT CHECK (problem_solving_score BETWEEN 1 AND 5),
    initiative_score INT CHECK (initiative_score BETWEEN 1 AND 5),
    overall_score NUMERIC(5, 2) NOT NULL,
    strengths TEXT,
    areas_for_improvement TEXT,
    general_remarks TEXT,
    recommend_for_hire BOOLEAN DEFAULT false,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    placement_id UUID UNIQUE NOT NULL REFERENCES placements(id) ON DELETE CASCADE,
    supervisor_id UUID NOT NULL REFERENCES academic_supervisors(id) ON DELETE RESTRICT,
    academic_score NUMERIC(5, 2) DEFAULT 0.00,
    host_score NUMERIC(5, 2) DEFAULT 0.00,
    logbook_report_score NUMERIC(5, 2) DEFAULT 0.00,
    presentation_score NUMERIC(5, 2) DEFAULT 0.00,
    total_score NUMERIC(5, 2) NOT NULL,
    letter_grade VARCHAR(5),
    final_assessment_status VARCHAR(50) DEFAULT 'PENDING',
    notes TEXT,
    finalized_at TIMESTAMPTZ,
    finalized_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS completion_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    placement_id UUID UNIQUE NOT NULL REFERENCES placements(id) ON DELETE RESTRICT,
    student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE RESTRICT,
    academic_year VARCHAR(20) NOT NULL,
    final_status completion_status_enum NOT NULL DEFAULT 'IN_PROGRESS',
    total_hours_completed INT DEFAULT 0,
    total_reports_accepted INT DEFAULT 0,
    supervisor_signoff BOOLEAN DEFAULT false,
    coordinator_signoff BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    certificate_issued BOOLEAN DEFAULT false,
    certificate_number VARCHAR(100) UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Notifications and Audit Logging
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    link_url TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Indexes for Performance & Search
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role_name);
CREATE INDEX IF NOT EXISTS idx_student_profiles_user ON student_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_supervisor_user ON academic_supervisors(user_id);
CREATE INDEX IF NOT EXISTS idx_host_rep_org ON host_representatives(organization_id);
CREATE INDEX IF NOT EXISTS idx_applications_student ON internship_applications(student_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON internship_applications(application_status);
CREATE INDEX IF NOT EXISTS idx_placements_student ON placements(student_id);
CREATE INDEX IF NOT EXISTS idx_placements_status ON placements(status);
CREATE INDEX IF NOT EXISTS idx_reports_placement ON progress_reports(placement_id);
CREATE INDEX IF NOT EXISTS idx_reports_student ON progress_reports(student_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action, created_at);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

-- Enable RLS across all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_supervisors ENABLE ROW LEVEL SECURITY;
ALTER TABLE host_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE host_representatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE placement_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE internship_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE supervisor_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE host_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE completion_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper security functions
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS VARCHAR AS $$
BEGIN
    RETURN (SELECT role_name FROM profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Profiles RLS
CREATE POLICY "Users can view their own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Staff can view relevant user profiles"
    ON profiles FOR SELECT
    USING (current_user_role() IN ('coordinator', 'supervisor', 'admin', 'management'));

CREATE POLICY "Users can update their own profile details"
    ON profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id AND role_name = (SELECT role_name FROM profiles WHERE id = auth.uid())); -- Prevent self-role elevation

CREATE POLICY "Admins have full access to profiles"
    ON profiles FOR ALL
    USING (current_user_role() = 'admin');

-- 2. Student Profiles RLS
CREATE POLICY "Students can view and edit their own student profile"
    ON student_profiles FOR ALL
    USING (user_id = auth.uid());

CREATE POLICY "Staff and Supervisors can view student profiles"
    ON student_profiles FOR SELECT
    USING (current_user_role() IN ('coordinator', 'supervisor', 'admin', 'management'));

-- 3. Applications RLS
CREATE POLICY "Students can manage own applications"
    ON internship_applications FOR ALL
    USING (student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid()))
    WITH CHECK (
        student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid())
        AND application_status NOT IN ('APPROVED', 'REJECTED') -- Students cannot approve themselves
    );

CREATE POLICY "Coordinators and Admin manage applications"
    ON internship_applications FOR ALL
    USING (current_user_role() IN ('coordinator', 'admin'));

CREATE POLICY "Supervisors and Management can view applications"
    ON internship_applications FOR SELECT
    USING (current_user_role() IN ('supervisor', 'management'));

-- 4. Placements RLS
CREATE POLICY "Students view their assigned placements"
    ON placements FOR SELECT
    USING (student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Supervisors view their assigned placements"
    ON placements FOR SELECT
    USING (supervisor_id IN (SELECT id FROM academic_supervisors WHERE user_id = auth.uid()));

CREATE POLICY "Host reps view placements for their organization"
    ON placements FOR SELECT
    USING (organization_id IN (SELECT organization_id FROM host_representatives WHERE user_id = auth.uid()));

CREATE POLICY "Coordinators and Admin manage all placements"
    ON placements FOR ALL
    USING (current_user_role() IN ('coordinator', 'admin'));

-- 5. Progress Reports RLS
CREATE POLICY "Students manage own progress reports"
    ON progress_reports FOR ALL
    USING (student_id IN (SELECT id FROM student_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Supervisors view and review assigned student reports"
    ON progress_reports FOR ALL
    USING (
        placement_id IN (
            SELECT p.id FROM placements p
            JOIN academic_supervisors s ON p.supervisor_id = s.id
            WHERE s.user_id = auth.uid()
        )
    );

CREATE POLICY "Coordinators and Admin view reports"
    ON progress_reports FOR SELECT
    USING (current_user_role() IN ('coordinator', 'admin', 'management'));

-- 6. Notifications RLS
CREATE POLICY "Users access own notifications only"
    ON notifications FOR ALL
    USING (user_id = auth.uid());

-- 7. Audit Logs RLS
CREATE POLICY "Admins view audit logs"
    ON audit_logs FOR SELECT
    USING (current_user_role() = 'admin');
