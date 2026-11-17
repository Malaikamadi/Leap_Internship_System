import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  PlacementRow,
  CompletionRecordRow,
  CompletionChecklist,
  AssessmentRow,
} from '../../types/database';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { formatDateTime } from '../../lib/utils';
import { Award, CheckCircle2, Clock, ShieldCheck } from 'lucide-react';

export const StudentCompletionPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [placement, setPlacement] = useState<PlacementRow | null>(null);
  const [completion, setCompletion] = useState<CompletionRecordRow | null>(null);
  const [checklist, setChecklist] = useState<CompletionChecklist | null>(null);
  const [assessment, setAssessment] = useState<AssessmentRow | null>(null);

  const loadCompletionData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);

    const { data: sp } = await supabase
      .from('student_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!sp) {
      setLoading(false);
      return;
    }

    const { data: plRows } = await supabase
      .from('placements')
      .select('*')
      .eq('student_id', sp.id)
      .order('created_at', { ascending: false })
      .limit(1);

    const pl = (plRows?.[0] as PlacementRow) || null;
    setPlacement(pl);

    if (pl) {
      const [{ data: compData }, { data: chkData }, { data: assData }] = await Promise.all([
        supabase
          .from('completion_records')
          .select('*')
          .eq('placement_id', pl.id)
          .maybeSingle(),
        supabase.rpc('get_completion_status', { p_placement_id: pl.id }),
        supabase
          .from('assessments')
          .select('*')
          .eq('placement_id', pl.id)
          .maybeSingle(),
      ]);

      setCompletion((compData as CompletionRecordRow) || null);
      setChecklist((chkData as CompletionChecklist) || null);
      setAssessment((assData as AssessmentRow) || null);
    }

    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    loadCompletionData();
  }, [loadCompletionData]);

  if (loading) {
    return (
      <div className="py-12 text-center text-xs text-slate-500">
        Loading completion & assessment status...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-[#002B49]">
            Internship Completion & Assessment Status
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Track your completion eligibility requirements and view your finalized academic
            assessment
          </p>
        </div>
        {completion && <StatusBadge status={completion.status} />}
      </div>

      {!placement ? (
        <Card className="p-8 text-center text-xs text-slate-500">
          Completion tracking becomes available once you are assigned to an active placement.
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Completion Checklist Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-teal-600" />
                <span>Completion Eligibility Requirements</span>
              </CardTitle>
              {completion && <StatusBadge status={completion.status} />}
            </CardHeader>

            {checklist ? (
              <div className="space-y-3 text-xs">
                {checklist.items.map((item) => (
                  <div
                    key={item.requirement}
                    className="flex items-center justify-between rounded-xl border border-slate-200 p-3.5 bg-slate-50/60"
                  >
                    <div className="flex items-center gap-2.5">
                      {item.met ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      ) : (
                        <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                      )}
                      <div>
                        <p className="font-semibold text-slate-900">{item.requirement}</p>
                        <p className="text-[11px] text-slate-500">
                          Required: {String(item.required)} • Current: {String(item.actual)}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                        item.met
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.met ? 'Met' : 'Pending'}
                    </span>
                  </div>
                ))}

                <div className="pt-2 text-[11px] text-slate-500">
                  Minimum passing composite score: <strong>{checklist.pass_mark}%</strong>{' '}
                  (Configurable university policy). Completion is finalized by your Academic
                  Supervisor or LEAP Coordinator.
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500">No checklist available.</p>
            )}
          </Card>

          {/* Finalized Assessment Breakdown Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Award className="h-4 w-4 text-teal-600" />
                <span>Permitted Assessment Summary</span>
              </CardTitle>
              {assessment && <StatusBadge status={assessment.status} />}
            </CardHeader>

            {assessment ? (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-xl bg-slate-50 p-4 border border-slate-200 text-center">
                  <div>
                    <span className="text-slate-500">Supervisor</span>
                    <p className="text-base font-extrabold text-slate-900 mt-0.5">
                      {assessment.supervisor_score}%
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">Reports</span>
                    <p className="text-base font-extrabold text-slate-900 mt-0.5">
                      {assessment.report_score}%
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500">Host Score</span>
                    <p className="text-base font-extrabold text-slate-900 mt-0.5">
                      {assessment.host_score !== null ? `${assessment.host_score}%` : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="text-teal-700 font-semibold">Final Score</span>
                    <p className="text-lg font-black text-[#002B49] mt-0.5">
                      {assessment.final_score !== null ? `${assessment.final_score}%` : 'N/A'}
                    </p>
                  </div>
                </div>

                {assessment.comments && (
                  <div className="rounded-lg border border-slate-200 p-3.5">
                    <p className="font-bold text-slate-800">Academic Assessor Remarks</p>
                    <p className="text-slate-600 mt-1">{assessment.comments}</p>
                  </div>
                )}

                {assessment.finalized_at && (
                  <p className="text-[11px] text-slate-400">
                    Finalized at: {formatDateTime(assessment.finalized_at)}
                  </p>
                )}
              </div>
            ) : (
              <div className="py-8 text-center space-y-2 text-xs text-slate-500">
                <p className="font-semibold text-slate-700">Assessment Not Yet Finalized</p>
                <p className="max-w-sm mx-auto">
                  Your assessment breakdown becomes visible here once your Academic Supervisor or
                  LEAP Coordinator finalizes the assessment.
                </p>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};

