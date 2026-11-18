import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ROLE_HOME_PATH } from '../../types/auth';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { PasswordInput } from '../../components/ui/PasswordInput';
import { MiniTechOrbital } from '../../components/landing/GlobalTechBackdrop';
import {
  Mail,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  UserPlus,
  ShieldCheck,
} from 'lucide-react';

interface LocationState {
  registeredEmail?: string;
  registrationMessage?: string;
}

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as LocationState) || {};
  const { signIn, isAuthenticated, activeRole, authError } = useAuth();

  const [email, setEmail] = useState(state.registeredEmail || '');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoBanner, setInfoBanner] = useState<string | null>(
    state.registrationMessage || null
  );
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [recoverySent, setRecoverySent] = useState<string | null>(null);
  const [resendingConfirm, setResendingConfirm] = useState(false);

  const handleResendConfirmation = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setError('Enter your university email address above to resend the verification email.');
      return;
    }
    setResendingConfirm(true);
    setError(null);
    await supabase.rpc('refresh_student_verification_expiry', { p_email: trimmed });
    const { error: resendErr } = await supabase.auth.resend({
      type: 'signup',
      email: trimmed,
      options: { emailRedirectTo: `${window.location.origin}/login` },
    });
    setResendingConfirm(false);
    if (resendErr) {
      setError(resendErr.message);
      return;
    }
    setInfoBanner(
      `A fresh email verification link has been sent to ${trimmed}. Please confirm your email before signing in.`
    );
  };

  useEffect(() => {
    if (isAuthenticated && activeRole) {
      navigate(ROLE_HOME_PATH[activeRole], { replace: true });
    }
  }, [isAuthenticated, activeRole, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoBanner(null);
    setRecoverySent(null);
    setSubmitting(true);

    const result = await signIn(email, password);
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error || 'Authentication failed. Please verify your credentials.');
      return;
    }

    if (result.redirectPath) {
      navigate(result.redirectPath, { replace: true });
    }
  };

  const handlePasswordRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setRecoverySent(null);

    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setError('Enter your registered email address to request a password reset link.');
      return;
    }

    setSubmitting(true);
    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(trimmed, {
      redirectTo: `${window.location.origin}/login`,
    });
    setSubmitting(false);

    if (resetErr) {
      setError(resetErr.message);
      return;
    }

    setRecoverySent(
      `If an active account exists for ${trimmed}, a password recovery link has been dispatched.`
    );
  };

  return (
    <div className="min-h-screen bg-[#f7f9fb] flex flex-col">
      <div className="h-1 w-full bg-[#002B49]" />

      {/* Top Navigation Bar */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-[#002B49] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Home</span>
          </Link>
          <span className="text-[11px] font-medium text-slate-500 hidden sm:inline">
            Limkokwing University of Creative Technology — Sierra Leone
          </span>
        </div>
      </div>

      {/* Main Split Institutional Auth Layout */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 leap-geo-grid">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 rounded-lg border border-slate-200/90 bg-white shadow-xl shadow-[#002B49]/[0.06] overflow-hidden leap-page-enter">
          {/* Left Institutional Brand Panel — Tech-University Animated Orbital Panel */}
          <div className="lg:col-span-5 bg-gradient-to-br from-[#00182b] via-[#002B49] to-[#02223a] leap-geo-grid-dark text-white p-7 sm:p-8 flex flex-col justify-between relative overflow-hidden">
            {/* Subtle Animated Scan Beam */}
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-24 leap-scan-line"
              aria-hidden="true"
            />
            {/* Animated Wireframe Orbital Watermark */}
            <MiniTechOrbital className="absolute -right-14 -bottom-14 h-56 w-56 opacity-70" />

            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-3 leap-stagger-1">
                <img
                  src="/limkokwing-logo.png"
                  alt="Limkokwing University Sierra Leone"
                  className="h-12 w-auto bg-white rounded p-1 object-contain"
                />
                <div className="border-l border-white/20 pl-3">
                  <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-teal-300 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse" />
                    <span>Digital LEAP Portal</span>
                  </p>
                  <p className="text-xs font-semibold text-white">
                    Limkokwing Sierra Leone
                  </p>
                </div>
              </div>

              <div className="space-y-2.5 pt-2 leap-stagger-2">
                <h2 className="text-xl font-bold leading-snug text-white">
                  Unified Role-Based Authentication Gateway
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Sign in once to access your authorized workspace—Student, LEAP Coordinator,
                  Academic Supervisor, Host Organization, University Management, or System
                  Administrator.
                </p>
              </div>

              {/* Tech Security Telemetry Pills */}
              <div className="leap-stagger-3 flex flex-wrap gap-1.5 pt-1">
                {['AUTH // SUPABASE JWT', 'DB // POSTGRESQL RLS', '6 ROLE PORTALS'].map((tag) => (
                  <span
                    key={tag}
                    className="rounded border border-teal-400/25 bg-teal-500/10 px-2 py-0.5 text-[10px] font-mono text-teal-200"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="relative z-10 mt-8 pt-5 border-t border-white/15 space-y-2.5 text-[11px] text-slate-300">
              <div className="flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 text-teal-300 shrink-0 mt-0.5" />
                <span>
                  Protected by Supabase Auth, PostgreSQL Row-Level Security, and active account
                  status verification.
                </span>
              </div>
              <p className="text-slate-400 font-mono text-[10px]">
                HILL STATION CAMPUS • FREETOWN, SIERRA LEONE
              </p>
            </div>
          </div>

          {/* Right Form Panel */}
          <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-center leap-stagger-2">
            <div className="pb-5 border-b border-slate-100">
              <p className="text-[11px] font-bold uppercase tracking-wider text-teal-700">
                {recoveryMode ? 'Account Recovery' : 'Portal Access'}
              </p>
              <h1 className="mt-1 text-xl sm:text-2xl font-bold text-[#002B49]">
                {recoveryMode ? 'Password Recovery' : 'Sign In to Digital LEAP'}
              </h1>
              <p className="mt-1 text-xs text-slate-500">
                {recoveryMode
                  ? 'Request a secure password reset link via Supabase Auth'
                  : 'Enter your university or partner host organization credentials'}
              </p>
            </div>

            {infoBanner && (
              <div className="mt-4 rounded-md bg-emerald-50 p-3 text-xs text-emerald-800 flex items-start gap-2 border border-emerald-200">
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
                <span>{infoBanner}</span>
              </div>
            )}

            {(error || authError) && (
              <div
                role="alert"
                className="mt-4 rounded-md bg-rose-50 p-3 text-xs text-rose-800 space-y-2 border border-rose-200"
              >
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
                  <span>{error || authError}</span>
                </div>
                {((error || authError || '').toLowerCase().includes('email not confirmed') ||
                  (error || authError || '').toLowerCase().includes('verification')) && (
                  <button
                    type="button"
                    disabled={resendingConfirm}
                    onClick={handleResendConfirmation}
                    className="text-[11px] font-bold text-teal-800 underline hover:text-[#002B49]"
                  >
                    {resendingConfirm ? 'Sending verification email...' : 'Resend Verification Email'}
                  </button>
                )}
              </div>
            )}

            {recoverySent && (
              <div className="mt-4 rounded-md bg-emerald-50 p-3 text-xs text-emerald-800 flex items-start gap-2 border border-emerald-200">
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-600" />
                <span>{recoverySent}</span>
              </div>
            )}

            {!recoveryMode ? (
              <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label
                    htmlFor="login-email"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      id="login-email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@limkokwing.edu.sl"
                      className="block w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#002B49] focus:ring-2 focus:ring-[#002B49]/15 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="login-password"
                      className="block text-xs font-semibold text-slate-700"
                    >
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setRecoveryMode(true);
                        setError(null);
                        setInfoBanner(null);
                      }}
                      className="text-[11px] font-semibold text-teal-700 hover:text-[#002B49] hover:underline"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <PasswordInput
                    id="login-password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="w-full py-2.5"
                  isLoading={submitting}
                >
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </form>
            ) : (
              <form className="mt-5 space-y-4" onSubmit={handlePasswordRecovery}>
                <div>
                  <label
                    htmlFor="recovery-email"
                    className="block text-xs font-semibold text-slate-700 mb-1.5"
                  >
                    Registered Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      id="recovery-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@limkokwing.edu.sl"
                      className="block w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#002B49] focus:ring-2 focus:ring-[#002B49]/15 transition-colors"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="w-full py-2.5"
                  isLoading={submitting}
                >
                  <KeyRound className="h-4 w-4" />
                  <span>Send Recovery Instructions</span>
                </Button>

                <button
                  type="button"
                  onClick={() => {
                    setRecoveryMode(false);
                    setError(null);
                    setRecoverySent(null);
                  }}
                  className="block w-full text-center text-xs font-semibold text-slate-600 hover:text-[#002B49]"
                >
                  Return to Sign In
                </button>
              </form>
            )}

            <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <span className="text-slate-500">Undergraduate student without an account?</span>
              <Link
                to="/register"
                className="inline-flex items-center gap-1.5 font-bold text-teal-700 hover:text-[#002B49] hover:underline"
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>Create Student Account</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
