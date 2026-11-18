import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { PasswordInput } from '../../components/ui/PasswordInput';
import {
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
    <div className="min-h-screen bg-[#f7f9fb] flex flex-col">
      <div className="h-1 w-full bg-[#002B49]" />

      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-[#002B49] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Sign In</span>
          </Link>
          <span className="text-[11px] font-medium text-slate-500 hidden sm:inline">
            Limkokwing University of Creative Technology — Sierra Leone
          </span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 leap-geo-grid">
        <div className="w-full max-w-md bg-white rounded-lg border border-slate-200 shadow-card p-6 sm:p-8 leap-page-enter">
          <div className="flex items-center gap-3.5 pb-5 border-b border-slate-100">
            <img
              src="/limkokwing-logo.png"
              alt="Limkokwing University Sierra Leone"
              className="h-11 w-auto object-contain"
            />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-teal-700">
                Staff Onboarding
              </p>
              <h1 className="text-lg font-bold text-[#002B49] leading-tight">
                Staff Account Password Setup
              </h1>
            </div>
          </div>

          {completedEmail ? (
            <div className="mt-6 space-y-4 text-center">
              <div className="mx-auto h-11 w-11 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
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
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {error && (
                <div
                  role="alert"
                  className="rounded-md bg-rose-50 p-3 text-xs text-rose-800 flex items-start gap-2 border border-rose-200"
                >
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label
                  htmlFor="setup-token"
                  className="block text-xs font-semibold text-slate-700 mb-1.5"
                >
                  One-Time Invitation Token *
                </label>
                <div className="relative">
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
                    className="block w-full pl-9 pr-3 py-2.5 text-xs font-mono border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:border-[#002B49] focus:ring-2 focus:ring-[#002B49]/15"
                  />
                </div>
              </div>

              <PasswordInput
                id="setup-password"
                label="New Password * (min 8 characters)"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Choose a strong password"
              />

              <PasswordInput
                id="setup-confirm"
                label="Confirm New Password *"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
              />

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full py-2.5"
                isLoading={submitting}
              >
                <span>Complete Password Setup</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
