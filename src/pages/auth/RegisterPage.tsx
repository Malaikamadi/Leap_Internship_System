import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { StudentRegistryCandidateResult } from '../../types/database';
import { Button } from '../../components/ui/Button';
import {
  User,
  GraduationCap,
  Mail,
  Lock,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendInfo, setResendInfo] = useState<string | null>(null);
  const [registeredComplete, setRegisteredComplete] = useState(false);
  const [pendingEmailConfirmation, setPendingEmailConfirmation] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResendInfo(null);

    const trimmedName = fullName.trim();
    const trimmedStudentId = studentId.trim().toUpperCase();
    const trimmedEmail = email.trim().toLowerCase();

    if (trimmedName.length < 2) {
      setError('Please enter your full name (at least 2 characters).');
      return;
    }
    if (trimmedStudentId.length < 3) {
      setError('Please enter a valid University Student ID.');
      return;
    }
    if (!trimmedEmail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmedEmail)) {
      setError('Please enter a valid university email address.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);

    // 1. Pre-check Student ID + institutional email against the protected University Student Registry
    const { data: candidateData, error: checkErr } = await supabase.rpc(
      'verify_student_registration_candidate',
      {
        p_student_number: trimmedStudentId,
        p_email: trimmedEmail,
      }
    );

    if (checkErr) {
      setSubmitting(false);
      setError(checkErr.message);
      return;
    }

    const candidate = candidateData as StudentRegistryCandidateResult | null;
    if (!candidate || !candidate.ok) {
      setSubmitting(false);
      setError(
        candidate?.error ||
          'We could not verify that Student ID and university email combination against active Limkokwing enrollment records.'
      );
      return;
    }

    // 2. Create account via Supabase Auth.
    // The database trigger validates against private.university_student_registry,
    // populates academic attributes strictly from the official registry, and activates
    // ONLY the 'student' role once email confirmation succeeds.
    const { data, error: signUpErr } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
        data: {
          full_name: trimmedName,
          student_number: trimmedStudentId,
        },
      },
    });

    if (signUpErr || !data.user) {
      setSubmitting(false);
      setError(signUpErr?.message || 'Registration failed. Please check your details.');
      return;
    }

    const requiresEmailConfirm = !data.session && !data.user.email_confirmed_at;
    setPendingEmailConfirmation(requiresEmailConfirm);

    // Sign out any auto-created session so the student signs in through the standard login verification flow
    if (data.session) {
      await supabase.auth.signOut();
    }

    setSubmitting(false);
    setRegisteredComplete(true);
  };

  const handleResendConfirmation = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) return;
    setResending(true);
    setError(null);
    setResendInfo(null);

    await supabase.rpc('refresh_student_verification_expiry', {
      p_email: trimmedEmail,
    });

    const { error: resendErr } = await supabase.auth.resend({
      type: 'signup',
      email: trimmedEmail,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });

    setResending(false);
    if (resendErr) {
      setError(resendErr.message);
      return;
    }
    setResendInfo(
      `A fresh verification email has been sent to ${trimmedEmail}. Please confirm within 24 hours.`
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

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 shadow-card p-6 sm:p-8">
          <div className="flex flex-col items-center text-center pb-6 border-b border-slate-100">
            <img
              src="/limkokwing-logo.png"
              alt="Limkokwing University Sierra Leone"
              className="h-14 w-auto object-contain"
            />
            <h1 className="mt-3 text-xl font-bold text-[#002B49]">
              Create Student Account
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Official University Student Registry Verification • Digital LEAP System
            </p>
          </div>

          {registeredComplete ? (
            <div className="mt-6 space-y-5 text-center">
              <div className="mx-auto h-12 w-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h2 className="text-base font-bold text-slate-900">
                  {pendingEmailConfirmation
                    ? 'Confirm Your University Email to Activate Your Account'
                    : 'Student Account Verified & Activated'}
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {pendingEmailConfirmation ? (
                    <>
                      Your Student ID (<strong>{studentId.trim().toUpperCase()}</strong>) was
                      matched against the University Student Registry. Please click the verification
                      link sent to <strong>{email.trim().toLowerCase()}</strong> to activate your{' '}
                      <strong>STUDENT</strong> account.
                    </>
                  ) : (
                    <>
                      Your Student ID (<strong>{studentId.trim().toUpperCase()}</strong>) and
                      university email (<strong>{email.trim().toLowerCase()}</strong>) have been
                      verified against the University Student Registry, and your{' '}
                      <strong>STUDENT</strong> account is now active.
                    </>
                  )}
                </p>
                <p className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                  Note: Account activation grants access to the Student Portal so you can prepare
                  and submit your internship application for review by the LEAP Coordinator.
                </p>
              </div>

              {resendInfo && (
                <div className="rounded-lg bg-teal-50 p-3 text-xs text-teal-800 border border-teal-200">
                  {resendInfo}
                </div>
              )}

              {error && (
                <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
                  {error}
                </div>
              )}

              <div className="space-y-2.5">
                {pendingEmailConfirmation && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full"
                    isLoading={resending}
                    onClick={handleResendConfirmation}
                  >
                    <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                    <span>Resend Verification Email</span>
                  </Button>
                )}

                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  className="w-full"
                  onClick={() =>
                    navigate('/login', {
                      state: {
                        registeredEmail: email.trim().toLowerCase(),
                        registrationMessage: pendingEmailConfirmation
                          ? 'Please confirm the verification link sent to your university email before signing in.'
                          : 'Student registration verified. Sign in with your university email and password below.',
                      },
                    })
                  }
                >
                  <span>Proceed to Sign In</span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="mt-4 rounded-lg bg-slate-50 border border-slate-200 p-3 flex items-start gap-2.5">
                <ShieldCheck className="h-4 w-4 text-teal-700 shrink-0 mt-0.5" />
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Enter your official Limkokwing <strong>Student ID</strong> and registered{' '}
                  <strong>University Email Address</strong>. Your Faculty, Programme, Year of Study,
                  and Academic Standing are loaded automatically from the University Registrar.
                </p>
              </div>

              {error && (
                <div
                  role="alert"
                  className="mt-4 rounded-lg bg-rose-50 p-3 text-xs text-rose-700 flex items-start gap-2 border border-rose-200"
                >
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form className="mt-5 space-y-4" onSubmit={handleRegister}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="reg-fullname"
                      className="block text-xs font-semibold text-slate-700"
                    >
                      Full Name *
                    </label>
                    <div className="mt-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-4 w-4 text-slate-400" />
                      </div>
                      <input
                        id="reg-fullname"
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Mariama Conteh"
                        className="block w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002B49] text-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="reg-student-id"
                      className="block text-xs font-semibold text-slate-700"
                    >
                      Student ID *
                    </label>
                    <div className="mt-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <GraduationCap className="h-4 w-4 text-slate-400" />
                      </div>
                      <input
                        id="reg-student-id"
                        type="text"
                        required
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        placeholder="e.g. LUCT-SL-2024-0901"
                        className="block w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002B49] text-slate-900 uppercase"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="reg-email"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    University Email Address *
                  </label>
                  <div className="mt-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      id="reg-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@student.limkokwing.edu.sl"
                      className="block w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002B49] text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="reg-password"
                      className="block text-xs font-semibold text-slate-700"
                    >
                      Password * (min 8 characters)
                    </label>
                    <div className="mt-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-4 w-4 text-slate-400" />
                      </div>
                      <input
                        id="reg-password"
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="block w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002B49] text-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="reg-confirm-password"
                      className="block text-xs font-semibold text-slate-700"
                    >
                      Confirm Password *
                    </label>
                    <div className="mt-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-4 w-4 text-slate-400" />
                      </div>
                      <input
                        id="reg-confirm-password"
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="block w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002B49] text-slate-900"
                      />
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="w-full"
                  isLoading={submitting}
                >
                  <span>Verify Identity & Create Student Account</span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>

              <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-600">
                Already have an account?{' '}
                <Link to="/login" className="font-bold text-teal-700 hover:underline">
                  Sign In
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
