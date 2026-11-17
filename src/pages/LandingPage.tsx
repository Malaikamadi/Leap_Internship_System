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
  CheckCircle2,
  FileText,
  Lock,
  Globe,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { isAuthenticated, activeRole } = useAuth();
  const portalTarget = isAuthenticated && activeRole ? ROLE_HOME_PATH[activeRole] : '/login';

  const processSteps = [
    {
      step: '01',
      title: 'Application & Eligibility Review',
      processRef: 'DFD Process 1.0',
      description:
        'Students complete their academic profile and submit an internship application. The LEAP Coordinator verifies credit hours, GPA thresholds, and programme readiness.',
      icon: FileText,
    },
    {
      step: '02',
      title: 'Placement Matching & Supervision',
      processRef: 'DFD Process 2.0',
      description:
        'Approved students are matched to verified opportunities with partner organizations across Sierra Leone, confirmed by the host, and assigned an academic supervisor.',
      icon: Building2,
    },
    {
      step: '03',
      title: 'Progress Reporting & Feedback',
      processRef: 'DFD Process 3.0',
      description:
        'Interns submit structured progress reports and workplace hours. Assigned academic supervisors review each submission, request revisions, or accept reports.',
      icon: ClipboardCheck,
    },
    {
      step: '04',
      title: 'Evaluation, Assessment & Completion',
      processRef: 'DFD Process 4.0',
      description:
        'Host representatives submit workplace evaluations, academic staff record and finalize composite assessments, and verified completion records feed institutional analytics.',
      icon: Award,
    },
  ];

  const stakeholders = [
    {
      role: 'Student',
      icon: GraduationCap,
      summary:
        'Manage academic profile, draft and submit internship applications, respond to coordinator corrections, log periodic progress reports, and track completion status.',
    },
    {
      role: 'LEAP Coordinator',
      icon: ClipboardCheck,
      summary:
        'Verify student eligibility, approve or return applications, manage host partner opportunities, allocate placements and academic supervisors, and monitor compliance.',
    },
    {
      role: 'Academic Supervisor',
      icon: UserCheck,
      summary:
        'Monitor assigned students, review submitted progress reports, provide academic feedback, inspect host evaluations, and record authorized assessments.',
    },
    {
      role: 'Host Organization',
      icon: Building2,
      summary:
        'Confirm nominated interns for organization placements, submit structured workplace performance evaluations, and communicate placement concerns.',
    },
    {
      role: 'University Management',
      icon: BarChart3,
      summary:
        'Access institutional dashboards, faculty participation distributions, placement rates, assessment summaries, and accreditation completion metrics.',
    },
    {
      role: 'System Administrator',
      icon: ShieldCheck,
      summary:
        'Provision and manage user accounts, assign or revoke system roles, configure university policy thresholds, and audit security logs.',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3.5">
            <img
              src="/limkokwing-logo.png"
              alt="Limkokwing University of Creative Technology — Sierra Leone"
              className="h-12 w-auto object-contain"
            />
            <div className="hidden sm:flex flex-col border-l border-slate-200 pl-3.5">
              <span className="text-xs font-bold uppercase tracking-wider text-[#002B49]">
                Digital LEAP System
              </span>
              <span className="text-[11px] text-slate-500">
                Limkokwing University • Sierra Leone
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#about-leap" className="hover:text-[#002B49] transition-colors">
              About LEAP
            </a>
            <a href="#how-it-works" className="hover:text-[#002B49] transition-colors">
              How It Works
            </a>
            <a href="#stakeholders" className="hover:text-[#002B49] transition-colors">
              Stakeholders
            </a>
          </nav>

          <div className="flex items-center gap-3">
            {isAuthenticated && activeRole ? (
              <Link
                to={portalTarget}
                className="inline-flex items-center gap-2 rounded-lg bg-[#002B49] px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#001f35] transition-colors"
              >
                <span>Open {ROLE_LABELS[activeRole]} Portal</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-lg bg-[#002B49] px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#001f35] transition-colors"
              >
                <span>Staff & Student Login</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-50 border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3.5 py-1 text-xs font-semibold text-teal-800">
                <Globe className="h-3.5 w-3.5 text-teal-600" />
                <span>Experiential Learning & Industry Placement Platform</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#002B49] leading-tight">
                Digital LEAP Internship Management System
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
                A unified, role-based academic platform connecting Limkokwing University of
                Creative Technology — Sierra Leone students, faculty coordinators, academic
                supervisors, and industry host organizations from initial application through
                verified internship completion.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link
                  to={portalTarget}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#002B49] px-6 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-[#001f35] transition-colors"
                >
                  <span>{isAuthenticated ? 'Continue to Dashboard' : 'Sign In to Portal'}</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Explore Workflow
                </a>
              </div>

              <div className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-200">
                <div>
                  <p className="text-2xl font-bold text-[#002B49]">6 Roles</p>
                  <p className="text-xs text-slate-500 mt-0.5">Strict PostgreSQL RLS Isolation</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#002B49]">4 Stages</p>
                  <p className="text-xs text-slate-500 mt-0.5">State-Driven Academic Workflows</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#002B49]">100% Audited</p>
                  <p className="text-xs text-slate-500 mt-0.5">Transactional Decision History</p>
                </div>
              </div>
            </div>

            {/* Institutional Showcase Card */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-card space-y-6">
                <div className="flex items-center gap-4 pb-5 border-b border-slate-100">
                  <img
                    src="/limkokwing-logo.png"
                    alt="Limkokwing University Sierra Leone"
                    className="h-14 w-auto object-contain"
                  />
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-teal-700">
                      Academic Governance
                    </p>
                    <h2 className="text-base font-bold text-slate-900">
                      Limkokwing University — Sierra Leone
                    </h2>
                    <p className="text-xs text-slate-500">
                      Hill Station Campus, Freetown
                    </p>
                  </div>
                </div>

                <div className="space-y-3.5 text-xs">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-900">
                        Verified Eligibility & Placement Capacity
                      </p>
                      <p className="text-slate-600 mt-0.5">
                        Enforces academic readiness and host organization slot limits inside
                        PostgreSQL transactions.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <Lock className="h-4 w-4 text-[#002B49] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-900">
                        Row-Level Security & Least Privilege
                      </p>
                      <p className="text-slate-600 mt-0.5">
                        Supervisors and host representatives access only their assigned students
                        and organization records.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <Award className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-900">
                        End-to-End Completion Verification
                      </p>
                      <p className="text-slate-600 mt-0.5">
                        Combines accepted progress reports, workplace evaluations, and academic
                        assessments into auditable completion records.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    to="/login"
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-teal-700 transition-colors"
                  >
                    <span>Access Demonstration Accounts</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About LEAP Section */}
      <section id="about-leap" className="py-16 lg:py-20 border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
              About the Programme
            </span>
            <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-[#002B49]">
              Bridging Academic Excellence and Industry Practice in Sierra Leone
            </h2>
            <p className="mt-4 text-sm sm:text-base text-slate-600 leading-relaxed">
              The Limkokwing Experiential Academic Placement (LEAP) programme prepares
              undergraduate students across ICT, Business, Design, Architecture, and Media for
              professional careers by embedding structured industry internships into the
              curriculum. Historically managed through paper forms and fragmented spreadsheets,
              the Digital LEAP System centralizes every stage of the internship lifecycle into a
              single, transparent, and auditable database.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-xl border border-slate-200 p-6 bg-slate-50/60">
              <h3 className="text-sm font-bold text-[#002B49]">
                Structured State Transitions
              </h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Applications, placements, progress reports, and assessments follow strict
                state machines enforced by server-side PostgreSQL functions, preventing
                invalid transitions or self-approval.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 p-6 bg-slate-50/60">
              <h3 className="text-sm font-bold text-[#002B49]">
                Real-Time Supervision & Accountability
              </h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Students record verified workplace hours and learning outcomes while academic
                supervisors provide structured feedback and version-controlled report reviews.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 p-6 bg-slate-50/60">
              <h3 className="text-sm font-bold text-[#002B49]">
                Configurable Institutional Policy
              </h3>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Eligibility thresholds, minimum required reports, and assessment weighting
                parameters are stored in database configuration tables so university leadership
                can adapt policies without code changes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How the Internship Process Works */}
      <section id="how-it-works" className="py-16 lg:py-20 bg-slate-50 border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
                COMP 217 Process Architecture
              </span>
              <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-[#002B49]">
                How the Internship Process Works
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md">
              Aligned with the four core Level-0 Data Flow Diagram processes established in the
              system analysis specification.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {processSteps.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.step}
                  className="rounded-xl border border-slate-200 bg-white p-6 shadow-subtle flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center rounded-md bg-[#002B49] px-2.5 py-1 text-xs font-bold text-white">
                        Step {item.step}
                      </span>
                      <span className="text-[11px] font-semibold text-teal-700">
                        {item.processRef}
                      </span>
                    </div>
                    <div className="mt-4 h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center text-[#002B49]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 text-base font-bold text-slate-900">{item.title}</h3>
                    <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stakeholders Section */}
      <section id="stakeholders" className="py-16 lg:py-20 bg-white border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
              Role-Based Access Control
            </span>
            <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-[#002B49]">
              Six Stakeholders, One Centralized Platform
            </h2>
            <p className="mt-3 text-sm text-slate-600">
              Each stakeholder signs in through a single authentication gateway and is routed to a
              dedicated workspace governed by PostgreSQL Row Level Security.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {stakeholders.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.role}
                  className="rounded-xl border border-slate-200 p-6 hover:border-slate-300 transition-colors bg-white"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-[#002B49]/10 text-[#002B49] flex items-center justify-center">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900">{item.role}</h3>
                  </div>
                  <p className="mt-3 text-xs text-slate-600 leading-relaxed">{item.summary}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-12 rounded-2xl bg-[#002B49] p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-lg sm:text-xl font-bold">
                Ready to access the Digital LEAP Internship Management System?
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                Sign in with your university or host organization account to manage applications,
                placements, reports, and evaluations.
              </p>
            </div>
            <Link
              to="/login"
              className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-teal-500 px-6 py-3 text-xs sm:text-sm font-bold text-slate-950 hover:bg-teal-400 transition-colors"
            >
              <span>Proceed to Login</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 py-10 mt-auto">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img
              src="/limkokwing-logo.png"
              alt="Limkokwing University Sierra Leone"
              className="h-10 w-auto bg-white rounded p-1 object-contain"
            />
            <div className="text-xs">
              <p className="font-semibold text-white">
                Limkokwing University of Creative Technology — Sierra Leone
              </p>
              <p className="text-slate-400">
                Digital LEAP Internship Management System • Hill Station, Freetown
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6 text-xs">
            <Link to="/login" className="text-slate-300 hover:text-white transition-colors">
              Portal Login
            </Link>
            <span>COMP 217 Academic Demonstration</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

