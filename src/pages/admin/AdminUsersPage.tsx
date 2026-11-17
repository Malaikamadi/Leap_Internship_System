import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { AppRole, ROLE_LABELS, UserProfile } from '../../types/auth';
import { UserRoleRow } from '../../types/database';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import {
  Users,
  Search,
  CheckCircle2,
  XCircle,
  Plus,
  X,
  AlertCircle,
} from 'lucide-react';

const ALL_ROLES: AppRole[] = [
  'student',
  'coordinator',
  'supervisor',
  'host',
  'management',
  'admin',
];

export const AdminUsersPage: React.FC = () => {
  const { user: currentUser, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [userRoles, setUserRoles] = useState<UserRoleRow[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleSelections, setRoleSelections] = useState<Record<string, AppRole>>({});

  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const [{ data: profRows }, { data: roleRows }] = await Promise.all([
      supabase.from('profiles').select('*').order('full_name', { ascending: true }),
      supabase.from('user_roles').select('*'),
    ]);

    const profList = (profRows || []) as UserProfile[];
    setProfiles(profList);
    setUserRoles((roleRows || []) as UserRoleRow[]);

    const defaults: Record<string, AppRole> = {};
    for (const p of profList) {
      defaults[p.id] = 'coordinator';
    }
    setRoleSelections((prev) => ({ ...defaults, ...prev }));
    setLoading(false);
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const rolesByUser: Record<string, AppRole[]> = {};
  for (const ur of userRoles) {
    rolesByUser[ur.user_id] = rolesByUser[ur.user_id] || [];
    rolesByUser[ur.user_id].push(ur.role);
  }

  const handleToggleActive = async (targetUser: UserProfile) => {
    setError(null);
    setSuccess(null);
    setProcessing(true);

    const nextActive = !targetUser.is_active;
    const { error: rpcErr } = await supabase.rpc('admin_set_user_active', {
      p_user_id: targetUser.id,
      p_is_active: nextActive,
    });
    setProcessing(false);

    if (rpcErr) {
      setError(rpcErr.message);
      return;
    }

    await loadUsers();
    setSuccess(
      `Account ${targetUser.email} ${nextActive ? 'activated' : 'deactivated'}.`
    );
  };

  const handleGrantRole = async (userId: string) => {
    setError(null);
    setSuccess(null);
    const roleToGrant = roleSelections[userId];
    if (!roleToGrant) return;

    setProcessing(true);
    const { error: rpcErr } = await supabase.rpc('admin_grant_role', {
      p_user_id: userId,
      p_role: roleToGrant,
    });
    setProcessing(false);

    if (rpcErr) {
      setError(rpcErr.message);
      return;
    }

    await loadUsers();
    if (userId === currentUser?.id) {
      await refreshProfile();
    }
    setSuccess(`Granted role "${ROLE_LABELS[roleToGrant]}".`);
  };

  const handleRevokeRole = async (userId: string, role: AppRole) => {
    setError(null);
    setSuccess(null);
    setProcessing(true);

    const { error: rpcErr } = await supabase.rpc('admin_revoke_role', {
      p_user_id: userId,
      p_role: role,
    });
    setProcessing(false);

    if (rpcErr) {
      setError(rpcErr.message);
      return;
    }

    await loadUsers();
    if (userId === currentUser?.id) {
      await refreshProfile();
    }
    setSuccess(`Revoked role "${ROLE_LABELS[role]}".`);
  };

  const filteredProfiles = profiles.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.full_name.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="pb-3 border-b border-slate-200">
        <h2 className="text-xl font-bold text-[#002B49]">
          User Accounts & Role-Based Access Management
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Activate or deactivate accounts and assign or revoke database roles via protected
          server-side RPCs
        </p>
      </div>

      <div className="relative max-w-md">
        <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search accounts by name or email..."
          className="w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 py-2 text-xs text-slate-900"
        />
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700 flex items-start gap-2.5"
        >
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800 flex items-start gap-2.5">
          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-teal-600" />
            <span>Registered Accounts ({filteredProfiles.length})</span>
          </CardTitle>
        </CardHeader>

        {loading ? (
          <p className="py-8 text-center text-xs text-slate-500">Loading accounts...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2.5">User</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5">Assigned Roles</th>
                  <th className="px-3 py-2.5">Grant Additional Role</th>
                  <th className="px-3 py-2.5 text-right">Account Status Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProfiles.map((p) => {
                  const assigned = rolesByUser[p.id] || [];
                  const isSelf = p.id === currentUser?.id;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="px-3 py-3">
                        <p className="font-bold text-slate-900">{p.full_name}</p>
                        <p className="text-[11px] font-mono text-slate-500">{p.email}</p>
                      </td>

                      <td className="px-3 py-3">
                        {p.is_active ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-700 font-semibold">
                            <XCircle className="h-3.5 w-3.5" />
                            Disabled
                          </span>
                        )}
                      </td>

                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          {assigned.map((r) => (
                            <span
                              key={r}
                              className="inline-flex items-center gap-1 rounded bg-[#002B49]/10 px-2 py-0.5 text-[11px] font-bold text-[#002B49]"
                            >
                              <span>{ROLE_LABELS[r]}</span>
                              {assigned.length > 1 && !(isSelf && r === 'admin') && (
                                <button
                                  type="button"
                                  title={`Revoke ${ROLE_LABELS[r]}`}
                                  onClick={() => handleRevokeRole(p.id, r)}
                                  className="text-slate-500 hover:text-rose-600"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              )}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1.5">
                          <select
                            aria-label={`Select role to grant to ${p.email}`}
                            value={roleSelections[p.id] || 'coordinator'}
                            onChange={(e) =>
                              setRoleSelections({
                                ...roleSelections,
                                [p.id]: e.target.value as AppRole,
                              })
                            }
                            className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs"
                          >
                            {ALL_ROLES.map((r) => (
                              <option key={r} value={r}>
                                {ROLE_LABELS[r]}
                              </option>
                            ))}
                          </select>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            isLoading={processing}
                            onClick={() => handleGrantRole(p.id)}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>

                      <td className="px-3 py-3 text-right">
                        <Button
                          type="button"
                          variant={p.is_active ? 'danger' : 'secondary'}
                          size="sm"
                          disabled={isSelf && p.is_active}
                          isLoading={processing}
                          onClick={() => handleToggleActive(p)}
                        >
                          {p.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
