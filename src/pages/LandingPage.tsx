import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ROLE_HOME_PATH, ROLE_LABELS } from '../types/auth';
import {
  ArrowRight,
  GraduationCap,
  Building2,
  ClipboardCheck,
  Award,
  ShieldCheck,
  BarChart3,
  UserCheck,
  FileText,
  Lock,
  UserPlus,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { isAuthenticated, activeRole } = useAuth();
  const portalTarget = isAuthenticated && activeRole ? ROLE_HOME_PATH[activeRole] : '/login';

  const processSteps = [
    {
      step: '01',
      title: 'Registry Verification & Application',
      processRef: 'DFD 1.0',
      states: 'DRAFT → SUBMITTED → APPROVED',
      description:
        'Students verify their Student ID against the protected University Student Registry, complete their academic profile, and submit an internship application for LEAP Coordinator eligibility review.',
      icon: FileText,
    },
    {
      step: '02',
      title: 'Placement Matching & Supervision',
      processRef: 'DFD 2.0',
      states: 'PENDING → CONFIRMED → ACTIVE',
      description:
        'Approved students are assigned to verified industry host opportunities across Sierra Leone, confirmed by the host organization, and paired with an academic supervisor.',
      icon: Building2,
    },
    {
      step: '03',
      title: 'Progress Reporting & Academic Feedback',
      processRef: 'DFD 3.0',
      states: 'DRAFT → UNDER REVIEW → ACCEPTED',
      description:
        'Interns log structured workplace activities, learning outcomes, and hours. Assigned academic supervisors review reports, track revisions, and issue documented feedback.',
      icon: ClipboardCheck,
    },
    {
      step: '04',
      title: 'Workplace Evaluation & Completion',
      processRef: 'DFD 4.0',
      states: 'EVALUATED → FINALIZED → COMPLETED',
      description:
        'Host supervisors submit six-criterion workplace evaluations, academic staff finalize composite scores, and verified completion records update institutional analytics.',
      icon: Award,
    },
  ];

  const governancePillars = [
    {
      num: '01',
      title: 'State-Machine Enforced Workflows',
      description:
        'Every transition across applications, placements, progress reports, and assessments is validated inside transactional PostgreSQL functions, preventing skipped stages or unauthorized approvals.',
    },
    {
      num: '02',
      title: 'Protected University Student Registry',
      description:
        'Student self-registration verifies Student ID and institutional email against protected Registrar records, populating authoritative Faculty, Programme, Year, and GPA standing automatically.',
    },
    {
      num: '03',
      title: 'Configurable Academic Policy Governance',
      description:
        'Eligibility thresholds, minimum accepted progress reports, and composite grading weights are stored in auditable database configuration tables manageable by System Administrators.',
    },
  ];

  const stakeholders = [
    {
      role: 'Student',
      scope: 'Self-Registration & Logbook',
      icon: GraduationCap,
      summary:
        'Verify enrollment identity, manage academic profile, draft and submit internship applications with preferred host organization, submit progress reports, and track completion requirements.',
    },
    {
      role: 'LEAP Coordinator',
      scope: 'Eligibility & Placement Operations',
      icon: ClipboardCheck,
      summary:
        'Audit student eligibility, review organization preferences, approve or return applications, manage host partner capacity, assign placements, and allocate academic supervisors.',
    },
    {
      role: 'Academic Supervisor',
      scope: 'Mentorship & Assessment',
      icon: UserCheck,
      summary:
        'Supervise assigned students, review submitted progress reports with structured feedback, inspect workplace host evaluations, and record finalized academic assessments.',
    },
    {
      role: 'Host Organization',
      scope: 'Workplace Confirmation & Evaluation',
      icon: Building2,
      summary:
        'Confirm or decline nominated student placements, evaluate intern conduct and technical growth across six structured criteria, and escalate workplace concerns.',
    },
    {
      role: 'University Management',
      scope: 'Executive Institutional Analytics',
      icon: BarChart3,
      summary:
        'Inspect faculty participation distributions, industry placement coverage, completion rates, and mean assessment outcomes with structured institutional CSV exports.',
    },
    {
      role: 'System Administrator',
      scope: 'Identity, Registry & Audit Governance',
      icon: ShieldCheck,
      summary:
        'Provision staff accounts via one-time setup links, manage the University Student Registry, administer multi-role access, tune policy thresholds, and inspect immutable audit logs.',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900">
      {/* Top Signature Institutional Accent Rule */}
      <div className="h-1 w-full bg-[#002B49]" />

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-slate-200/90 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-18 py-3 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3.5 group">
            <img
              src="/limkokwing-logo.png"
              alt="Limkokwing University of Creative Technology — Sierra Leone"
              className="h-11 w-auto object-contain"
            />
            <div className="hidden sm:flex flex-col border-l border-slate-200 pl-3.5">
              <span className="text-xs font-bold uppercase tracking-wider text-[#002B49] font-display">
                Digital LEAP System
              </span>
              <span className="text-[11px] text-slate-500">
                Limkokwing University • Sierra Leone
              </span>
            </div>
          </Link>

          <nav
            aria-label="Primary sections"
            className="hidden md:flex items-center gap-7 text-xs font-semibold tracking-wide text-slate-600"
          >
            <a
              href="#about-leap"
              className="py-1 border-b-2 border-transparent hover:border-teal-600 hover:text-[#002B49] transition-colors"
            >
              About LEAP
            </a>
            <a
              href="#how-it-works"
              className="py-1 border-b-2 border-transparent hover:border-teal-600 hover:text-[#002B49] transition-colors"
            >
              Internship Process
            </a>
            <a
              href="#stakeholders"
              className="py-1 border-b-2 border-transparent hover:border-teal-600 hover:text-[#002B49] transition-colors"
            >
              Stakeholders
            </a>
          </nav>

          <div className="flex items-center gap-2.5">
            {isAuthenticated && activeRole ? (
              <Link
                to={portalTarget}
                className="inline-flex items-center gap-2 rounded-lg bg-[#002B49] px-4 py-2 text-xs font-semibold text-white hover:bg-[#001f35] transition-colors"
              >
                <span>Open {ROLE_LABELS[activeRole]} Portal</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-[#002B49] hover:bg-slate-50 hover:border-slate-400 transition-colors"
                >
                  <UserPlus className="h-3.5 w-3.5 text-teal-700" />
                  <span>Create Student Account</span>
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-lg bg-[#002B49] px-4 py-2 text-xs font-semibold text-white hover:bg-[#001f35] transition-colors"
                >
                  <span>Sign In</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section — Asymmetric Institutional Layout with Subtle Geometric Progression */}
      <section className="relative overflow-hidden bg-[#f7f9fb] leap-geo-grid border-b border-slate-200">
        {/* Subtle Geometric Progression Lines (top-right accent representing upward academic-to-industry progression) */}
        <svg
          className="pointer-events-none absolute right-0 top-0 h-full w-1/2 text-[#002B49]/[0.04] hidden lg:block"
          viewBox="0 0 600 500"
          fill="none"
          aria-hidden="true"
        >
          <path d="M120 500 L380 0" stroke="currentColor" strokeWidth="1.5" />
          <path d="M220 500 L480 0" stroke="currentColor" strokeWidth="1.5" />
          <path d="M320 500 L580 0" stroke="#0d9488" strokeOpacity="0.18" strokeWidth="2" />
          <rect x="440" y="60" width="96" height="96" stroke="currentColor" strokeWidth="1.5" />
          <rect x="468" y="88" width="96" height="96" stroke="#0d9488" strokeOpacity="0.2" strokeWidth="1.5" />
        </svg>

        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
            {/* Left Editorial Column */}
            <div className="lg:col-span-7 space-y-6 pt-1">
              <div className="inline-flex items-center gap-2.5 text-xs font-bold uppercase tracking-widest text-teal-700">
                <span className="h-2 w-2 rounded-xs bg-teal-600" />
                <span>Limkokwing Experiential Academic Placement</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold tracking-tight text-[#002B49] leading-[1.12]">
                Digital LEAP Internship Management System
              </h1>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
                The official experiential learning and industry placement platform for{' '}
                <strong className="font-semibold text-slate-800">
                  Limkokwing University of Creative Technology — Sierra Leone
                </strong>
                . Connecting undergraduate students, faculty coordinators, academic supervisors,
                and partner host organizations through one auditable, role-governed academic record.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  to={portalTarget}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#002B49] px-5 py-3 text-sm font-semibold text-white hover:bg-[#001f35] active:scale-[0.99] transition-all"
                >
                  <span>{isAuthenticated ? 'Continue to Dashboard' : 'Sign In to Portal'}</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                {!isAuthenticated && (
                  <Link
                    to="/register"
                    className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-800 active:scale-[0.99] transition-all"
                  >
                    <UserPlus className="h-4 w-4" />
                    <span>Create Student Account</span>
                  </Link>
                )}
              </div>

              {/* Architectural Platform Specification Bar (Real Structural Guarantees, Zero Fake Stats) */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-200/90 max-w-xl">
                <div>
                  <p className="text-lg font-bold text-[#002B49] font-display">6 Role Portals</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    PostgreSQL Row-Level Security
                  </p>
                </div>
                <div className="border-l border-slate-200 pl-4">
                  <p className="text-lg font-bold text-[#002B49] font-display">4 Core Stages</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    State-Driven Academic Lifecycle
                  </p>
                </div>
                <div className="border-l border-slate-200 pl-4">
                  <p className="text-lg font-bold text-[#002B49] font-display">Verified ID</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                    Protected Student Registry
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column — Institutional Governance & Workflow Blueprint Panel */}
            <div className="lg:col-span-5">
              <div className="rounded-lg border border-slate-200 bg-white shadow-card overflow-hidden">
                {/* Navy Top Institutional Band */}
                <div className="bg-[#002B49] px-5 py-4 text-white flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src="/limkokwing-logo.png"
                      alt="Limkokwing University Sierra Leone"
                      className="h-10 w-auto bg-white rounded p-0.5 object-contain"
                    />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-teal-300">
                        Hill Station Campus • Freetown
                      </p>
                      <h2 className="text-sm font-bold text-white leading-tight">
                        Academic Placement Governance
                      </h2>
                    </div>
                  </div>
                  <Lock className="h-4 w-4 text-teal-300 shrink-0" />
                </div>

                {/* Live State-Machine Blueprint */}
                <div className="p-5 space-y-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                      Verified Internship Progression
                    </p>
                    <ol className="space-y-2 text-xs">
                      {[
                        {
                          tag: 'STAGE 01',
                          label: 'Student Registry Verification & Application',
                          status: 'DRAFT → SUBMITTED',
                        },
                        {
                          tag: 'STAGE 02',
                          label: 'Coordinator Eligibility Review & Decision',
                          status: 'UNDER REVIEW → APPROVED',
                        },
                        {
                          tag: 'STAGE 03',
                          label: 'Host Organization Confirmation & Supervision',
                          status: 'CONFIRMED → ACTIVE',
                        },
                        {
                          tag: 'STAGE 04',
                          label: 'Reports, Host Evaluation & Final Assessment',
                          status: 'FINALIZED → COMPLETED',
                        },
                      ].map((row) => (
                        <li
                          key={row.tag}
                          className="flex items-start justify-between gap-3 py-2 border-b border-slate-100 last:border-0"
                        >
                          <div className="flex items-start gap-2.5 min-w-0">
                            <CheckCircle2 className="h-3.5 w-3.5 text-teal-600 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-semibold text-slate-900 leading-snug">
                                {row.label}
                              </p>
                              <p className="text-[10px] font-mono text-slate-500 mt-0.5">
                                {row.status}
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono font-semibold text-[#002B49] bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                            {row.tag}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row gap-2">
                    <Link
                      to="/login"
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md bg-[#002B49] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#001f35] transition-colors"
                    >
                      <span>Sign In</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                    <Link
                      to="/register"
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-colors"
                    >
                      <UserPlus className="h-3.5 w-3.5 text-teal-700" />
                      <span>Create Student Account</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About LEAP Section — Asymmetric Editorial Split (Dividers instead of Repetitive Boxes) */}
      <section id="about-leap" className="py-16 lg:py-20 border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
            <div className="lg:col-span-5">
              <p className="text-[11px] font-bold uppercase tracking-widest text-teal-700">
                About the Programme
              </p>
              <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-[#002B49] leading-tight">
                Bridging Academic Excellence and Industry Practice in Sierra Leone
              </h2>
              <p className="mt-4 text-sm text-slate-600 leading-relaxed">
                The Limkokwing Experiential Academic Placement (LEAP) programme embeds structured
                industry internships directly into undergraduate study across ICT, Business,
                Architecture, Design, and Communication. Replacing paper logs and disconnected
                spreadsheets, the Digital LEAP System consolidates every approval, placement,
                progress report, and evaluation into a single authoritative university database.
              </p>
            </div>

            <div className="lg:col-span-7 divide-y divide-slate-200 border-y border-slate-200">
              {governancePillars.map((pillar) => (
                <div
                  key={pillar.num}
                  className="py-5 first:pt-4 last:pb-4 flex items-start gap-4 group"
                >
                  <span className="font-mono text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200/80 px-2 py-1 rounded shrink-0 mt-0.5">
                    {pillar.num}
                  </span>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-[#002B49]">
                      {pillar.title}
                    </h3>
                    <p className="mt-1.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {pillar.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How the Internship Process Works — Connected 4-Stage Progression Rail */}
      <section id="how-it-works" className="py-16 lg:py-20 bg-[#f7f9fb] border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-8 border-b border-slate-200">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-teal-700">
                Academic Process Architecture
              </p>
              <h2 className="mt-1.5 text-2xl sm:text-3xl font-bold text-[#002B49]">
                How the Internship Process Works
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md leading-relaxed">
              Every internship follows four sequential processes enforced by transactional
              PostgreSQL workflows from initial application to final certification.
            </p>
          </div>

          <div className="mt-10 relative">
            {/* Horizontal connecting progression line on large screens */}
            <div
              className="hidden lg:block absolute top-5 left-6 right-6 h-[2px] bg-slate-200"
              aria-hidden="true"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {processSteps.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.step}
                    className="relative bg-white border border-slate-200 rounded-lg p-5 hover:border-[#002B49]/40 transition-colors flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-[#002B49] text-xs font-bold font-mono text-white">
                          {item.step}
                        </span>
                        <span className="text-[11px] font-mono font-semibold text-teal-700">
                          {item.processRef}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[#002B49] mb-2">
                        <Icon className="h-4 w-4 text-teal-700 shrink-0" />
                        <h3 className="text-sm font-bold text-[#002B49] leading-snug">
                          {item.title}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{item.description}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <span className="text-[10px] font-mono font-semibold text-slate-500">
                        {item.states}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Stakeholders Directory — Crisp Divided Architectural Matrix */}
      <section id="stakeholders" className="py-16 lg:py-20 bg-white border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-[11px] font-bold uppercase tracking-widest text-teal-700">
              Role-Based Access Control
            </p>
            <h2 className="mt-1.5 text-2xl sm:text-3xl font-bold text-[#002B49]">
              Six Stakeholders, One Centralized Platform
            </h2>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">
              All participants authenticate through one shared login gateway and enter a workspace
              scoped strictly to their authorized university or host organization duties.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-slate-200 border border-slate-200 rounded-lg overflow-hidden">
            {stakeholders.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.role}
                  className="bg-white p-6 hover:bg-slate-50/70 transition-colors flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-md bg-[#002B49]/[0.07] text-[#002B49] flex items-center justify-center shrink-0">
                          <Icon className="h-4 w-4" />
                        </div>
                        <h3 className="text-sm font-bold text-[#002B49]">{item.role}</h3>
                      </div>
                    </div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-teal-700 mb-2">
                      {item.scope}
                    </p>
                    <p className="text-xs text-slate-600 leading-relaxed">{item.summary}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Institutional Access Callout */}
          <div className="mt-12 rounded-lg bg-[#002B49] leap-geo-grid-dark p-6 sm:p-8 text-white flex flex-col md:flex-row md:items-center justify-between gap-6 border border-[#001a2e]">
            <div className="max-w-xl">
              <p className="text-[11px] font-bold uppercase tracking-widest text-teal-300">
                Portal Access
              </p>
              <h3 className="text-lg sm:text-xl font-bold mt-1">
                Begin your verified LEAP internship workflow
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed">
                Enrolled undergraduate students activate their account with their official Student
                ID; faculty coordinators, supervisors, and host representatives sign in with their
                provisioned credentials.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-teal-500 transition-colors"
              >
                <UserPlus className="h-4 w-4" />
                <span>Create Student Account</span>
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-lg border border-white/25 bg-white/10 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-white/20 transition-colors"
              >
                <span>Sign In</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Institutional Footer */}
      <footer className="bg-[#001a2e] text-slate-300 py-10 mt-auto">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-3.5">
            <img
              src="/limkokwing-logo.png"
              alt="Limkokwing University Sierra Leone"
              className="h-10 w-auto bg-white rounded p-1 object-contain"
            />
            <div className="text-xs space-y-0.5">
              <p className="font-semibold text-white">
                Limkokwing University of Creative Technology — Sierra Leone
              </p>
              <p className="text-slate-400">
                Digital LEAP Internship Management System • Hill Station Campus, Freetown
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6 text-xs font-medium">
            <a href="#about-leap" className="text-slate-300 hover:text-white transition-colors">
              About LEAP
            </a>
            <Link to="/register" className="text-slate-300 hover:text-white transition-colors">
              Create Student Account
            </Link>
            <Link to="/login" className="text-teal-300 hover:text-teal-200 transition-colors">
              Portal Login
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
