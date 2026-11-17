import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
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
} from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [email, setEmail] = useState('');
  const [faculty, setFaculty] = useState(
    'Faculty of Information & Communication Technology'
  );
  const [programme, setProgramme] = useState(
    'BSc (Hons) in Software Engineering with Multimedia'
  );
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registeredComplete, setRegisteredComplete] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = fullName.trim();
    const trimmedStudentId = studentId.trim();
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

    // 1. Pre-check duplicate Student ID in PostgreSQL
    const { data: idAvailable, error: checkErr } = await supabase.rpc(
      'check_student_id_available',
      { p_student_number: trimmedStudentId }
    );
    if (checkErr) {
      setSubmitting(false);
      setError(checkErr.message);
      return;
    }
    if (!idAvailable) {
      setSubmitting(false);
      setError(`Student ID "${trimmedStudentId}" is already registered.`);
      return;
    }

    // 2. Create account via Supabase Auth.
    // The server-side handle_new_auth_user trigger automatically assigns ONLY the
    // 'student' role in public.user_roles and creates public.student_profiles.
    const { data, error: signUpErr } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
        data: {
          full_name: trimmedName,
          student_number: trimmedStudentId,
          faculty,
          programme,
          year_of_study: 4,
          semester: 8,
        },
      },
    });

    if (signUpErr || !data.user) {
      setSubmitting(false);
      setError(signUpErr?.message || 'Registration failed. Please check your details.');
      return;
    }

    // Sign out any auto-created session so the student completes the standard login verification flow
    if (data.session) {
      await supabase.auth.signOut();
    }

    setSubmitting(false);
    setRegisteredComplete(true);
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
              Undergraduate Student Self-Registration • Digital LEAP System
            </p>
          </div>

          {registeredComplete ? (
            <div className="mt-6 space-y-5 text-center">
              <div className="mx-auto h-12 w-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div className="space-y-1.5">
                <h2 className="text-base font-bold text-slate-900">
                  Student Account Created & Verified
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Your student account for <strong>{email.trim().toLowerCase()}</strong> (Student
                  ID: <strong>{studentId.trim()}</strong>) has been registered with the{' '}
                  <strong>STUDENT</strong> role. Proceed to the login page to sign in and access
                  your dashboard.
                </p>
              </div>
              <Button
                type="button"
                variant="primary"
                size="md"
                className="w-full"
                onClick={() =>
                  navigate('/login', {
                    state: {
                      registeredEmail: email.trim().toLowerCase(),
                      registrationMessage:
                        'Student registration complete. Sign in with your email and password below.',
                    },
                  })
                }
              >
                <span>Proceed to Sign In</span>
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          ) : (
            <>
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
                        className="block w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002B49] text-slate-900"
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
                      htmlFor="reg-faculty"
                      className="block text-xs font-semibold text-slate-700"
                    >
                      Faculty
                    </label>
                    <select
                      id="reg-faculty"
                      value={faculty}
                      onChange={(e) => setFaculty(e.target.value)}
                      className="mt-1 block w-full py-2 px-3 text-xs border border-slate-300 rounded-lg bg-white text-slate-900"
                    >
                      <option value="Faculty of Information & Communication Technology">
                        Faculty of ICT
                      </option>
                      <option value="Faculty of Business & Globalization">
                        Faculty of Business & Globalization
                      </option>
                      <option value="Faculty of Architecture & The Built Environment">
                        Faculty of Architecture & Built Environment
                      </option>
                      <option value="Faculty of Design Innovation">
                        Faculty of Design Innovation
                      </option>
                      <option value="Faculty of Communication, Media & Broadcasting">
                        Faculty of Communication & Media
                      </option>
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="reg-programme"
                      className="block text-xs font-semibold text-slate-700"
                    >
                      Programme of Study
                    </label>
                    <input
                      id="reg-programme"
                      type="text"
                      required
                      value={programme}
                      onChange={(e) => setProgramme(e.target.value)}
                      className="mt-1 block w-full py-2 px-3 text-xs border border-slate-300 rounded-lg text-slate-900"
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
                  <span>Create Student Account</span>
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

