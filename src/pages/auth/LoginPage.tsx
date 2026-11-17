import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { DEMO_ACCOUNTS, DemoAccountInfo, ROLE_HOME_PATH } from '../../types/auth';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import {
  Lock,
  Mail,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  KeyRound,
} from 'lucide-react';

const DEMO_DEFAULT_PASSWORD = 'LeapDemo!2026';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { signIn, isAuthenticated, activeRole, authError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [recoverySent, setRecoverySent] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && activeRole) {
      navigate(ROLE_HOME_PATH[activeRole], { replace: true });
    }
  }, [isAuthenticated, activeRole, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
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

  const handleDemoAccountSignIn = async (account: DemoAccountInfo) => {
    setError(null);
    setRecoverySent(null);
    setEmail(account.email);
    setPassword(DEMO_DEFAULT_PASSWORD);
    setSubmitting(true);

    const result = await signIn(account.email, DEMO_DEFAULT_PASSWORD);
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error || 'Failed to sign in with demo account.');
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
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Bar */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-[#002B49]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Public Landing Page</span>
          </Link>
          <span className="text-xs text-slate-500">
            Limkokwing University of Creative Technology — Sierra Leone
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Login / Recovery Form */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-card p-6 sm:p-8">
            <div className="flex flex-col items-center text-center pb-6 border-b border-slate-100">
              <img
                src="/limkokwing-logo.png"
                alt="Limkokwing University Sierra Leone"
                className="h-16 w-auto object-contain"
              />
              <h1 className="mt-4 text-xl font-bold text-[#002B49]">
                {recoveryMode ? 'Password Recovery' : 'Sign In to Digital LEAP'}
              </h1>
              <p className="mt-1 text-xs text-slate-500">
                {recoveryMode
                  ? 'Request a secure password reset link via Supabase Auth'
                  : 'Enter your university or host organization credentials'}
              </p>
            </div>

            {(error || authError) && (
              <div
                role="alert"
                className="mt-4 rounded-lg bg-rose-50 p-3 text-xs text-rose-700 flex items-start gap-2 border border-rose-200"
              >
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error || authError}</span>
              </div>
            )}

            {recoverySent && (
              <div className="mt-4 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800 flex items-start gap-2 border border-emerald-200">
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{recoverySent}</span>
              </div>
            )}

            {!recoveryMode ? (
              <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label
                    htmlFor="login-email"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Email Address
                  </label>
                  <div className="mt-1 relative">
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
                      className="block w-full pl-9 pr-3 py-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002B49] focus:border-transparent text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
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
                      }}
                      className="text-[11px] font-medium text-teal-700 hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      id="login-password"
                      type="password"
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="block w-full pl-9 pr-3 py-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002B49] focus:border-transparent text-slate-900"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="w-full"
                  isLoading={submitting}
                >
                  <span>Sign In</span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
            ) : (
              <form className="mt-5 space-y-4" onSubmit={handlePasswordRecovery}>
                <div>
                  <label
                    htmlFor="recovery-email"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Registered Email Address
                  </label>
                  <div className="mt-1 relative">
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
                      className="block w-full pl-9 pr-3 py-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002B49] focus:border-transparent text-slate-900"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="w-full"
                  isLoading={submitting}
                >
                  <KeyRound className="mr-2 h-4 w-4" />
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

            <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-500 text-center">
              Accounts are provisioned by the University ICT Office and LEAP Coordination Unit.
            </div>
          </div>

          {/* Right: Provisioned Supabase Auth Demonstration Accounts */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-card p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700">
                  Supabase Auth Provisioned Accounts
                </span>
                <h2 className="text-base font-bold text-slate-900 mt-0.5">
                  Six Role Demonstration Accounts
                </h2>
              </div>
              <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-mono text-slate-700">
                Password: {DEMO_DEFAULT_PASSWORD}
              </span>
            </div>

            <p className="mt-3 text-xs text-slate-600 leading-relaxed">
              Select any stakeholder below to sign in with its real Supabase Auth credentials and
              test role-based access control, PostgreSQL Row Level Security, and the 12-step
              end-to-end LEAP workflow.
            </p>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {DEMO_ACCOUNTS.map((acc) => (
                <div
                  key={acc.role}
                  className="rounded-xl border border-slate-200 p-3.5 hover:border-[#002B49] transition-colors flex flex-col justify-between bg-slate-50/50"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center rounded bg-[#002B49]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#002B49]">
                        {acc.label}
                      </span>
                    </div>
                    <p className="mt-2 text-xs font-bold text-slate-900">{acc.name}</p>
                    <p className="text-[11px] font-mono text-slate-600 truncate">{acc.email}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{acc.subtitle}</p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-200/70 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setRecoveryMode(false);
                        setEmail(acc.email);
                        setPassword(DEMO_DEFAULT_PASSWORD);
                      }}
                      className="text-[11px] font-medium text-slate-600 hover:text-slate-900"
                    >
                      Fill Form
                    </button>
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => handleDemoAccountSignIn(acc)}
                      className="inline-flex items-center gap-1 rounded-lg bg-[#002B49] px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-[#001f35] disabled:opacity-50 transition-colors"
                    >
                      <span>Sign in as {acc.label}</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
