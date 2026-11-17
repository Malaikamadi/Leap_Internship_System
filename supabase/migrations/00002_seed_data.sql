-- ====================================================================
-- Digital LEAP Internship Management System
-- Limkokwing University of Creative Technology — Sierra Leone
-- COMP 217 Seed Data for Academic Demonstration & Testing
-- ====================================================================

-- 1. Insert Core Roles
INSERT INTO roles (name, display_name, description, is_system_role)
VALUES 
    ('student', 'Student', 'Enrolled undergraduate student undertaking the LEAP internship programme', true),
    ('coordinator', 'LEAP Coordinator', 'Faculty internship coordinator responsible for eligibility, placements, and supervision allocation', true),
    ('supervisor', 'Academic Supervisor', 'Faculty academic lecturer assigned to supervise and assess student interns', true),
    ('host', 'Host Organization Representative', 'Workplace industry supervisor or HR representative at partner company', true),
    ('management', 'University Management', 'Dean, Head of Academic Affairs, and University Executive Management', true),
    ('admin', 'System Administrator', 'IT and System Administrator for account provisioning, security, and audit review', true)
ON CONFLICT (name) DO NOTHING;

-- 2. Insert Core Permissions
INSERT INTO permissions (code, module, description)
VALUES
    ('student:apply', 'applications', 'Submit and edit internship applications'),
    ('student:report', 'reports', 'Submit periodic progress reports and reflections'),
    ('coordinator:review_application', 'applications', 'Review, approve, reject, or request corrections on student applications'),
    ('coordinator:manage_placements', 'placements', 'Match students to host organizations and assign supervisors'),
    ('supervisor:review_reports', 'supervision', 'Review and grade student weekly logbooks and progress reports'),
    ('supervisor:assess', 'assessments', 'Record academic assessment scores and final evaluation'),
    ('host:evaluate', 'evaluations', 'Complete host organization workplace appraisal form'),
    ('management:view_reports', 'reporting', 'View aggregate institutional analytics and completion statistics'),
    ('admin:manage_users', 'admin', 'Manage user accounts, roles, and review security audit logs')
ON CONFLICT (code) DO NOTHING;

-- 3. Insert Host Organizations (Freetown, Sierra Leone Context)
INSERT INTO host_organizations (name, industry, contact_person, email, phone, physical_address, city, country, max_placement_capacity)
VALUES
    ('Sierra Leone Commercial Bank (SLCB)', 'Banking & Financial Technology', 'Amadu Mansaray (Head of IT)', 'hr.leap@slcb.sl', '+232 76 123456', 'Siaka Stevens Street', 'Freetown', 'Sierra Leone', 6),
    ('Africell Sierra Leone', 'Telecommunications & Systems', 'Mariama Koroma (Network Operations)', 'internships@africell.sl', '+232 77 987654', 'Wilkinson Road', 'Freetown', 'Sierra Leone', 8),
    ('Orange Sierra Leone', 'Digital Services & Engineering', 'Ibrahim Kamara (Talent Lead)', 'careers@orange.sl', '+232 78 555666', 'Regent Road, Hill Station', 'Freetown', 'Sierra Leone', 8),
    ('Directorate of Science, Technology & Innovation (DSTI)', 'Public Sector Innovation & Software', 'Fatmata Sesay (Tech Lead)', 'leap@dsti.gov.sl', '+232 30 112233', 'State House', 'Freetown', 'Sierra Leone', 5),
    ('Rokel Commercial Bank', 'Banking & Information Systems', 'Mohamed Turay (IT Operations)', 'it@rokelbank.sl', '+232 79 443322', 'Rawdon Street', 'Freetown', 'Sierra Leone', 4)
ON CONFLICT (name) DO NOTHING;

-- 4. Insert Placement Opportunities
INSERT INTO placement_opportunities (organization_id, title, department, description, requirements, total_slots, filled_slots, stipend_details, application_deadline, status)
SELECT 
    id, 
    'Software & Web Development Intern', 
    'Information Technology Division',
    'Develop and maintain internal web portals, database integrations, and digital customer self-service applications.',
    'HTML/CSS/JS, basic SQL, understanding of modern web architectures, good teamwork.',
    3,
    1,
    'SLL 1,500,000 monthly transport allowance',
    '2026-12-15',
    'OPEN'
FROM host_organizations WHERE name = 'Sierra Leone Commercial Bank (SLCB)'
ON CONFLICT DO NOTHING;

INSERT INTO placement_opportunities (organization_id, title, department, description, requirements, total_slots, filled_slots, stipend_details, application_deadline, status)
SELECT 
    id, 
    'Network & Infrastructure Systems Intern', 
    'Network Engineering Dept',
    'Assist network engineers with router configurations, subnet monitoring, fiber troubleshooting, and field diagnostics.',
    'Cisco CCNA coursework, networking fundamentals, IP subnetting knowledge.',
    4,
    2,
    'Transport support provided',
    '2026-12-20',
    'OPEN'
FROM host_organizations WHERE name = 'Africell Sierra Leone'
ON CONFLICT DO NOTHING;
