import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { StudentRegistryCandidateResult } from '../../types/database';
import { Button } from '../../components/ui/Button';
import { PasswordInput } from '../../components/ui/PasswordInput';
import {
  User,
  GraduationCap,
  Mail,
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

      {/* Main Split Registration Card */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 leap-geo-grid">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 rounded-lg border border-slate-200 bg-white shadow-card overflow-hidden leap-page-enter">
          {/* Left Institutional Registry Verification Panel */}
          <div className="lg:col-span-5 bg-[#002B49] leap-geo-grid-dark text-white p-7 sm:p-8 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <img
                  src="/limkokwing-logo.png"
                  alt="Limkokwing University Sierra Leone"
                  className="h-12 w-auto bg-white rounded p-1 object-contain"
                />
                <div className="border-l border-white/20 pl-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-teal-300">
                    Student Registry
                  </p>
                  <p className="text-xs font-semibold text-white">
                    Digital LEAP Onboarding
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                <h2 className="text-lg font-bold leading-snug text-white">
                  Automatic University Identity Verification
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Enter your official Student ID and registered university email. Your Faculty,
                  Programme, Year of Study, Semester, and GPA are synchronized directly from the
                  University Student Registry.
                </p>
              </div>

              <ol className="space-y-3 pt-2 text-xs text-slate-200 border-t border-white/15">
                <li className="flex items-start gap-2.5">
                  <span className="font-mono text-[10px] font-bold bg-teal-600/30 border border-teal-400/40 text-teal-200 px-1.5 py-0.5 rounded shrink-0">
                    01
                  </span>
                  <span>Verify active enrollment match against the protected Student Registry.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="font-mono text-[10px] font-bold bg-teal-600/30 border border-teal-400/40 text-teal-200 px-1.5 py-0.5 rounded shrink-0">
                    02
                  </span>
                  <span>Confirm your institutional email to activate your STUDENT portal access.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="font-mono text-[10px] font-bold bg-teal-600/30 border border-teal-400/40 text-teal-200 px-1.5 py-0.5 rounded shrink-0">
                    03
                  </span>
                  <span>Submit your internship application for LEAP Coordinator review.</span>
                </li>
              </ol>
            </div>

            <div className="mt-8 pt-4 border-t border-white/15 text-[11px] text-slate-300 flex items-start gap-2">
              <ShieldCheck className="h-4 w-4 text-teal-300 shrink-0 mt-0.5" />
              <span>
                Staff, academic supervisor, and host representative accounts are provisioned
                exclusively by the System Administrator.
              </span>
            </div>
          </div>

          {/* Right Form Panel */}
          <div className="lg:col-span-7 p-6 sm:p-8 lg:p-9">
            <div className="pb-5 border-b border-slate-100">
              <p className="text-[11px] font-bold uppercase tracking-wider text-teal-700">
                Undergraduate Self-Registration
              </p>
              <h1 className="mt-1 text-xl sm:text-2xl font-bold text-[#002B49]">
                Create Student Account
              </h1>
              <p className="mt-1 text-xs text-slate-500">
                Official University Student Registry Verification • Digital LEAP System
              </p>
            </div>

            {registeredComplete ? (
              <div className="mt-6 space-y-5">
                <div className="flex items-start gap-3.5 rounded-lg border border-emerald-200 bg-emerald-50/70 p-4">
                  <div className="h-9 w-9 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-sm font-bold text-slate-900">
                      {pendingEmailConfirmation
                        ? 'Confirm Your University Email to Activate Your Account'
                        : 'Student Account Verified & Activated'}
                    </h2>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {pendingEmailConfirmation ? (
                        <>
                          Your Student ID (
                          <strong className="font-mono">{studentId.trim().toUpperCase()}</strong>)
                          matched the University Student Registry. Click the verification link sent
                          to <strong>{email.trim().toLowerCase()}</strong> to activate your{' '}
                          <strong>STUDENT</strong> account.
                        </>
                      ) : (
                        <>
                          Your Student ID (
                          <strong className="font-mono">{studentId.trim().toUpperCase()}</strong>)
                          and university email (<strong>{email.trim().toLowerCase()}</strong>) have
                          been verified against the University Student Registry, and your{' '}
                          <strong>STUDENT</strong> account is now active.
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <p className="text-[11px] text-slate-600 bg-slate-50 border border-slate-200 rounded-md p-3 leading-relaxed">
                  Note: Activating your student account grants access to the Student Portal so you
                  can prepare and submit your internship application for review by the LEAP
                  Coordinator.
                </p>

                {resendInfo && (
                  <div className="rounded-md bg-teal-50 p-3 text-xs text-teal-800 border border-teal-200">
                    {resendInfo}
                  </div>
                )}

                {error && (
                  <div className="rounded-md bg-rose-50 p-3 text-xs text-rose-800 border border-rose-200">
                    {error}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                  {pendingEmailConfirmation && (
                    <Button
                      type="button"
                      variant="outline"
                      size="md"
                      className="flex-1"
                      isLoading={resending}
                      onClick={handleResendConfirmation}
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      <span>Resend Verification Email</span>
                    </Button>
                  )}

                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    className="flex-1"
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
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {error && (
                  <div
                    role="alert"
                    className="mt-4 rounded-md bg-rose-50 p-3 text-xs text-rose-800 flex items-start gap-2 border border-rose-200"
                  >
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
                    <span>{error}</span>
                  </div>
                )}

                <form className="mt-5 space-y-4" onSubmit={handleRegister}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="reg-fullname"
                        className="block text-xs font-semibold text-slate-700 mb-1.5"
                      >
                        Full Name *
                      </label>
                      <div className="relative">
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
                          className="block w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#002B49] focus:ring-2 focus:ring-[#002B49]/15 transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="reg-student-id"
                        className="block text-xs font-semibold text-slate-700 mb-1.5"
                      >
                        Student ID *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <GraduationCap className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                          id="reg-student-id"
                          type="text"
                          required
                          value={studentId}
                          onChange={(e) => setStudentId(e.target.value)}
                          placeholder="LUCT-SL-2024-0901"
                          className="block w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm font-mono border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#002B49] focus:ring-2 focus:ring-[#002B49]/15 transition-colors uppercase"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="reg-email"
                      className="block text-xs font-semibold text-slate-700 mb-1.5"
                    >
                      University Email Address *
                    </label>
                    <div className="relative">
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
                        className="block w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#002B49] focus:ring-2 focus:ring-[#002B49]/15 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <PasswordInput
                      id="reg-password"
                      label="Password * (min 8 chars)"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a password"
                    />
                    <PasswordInput
                      id="reg-confirm-password"
                      label="Confirm Password *"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    className="w-full py-2.5"
                    isLoading={submitting}
                  >
                    <span>Verify Identity & Create Student Account</span>
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </form>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                  <span>Already have an account?</span>
                  <Link
                    to="/login"
                    className="font-bold text-teal-700 hover:text-[#002B49] hover:underline"
                  >
                    Sign In
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
