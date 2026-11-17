import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import {
  Lock,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  KeyRound,
} from 'lucide-react';

export const SetupPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState(searchParams.get('token') || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completedEmail, setCompletedEmail] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token.trim()) {
      setError('A valid invitation setup token is required.');
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
    const { data, error: rpcErr } = await supabase.rpc('complete_staff_password_setup', {
      p_token: token.trim(),
      p_password: password,
    });
    setSubmitting(false);

    if (rpcErr) {
      setError(rpcErr.message);
      return;
    }

    const res = data as { email: string; role: string };
    setCompletedEmail(res.email);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-[#002B49]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Sign In</span>
          </Link>
          <span className="text-xs text-slate-500">
            Limkokwing University of Creative Technology — Sierra Leone
          </span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-card p-6 sm:p-8">
          <div className="flex flex-col items-center text-center pb-6 border-b border-slate-100">
            <img
              src="/limkokwing-logo.png"
              alt="Limkokwing University Sierra Leone"
              className="h-14 w-auto object-contain"
            />
            <h1 className="mt-3 text-xl font-bold text-[#002B49]">
              Staff Account Password Setup
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Complete your administrator-provisioned staff account invitation
            </p>
          </div>

          {completedEmail ? (
            <div className="mt-6 space-y-4 text-center">
              <div className="mx-auto h-12 w-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <p className="text-xs text-slate-700">
                Password configured for <strong>{completedEmail}</strong>. You may now sign in to
                your authorized workspace.
              </p>
              <Button
                type="button"
                variant="primary"
                size="md"
                className="w-full"
                onClick={() =>
                  navigate('/login', {
                    state: {
                      registeredEmail: completedEmail,
                      registrationMessage:
                        'Password setup complete. Sign in with your new password.',
                    },
                  })
                }
              >
                <span>Proceed to Sign In</span>
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {error && (
                <div
                  role="alert"
                  className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700 flex items-start gap-2 border border-rose-200"
                >
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label
                  htmlFor="setup-token"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Invitation Token *
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyRound className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    id="setup-token"
                    type="text"
                    required
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Paste invitation token"
                    className="block w-full pl-9 pr-3 py-2 text-xs font-mono border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="setup-password"
                  className="block text-xs font-semibold text-slate-700"
                >
                  New Password * (min 8 characters)
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    id="setup-password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="block w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="setup-confirm"
                  className="block text-xs font-semibold text-slate-700"
                >
                  Confirm New Password *
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    id="setup-confirm"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="block w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg text-slate-900"
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
                <span>Complete Password Setup</span>
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

