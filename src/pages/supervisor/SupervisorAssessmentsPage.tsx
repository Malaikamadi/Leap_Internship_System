import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import {
  PlacementRow,
  HostEvaluationRow,
  AssessmentRow,
  CompletionChecklist,
  StudentProfileRow,
  HostOrganizationRow,
} from '../../types/database';
import { UserProfile } from '../../types/auth';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import {
  Award,
  Save,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Lock,
} from 'lucide-react';

export const SupervisorAssessmentsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [placements, setPlacements] = useState<PlacementRow[]>([]);
  const [students, setStudents] = useState<StudentProfileRow[]>([]);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [organizations, setOrganizations] = useState<HostOrganizationRow[]>([]);
  const [evaluations, setEvaluations] = useState<HostEvaluationRow[]>([]);
  const [assessments, setAssessments] = useState<AssessmentRow[]>([]);

  const [selectedPlacementId, setSelectedPlacementId] = useState<string | null>(null);
  const [checklist, setChecklist] = useState<CompletionChecklist | null>(null);

  const [supervisorScore, setSupervisorScore] = useState<number>(85);
  const [reportScore, setReportScore] = useState<number>(88);
  const [comments, setComments] = useState('');

  const [saving, setSaving] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [
      { data: plRows },
      { data: spRows },
      { data: profRows },
      { data: orgRows },
      { data: evalRows },
      { data: assRows },
    ] = await Promise.all([
      supabase.from('placements').select('*').order('created_at', { ascending: false }),
      supabase.from('student_profiles').select('*'),
      supabase.from('profiles').select('*'),
      supabase.from('host_organizations').select('*'),
      supabase.from('host_evaluations').select('*'),
      supabase.from('assessments').select('*'),
    ]);

    const plList = (plRows || []) as PlacementRow[];
    const assList = (assRows || []) as AssessmentRow[];
    setPlacements(plList);
    setStudents((spRows || []) as StudentProfileRow[]);
    setProfiles((profRows || []) as UserProfile[]);
    setOrganizations((orgRows || []) as HostOrganizationRow[]);
    setEvaluations((evalRows || []) as HostEvaluationRow[]);
    setAssessments(assList);

    const activeOrFirst =
      plList.find((p) => p.status === 'ACTIVE') || plList[0] || null;
    const targetId = selectedPlacementId || activeOrFirst?.id || null;
    setSelectedPlacementId(targetId);

    if (targetId) {
      const existingAss = assList.find((a) => a.placement_id === targetId);
      if (existingAss) {
        setSupervisorScore(existingAss.supervisor_score);
        setReportScore(existingAss.report_score);
        setComments(existingAss.comments || '');
      }
      const { data: chkData } = await supabase.rpc('get_completion_status', {
        p_placement_id: targetId,
      });
      setChecklist((chkData as CompletionChecklist) || null);
    }

    setLoading(false);
  }, [selectedPlacementId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSelectPlacement = async (plId: string) => {
    setError(null);
    setSuccess(null);
    setSelectedPlacementId(plId);
    const existingAss = assessments.find((a) => a.placement_id === plId);
    if (existingAss) {
      setSupervisorScore(existingAss.supervisor_score);
      setReportScore(existingAss.report_score);
      setComments(existingAss.comments || '');
    } else {
      setSupervisorScore(85);
      setReportScore(88);
      setComments('');
    }
    const { data: chkData } = await supabase.rpc('get_completion_status', {
      p_placement_id: plId,
    });
    setChecklist((chkData as CompletionChecklist) || null);
  };

  const spById = Object.fromEntries(students.map((s) => [s.id, s]));
  const profById = Object.fromEntries(profiles.map((p) => [p.id, p]));
  const orgById = Object.fromEntries(organizations.map((o) => [o.id, o]));

  const selectedPlacement = placements.find((p) => p.id === selectedPlacementId) || null;
  const selectedEval =
    evaluations.find((e) => e.placement_id === selectedPlacementId) || null;
  const selectedAssessment =
    assessments.find((a) => a.placement_id === selectedPlacementId) || null;

  const canModifyAssessment =
    selectedPlacement?.status === 'ACTIVE' &&
    selectedAssessment?.status !== 'FINALIZED';

  const handleRecordAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlacement) return;
    setError(null);
    setSuccess(null);
    setSaving(true);

    const { error: rpcErr } = await supabase.rpc('staff_record_assessment', {
      p_placement_id: selectedPlacement.id,
      p_supervisor_score: Number(supervisorScore),
      p_report_score: Number(reportScore),
      p_comments: comments.trim(),
    });
    setSaving(false);

    if (rpcErr) {
      setError(rpcErr.message);
      return;
    }

    await loadData();
    setSuccess('Assessment scores saved to PostgreSQL.');
  };

  const handleFinalizeAssessment = async () => {
    if (!selectedPlacement) return;
    setError(null);
    setSuccess(null);
    setFinalizing(true);

    // Ensure current draft scores are saved first if not yet recorded
    if (!selectedAssessment) {
      const { error: recErr } = await supabase.rpc('staff_record_assessment', {
        p_placement_id: selectedPlacement.id,
        p_supervisor_score: Number(supervisorScore),
        p_report_score: Number(reportScore),
        p_comments: comments.trim(),
      });
      if (recErr) {
        setFinalizing(false);
        setError(recErr.message);
        return;
      }
    }

    const { data, error: finErr } = await supabase.rpc('staff_finalize_assessment', {
      p_placement_id: selectedPlacement.id,
    });
    setFinalizing(false);

    if (finErr) {
      setError(finErr.message);
      return;
    }

    const res = data as { outcome: string; final_score: number };
    await loadData();
    setSuccess(
      `Assessment finalized! Final Score: ${res.final_score}% • Completion Status: ${res.outcome}.`
    );
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-xs text-slate-500">
        Loading assessments & completion records...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="pb-3 border-b border-slate-200">
        <h2 className="text-xl font-bold text-[#002B49]">
          Host Evaluations, Assessments & Completion Finalization
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Inspect host organization evaluations, record academic assessment scores, and finalize
          student completion
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
        {/* Left: Supervised Placements Selector */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="text-base">
              Supervised Placements ({placements.length})
            </CardTitle>
          </CardHeader>

          {placements.length === 0 ? (
            <p className="py-8 text-center text-xs text-slate-500">
              No supervised placements assigned.
            </p>
          ) : (
            <div className="space-y-2.5">
              {placements.map((pl) => {
                const sp = spById[pl.student_id];
                const up = sp ? profById[sp.user_id] : undefined;
                const org = orgById[pl.organization_id];
                const active = pl.id === selectedPlacementId;
                return (
                  <div
                    key={pl.id}
                    onClick={() => handleSelectPlacement(pl.id)}
                    className={`cursor-pointer rounded-xl border p-3.5 text-xs space-y-1 transition-all ${
                      active
                        ? 'border-[#002B49] bg-slate-50'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">
                        {up?.full_name || 'Student'}
                      </span>
                      <StatusBadge status={pl.status} />
                    </div>
                    <p className="text-slate-500">{sp?.student_number}</p>
                    <p className="text-teal-700 font-medium">{org?.name}</p>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Right: Evaluation Viewer, Checklist & Assessment Form */}
        <div className="lg:col-span-8 space-y-6">
          {!selectedPlacement ? (
            <Card className="p-8 text-center text-xs text-slate-500">
              Select a placement to record or finalize its assessment.
            </Card>
          ) : (
            <>
              {/* Host Evaluation Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Host Organization Evaluation —{' '}
                    {orgById[selectedPlacement.organization_id]?.name}
                  </CardTitle>
                  {selectedEval && (
                    <span className="rounded-lg bg-[#002B49] px-2.5 py-1 text-xs font-bold text-white">
                      Rating: {selectedEval.overall_rating} / 5.00 (
                      {Math.round((selectedEval.overall_rating / 5) * 100)}%)
                    </span>
                  )}
                </CardHeader>

                {!selectedEval ? (
                  <p className="text-xs text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200">
                    The host organization has not yet submitted an evaluation for this placement.
                  </p>
                ) : (
                  <div className="space-y-3 text-xs">
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
                      <div className="rounded-lg bg-slate-50 p-2 border border-slate-200">
                        <span className="text-[10px] text-slate-500">Punctuality</span>
                        <p className="font-bold text-slate-900">{selectedEval.punctuality}/5</p>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-2 border border-slate-200">
                        <span className="text-[10px] text-slate-500">Conduct</span>
                        <p className="font-bold text-slate-900">
                          {selectedEval.professionalism}/5
                        </p>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-2 border border-slate-200">
                        <span className="text-[10px] text-slate-500">Technical</span>
                        <p className="font-bold text-slate-900">
                          {selectedEval.technical_skills}/5
                        </p>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-2 border border-slate-200">
                        <span className="text-[10px] text-slate-500">Comm.</span>
                        <p className="font-bold text-slate-900">
                          {selectedEval.communication}/5
                        </p>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-2 border border-slate-200">
                        <span className="text-[10px] text-slate-500">Teamwork</span>
                        <p className="font-bold text-slate-900">{selectedEval.teamwork}/5</p>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-2 border border-slate-200">
                        <span className="text-[10px] text-slate-500">Initiative</span>
                        <p className="font-bold text-slate-900">{selectedEval.initiative}/5</p>
                      </div>
                    </div>

                    {selectedEval.strengths && (
                      <p className="text-slate-700">
                        <strong>Strengths:</strong> {selectedEval.strengths}
                      </p>
                    )}
                    {selectedEval.improvements && (
                      <p className="text-slate-700">
                        <strong>Areas for Improvement:</strong> {selectedEval.improvements}
                      </p>
                    )}
                  </div>
                )}
              </Card>

              {/* Academic Assessment Form & Completion Checklist */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Award className="h-4 w-4 text-teal-600" />
                    <span>Academic Assessment & Completion Verification</span>
                  </CardTitle>
                  {selectedAssessment && <StatusBadge status={selectedAssessment.status} />}
                </CardHeader>

                {checklist && (
                  <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-2 text-xs">
                    <p className="font-bold text-slate-800">Completion Requirements Checklist</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {checklist.items.map((item) => (
                        <div
                          key={item.requirement}
                          className="flex items-center justify-between rounded-lg bg-white p-2.5 border border-slate-200"
                        >
                          <span className="flex items-center gap-1.5 text-slate-700">
                            {item.met ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            ) : (
                              <Clock className="h-3.5 w-3.5 text-amber-500" />
                            )}
                            {item.requirement}
                          </span>
                          <span className="font-bold text-slate-900">
                            {String(item.actual)} / {String(item.required)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <form onSubmit={handleRecordAssessment} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label
                        htmlFor="ass-sup-score"
                        className="block font-semibold text-slate-700"
                      >
                        Supervisor Score (0–100) *
                      </label>
                      <input
                        id="ass-sup-score"
                        type="number"
                        min={0}
                        max={100}
                        step="0.5"
                        required
                        disabled={!canModifyAssessment}
                        value={supervisorScore}
                        onChange={(e) => setSupervisorScore(Number(e.target.value))}
                        className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 disabled:bg-slate-100"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="ass-rep-score"
                        className="block font-semibold text-slate-700"
                      >
                        Progress Reports Score (0–100) *
                      </label>
                      <input
                        id="ass-rep-score"
                        type="number"
                        min={0}
                        max={100}
                        step="0.5"
                        required
                        disabled={!canModifyAssessment}
                        value={reportScore}
                        onChange={(e) => setReportScore(Number(e.target.value))}
                        className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 disabled:bg-slate-100"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700">
                        Computed Composite Score
                      </label>
                      <div className="mt-1 rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 font-extrabold text-[#002B49]">
                        {selectedAssessment?.final_score !== null &&
                        selectedAssessment?.final_score !== undefined
                          ? `${selectedAssessment.final_score}%`
                          : 'Save to compute'}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="ass-comments"
                      className="block font-semibold text-slate-700"
                    >
                      Assessor Comments & Summary
                    </label>
                    <textarea
                      id="ass-comments"
                      rows={3}
                      disabled={!canModifyAssessment}
                      value={comments}
                      onChange={(e) => setComments(e.target.value)}
                      placeholder="Summarize the student's academic and workplace performance..."
                      className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 disabled:bg-slate-100"
                    />
                  </div>

                  {canModifyAssessment ? (
                    <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100">
                      <Button type="submit" variant="outline" size="md" isLoading={saving}>
                        <Save className="mr-1.5 h-4 w-4" />
                        <span>Save Assessment Scores</span>
                      </Button>
                      <Button
                        type="button"
                        variant="primary"
                        size="md"
                        isLoading={finalizing}
                        onClick={handleFinalizeAssessment}
                      >
                        <ShieldCheck className="mr-1.5 h-4 w-4" />
                        <span>Finalize Assessment & Complete Internship</span>
                      </Button>
                    </div>
                  ) : (
                    <div className="rounded-lg bg-slate-50 p-3 text-slate-600 border border-slate-200 flex items-center gap-2">
                      <Lock className="h-4 w-4 text-slate-500 shrink-0" />
                      <span>
                        {selectedAssessment?.status === 'FINALIZED'
                          ? 'This assessment is finalized and locked.'
                          : 'Placement must be ACTIVE to record or finalize an assessment.'}
                      </span>
                    </div>
                  )}
                </form>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

