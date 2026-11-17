import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types/auth';
import { Button } from '../../components/ui/Button';
import { 
  Lock, 
  Mail, 
  AlertCircle, 
  ArrowRight
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, availableDemoUsers, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email) {
      setError('Please provide your university email address.');
      return;
    }
    const success = await login(email);
    if (success) {
      navigate('/dashboard');
    } else {
      setError('Invalid credentials or inactive account.');
    }
  };

  const handleQuickDemoLogin = async (userEmail: string, role: UserRole) => {
    setError(null);
    setEmail(userEmail);
    const success = await login(userEmail, role);
    if (success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#002B49] text-teal-400 font-black text-2xl shadow-lg ring-4 ring-teal-500/20">
            LP
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-black tracking-tight text-[#002B49]">
          Digital LEAP Internship System
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500">
          Limkokwing University of Creative Technology — Sierra Leone
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-card rounded-2xl sm:px-10 border border-slate-200">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700 flex items-center gap-2 border border-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                University / Corporate Email
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. name@student.limkokwing.edu.sl"
                  className="block w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002B49] focus:border-transparent text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#002B49] focus:border-transparent text-slate-900"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full mt-2"
              isLoading={isLoading}
            >
              Sign In to LEAP Portal
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          {/* Quick Academic Demo Switcher */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Interactive Defense Demo Accounts:
              </span>
              <span className="text-[10px] text-teal-700 font-semibold bg-teal-50 px-2 py-0.5 rounded">
                Click to Auto-Login
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-left">
              {availableDemoUsers.map((demo) => (
                <button
                  key={demo.id}
                  type="button"
                  onClick={() => handleQuickDemoLogin(demo.email, demo.role_name)}
                  className="p-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 transition-colors text-left"
                >
                  <p className="text-[11px] font-bold text-slate-900 truncate">{demo.full_name}</p>
                  <p className="text-[10px] text-teal-700 font-medium capitalize mt-0.5">
                    {demo.role_name}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-slate-500">
            New Student?{' '}
            <Link to="/register" className="font-semibold text-teal-700 hover:underline">
              Register Student Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
