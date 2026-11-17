import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import {
  PlacementRow,
  HostEvaluationRow,
  PlacementConcernRow,
  StudentProfileRow,
} from '../../types/database';
import { UserProfile } from '../../types/auth';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { formatDateTime } from '../../lib/utils';
import {
  Award,
  AlertTriangle,
  Send,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const HostEvaluationsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [placements, setPlacements] = useState<PlacementRow[]>([]);
  const [evaluations, setEvaluations] = useState<HostEvaluationRow[]>([]);
  const [concerns, setConcerns] = useState<PlacementConcernRow[]>([]);
  const [students, setStudents] = useState<StudentProfileRow[]>([]);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);

  // Evaluation form state
  const [selectedPlacementId, setSelectedPlacementId] = useState<string>('');
  const [punctuality, setPunctuality] = useState<number>(5);
  const [professionalism, setProfessionalism] = useState<number>(5);
  const [technicalSkills, setTechnicalSkills] = useState<number>(5);
  const [communication, setCommunication] = useState<number>(5);
  const [teamwork, setTeamwork] = useState<number>(5);
  const [initiative, setInitiative] = useState<number>(5);
  const [strengths, setStrengths] = useState('');
  const [improvements, setImprovements] = useState('');
  const [recommend, setRecommend] = useState(true);

  // Concern form state
  const [concernPlacementId, setConcernPlacementId] = useState<string>('');
  const [concernMessage, setConcernMessage] = useState('');

  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [
      { data: plRows },
      { data: evalRows },
      { data: concRows },
      { data: spRows },
      { data: profRows },
    ] = await Promise.all([
      supabase.from('placements').select('*').order('created_at', { ascending: false }),
      supabase.from('host_evaluations').select('*').order('submitted_at', { ascending: false }),
      supabase.from('placement_concerns').select('*').order('created_at', { ascending: false }),
      supabase.from('student_profiles').select('*'),
      supabase.from('profiles').select('*'),
    ]);

    const plList = (plRows || []) as PlacementRow[];
    const evalList = (evalRows || []) as HostEvaluationRow[];
    setPlacements(plList);
    setEvaluations(evalList);
    setConcerns((concRows || []) as PlacementConcernRow[]);
    setStudents((spRows || []) as StudentProfileRow[]);
    setProfiles((profRows || []) as UserProfile[]);

    const evalPlIds = new Set(evalList.map((e) => e.placement_id));
    const activeUnevaluated = plList.filter(
      (p) => p.status === 'ACTIVE' && !evalPlIds.has(p.id)
    );
    if (activeUnevaluated.length > 0 && !selectedPlacementId) {
      setSelectedPlacementId(activeUnevaluated[0].id);
    }
    const livePls = plList.filter((p) =>
      ['AWAITING_CONFIRMATION', 'CONFIRMED', 'ACTIVE'].includes(p.status)
    );
    if (livePls.length > 0 && !concernPlacementId) {
      setConcernPlacementId(livePls[0].id);
    }

    setLoading(false);
  }, [selectedPlacementId, concernPlacementId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const spById = Object.fromEntries(students.map((s) => [s.id, s]));
  const profById = Object.fromEntries(profiles.map((p) => [p.id, p]));
  const plById = Object.fromEntries(placements.map((p) => [p.id, p]));
  const evalPlIds = new Set(evaluations.map((e) => e.placement_id));

  const getInternLabel = (studentId: string) => {
    const sp = spById[studentId];
    const up = sp ? profById[sp.user_id] : undefined;
    return `${up?.full_name || 'Student'} (${sp?.student_number || 'N/A'})`;
  };

  const activeUnevaluatedPlacements = placements.filter(
    (p) => p.status === 'ACTIVE' && !evalPlIds.has(p.id)
  );
  const livePlacements = placements.filter((p) =>
    ['AWAITING_CONFIRMATION', 'CONFIRMED', 'ACTIVE'].includes(p.status)
  );

  const handleSubmitEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedPlacementId) {
      setError('Select an active intern placement to evaluate.');
      return;
    }

    setProcessing(true);
    const { error: rpcErr } = await supabase.rpc('host_submit_evaluation', {
      p_placement_id: selectedPlacementId,
      p_punctuality: Number(punctuality),
      p_professionalism: Number(professionalism),
      p_technical_skills: Number(technicalSkills),
      p_communication: Number(communication),
      p_teamwork: Number(teamwork),
      p_initiative: Number(initiative),
      p_strengths: strengths.trim(),
      p_improvements: improvements.trim(),
      p_recommend: recommend,
    });
    setProcessing(false);

    if (rpcErr) {
      setError(rpcErr.message);
      return;
    }

    setStrengths('');
    setImprovements('');
    setSelectedPlacementId('');
    await loadData();
    setSuccess('Host organization evaluation submitted and linked to the placement.');
  };

  const handleSubmitConcern = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!concernPlacementId || concernMessage.trim().length < 10) {
      setError('Select a placement and describe the concern (minimum 10 characters).');
      return;
    }

    setProcessing(true);
    const { error: rpcErr } = await supabase.rpc('host_report_concern', {
      p_placement_id: concernPlacementId,
      p_message: concernMessage.trim(),
    });
    setProcessing(false);

    if (rpcErr) {
      setError(rpcErr.message);
      return;
    }

    setConcernMessage('');
    await loadData();
    setSuccess('Workplace concern reported to the LEAP Coordinator and Academic Supervisor.');
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-xs text-slate-500">
        Loading evaluations & workplace feedback...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="pb-3 border-b border-slate-200">
        <h2 className="text-xl font-bold text-[#002B49]">
          Workplace Performance Evaluations & Concerns
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Submit official workplace performance evaluations for active interns or report placement
          concerns
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Submit Workplace Evaluation Card */}
        <Card className="lg:col-span-7">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="h-4 w-4 text-teal-600" />
              <span>Submit Intern Performance Evaluation</span>
            </CardTitle>
          </CardHeader>

          {activeUnevaluatedPlacements.length === 0 ? (
            <p className="py-6 text-xs text-slate-500">
              All active placements at your organization already have a submitted evaluation (or no
              placement is currently in ACTIVE status).
            </p>
          ) : (
            <form onSubmit={handleSubmitEvaluation} className="space-y-4 text-xs">
              <div>
                <label htmlFor="eval-pl" className="block font-semibold text-slate-700">
                  Active Intern Placement *
                </label>
                <select
                  id="eval-pl"
                  required
                  value={selectedPlacementId}
                  onChange={(e) => setSelectedPlacementId(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
                >
                  {activeUnevaluatedPlacements.map((pl) => (
                    <option key={pl.id} value={pl.id}>
                      {getInternLabel(pl.student_id)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  {
                    id: 'eval-punctuality',
                    label: 'Punctuality (1–5)',
                    val: punctuality,
                    set: setPunctuality,
                  },
                  {
                    id: 'eval-prof',
                    label: 'Professionalism (1–5)',
                    val: professionalism,
                    set: setProfessionalism,
                  },
                  {
                    id: 'eval-tech',
                    label: 'Technical Skills (1–5)',
                    val: technicalSkills,
                    set: setTechnicalSkills,
                  },
                  {
                    id: 'eval-comm',
                    label: 'Communication (1–5)',
                    val: communication,
                    set: setCommunication,
                  },
                  {
                    id: 'eval-team',
                    label: 'Teamwork (1–5)',
                    val: teamwork,
                    set: setTeamwork,
                  },
                  {
                    id: 'eval-init',
                    label: 'Initiative (1–5)',
                    val: initiative,
                    set: setInitiative,
                  },
                ].map((field) => (
                  <div key={field.id}>
                    <label htmlFor={field.id} className="block font-semibold text-slate-700">
                      {field.label}
                    </label>
                    <select
                      id={field.id}
                      value={field.val}
                      onChange={(e) => field.set(Number(e.target.value))}
                      className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-slate-900"
                    >
                      {[5, 4, 3, 2, 1].map((n) => (
                        <option key={n} value={n}>
                          {n} / 5
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              <div>
                <label htmlFor="eval-strengths" className="block font-semibold text-slate-700">
                  Key Workplace Strengths & Achievements
                </label>
                <textarea
                  id="eval-strengths"
                  rows={2}
                  value={strengths}
                  onChange={(e) => setStrengths(e.target.value)}
                  placeholder="Describe the intern's strongest contributions..."
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                />
              </div>

              <div>
                <label htmlFor="eval-improvements" className="block font-semibold text-slate-700">
                  Areas for Professional Development
                </label>
                <textarea
                  id="eval-improvements"
                  rows={2}
                  value={improvements}
                  onChange={(e) => setImprovements(e.target.value)}
                  placeholder="Recommendations for continued growth..."
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                />
              </div>

              <label className="inline-flex items-center gap-2 font-semibold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={recommend}
                  onChange={(e) => setRecommend(e.target.checked)}
                  className="rounded border-slate-300 text-[#002B49]"
                />
                <span>Recommend intern for future graduate employment</span>
              </label>

              <div>
                <Button type="submit" variant="primary" size="md" isLoading={processing}>
                  <Send className="mr-1.5 h-4 w-4" />
                  <span>Submit Host Evaluation</span>
                </Button>
              </div>
            </form>
          )}
        </Card>

        {/* Right: Report Concern & Submitted Evaluations */}
        <div className="lg:col-span-5 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-600" />
                <span>Report a Placement Concern</span>
              </CardTitle>
            </CardHeader>

            {livePlacements.length === 0 ? (
              <p className="text-xs text-slate-500">No live placements to report concerns on.</p>
            ) : (
              <form onSubmit={handleSubmitConcern} className="space-y-3 text-xs">
                <div>
                  <label htmlFor="conc-pl" className="block font-semibold text-slate-700">
                    Placement *
                  </label>
                  <select
                    id="conc-pl"
                    value={concernPlacementId}
                    onChange={(e) => setConcernPlacementId(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"
                  >
                    {livePlacements.map((pl) => (
                      <option key={pl.id} value={pl.id}>
                        {getInternLabel(pl.student_id)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="conc-msg" className="block font-semibold text-slate-700">
                    Concern Details * (min 10 characters)
                  </label>
                  <textarea
                    id="conc-msg"
                    rows={3}
                    value={concernMessage}
                    onChange={(e) => setConcernMessage(e.target.value)}
                    placeholder="Describe attendance, conduct, or operational concerns..."
                    className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
                  />
                </div>

                <Button type="submit" variant="outline" size="sm" isLoading={processing}>
                  Submit Concern to University
                </Button>
              </form>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Submitted Evaluations ({evaluations.length})
              </CardTitle>
            </CardHeader>

            {evaluations.length === 0 ? (
              <p className="py-4 text-center text-xs text-slate-500">
                No evaluations submitted yet.
              </p>
            ) : (
              <div className="space-y-3 text-xs">
                {evaluations.map((ev) => {
                  const pl = plById[ev.placement_id];
                  return (
                    <div
                      key={ev.id}
                      className="rounded-xl border border-slate-200 p-3 space-y-1 bg-slate-50/50"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">
                          {pl ? getInternLabel(pl.student_id) : 'Intern'}
                        </span>
                        <span className="rounded bg-[#002B49] px-2 py-0.5 text-[11px] font-bold text-white">
                          {ev.overall_rating} / 5.00
                        </span>
                      </div>
                      {ev.strengths && <p className="text-slate-600">{ev.strengths}</p>}
                      <p className="text-[10px] text-slate-400">
                        {formatDateTime(ev.submitted_at)}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {concerns.length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                <p className="font-bold text-slate-800">Reported Concerns</p>
                {concerns.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-lg border border-slate-200 p-2.5 flex items-center justify-between gap-2"
                  >
                    <span className="text-slate-700 truncate">{c.message}</span>
                    <StatusBadge status={c.status} />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

