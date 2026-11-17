import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { SystemSettingRow } from '../../types/database';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { formatDateTime } from '../../lib/utils';
import { Settings, Save, CheckCircle2, AlertCircle } from 'lucide-react';

export const AdminSettingsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<SystemSettingRow[]>([]);
  const [draftValues, setDraftValues] = useState<Record<string, string>>({});
  const [draftConfirmed, setDraftConfirmed] = useState<Record<string, boolean>>({});
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('system_settings')
      .select('*')
      .order('key', { ascending: true });
    const rows = (data || []) as SystemSettingRow[];
    setSettings(rows);

    const vals: Record<string, string> = {};
    const confs: Record<string, boolean> = {};
    for (const s of rows) {
      vals[s.key] = JSON.stringify(s.value);
      confs[s.key] = s.policy_confirmed;
    }
    setDraftValues(vals);
    setDraftConfirmed(confs);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSaveSetting = async (key: string) => {
    setError(null);
    setSuccess(null);

    let parsedValue: unknown;
    try {
      parsedValue = JSON.parse(draftValues[key]);
    } catch {
      setError(`Invalid JSON value for setting "${key}".`);
      return;
    }

    setSavingKey(key);
    const { error: rpcErr } = await supabase.rpc('admin_update_setting', {
      p_key: key,
      p_value: parsedValue,
      p_policy_confirmed: draftConfirmed[key],
    });
    setSavingKey(null);

    if (rpcErr) {
      setError(rpcErr.message);
      return;
    }

    await loadSettings();
    setSuccess(`Policy setting "${key}" updated in PostgreSQL.`);
  };

  return (
    <div className="space-y-6">
      <div className="pb-3 border-b border-slate-200">
        <h2 className="text-xl font-bold text-[#002B49]">
          Configurable University Policy Settings
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage eligibility thresholds, completion rules, and assessment weightings pending formal
          Limkokwing University confirmation
        </p>
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
            <Settings className="h-4 w-4 text-teal-600" />
            <span>Database Policy Parameters ({settings.length})</span>
          </CardTitle>
        </CardHeader>

        {loading ? (
          <p className="py-8 text-center text-xs text-slate-500">Loading settings...</p>
        ) : (
          <div className="space-y-3 text-xs">
            {settings.map((s) => (
              <div
                key={s.key}
                className="rounded-xl border border-slate-200 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900">{s.key}</span>
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                        s.policy_confirmed
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {s.policy_confirmed
                        ? 'University Confirmed'
                        : 'Pending University Confirmation'}
                    </span>
                  </div>
                  <p className="text-slate-600">{s.description}</p>
                  <p className="text-[10px] text-slate-400">
                    Updated: {formatDateTime(s.updated_at)}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <input
                    aria-label={`Value for ${s.key}`}
                    type="text"
                    value={draftValues[s.key] ?? ''}
                    onChange={(e) =>
                      setDraftValues({ ...draftValues, [s.key]: e.target.value })
                    }
                    className="w-48 rounded-lg border border-slate-300 px-3 py-1.5 font-mono text-xs text-slate-900"
                  />

                  <label className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={draftConfirmed[s.key] ?? false}
                      onChange={(e) =>
                        setDraftConfirmed({
                          ...draftConfirmed,
                          [s.key]: e.target.checked,
                        })
                      }
                      className="rounded border-slate-300"
                    />
                    <span>Confirmed</span>
                  </label>

                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    isLoading={savingKey === s.key}
                    onClick={() => handleSaveSetting(s.key)}
                  >
                    <Save className="mr-1 h-3.5 w-3.5" />
                    Save
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

