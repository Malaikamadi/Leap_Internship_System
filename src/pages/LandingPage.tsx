import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ROLE_HOME_PATH, ROLE_LABELS } from '../types/auth';
import { GlobalTechBackdrop } from '../components/landing/GlobalTechBackdrop';
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
  Globe2,
  Cpu,
} from 'lucide-react';

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
}

const RevealSection: React.FC<RevealProps> = ({ children, className = '', delayMs = 0 }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(
    () => typeof window === 'undefined' || !('IntersectionObserver' in window)
  );

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delayMs}ms` }}
      className={`transition-all duration-700 ease-out ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
      } ${className}`}
    >
      {children}
    </div>
  );
};

export const LandingPage: React.FC = () => {
  const { isAuthenticated, activeRole } = useAuth();
  const portalTarget = isAuthenticated && activeRole ? ROLE_HOME_PATH[activeRole] : '/login';

  // Interactive Hero Workflow Stage Console
  const [activeStageIdx, setActiveStageIdx] = useState(0);
  const [consolePaused, setConsolePaused] = useState(false);

  // Subtle pointer parallax for the Global World backdrop
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  const heroStages = [
    {
      tag: 'STAGE 01',
      label: 'Registry Verification & Application',
      role: 'Student + Registrar Registry',
      status: 'DRAFT → SUBMITTED',
      detail:
        'Student ID and university email verified against the protected Registrar table before application submission.',
    },
    {
      tag: 'STAGE 02',
      label: 'Eligibility Review & Decision',
      role: 'LEAP Coordinator',
      status: 'UNDER REVIEW → APPROVED',
      detail:
        'Automated credit, year-of-study, and GPA checks guide coordinator approval, correction, or rejection.',
    },
    {
      tag: 'STAGE 03',
      label: 'Host Confirmation & Supervision',
      role: 'Host Organization + Supervisor',
      status: 'CONFIRMED → ACTIVE',
      detail:
        'Partner organizations confirm nominated interns while academic supervisors track live progress reports.',
    },
    {
      tag: 'STAGE 04',
      label: 'Evaluation, Grading & Completion',
      role: 'Supervisor + University Management',
      status: 'FINALIZED → COMPLETED',
      detail:
        'Workplace ratings and academic scores produce verified completion records and executive analytics.',
    },
  ];

  useEffect(() => {
    if (consolePaused) return;
    const timer = window.setInterval(() => {
      setActiveStageIdx((prev) => (prev + 1) % heroStages.length);
    }, 3800);
    return () => window.clearInterval(timer);
  }, [consolePaused, heroStages.length]);

  const handleHeroMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    setParallax({
      x: Math.round(nx * -18),
      y: Math.round(ny * -14),
    });
  };

  const tickerItems = [
    'Limkokwing Global Campus Network',
    'Freetown • Sierra Leone Tech Hub',
    'Software Engineering & Multimedia',
    'Information Technology',
    'Business Information Systems',
    'Architectural Technology',
    'Creative Innovation & Design',
    'Protected Student Registry',
    'PostgreSQL Row-Level Security',
  ];

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
      <div className="h-1 w-full bg-gradient-to-r from-[#002B49] via-teal-600 to-[#002B49]" />

      {/* Sticky Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-slate-200/90 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex py-3 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3.5 group">
            <img
              src="/limkokwing-logo.png"
              alt="Limkokwing University of Creative Technology — Sierra Leone"
              className="h-11 w-auto object-contain transition-transform duration-200 group-hover:scale-[1.02]"
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
                className="group inline-flex items-center gap-2 rounded-lg bg-[#002B49] px-4 py-2 text-xs font-semibold text-white hover:bg-[#001f35] transition-all"
              >
                <span>Open {ROLE_LABELS[activeRole]} Portal</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-[#002B49] hover:bg-slate-50 hover:border-teal-600/60 transition-colors"
                >
                  <UserPlus className="h-3.5 w-3.5 text-teal-700" />
                  <span>Create Student Account</span>
                </Link>
                <Link
                  to="/login"
                  className="group inline-flex items-center gap-2 rounded-lg bg-[#002B49] px-4 py-2 text-xs font-semibold text-white hover:bg-[#001f35] transition-all"
                >
                  <span>Sign In</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section — Deep Navy Global Creative Technology Experience with Animated Wireframe Globe */}
      <section
        onMouseMove={handleHeroMouseMove}
        onMouseLeave={() => setParallax({ x: 0, y: 0 })}
        className="relative overflow-hidden bg-gradient-to-br from-[#00192c] via-[#002B49] to-[#022138] text-white border-b border-teal-500/20"
      >
        <GlobalTechBackdrop offsetX={parallax.x} offsetY={parallax.y} />

        <div className="relative z-10 mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-22">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Editorial Column */}
            <div className="lg:col-span-7 space-y-6">
              <div className="leap-hero-rise inline-flex items-center gap-2.5 rounded-md border border-teal-400/30 bg-teal-500/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-teal-300">
                <Globe2 className="h-3.5 w-3.5 text-teal-300 animate-pulse" />
                <span>Global University of Creative Technology • Sierra Leone</span>
              </div>

              <h1 className="leap-hero-rise-delay-1 text-3xl sm:text-4xl lg:text-[2.95rem] font-extrabold tracking-tight text-white leading-[1.1]">
                Digital LEAP Internship Management System
              </h1>

              <p className="leap-hero-rise-delay-2 text-sm sm:text-base text-slate-200/90 leading-relaxed max-w-2xl">
                Connecting{' '}
                <strong className="font-semibold text-white">
                  Limkokwing University of Creative Technology — Sierra Leone
                </strong>{' '}
                students, faculty coordinators, academic supervisors, and industry host
                organizations through an intelligent, globally inspired experiential learning
                platform powered by real-time PostgreSQL workflows.
              </p>

              <div className="leap-hero-rise-delay-2 flex flex-wrap items-center gap-3.5 pt-1">
                <Link
                  to={portalTarget}
                  className="group inline-flex items-center gap-2 rounded-lg bg-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-950/40 hover:bg-teal-500 active:scale-[0.99] transition-all"
                >
                  <span>{isAuthenticated ? 'Continue to Dashboard' : 'Sign In to Portal'}</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                {!isAuthenticated && (
                  <Link
                    to="/register"
                    className="group inline-flex items-center gap-2 rounded-lg border border-white/25 bg-white/10 px-5 py-3 text-sm font-semibold text-white hover:bg-white/20 hover:border-teal-300/60 active:scale-[0.99] transition-all"
                  >
                    <UserPlus className="h-4 w-4 text-teal-300" />
                    <span>Create Student Account</span>
                  </Link>
                )}
              </div>

              {/* Architectural Platform Specification Bar */}
              <div className="leap-hero-rise-delay-3 grid grid-cols-3 gap-4 pt-6 border-t border-white/15 max-w-xl">
                <div>
                  <p className="text-lg font-bold text-white font-display">6 Role Portals</p>
                  <p className="text-[11px] text-teal-200/80 mt-0.5 leading-snug">
                    PostgreSQL Row-Level Security
                  </p>
                </div>
                <div className="border-l border-white/15 pl-4">
                  <p className="text-lg font-bold text-white font-display">4 Core Stages</p>
                  <p className="text-[11px] text-teal-200/80 mt-0.5 leading-snug">
                    State-Driven Academic Lifecycle
                  </p>
                </div>
                <div className="border-l border-white/15 pl-4">
                  <p className="text-lg font-bold text-white font-display">Verified ID</p>
                  <p className="text-[11px] text-teal-200/80 mt-0.5 leading-snug">
                    Protected Student Registry
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column — Interactive Animated LEAP Lifecycle Console */}
            <div className="lg:col-span-5 leap-hero-rise-delay-2">
              <div
                onMouseEnter={() => setConsolePaused(true)}
                onMouseLeave={() => setConsolePaused(false)}
                className="rounded-lg border border-teal-400/25 bg-[#001d33]/90 backdrop-blur-sm shadow-2xl shadow-black/40 overflow-hidden"
              >
                {/* Console Header */}
                <div className="bg-[#001424] px-5 py-3.5 border-b border-white/10 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src="/limkokwing-logo.png"
                      alt="Limkokwing University Sierra Leone"
                      className="h-9 w-auto bg-white rounded p-0.5 object-contain"
                    />
                    <div>
                      <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-teal-300 flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse" />
                        <span>Live Workflow Engine</span>
                      </p>
                      <h2 className="text-xs sm:text-sm font-bold text-white leading-tight">
                        Hill Station Campus • Freetown
                      </h2>
                    </div>
                  </div>
                  <Lock className="h-4 w-4 text-teal-300/80 shrink-0" />
                </div>

                {/* Interactive Stage Selector */}
                <div className="p-5 space-y-2.5">
                  <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1">
                    <span>Click any stage to inspect</span>
                    <span className="text-teal-300">
                      0{activeStageIdx + 1} / 0{heroStages.length}
                    </span>
                  </div>

                  {heroStages.map((stage, idx) => {
                    const isActive = idx === activeStageIdx;
                    return (
                      <button
                        key={stage.tag}
                        type="button"
                        onClick={() => setActiveStageIdx(idx)}
                        className={`w-full text-left rounded-md border px-3.5 py-2.5 transition-all duration-300 ${
                          isActive
                            ? 'bg-teal-500/15 border-teal-400/60 shadow-sm'
                            : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.07] hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <CheckCircle2
                              className={`h-3.5 w-3.5 shrink-0 transition-colors ${
                                isActive ? 'text-teal-300' : 'text-slate-500'
                              }`}
                            />
                            <span
                              className={`text-xs font-bold truncate ${
                                isActive ? 'text-white' : 'text-slate-300'
                              }`}
                            >
                              {stage.label}
                            </span>
                          </div>
                          <span
                            className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded shrink-0 ${
                              isActive
                                ? 'bg-teal-400/20 text-teal-200'
                                : 'bg-white/10 text-slate-400'
                            }`}
                          >
                            {stage.tag}
                          </span>
                        </div>

                        <div className="mt-1 flex items-center justify-between gap-2 text-[10px] font-mono">
                          <span className={isActive ? 'text-teal-300' : 'text-slate-400'}>
                            {stage.status}
                          </span>
                          <span className="text-slate-400 truncate">{stage.role}</span>
                        </div>

                        {isActive && (
                          <p className="mt-2 pt-2 border-t border-teal-400/20 text-[11px] text-slate-200 leading-relaxed">
                            {stage.detail}
                          </p>
                        )}
                      </button>
                    );
                  })}

                  {/* Quick Portal Actions inside Console */}
                  <div className="pt-3 mt-1 border-t border-white/10 flex flex-col sm:flex-row gap-2">
                    <Link
                      to="/login"
                      className="group flex-1 inline-flex items-center justify-center gap-1.5 rounded-md bg-white px-3.5 py-2 text-xs font-bold text-[#002B49] hover:bg-teal-50 transition-colors"
                    >
                      <span>Sign In</span>
                      <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                    <Link
                      to="/register"
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md border border-teal-400/40 bg-teal-600/20 px-3.5 py-2 text-xs font-semibold text-teal-100 hover:bg-teal-600/35 transition-colors"
                    >
                      <UserPlus className="h-3.5 w-3.5 text-teal-300" />
                      <span>Create Student Account</span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Global Tech University Kinetic Ticker Strip */}
      <div className="bg-[#001424] border-b border-teal-500/20 py-3 overflow-hidden">
        <div className="leap-marquee-track">
          {[...tickerItems, ...tickerItems].map((item, idx) => (
            <div
              key={`${item}-${idx}`}
              className="inline-flex items-center gap-3 px-6 text-[11px] font-mono uppercase tracking-widest text-teal-200/80 whitespace-nowrap"
            >
              <Cpu className="h-3 w-3 text-teal-400 shrink-0" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* About LEAP Section — Asymmetric Editorial Split with Scroll Reveal */}
      <section id="about-leap" className="py-16 lg:py-22 border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
            <RevealSection className="lg:col-span-5">
              <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-teal-700">
                <span className="h-2 w-2 rounded-xs bg-teal-600" />
                <span>About the Programme</span>
              </div>
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

              {/* Subtle Interactive Global Tech Accent Callout */}
              <div className="mt-6 rounded-lg border border-slate-200 bg-[#f7f9fb] p-4 flex items-start gap-3">
                <div className="h-8 w-8 rounded-md bg-[#002B49] text-teal-300 flex items-center justify-center shrink-0">
                  <Globe2 className="h-4 w-4" />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-[#002B49]">Global Standards, Local Impact</p>
                  <p className="text-slate-600 mt-0.5 leading-relaxed">
                    Built for Limkokwing University&apos;s Sierra Leone campus to align students
                    with banking, telecom, civic tech, and creative industries across Freetown.
                  </p>
                </div>
              </div>
            </RevealSection>

            <div className="lg:col-span-7 divide-y divide-slate-200 border-y border-slate-200">
              {governancePillars.map((pillar, idx) => (
                <RevealSection key={pillar.num} delayMs={idx * 90}>
                  <div className="py-5 first:pt-4 last:pb-4 pl-3 -ml-3 border-l-2 border-transparent hover:border-teal-600 hover:bg-slate-50/70 transition-all duration-200 flex items-start gap-4 rounded-r-md">
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
                </RevealSection>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How the Internship Process Works — Connected 4-Stage Rail with Animated Energy Beam */}
      <section
        id="how-it-works"
        className="py-16 lg:py-22 bg-[#f7f9fb] leap-geo-grid border-b border-slate-200"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <RevealSection className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-8 border-b border-slate-200">
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
          </RevealSection>

          <div className="mt-10 relative">
            {/* Horizontal connecting progression track with animated teal energy beam */}
            <div
              className="hidden lg:block absolute top-6 left-8 right-8 h-[2px] bg-slate-200 overflow-hidden"
              aria-hidden="true"
            >
              <div className="h-full w-1/3 leap-beam-flow" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {processSteps.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <RevealSection key={item.step} delayMs={idx * 90}>
                    <div className="group h-full relative bg-white border border-slate-200 rounded-lg p-5 hover:border-teal-600/60 hover:-translate-y-1 hover:shadow-lg hover:shadow-[#002B49]/[0.07] transition-all duration-200 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-[#002B49] group-hover:bg-teal-700 text-xs font-bold font-mono text-white transition-colors">
                            {item.step}
                          </span>
                          <span className="text-[11px] font-mono font-semibold text-teal-700">
                            {item.processRef}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[#002B49] mb-2">
                          <Icon className="h-4 w-4 text-teal-700 shrink-0 transition-transform duration-200 group-hover:scale-110" />
                          <h3 className="text-sm font-bold text-[#002B49] leading-snug">
                            {item.title}
                          </h3>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {item.description}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100">
                        <span className="text-[10px] font-mono font-semibold text-slate-500 group-hover:text-teal-700 transition-colors">
                          {item.states}
                        </span>
                      </div>
                    </div>
                  </RevealSection>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Stakeholders Directory — Interactive Tech-Grid Matrix */}
      <section id="stakeholders" className="py-16 lg:py-22 bg-white border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <RevealSection className="max-w-2xl">
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
          </RevealSection>

          <RevealSection delayMs={100} className="mt-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-slate-200 border border-slate-200 rounded-lg overflow-hidden">
              {stakeholders.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.role}
                    className="group relative bg-white p-6 hover:bg-[#f7f9fb] transition-colors flex flex-col justify-between overflow-hidden"
                  >
                    {/* Animated top teal laser bar on hover */}
                    <span
                      className="absolute top-0 left-0 right-0 h-[2px] bg-teal-600 scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-300"
                      aria-hidden="true"
                    />
                    <div>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="h-9 w-9 rounded-md bg-[#002B49]/[0.07] text-[#002B49] group-hover:bg-[#002B49] group-hover:text-teal-300 group-hover:scale-105 transition-all duration-200 flex items-center justify-center shrink-0">
                          <Icon className="h-4 w-4" />
                        </div>
                        <h3 className="text-sm font-bold text-[#002B49]">{item.role}</h3>
                      </div>
                      <p className="text-[11px] font-mono font-semibold uppercase tracking-wider text-teal-700 mb-2">
                        {item.scope}
                      </p>
                      <p className="text-xs text-slate-600 leading-relaxed">{item.summary}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </RevealSection>

          {/* Animated Global Orbital CTA Callout */}
          <RevealSection delayMs={140} className="mt-12">
            <div className="relative overflow-hidden rounded-lg bg-[#002B49] leap-geo-grid-dark p-6 sm:p-8 text-white flex flex-col md:flex-row md:items-center justify-between gap-6 border border-[#001a2e]">
              {/* Subtle Rotating Orbital Accent Ring */}
              <svg
                className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 text-teal-400/15 leap-orbit-slow"
                viewBox="0 0 200 200"
                fill="none"
                aria-hidden="true"
              >
                <circle
                  cx="100"
                  cy="100"
                  r="86"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeDasharray="6 8"
                />
                <circle cx="100" cy="100" r="62" stroke="currentColor" strokeWidth="1" />
                <circle cx="100" cy="14" r="3" fill="#2dd4bf" />
              </svg>

              <div className="relative z-10 max-w-xl">
                <p className="text-[11px] font-mono font-bold uppercase tracking-widest text-teal-300">
                  Global University Portal Access
                </p>
                <h3 className="text-lg sm:text-xl font-bold mt-1">
                  Launch your verified LEAP internship workflow
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed">
                  Enrolled undergraduate students activate their account with their official Student
                  ID; faculty coordinators, supervisors, and host representatives sign in with their
                  provisioned credentials.
                </p>
              </div>
              <div className="relative z-10 flex flex-wrap items-center gap-3 shrink-0">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-teal-500 transition-colors"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Create Student Account</span>
                </Link>
                <Link
                  to="/login"
                  className="group inline-flex items-center gap-2 rounded-lg border border-white/25 bg-white/10 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-white/20 transition-colors"
                >
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* Institutional Footer */}
      <footer className="bg-[#001628] text-slate-300 py-10 mt-auto border-t border-white/10">
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
