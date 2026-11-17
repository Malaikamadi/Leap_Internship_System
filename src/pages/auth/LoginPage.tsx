import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ROLE_HOME_PATH } from '../../types/auth';
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
  UserPlus,
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
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Bar */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-[#002B49]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </Link>
          <span className="text-xs text-slate-500">
            Limkokwing University of Creative Technology — Sierra Leone
          </span>
        </div>
      </div>

      {/* Centered Single Login Card */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-card p-6 sm:p-8">
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

          {infoBanner && (
            <div className="mt-4 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800 flex items-start gap-2 border border-emerald-200">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{infoBanner}</span>
            </div>
          )}

          {(error || authError) && (
            <div
              role="alert"
              className="mt-4 rounded-lg bg-rose-50 p-3 text-xs text-rose-700 space-y-2 border border-rose-200"
            >
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
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
                    Forgot Password?
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

          <div className="mt-6 pt-5 border-t border-slate-100 text-center space-y-2">
            <p className="text-xs text-slate-600">
              Undergraduate student without an account?
            </p>
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-teal-700 hover:underline"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Create Student Account</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
