import React, { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import {
  PlacementRow,
  StudentProfileRow,
  PlacementOpportunityRow,
  SupervisorAssignmentRow,
  AcademicSupervisorRow,
} from '../../types/database';
import { UserProfile } from '../../types/auth';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';
import { formatDate } from '../../lib/utils';
import {
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Mail,
  Phone,
} from 'lucide-react';

export const HostInternsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [placements, setPlacements] = useState<PlacementRow[]>([]);
  const [students, setStudents] = useState<StudentProfileRow[]>([]);
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [opportunities, setOpportunities] = useState<PlacementOpportunityRow[]>([]);
  const [assignments, setAssignments] = useState<SupervisorAssignmentRow[]>([]);
  const [supervisors, setSupervisors] = useState<AcademicSupervisorRow[]>([]);

  const [responseNotes, setResponseNotes] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadInterns = useCallback(async () => {
    setLoading(true);
    const [
      { data: plRows },
      { data: spRows },
      { data: profRows },
      { data: oppRows },
      { data: saRows },
      { data: supRows },
    ] = await Promise.all([
      supabase.from('placements').select('*').order('created_at', { ascending: false }),
      supabase.from('student_profiles').select('*'),
      supabase.from('profiles').select('*'),
      supabase.from('placement_opportunities').select('*'),
      supabase.from('supervisor_assignments').select('*').eq('is_current', true),
      supabase.from('academic_supervisors').select('*'),
    ]);

    setPlacements((plRows || []) as PlacementRow[]);
    setStudents((spRows || []) as StudentProfileRow[]);
    setProfiles((profRows || []) as UserProfile[]);
    setOpportunities((oppRows || []) as PlacementOpportunityRow[]);
    setAssignments((saRows || []) as SupervisorAssignmentRow[]);
    setSupervisors((supRows || []) as AcademicSupervisorRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadInterns();
  }, [loadInterns]);

  const spById = Object.fromEntries(students.map((s) => [s.id, s]));
  const profById = Object.fromEntries(profiles.map((p) => [p.id, p]));
  const oppById = Object.fromEntries(opportunities.map((o) => [o.id, o]));
  const supById = Object.fromEntries(supervisors.map((s) => [s.id, s]));

  const handleRespondPlacement = async (placementId: string, accept: boolean) => {
    setError(null);
    setSuccess(null);
    const note = (responseNotes[placementId] || '').trim();
    if (!accept && note.length < 5) {
      setError('Please enter a reason (at least 5 characters) when declining a placement.');
      return;
    }

    setProcessing(true);
    const { error: rpcErr } = await supabase.rpc('host_respond_placement', {
      p_placement_id: placementId,
      p_accept: accept,
      p_note:
        note ||
        (accept
          ? 'Confirmed by host organization. Workplace onboarding scheduled.'
          : ''),
    });
    setProcessing(false);

    if (rpcErr) {
      setError(rpcErr.message);
      return;
    }

    await loadInterns();
    setSuccess(
      accept
        ? 'Placement confirmed! The LEAP Coordinator and student have been notified.'
        : 'Placement declined and returned to the LEAP Coordinator.'
    );
  };

  return (
    <div className="space-y-6">
      <div className="pb-3 border-b border-slate-200">
        <h2 className="text-xl font-bold text-[#002B49]">
          Assigned Interns & Placement Confirmations
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Confirm or decline nominated student placements and review intern details for your
          organization
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
            <Users className="h-4 w-4 text-teal-600" />
            <span>Organization Placements ({placements.length})</span>
          </CardTitle>
        </CardHeader>

        {loading ? (
          <p className="py-8 text-center text-xs text-slate-500">Loading interns...</p>
        ) : placements.length === 0 ? (
          <p className="py-8 text-center text-xs text-slate-500">
            No interns are currently assigned to your organization.
          </p>
        ) : (
          <div className="space-y-4">
            {placements.map((pl) => {
              const sp = spById[pl.student_id];
              const up = sp ? profById[sp.user_id] : undefined;
              const opp = oppById[pl.opportunity_id];
              const sa = assignments.find((s) => s.placement_id === pl.id && s.is_current);
              const sup = sa ? supById[sa.supervisor_id] : undefined;
              const supUser = sup ? profById[sup.user_id] : undefined;

              return (
                <div
                  key={pl.id}
                  className="rounded-xl border border-slate-200 p-4 space-y-3 text-xs bg-white"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                    <div>
                      <span className="text-sm font-bold text-slate-900">
                        {up?.full_name || 'Student Intern'}
                      </span>{' '}
                      <span className="text-slate-500">({sp?.student_number})</span>
                      <p className="text-teal-700 font-medium mt-0.5">
                        Role: {opp?.title} ({opp?.department || 'General'}) •{' '}
                        {formatDate(pl.start_date)} to {formatDate(pl.end_date)}
                      </p>
                    </div>
                    <StatusBadge status={pl.status} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <span className="text-slate-500 font-semibold">Academic Background</span>
                      <p className="font-semibold text-slate-900 mt-0.5">{sp?.programme}</p>
                      <p className="text-slate-600">
                        {sp?.faculty} • Year {sp?.year_of_study}
                      </p>
                    </div>

                    <div>
                      <span className="text-slate-500 font-semibold">Intern Contact & Skills</span>
                      <p className="text-slate-800 flex items-center gap-1.5 mt-0.5">
                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                        {up?.email}
                      </p>
                      {up?.phone && (
                        <p className="text-slate-600 flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-slate-400" />
                          {up.phone}
                        </p>
                      )}
                      {sp?.skills && (
                        <p className="text-slate-500 mt-1 truncate">Skills: {sp.skills}</p>
                      )}
                    </div>

                    <div>
                      <span className="text-slate-500 font-semibold">
                        University Academic Supervisor
                      </span>
                      <p className="font-semibold text-slate-900 mt-0.5">
                        {supUser
                          ? `${sup?.title ? sup.title + ' ' : ''}${supUser.full_name}`
                          : 'Pending Coordinator Assignment'}
                      </p>
                      {supUser && <p className="text-slate-600">{supUser.email}</p>}
                    </div>
                  </div>

                  {pl.status === 'AWAITING_CONFIRMATION' ? (
                    <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3.5 space-y-2.5">
                      <label className="block font-bold text-slate-800">
                        Host Confirmation / Onboarding Note (Required if declining)
                      </label>
                      <input
                        type="text"
                        placeholder="Enter department assignment, workplace mentor name, or decline reason..."
                        value={responseNotes[pl.id] || ''}
                        onChange={(e) =>
                          setResponseNotes({ ...responseNotes, [pl.id]: e.target.value })
                        }
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900"
                      />
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          isLoading={processing}
                          onClick={() => handleRespondPlacement(pl.id, true)}
                        >
                          <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                          Confirm Placement
                        </Button>
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          isLoading={processing}
                          onClick={() => handleRespondPlacement(pl.id, false)}
                        >
                          <XCircle className="mr-1.5 h-3.5 w-3.5" />
                          Decline Placement
                        </Button>
                      </div>
                    </div>
                  ) : (
                    pl.host_response_note && (
                      <div className="pt-2 border-t border-slate-100 text-slate-600">
                        <strong>Host Response Note:</strong> {pl.host_response_note}
                      </div>
                    )
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
};

