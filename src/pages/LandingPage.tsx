import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ROLE_HOME_PATH, ROLE_LABELS } from '../types/auth';
import { GlobalHeroGlobe, MiniTechOrbital } from '../components/landing/GlobalTechBackdrop';
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
  UserPlus,
  CheckCircle2,
  Globe2,
  Cpu,
  Terminal,
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

  const [activeStageIdx, setActiveStageIdx] = useState(0);
  const [consolePaused, setConsolePaused] = useState(false);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  const heroStages = [
    {
      tag: '01',
      label: 'Registry Verification',
      role: 'Student + Registrar',
      status: 'DRAFT → SUBMITTED',
      detail: 'Student ID & email verified against the protected University Student Registry.',
    },
    {
      tag: '02',
      label: 'Coordinator Review',
      role: 'LEAP Coordinator',
      status: 'UNDER REVIEW → APPROVED',
      detail: 'Automated credit, GPA & year-of-study checks govern eligibility approval.',
    },
    {
      tag: '03',
      label: 'Placement & Supervision',
      role: 'Host Org + Supervisor',
      status: 'CONFIRMED → ACTIVE',
      detail: 'Host confirms placement while academic supervisor reviews weekly reports.',
    },
    {
      tag: '04',
      label: 'Evaluation & Completion',
      role: 'Supervisor + Management',
      status: 'FINALIZED → COMPLETED',
      detail: 'Workplace ratings and composite scores feed live institutional analytics.',
    },
  ];

  useEffect(() => {
    if (consolePaused) return;
    const timer = window.setInterval(() => {
      setActiveStageIdx((prev) => (prev + 1) % heroStages.length);
    }, 3600);
    return () => window.clearInterval(timer);
  }, [consolePaused, heroStages.length]);

  const handleHeroMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    setParallax({
      x: Math.round(nx * -16),
      y: Math.round(ny * -12),
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
      code: 'ROLE // 01',
      role: 'Student',
      scope: 'Self-Registration & Logbook',
      portal: '/app/student',
      icon: GraduationCap,
      summary:
        'Verify enrollment identity, manage academic profile, draft and submit internship applications with preferred host organization, submit progress reports, and track completion requirements.',
    },
    {
      code: 'ROLE // 02',
      role: 'LEAP Coordinator',
      scope: 'Eligibility & Placement Operations',
      portal: '/app/coordinator',
      icon: ClipboardCheck,
      summary:
        'Audit student eligibility, review organization preferences, approve or return applications, manage host partner capacity, assign placements, and allocate academic supervisors.',
    },
    {
      code: 'ROLE // 03',
      role: 'Academic Supervisor',
      scope: 'Mentorship & Assessment',
      portal: '/app/supervisor',
      icon: UserCheck,
      summary:
        'Supervise assigned students, review submitted progress reports with structured feedback, inspect workplace host evaluations, and record finalized academic assessments.',
    },
    {
      code: 'ROLE // 04',
      role: 'Host Organization',
      scope: 'Workplace Confirmation & Evaluation',
      portal: '/app/host',
      icon: Building2,
      summary:
        'Confirm or decline nominated student placements, evaluate intern conduct and technical growth across six structured criteria, and escalate workplace concerns.',
    },
    {
      code: 'ROLE // 05',
      role: 'University Management',
      scope: 'Executive Institutional Analytics',
      portal: '/app/management',
      icon: BarChart3,
      summary:
        'Inspect faculty participation distributions, industry placement coverage, completion rates, and mean assessment outcomes with structured institutional CSV exports.',
    },
    {
      code: 'ROLE // 06',
      role: 'System Administrator',
      scope: 'Identity, Registry & Audit Governance',
      portal: '/app/admin',
      icon: ShieldCheck,
      summary:
        'Provision staff accounts via one-time setup links, manage the University Student Registry, administer multi-role access, tune policy thresholds, and inspect immutable audit logs.',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900">
      {/* Top Signature Institutional Accent Rule */}
      <div className="h-1 w-full bg-gradient-to-r from-[#002B49] via-teal-500 to-[#002B49]" />

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

      {/* Hero Section — Unobstructed Global World Globe Showcase + Bottom Interactive Command Deck */}
      <section
        onMouseMove={handleHeroMouseMove}
        onMouseLeave={() => setParallax({ x: 0, y: 0 })}
        className="relative overflow-hidden bg-gradient-to-br from-[#001729] via-[#002B49] to-[#022036] text-white border-b border-teal-500/20"
      >
        {/* Subtle Architectural Dark Grid */}
        <div className="pointer-events-none absolute inset-0 leap-geo-grid-dark opacity-70" aria-hidden="true" />
        {/* Subtle Left Ambient Teal Glow */}
        <div
          className="pointer-events-none absolute -left-32 -top-24 h-[420px] w-[420px] rounded-full opacity-20 blur-3xl"
          style={{
            background:
              'radial-gradient(circle, rgba(45, 212, 191, 0.28) 0%, rgba(0, 43, 73, 0) 70%)',
          }}
          aria-hidden="true"
        />

        <div className="relative z-10 mx-auto max-w-7xl px-4 pt-12 pb-10 sm:px-6 lg:px-8 lg:pt-16 lg:pb-12">
          {/* Top Split: Left Editorial Copy + Right 100% Unobstructed Wireframe Globe */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            <div className="lg:col-span-6 space-y-6">
              <div className="leap-hero-rise inline-flex items-center gap-2.5 rounded-md border border-teal-400/30 bg-teal-500/10 px-3 py-1.5 text-[11px] font-mono font-bold uppercase tracking-widest text-teal-300">
                <Globe2 className="h-3.5 w-3.5 text-teal-300 animate-pulse" />
                <span>Global University of Creative Technology • Sierra Leone</span>
              </div>

              <h1 className="leap-hero-rise-delay-1 text-3xl sm:text-4xl lg:text-[2.95rem] font-extrabold tracking-tight text-white leading-[1.09]">
                Digital LEAP Internship Management System
              </h1>

              <p className="leap-hero-rise-delay-2 text-sm sm:text-base text-slate-200/90 leading-relaxed max-w-xl">
                Connecting{' '}
                <strong className="font-semibold text-white">
                  Limkokwing University of Creative Technology — Sierra Leone
                </strong>{' '}
                students, faculty coordinators, academic supervisors, and industry host
                organizations through a modern, globally connected experiential learning platform
                powered by live PostgreSQL workflows.
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

              <div className="leap-hero-rise-delay-3 grid grid-cols-3 gap-4 pt-5 border-t border-white/15 max-w-lg">
                <div>
                  <p className="text-base sm:text-lg font-bold text-white font-display">
                    6 Role Portals
                  </p>
                  <p className="text-[11px] text-teal-200/80 mt-0.5 leading-snug">
                    PostgreSQL RLS Isolation
                  </p>
                </div>
                <div className="border-l border-white/15 pl-4">
                  <p className="text-base sm:text-lg font-bold text-white font-display">
                    4 Core Stages
                  </p>
                  <p className="text-[11px] text-teal-200/80 mt-0.5 leading-snug">
                    State-Driven Lifecycle
                  </p>
                </div>
                <div className="border-l border-white/15 pl-4">
                  <p className="text-base sm:text-lg font-bold text-white font-display">
                    Verified ID
                  </p>
                  <p className="text-[11px] text-teal-200/80 mt-0.5 leading-snug">
                    Student Registry Gate
                  </p>
                </div>
              </div>
            </div>

            {/* Right Showcase: 100% Unobstructed Animated Global World Globe */}
            <div className="lg:col-span-6 leap-hero-rise-delay-1">
              <GlobalHeroGlobe offsetX={parallax.x} offsetY={parallax.y} />
            </div>
          </div>

          {/* Horizontal Interactive Workflow Telemetry Bar (Clear Below the Globe!) */}
          <div
            onMouseEnter={() => setConsolePaused(true)}
            onMouseLeave={() => setConsolePaused(false)}
            className="mt-10 pt-6 border-t border-white/10"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3 text-[10px] font-mono uppercase tracking-widest text-slate-400">
              <span className="inline-flex items-center gap-2 text-teal-300 font-semibold">
                <Terminal className="h-3.5 w-3.5" />
                <span>Live LEAP Workflow Pipeline • Interactive Stage Inspector</span>
              </span>
              <span>
                ACTIVE STAGE: 0{activeStageIdx + 1} / 0{heroStages.length}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {heroStages.map((stage, idx) => {
                const isActive = idx === activeStageIdx;
                return (
                  <button
                    key={stage.tag}
                    type="button"
                    onClick={() => setActiveStageIdx(idx)}
                    className={`group relative text-left rounded-md border p-3.5 transition-all duration-300 overflow-hidden ${
                      isActive
                        ? 'bg-teal-500/15 border-teal-400/65 shadow-md shadow-black/25'
                        : 'bg-[#001424]/70 border-white/10 hover:bg-white/[0.06] hover:border-white/25'
                    }`}
                  >
                    {isActive && (
                      <span
                        className="absolute top-0 left-0 right-0 h-[2px] bg-teal-400"
                        aria-hidden="true"
                      />
                    )}
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-white">
                        <CheckCircle2
                          className={`h-3.5 w-3.5 shrink-0 ${
                            isActive ? 'text-teal-300' : 'text-slate-500'
                          }`}
                        />
                        <span className="truncate">{stage.label}</span>
                      </span>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                          isActive
                            ? 'bg-teal-400/20 text-teal-200 font-bold'
                            : 'bg-white/10 text-slate-400'
                        }`}
                      >
                        {stage.tag}
                      </span>
                    </div>
                    <p
                      className={`mt-1.5 text-[10px] font-mono ${
                        isActive ? 'text-teal-300' : 'text-slate-400'
                      }`}
                    >
                      {stage.status}
                    </p>
                    <p className="mt-1.5 text-[11px] text-slate-300/90 leading-snug">
                      {stage.detail}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Global Tech University Kinetic Ticker Strip */}
      <div className="bg-[#001220] border-b border-teal-500/20 py-3 overflow-hidden">
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

      {/* Stakeholders Directory — Tech-University Role Portal Matrix */}
      <section id="stakeholders" className="py-16 lg:py-22 bg-white border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <RevealSection className="max-w-2xl">
            <p className="text-[11px] font-mono font-bold uppercase tracking-widest text-teal-700">
              Role-Based Access Control • 6 Authorized Workspaces
            </p>
            <h2 className="mt-1.5 text-2xl sm:text-3xl font-bold text-[#002B49]">
              Six Stakeholders, One Centralized Platform
            </h2>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">
              All participants authenticate through one shared login gateway and enter a dedicated
              role workspace enforced by PostgreSQL Row-Level Security.
            </p>
          </RevealSection>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {stakeholders.map((item, idx) => {
              const Icon = item.icon;
              return (
                <RevealSection key={item.role} delayMs={idx * 70}>
                  <div className="group h-full relative rounded-lg border border-slate-200 bg-white overflow-hidden hover:border-teal-600/60 hover:-translate-y-1 hover:shadow-lg hover:shadow-[#002B49]/[0.08] transition-all duration-200 flex flex-col justify-between">
                    {/* Animated Top Laser Accent Line */}
                    <span
                      className="absolute top-0 left-0 right-0 h-[2px] bg-teal-500 scale-x-0 origin-left group-hover:scale-x-100 transition-transform duration-300"
                      aria-hidden="true"
                    />

                    {/* Crisp Tech Header Bar */}
                    <div className="px-5 py-3 bg-[#002B49]/[0.03] border-b border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold tracking-widest text-slate-500 group-hover:text-teal-700 transition-colors">
                        {item.code}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-teal-500/70 group-hover:animate-ping" />
                        <span>{item.portal}</span>
                      </span>
                    </div>

                    <div className="p-5 flex-1">
                      <div className="flex items-center gap-3 mb-2.5">
                        <div className="h-9 w-9 rounded-md bg-[#002B49] text-teal-300 group-hover:bg-teal-600 group-hover:text-white group-hover:scale-105 transition-all duration-200 flex items-center justify-center shrink-0">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-[#002B49] leading-tight">
                            {item.role}
                          </h3>
                          <p className="text-[10px] font-mono font-semibold uppercase tracking-wider text-teal-700 mt-0.5">
                            {item.scope}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{item.summary}</p>
                    </div>
                  </div>
                </RevealSection>
              );
            })}
          </div>

          {/* Animated Global Orbital CTA Callout */}
          <RevealSection delayMs={140} className="mt-12">
            <div className="relative overflow-hidden rounded-lg bg-[#002B49] leap-geo-grid-dark p-6 sm:p-8 text-white flex flex-col md:flex-row md:items-center justify-between gap-6 border border-[#001a2e]">
              <MiniTechOrbital className="absolute -right-12 -top-12 h-56 w-56 opacity-75" />

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
